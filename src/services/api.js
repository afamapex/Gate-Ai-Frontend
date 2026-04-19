// src/services/api.js
const BASE = import.meta.env.VITE_API_URL || 'https://gate-ai-backend-production.up.railway.app';

function getToken() {
  return localStorage.getItem('gateai_token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401) {
    localStorage.removeItem('gateai_token');
    localStorage.removeItem('gateai_user');
    localStorage.removeItem('gateai_company');
    window.location.href = '/auth';
    return;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

const get   = (path)       => request('GET',    path);
const post  = (path, body) => request('POST',   path, body);
const put   = (path, body) => request('PUT',    path, body);
const patch = (path, body) => request('PATCH',  path, body);
const del   = (path)       => request('DELETE', path);

export const auth = {
  login:            (email, password) => post('/api/auth/login', { email, password }),
  register:         (data)            => post('/api/auth/register', data),
  me:               ()                => get('/api/auth/me'),
  dismissChecklist: ()                => post('/api/auth/checklist/dismiss'),
};

export const calls = {
  list:       (params = {}) => { const q = new URLSearchParams(params).toString(); return get(`/api/calls${q ? '?' + q : ''}`); },
  get:        (id)          => get(`/api/calls/${id}`),
  statsToday: ()            => get('/api/calls/stats/today'),
  volume:     ()            => get('/api/calls/stats/volume'),
  topBlocked: ()            => get('/api/calls/stats/top-blocked'),
};

export const users = {
  list:   ()         => get('/api/users'),
  create: (data)     => post('/api/users', data),
  update: (id, data) => put(`/api/users/${id}`, data),
  remove: (id)       => del(`/api/users/${id}`),
};

export const whitelist = {
  list:   ()         => get('/api/whitelist'),
  create: (data)     => post('/api/whitelist', data),
  update: (id, data) => put(`/api/whitelist/${id}`, data),
  remove: (id)       => del(`/api/whitelist/${id}`),
};

export const patterns = {
  list:   ()         => get('/api/patterns'),
  create: (data)     => post('/api/patterns', data),
  update: (id, data) => put(`/api/patterns/${id}`, data),
  remove: (id)       => del(`/api/patterns/${id}`),
};

export const routing = {
  list:   ()         => get('/api/routing'),
  create: (data)     => post('/api/routing', data),
  update: (id, data) => put(`/api/routing/${id}`, data),
  remove: (id)       => del(`/api/routing/${id}`),
};

export const settings = {
  get:    ()     => get('/api/settings'),
  update: (data) => patch('/api/settings', data),
};

export const notifications = {
  get:          ()     => get('/api/notifications'),
  update:       (data) => patch('/api/notifications', data),
  testBlocked:   ()    => post('/api/notifications/test/blocked'),
  testForwarded: ()    => post('/api/notifications/test/forwarded'),
};

export const billing = {
  status:   ()     => get('/api/billing/status'),
  checkout: (plan) => post('/api/billing/checkout', { plan }),
  portal:   ()     => post('/api/billing/portal'),
};

export async function exportCallsCsv(params = {}) {
  const token = getToken();
  // Strip keys with undefined/null values so they don't become ?status=undefined
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null));
  const q = new URLSearchParams(clean).toString();
  const res = await fetch(`${BASE}/api/calls/export${q ? '?' + q : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Export failed: ${res.status}`);
  }
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `gate-ai-calls-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
