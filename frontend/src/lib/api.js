// src/lib/api.js
// Cliente centralizado para a Chaveiro Pro API

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('cp_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────
export const auth = {
  login:    (email, password)     => request('/auth/login',    { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  me:       ()                    => request('/auth/me'),
};

// ── Keys ──────────────────────────────────────────────────
export const keys = {
  list:   (params = {})      => request('/keys?' + new URLSearchParams(params)),
  panel:  ()                 => request('/keys/panel'),
  stats:  ()                 => request('/keys/stats'),
  get:    (id)               => request(`/keys/${id}`),
  create: (body)             => request('/keys',      { method: 'POST',   body: JSON.stringify(body) }),
  update: (id, body)         => request(`/keys/${id}`, { method: 'PUT',   body: JSON.stringify(body) }),
  remove: (id)               => request(`/keys/${id}`, { method: 'DELETE' }),
};

// ── Movements ─────────────────────────────────────────────
export const movements = {
  list:   (params = {})      => request('/movements?' + new URLSearchParams(params)),
  create: (body)             => request('/movements', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Catalog ───────────────────────────────────────────────
export const catalog = {
  manufacturers: () => request('/manufacturers'),
  categories:    () => request('/categories'),
  addManufacturer: (name) => request('/manufacturers', { method: 'POST', body: JSON.stringify({ name }) }),
  addCategory:     (name) => request('/categories',    { method: 'POST', body: JSON.stringify({ name }) }),
};

// ── Users ─────────────────────────────────────────────────
export const users = {
  list:            ()           => request('/users'),
  update:          (id, body)   => request(`/users/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  changePassword:  (id, password) => request(`/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) }),
  deactivate:      (id)         => request(`/users/${id}`, { method: 'DELETE' }),
};

export default { auth, keys, movements, catalog, users };
