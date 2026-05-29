// routes/ai-search.js — Google Gemini Vision
const router = require('express').Router();
const db     = require('../db/pool');
const { auth } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas.'));
  },
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });

  try {
    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType    = req.file.mimetype;

    // Buscar todas as chaves do banco
    const { rows: allKeys } = await db.query(`
      SELECT k.id, k.code, k.application, k.profile, k.image_url,
             k.panel_column, k.panel_row, k.stock, k.status,
             m.name AS manufacturer, c.name AS category
      FROM keys k
      LEFT JOIN manufacturers m ON k.manufacturer_id = m.id
      LEFT JOIN categories    c ON k.category_id     = c.id
      ORDER BY k.code
    `);

    const keysList = allKeys.map(k =>
      `- Código: ${k.code} | Fabricante: ${k.manufacturer || '?'} | Aplicação: ${k.application || '?'} | Perfil: ${k.profile || '?'} | Categoria: ${k.category || '?'}`
    ).join('\n');

    const prompt = `Você é um especialista em chaves virgens para chaveiros.

Analise a imagem desta chave e compare com o catálogo abaixo.

CATÁLOGO DE CHAVES DISPONÍVEIS:
${keysList}

Responda APENAS em JSON válido, sem texto extra, sem markdown, neste formato exato:
{
  "descricao": "descrição visual da chave na imagem",
  "fabricante_provavel": "nome do fabricante identificado",
  "perfil": "tipo de perfil identificado",
  "correspondencias": [
    {"codigo": "CODIGO", "similaridade": 85, "motivo": "breve explicação"},
    {"codigo": "CODIGO2", "similaridade": 72, "motivo": "breve explicação"}
  ]
}

Retorne até 5 correspondências ordenadas por similaridade (0-100).
Se não conseguir identificar, retorne correspondencias como array vazio.`;

    // Chamar Gemini Vision API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                }
              },
              { text: prompt }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('Gemini error:', err);
      return res.status(500).json({ error: 'Erro ao consultar Gemini: ' + err });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    let aiResult;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      aiResult = JSON.parse(cleaned);
    } catch (e) {
      console.error('Parse error:', rawText);
      return res.status(500).json({ error: 'Erro ao processar resposta da IA.', raw: rawText });
    }

    const correspondencias = (aiResult.correspondencias || []).map(match => {
      const key = allKeys.find(k => k.code === match.codigo);
      if (!key) return null;
      return { ...key, similaridade: match.similaridade, motivo: match.motivo };
    }).filter(Boolean);

    res.json({
      descricao:           aiResult.descricao            || '',
      fabricante_provavel: aiResult.fabricante_provavel  || '',
      perfil:              aiResult.perfil               || '',
      correspondencias,
      total: correspondencias.length,
    });

  } catch (err) {
    console.error('AI search error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
