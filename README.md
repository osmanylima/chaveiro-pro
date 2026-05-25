# 🔑 Chaveiro Pro — Guia de Instalação Completo

Sistema de gerenciamento de chaves virgens com painel físico inteligente.

---

## Stack

| Camada    | Tecnologia                  |
|-----------|-----------------------------|
| Frontend  | React 18 + Vite             |
| Backend   | Node.js + Express           |
| Banco     | PostgreSQL 16               |
| Auth      | JWT (bcrypt + jsonwebtoken) |
| Deploy    | Docker Compose / Railway    |

---

## Início Rápido (Docker — recomendado)

```bash
# 1. Clone o projeto
git clone https://github.com/SEU_USER/chaveiro-pro
cd chaveiro-pro

# 2. Suba tudo com um comando
docker compose up --build

# 3. Acesse
# Frontend → http://localhost:5173
# API      → http://localhost:3001
# DB       → localhost:5432
```

O schema SQL é aplicado automaticamente na primeira execução.

---

## Instalação Manual (sem Docker)

### Pré-requisitos
- Node.js 18+
- PostgreSQL 16+

### 1. Banco de Dados

```bash
# Criar banco
createdb chaveiro_pro

# Aplicar schema
psql -d chaveiro_pro -f sql/schema.sql
```

### 2. Backend

```bash
cd backend

# Copiar e editar variáveis de ambiente
cp .env.example .env
# Edite DATABASE_URL e JWT_SECRET no .env

npm install
node server.js
# API rodando em http://localhost:3001
```

### 3. Frontend

```bash
cd frontend

# Opcional: copiar .env se precisar apontar para API remota
cp .env.example .env

npm install
npm run dev
# Frontend em http://localhost:5173
```

---

## Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável       | Descrição                           | Exemplo                            |
|----------------|-------------------------------------|------------------------------------|
| `DATABASE_URL` | String de conexão PostgreSQL        | `postgresql://user:pass@host/db`   |
| `JWT_SECRET`   | Segredo para assinar tokens JWT     | string aleatória de 32+ caracteres |
| `PORT`         | Porta da API                        | `3001`                             |
| `FRONTEND_URL` | URL do frontend (CORS em produção)  | `https://chaveiro.suaempresa.com`  |

### Frontend (`frontend/.env`)

| Variável       | Descrição           | Padrão           |
|----------------|---------------------|------------------|
| `VITE_API_URL` | URL base da API     | (proxy Vite dev) |

---

## API — Endpoints Principais

```
POST   /api/auth/login              Login
POST   /api/auth/register           Cadastro
GET    /api/auth/me                 Usuário logado

GET    /api/keys                    Listar/buscar chaves
GET    /api/keys/panel              Grid do painel físico
GET    /api/keys/stats              Resumo para dashboard
GET    /api/keys/:id                Detalhes de uma chave
POST   /api/keys                    Criar chave
PUT    /api/keys/:id                Atualizar chave
DELETE /api/keys/:id                Remover chave

GET    /api/movements               Histórico de movimentações
POST   /api/movements               Registrar entrada/saída

GET    /api/manufacturers           Listar fabricantes
GET    /api/categories              Listar categorias

GET    /api/users                   Listar usuários (admin)
PUT    /api/users/:id               Atualizar usuário (admin)
```

Todos os endpoints (exceto `/api/auth/login`) exigem header:
```
Authorization: Bearer <token>
```

---

## Deploy em Produção (Railway)

```bash
# 1. Crie projeto no Railway (railway.app)
# 2. Adicione serviço PostgreSQL
# 3. Faça deploy do backend apontando para a DATABASE_URL do Railway
# 4. Faça build do frontend e sirva via Vercel ou Railway Static
```

---

## Próximos Passos

- [ ] Upload de imagens para as chaves (Supabase Storage / S3)
- [ ] Integração com API de Computer Vision (reconhecimento por foto)
- [ ] PWA / manifest para uso no celular
- [ ] Relatórios em PDF com exportação
- [ ] Múltiplos painéis físicos
- [ ] Notificações de estoque baixo por e-mail/WhatsApp

---

## Estrutura do Projeto

```
chaveiro-pro/
├── sql/
│   └── schema.sql          # Schema PostgreSQL completo + seed
├── backend/
│   ├── db/pool.js           # Conexão PostgreSQL
│   ├── middleware/auth.js   # JWT middleware
│   ├── routes/
│   │   ├── auth.js          # Login / registro / me
│   │   ├── keys.js          # CRUD chaves + busca + painel
│   │   ├── movements.js     # Entrada/saída de estoque
│   │   ├── catalog.js       # Fabricantes e categorias
│   │   └── users.js         # Gestão de usuários
│   ├── server.js            # Entry point Express
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── lib/api.js        # Cliente HTTP centralizado
│   │   ├── hooks/
│   │   │   ├── useAuth.jsx   # Context de autenticação
│   │   │   └── useFetch.js   # Hooks genéricos de fetch/mutation
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx # Dashboard conectado à API
│   │   │   ├── SearchKeys.jsx# Busca com debounce real
│   │   │   ├── KeyDetail.jsx # Detalhes + movimentação inline
│   │   │   └── Login.jsx     # Tela de autenticação
│   │   └── App.jsx           # Roteamento + layout
│   ├── vite.config.js
│   ├── Dockerfile
│   └── .env.example
└── docker-compose.yml
```
