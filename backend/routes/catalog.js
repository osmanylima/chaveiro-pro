const router = require('express').Router();
const db = require('../db/pool');
const { auth, adminOnly } = require('../middleware/auth');

// ── MANUFACTURERS ─────────────────────────────────────────
router.get('/manufacturers', auth, async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM manufacturers ORDER BY name');
  res.json(rows);
});

router.post('/manufacturers', auth, adminOnly, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nome obrigatório.' });
  try {
    const { rows } = await db.query(
      'INSERT INTO manufacturers (name) VALUES ($1) RETURNING *', [name.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Fabricante já existe.' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/manufacturers/:id', auth, adminOnly, async (req, res) => {
  await db.query('DELETE FROM manufacturers WHERE id=$1', [req.params.id]);
  res.json({ message: 'Removido.' });
});

// ── CATEGORIES ────────────────────────────────────────────
router.get('/categories', auth, async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM categories ORDER BY name');
  res.json(rows);
});

router.post('/categories', auth, adminOnly, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nome obrigatório.' });
  try {
    const { rows } = await db.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *', [name.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Categoria já existe.' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', auth, adminOnly, async (req, res) => {
  await db.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
  res.json({ message: 'Removido.' });
});

module.exports = router;
