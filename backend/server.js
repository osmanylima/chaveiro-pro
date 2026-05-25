require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const authRoutes      = require('./routes/auth');
const keysRoutes      = require('./routes/keys');
const movementsRoutes = require('./routes/movements');
const catalogRoutes   = require('./routes/catalog');
const usersRoutes     = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares ───────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '5mb' }));

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── Rotas ─────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/keys',       keysRoutes);
app.use('/api/movements',  movementsRoutes);
app.use('/api',            catalogRoutes);   // /api/manufacturers, /api/categories
app.use('/api/users',      usersRoutes);

// ── 404 ───────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// ── Error handler ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, () => console.log(`✅  Chaveiro Pro API rodando na porta ${PORT}`));
