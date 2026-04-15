// src/services/staffApi.js
// Staff-side API client. Uses the staff token and bounces 401s
// back to /staff/login (NOT /auth) so customer/staff flows don't collide.

const BASE = import.meta.env.VITE_API_URL || 'https://gate-ai-backend-production.up.railway.app';

function getStaffToken() {
  return localStorage.getItem('gateai_staff_token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getStaffToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('gateai_staff_token');
    localStorage.removeItem('gateai_staff_user');
    window.location.href = '/staff/login';
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

export const staffAuth = {
  login:  (email, password) => post('/api/auth/staff/login', { email, password }),
  logout: ()                => post('/api/auth/staff/logout'),
  me:     ()                => get('/api/auth/me'),
};

export const staffCompanies = {
  list:        (params = {}) => { const q = new URLSearchParams(params).toString(); return get(`/api/staff/companies${q ? '?' + q : ''}`); },
  get:         (id)          => get(`/api/staff/companies/${id}`),
  update:      (id, data)    => patch(`/api/staff/companies/${id}`, data),
  deactivate:  (id)          => post(`/api/staff/companies/${id}/deactivate`),
  reactivate:  (id)          => post(`/api/staff/companies/${id}/reactivate`),
  reprovision: (id)          => post(`/api/staff/companies/${id}/reprovision`),
  calls:       (id, params = {}) => { const q = new URLSearchParams(params).toString(); return get(`/api/staff/companies/${id}/calls${q ? '?' + q : ''}`); },
  billing:     (id)          => get(`/api/staff/companies/${id}/billing`),
};

export const staffInvites = {
  list:       (params = {}) => { const q = new URLSearchParams(params).toString(); return get(`/api/staff/invites${q ? '?' + q : ''}`); },
  get:        (id)          => get(`/api/staff/invites/${id}`),
  create:     (data)        => post('/api/staff/invites', data),
  resend:     (id)          => post(`/api/staff/invites/${id}/resend`),
  revoke:     (id)          => post(`/api/staff/invites/${id}/revoke`),
  regenerate: (id)          => post(`/api/staff/invites/${id}/regenerate`),
};

export const staffDemoRequests = {
  list:    (params = {}) => { const q = new URLSearchParams(params).toString(); return get(`/api/staff/demo-requests${q ? '?' + q : ''}`); },
  get:     (id)          => get(`/api/staff/demo-requests/${id}`),
  update:  (id, data)    => patch(`/api/staff/demo-requests/${id}`, data),
  convert: (id)          => post(`/api/staff/demo-requests/${id}/convert`),
};

export const staffContactRequests = {
  list:   (params = {}) => { const q = new URLSearchParams(params).toString(); return get(`/api/staff/contact-requests${q ? '?' + q : ''}`); },
  get:    (id)          => get(`/api/staff/contact-requests/${id}`),
  update: (id, data)    => patch(`/api/staff/contact-requests/${id}`, data),
};

export const staffBilling = {
  summary:       ()             => get('/api/staff/billing/summary'),
  subscriptions: (params = {})  => { const q = new URLSearchParams(params).toString(); return get(`/api/staff/billing/subscriptions${q ? '?' + q : ''}`); },
  events:        (params = {})  => { const q = new URLSearchParams(params).toString(); return get(`/api/staff/billing/events${q ? '?' + q : ''}`); },
};

export const staffCalls = {
  volume:     ()         => get('/api/staff/calls/volume'),
  breakdown:  ()         => get('/api/staff/calls/breakdown'),
  topBlocked: ()         => get('/api/staff/calls/top-blocked'),
};

export const staffSystem = {
  health:             ()       => get('/api/staff/system/health'),
  failedOnboardings:  ()       => get('/api/staff/system/failed-onboardings'),
  errors:             (params = {}) => { const q = new URLSearchParams(params).toString(); return get(`/api/staff/system/errors${q ? '?' + q : ''}`); },
};

export const staffUsers = {
  list:           ()         => get('/api/staff/staff-users'),
  create:         (data)     => post('/api/staff/staff-users', data),
  update:         (id, data) => patch(`/api/staff/staff-users/${id}`, data),
  resetPassword:  (id)       => post(`/api/staff/staff-users/${id}/reset-password`),
  deactivate:     (id)       => post(`/api/staff/staff-users/${id}/deactivate`),
};

export const staffAuditLog = {
  list: (params = {}) => { const q = new URLSearchParams(params).toString(); return get(`/api/staff/audit-log${q ? '?' + q : ''}`); },
};

// ─── Meetings (Phase 7) ──────────────────────────────────────
export const staffMeetings = {
  list:           (params = {}) => { const q = new URLSearchParams(params).toString(); return get(`/api/staff/meetings${q ? '?' + q : ''}`); },
  get:            (id)          => get(`/api/staff/meetings/${id}`),
  fromDemoRequest:(demo_request_id) => post('/api/staff/meetings/from-demo-request', { demo_request_id }),
  resend:         (id)          => post(`/api/staff/meetings/${id}/resend`),
  markCompleted:  (id)          => post(`/api/staff/meetings/${id}/mark-completed`),
  markNoShow:     (id)          => post(`/api/staff/meetings/${id}/mark-no-show`),
  markDeclined:   (id)          => post(`/api/staff/meetings/${id}/mark-declined`),
  cancel:         (id)          => post(`/api/staff/meetings/${id}/cancel`),
};
