const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db/pool');
const { auth, adminOnly } = require('../middleware/auth');

// GET /api/users  (admin only)
router.get('/', auth, adminOnly, async (_req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, email, role, active, created_at FROM users ORDER BY name'
  );
  res.json(rows);
});

// PUT /api/users/:id  — update role / active
router.put('/:id', auth, adminOnly, async (req, res) => {
  const { name, role, active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE users SET
         name   = COALESCE($2, name),
         role   = COALESCE($3, role),
         active = COALESCE($4, active)
       WHERE id=$1
       RETURNING id, name, email, role, active`,
      [req.params.id, name, role, active]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/password
router.put('/:id/password', auth, async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Sem permissão.' });
  }
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Senha mínima de 6 caracteres.' });
  }
  const hash = await bcrypt.hash(password, 12);
  await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.params.id]);
  res.json({ message: 'Senha atualizada.' });
});

// DELETE /api/users/:id  — soft delete
router.delete('/:id', auth, adminOnly, async (req, res) => {
  await db.query('UPDATE users SET active=false WHERE id=$1', [req.params.id]);
  res.json({ message: 'Usuário desativado.' });
});

module.exports = router;
