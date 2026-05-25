const router = require('express').Router();
const db = require('../db/pool');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/movements?key_id=&type=&from=&to=&page=&limit=
router.get('/', auth, async (req, res) => {
  try {
    const { key_id, type, from, to, page = 1, limit = 50 } = req.query;
    const where = [];
    const vals = [];

    if (key_id) { vals.push(key_id); where.push(`m.key_id = $${vals.length}`); }
    if (type)   { vals.push(type);   where.push(`m.type = $${vals.length}`); }
    if (from)   { vals.push(from);   where.push(`m.created_at >= $${vals.length}`); }
    if (to)     { vals.push(to);     where.push(`m.created_at <= $${vals.length}`); }

    const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (Number(page) - 1) * Number(limit);

    const [dataRes, countRes] = await Promise.all([
      db.query(`
        SELECT m.*, k.code AS key_code, k.application,
               u.name AS user_name
        FROM movements m
        JOIN keys  k ON m.key_id  = k.id
        LEFT JOIN users u ON m.user_id = u.id
        ${whereSQL}
        ORDER BY m.created_at DESC
        LIMIT $${vals.length+1} OFFSET $${vals.length+2}
      `, [...vals, limit, offset]),
      db.query(`SELECT COUNT(*) FROM movements m ${whereSQL}`, vals),
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

// POST /api/movements  — registra movimentação e atualiza estoque atomicamente
router.post('/', auth, [
  body('key_id').isUUID(),
  body('type').isIn(['entrada','saida','ajuste']),
  body('quantity').isInt({ min: 1 }),
  body('reason').optional().isString().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { key_id, type, quantity, reason } = req.body;
  try {
    const { rows } = await db.query(
      'SELECT apply_movement($1,$2,$3,$4,$5) AS mov',
      [key_id, type, quantity, reason, req.user.id]
    );

    // Retornar movimentação com info da chave
    const { rows: full } = await db.query(`
      SELECT m.*, k.code, k.application, k.stock AS stock_after
      FROM movements m JOIN keys k ON m.key_id = k.id
      WHERE m.id = ($1::json->>'id')::uuid
    `, [JSON.stringify(rows[0].mov)]);

    res.status(201).json(full[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
