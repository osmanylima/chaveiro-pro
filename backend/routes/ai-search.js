// routes/ai-search.js — OpenRouter Vision (free)
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

    // Chamar OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chaveiro-pro-dun.vercel.app',
        'X-Title': 'Chaveiro Pro',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter error:', err);
      return res.status(500).json({ error: 'Erro ao consultar IA: ' + err });
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '{}';

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
      descricao:           aiResult.descricao           || '',
      fabricante_provavel: aiResult.fabricante_provavel || '',
      perfil:              aiResult.perfil              || '',
      correspondencias,
      total: correspondencias.length,
    });

  } catch (err) {
    console.error('AI search error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
