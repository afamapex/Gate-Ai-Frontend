// src/services/api.js
// Base API client — attaches JWT token to every request,
// handles 401s by redirecting to login, surfaces errors cleanly.

const BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('gateai_token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('gateai_token');
    window.location.href = '/login';
    return;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

const get  = (path)        => request('GET',    path);
const post = (path, body)  => request('POST',   path, body);
const put  = (path, body)  => request('PUT',    path, body);
const patch= (path, body)  => request('PATCH',  path, body);
const del  = (path)        => request('DELETE', path);

// ─── Auth ─────────────────────────────────────────────────────
export const auth = {
  login:   (email, password) => post('/api/auth/login', { email, password }),
  me:      ()                => get('/api/auth/me'),
};

// ─── Calls ────────────────────────────────────────────────────
export const calls = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/api/calls${q ? '?' + q : ''}`);
  },
  get:  (id) => get(`/api/calls/${id}`),
};

// ─── Users / Employees ────────────────────────────────────────
export const users = {
  list:   ()           => get('/api/users'),
  create: (data)       => post('/api/users', data),
  update: (id, data)   => put(`/api/users/${id}`, data),
  remove: (id)         => del(`/api/users/${id}`),
};

// ─── Whitelist ────────────────────────────────────────────────
export const whitelist = {
  list:   ()           => get('/api/whitelist'),
  create: (data)       => post('/api/whitelist', data),
  update: (id, data)   => put(`/api/whitelist/${id}`, data),
  remove: (id)         => del(`/api/whitelist/${id}`),
};

// ─── Blocked Patterns ─────────────────────────────────────────
export const patterns = {
  list:   ()           => get('/api/patterns'),
  create: (data)       => post('/api/patterns', data),
  update: (id, data)   => put(`/api/patterns/${id}`, data),
  remove: (id)         => del(`/api/patterns/${id}`),
};

// ─── Routing Rules ────────────────────────────────────────────
export const routing = {
  list:   ()           => get('/api/routing'),
  create: (data)       => post('/api/routing', data),
  update: (id, data)   => put(`/api/routing/${id}`, data),
  remove: (id)         => del(`/api/routing/${id}`),
};

// ─── Settings ─────────────────────────────────────────────────
export const settings = {
  get:    ()     => get('/api/settings'),
  update: (data) => patch('/api/settings', data),
};

// ─── Notifications ────────────────────────────────────────────
export const notifications = {
  get:    ()     => get('/api/notifications'),
  update: (data) => patch('/api/notifications', data),
};

// ─── Export (CSV download) ────────────────────────────────────
export function exportCallsCsv(params = {}) {
  const token = getToken();
  const q = new URLSearchParams({ ...params, format: 'csv' }).toString();
  const url = `${BASE}/api/calls/export?${q}`;

  // Trigger browser download
  const a = document.createElement('a');
  a.href = url;
  a.download = `gate-ai-calls-${new Date().toISOString().slice(0, 10)}.csv`;

  // Pass auth via URL param since we can't set headers on a download link
  // The backend export endpoint checks ?token= as a fallback
  a.href = `${url}&token=${token}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
