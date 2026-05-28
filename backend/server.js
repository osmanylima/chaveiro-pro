require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

const authRoutes      = require('./routes/auth');
const keysRoutes      = require('./routes/keys');
const movementsRoutes = require('./routes/movements');
const catalogRoutes   = require('./routes/catalog');
const usersRoutes     = require('./routes/users');
const uploadRoutes    = require('./routes/upload');
const aiSearchRoutes  = require('./routes/ai-search');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

app.use('/api/auth',       authRoutes);
app.use('/api/keys',       keysRoutes);
app.use('/api/movements',  movementsRoutes);
app.use('/api',            catalogRoutes);
app.use('/api/users',      usersRoutes);
app.use('/api/upload',     uploadRoutes);
app.use('/api/ai-search',  aiSearchRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Erro interno.' });
});

app.listen(PORT, () => console.log(`✅  Chaveiro Pro API rodando na porta ${PORT}`));
