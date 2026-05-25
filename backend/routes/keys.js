const router = require('express').Router();
const db = require('../db/pool');
const { auth } = require('../middleware/auth');
const { body, query, param, validationResult } = require('express-validator');

const KEY_SELECT = `
  SELECT
    k.id, k.code, k.model, k.application, k.profile,
    k.panel_column, k.panel_row, k.stock, k.low_stock_threshold,
    k.status, k.notes, k.cross_refs, k.image_url,
    k.created_at, k.updated_at,
    m.name  AS manufacturer,
    m.id    AS manufacturer_id,
    c.name  AS category,
    c.id    AS category_id
  FROM keys k
  LEFT JOIN manufacturers m ON k.manufacturer_id = m.id
  LEFT JOIN categories    c ON k.category_id     = c.id
`;

// ── GET /api/keys ─────────────────────────────────────────
// ?q=texto  &status=esgotado|pouco|disponivel  &manufacturer=uuid
// &category=uuid  &column=C  &page=1  &limit=50
router.get('/', auth, async (req, res) => {
  try {
    const { q, status, manufacturer, category, column, page = 1, limit = 50 } = req.query;
    const where = [];
    const vals = [];

    if (q) {
      vals.push(`%${q}%`);
      where.push(`(k.code ILIKE $${vals.length}
        OR k.application ILIKE $${vals.length}
        OR k.model ILIKE $${vals.length}
        OR m.name ILIKE $${vals.length})`);
    }
    if (status)       { vals.push(status);       where.push(`k.status = $${vals.length}`); }
    if (manufacturer) { vals.push(manufacturer); where.push(`k.manufacturer_id = $${vals.length}`); }
    if (category)     { vals.push(category);     where.push(`k.category_id = $${vals.length}`); }
    if (column)       { vals.push(column.toUpperCase()); where.push(`k.panel_column = $${vals.length}`); }

    const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (Number(page) - 1) * Number(limit);

    const [dataRes, countRes] = await Promise.all([
      db.query(`${KEY_SELECT} ${whereSQL} ORDER BY k.panel_column, k.panel_row LIMIT $${vals.length+1} OFFSET $${vals.length+2}`,
        [...vals, limit, offset]),
      db.query(`SELECT COUNT(*) FROM keys k LEFT JOIN manufacturers m ON k.manufacturer_id=m.id ${whereSQL}`, vals),
    ]);

    res.json({
      data: dataRes.rows,
      total: Number(countRes.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/keys/panel ───────────────────────────────────
// Retorna todas as posições do painel (colunas A-H, linhas 1-8)
router.get('/panel', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      ${KEY_SELECT}
      ORDER BY k.panel_column, k.panel_row
    `);

    // Montar grid 8x8
    const cols = ['A','B','C','D','E','F','G','H'];
    const grid = {};
    cols.forEach(col => {
      grid[col] = {};
      for (let r = 1; r <= 8; r++) grid[col][r] = null;
    });
    rows.forEach(k => { grid[k.panel_column][k.panel_row] = k; });

    res.json({ grid, keys: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/keys/stats ───────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        COUNT(*)                                            AS total,
        COUNT(*) FILTER (WHERE status='disponivel')        AS available,
        COUNT(*) FILTER (WHERE status='pouco')             AS low_stock,
        COUNT(*) FILTER (WHERE status='esgotado')          AS out_of_stock,
        COALESCE(SUM(stock),0)                             AS total_units
      FROM keys
    `);

    const byMfr = await db.query(`
      SELECT m.name, COUNT(*) AS qty
      FROM keys k
      LEFT JOIN manufacturers m ON k.manufacturer_id = m.id
      GROUP BY m.name ORDER BY qty DESC LIMIT 8
    `);

    res.json({ summary: rows[0], by_manufacturer: byMfr.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/keys/:id ─────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`${KEY_SELECT} WHERE k.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Chave não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/keys ────────────────────────────────────────
router.post('/', auth, [
  body('code').trim().notEmpty().withMessage('Código obrigatório'),
  body('panel_column').isIn(['A','B','C','D','E','F','G','H']),
  body('panel_row').isInt({ min: 1, max: 8 }),
  body('stock').isInt({ min: 0 }).optional(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    code, model, manufacturer_id, application, category_id,
    profile, image_url, panel_column, panel_row,
    stock = 0, low_stock_threshold = 5, notes, cross_refs,
  } = req.body;

  try {
    const { rows } = await db.query(`
      INSERT INTO keys
        (code, model, manufacturer_id, application, category_id, profile,
         image_url, panel_column, panel_row, stock, low_stock_threshold, notes, cross_refs)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id`,
      [code, model, manufacturer_id, application, category_id, profile,
       image_url, panel_column, panel_row, stock, low_stock_threshold, notes,
       cross_refs || null]
    );
    const full = await db.query(`${KEY_SELECT} WHERE k.id=$1`, [rows[0].id]);
    res.status(201).json(full.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Código ou posição no painel já cadastrado.' });
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/keys/:id ─────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  const allowed = ['code','model','manufacturer_id','application','category_id',
    'profile','image_url','panel_column','panel_row','low_stock_threshold','notes','cross_refs'];

  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: 'Nenhum campo válido para atualizar.' });

  const setSQL = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const vals = [req.params.id, ...fields.map(f => req.body[f])];

  try {
    const { rowCount } = await db.query(`UPDATE keys SET ${setSQL} WHERE id=$1`, vals);
    if (!rowCount) return res.status(404).json({ error: 'Chave não encontrada.' });
    const full = await db.query(`${KEY_SELECT} WHERE k.id=$1`, [req.params.id]);
    res.json(full.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Código ou posição já em uso.' });
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/keys/:id ──────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM keys WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Chave não encontrada.' });
    res.json({ message: 'Chave removida com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
