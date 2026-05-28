// routes/ai-search.js
const router = require('express').Router();
const db     = require('../db/pool');
const { auth } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas.'));
  },
});

// POST /api/ai-search
// Body: multipart/form-data com campo "image"
router.post('/', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });

  try {
    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType    = req.file.mimetype;

    // 1. Buscar todas as chaves do banco para o Claude comparar
    const { rows: allKeys } = await db.query(`
      SELECT k.id, k.code, k.application, k.profile, k.image_url,
             k.panel_column, k.panel_row, k.stock, k.status,
             m.name AS manufacturer, c.name AS category
      FROM keys k
      LEFT JOIN manufacturers m ON k.manufacturer_id = m.id
      LEFT JOIN categories    c ON k.category_id     = c.id
      ORDER BY k.code
    `);

    // 2. Montar lista de chaves para o Claude analisar
    const keysList = allKeys.map(k =>
      `- Código: ${k.code} | Fabricante: ${k.manufacturer || '?'} | Aplicação: ${k.application || '?'} | Perfil: ${k.profile || '?'} | Categoria: ${k.category || '?'}`
    ).join('\n');

    // 3. Chamar Claude Vision
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type:       'base64',
                  media_type: mimeType,
                  data:       imageBase64,
                },
              },
              {
                type: 'text',
                text: `Você é um especialista em chaves virgens para chaveiros.

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
Se não conseguir identificar, retorne correspondencias como array vazio.`,
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'Erro ao consultar IA: ' + err });
    }

    const anthropicData = await anthropicRes.json();
    const rawText = anthropicData.content?.[0]?.text || '{}';

    // 4. Parsear resposta JSON do Claude
    let aiResult;
    try {
      // Limpar possível markdown
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      aiResult = JSON.parse(cleaned);
    } catch (e) {
      console.error('Parse error:', rawText);
      return res.status(500).json({ error: 'Erro ao processar resposta da IA.', raw: rawText });
    }

    // 5. Enriquecer correspondências com dados completos do banco
    const correspondencias = (aiResult.correspondencias || []).map(match => {
      const key = allKeys.find(k => k.code === match.codigo);
      if (!key) return null;
      return {
        ...key,
        similaridade: match.similaridade,
        motivo:       match.motivo,
      };
    }).filter(Boolean);

    res.json({
      descricao:          aiResult.descricao        || '',
      fabricante_provavel: aiResult.fabricante_provavel || '',
      perfil:             aiResult.perfil            || '',
      correspondencias,
      total: correspondencias.length,
    });

  } catch (err) {
    console.error('AI search error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
