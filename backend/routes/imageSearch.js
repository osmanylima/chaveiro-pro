// routes/imageSearch.js
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

// POST /api/image-search
// Body: multipart/form-data com campo "image"
router.post('/', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });

  try {
    // 1. Buscar todas as chaves do banco para comparação
    const { rows: allKeys } = await db.query(`
      SELECT k.id, k.code, k.application, k.profile, k.image_url,
             k.panel_column, k.panel_row, k.stock, k.status,
             m.name AS manufacturer, c.name AS category
      FROM keys k
      LEFT JOIN manufacturers m ON k.manufacturer_id = m.id
      LEFT JOIN categories    c ON k.category_id     = c.id
      ORDER BY k.code
    `);

    // 2. Preparar lista de chaves para o Claude analisar
    const keysList = allKeys.map(k =>
      `- Código: ${k.code} | ${k.manufacturer || '?'} | ${k.application || '?'} | Perfil: ${k.profile || '?'} | Categoria: ${k.category || '?'}`
    ).join('\n');

    // 3. Converter imagem para base64
    const base64Image = req.file.buffer.toString('base64');
    const mediaType   = req.file.mimetype;

    // 4. Chamar Claude Vision API
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            process.env.ANTHROPIC_API_KEY,
        'anthropic-version':    '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-5',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type:   'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image },
            },
            {
              type: 'text',
              text: `Você é um especialista em identificação de chaves virgens para chaveiros.

Analise a imagem da chave e identifique:
1. Tipo/perfil da chave (plana, tubular, automotiva, gorje, tetra, etc.)
2. Fabricante provável (Honda, VW, Ford, Fiat, Toyota, Gold, Papaiz, Pado, Haga, etc.)
3. Formato da cabeça (redonda, oval, quadrada, com logo, plástica, etc.)
4. Comprimento aproximado (pequena, média, grande)
5. Características únicas do perfil/corte

Depois compare com esta lista de chaves cadastradas no sistema e retorne as 5 mais prováveis em JSON:

${keysList}

Responda APENAS com JSON válido neste formato exato, sem texto adicional:
{
  "analysis": "descrição breve da chave identificada",
  "matches": [
    {"code": "CODIGO", "similarity": 95, "reason": "motivo curto"},
    {"code": "CODIGO", "similarity": 80, "reason": "motivo curto"},
    {"code": "CODIGO", "similarity": 70, "reason": "motivo curto"}
  ]
}`
            }
          ]
        }]
      })
    });

    const aiData = await anthropicRes.json();

    if (!anthropicRes.ok) {
      console.error('Claude API error:', aiData);
      return res.status(500).json({ error: 'Erro na API de IA: ' + (aiData.error?.message || 'desconhecido') });
    }

    // 5. Parsear resposta do Claude
    const rawText = aiData.content[0]?.text || '';
    let parsed;
    try {
      // Extrair JSON mesmo se vier com texto ao redor
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch (e) {
      console.error('Parse error:', rawText);
      return res.status(500).json({ error: 'Erro ao processar resposta da IA', raw: rawText });
    }

    // 6. Enriquecer matches com dados completos do banco
    const enriched = (parsed.matches || []).map(match => {
      const key = allKeys.find(k => k.code === match.code);
      return {
        ...match,
        key: key || null,
      };
    }).filter(m => m.key !== null);

    res.json({
      analysis: parsed.analysis || '',
      matches:  enriched,
      total:    enriched.length,
    });

  } catch (err) {
    console.error('Image search error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
