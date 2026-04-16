import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY   = 'gateai_token';
const USER_KEY    = 'gateai_user';
const COMPANY_KEY = 'gateai_company';

const API_BASE = import.meta.env.VITE_API_URL || 'https://gate-ai-backend-production.up.railway.app';

// If the URL contains ?impersonate=<encoded>, decode it and seed a session.
// This is how the staff console hands off an impersonation token to a new tab.
function consumeImpersonationParam() {
  try {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get('impersonate');
    if (!raw) return null;
    const data = JSON.parse(decodeURIComponent(raw));
    // Strip the param so refreshing doesn't re-seed.
    url.searchParams.delete('impersonate');
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
    if (!data?.token || !data?.user || !data?.company) return null;
    return data;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user,    setUser]    = useState(() => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } });
  const [company, setCompany] = useState(() => { try { return JSON.parse(localStorage.getItem(COMPANY_KEY)); } catch { return null; } });
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    // First, check for an impersonation handoff in the URL.
    const imp = consumeImpersonationParam();
    if (imp) {
      localStorage.setItem(TOKEN_KEY,   imp.token);
      localStorage.setItem(USER_KEY,    JSON.stringify(imp.user));
      localStorage.setItem(COMPANY_KEY, JSON.stringify(imp.company));
      setToken(imp.token);
      setUser(imp.user);
      setCompany(imp.company);
      setImpersonating(true);
      setLoading(false);
      return;
    }

    if (!token) { setLoading(false); return; }

    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data.type !== 'customer') {
          clearAuth();
          return;
        }
        setUser(data.user);
        setCompany(data.company);
        localStorage.setItem(USER_KEY,    JSON.stringify(data.user));
        localStorage.setItem(COMPANY_KEY, JSON.stringify(data.company));

        // Detect impersonation claim in token payload without decoding JWT
        // (the /me endpoint doesn't return the flag; inspect the raw token).
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.impersonated_by) setImpersonating(true);
        } catch { /* ignore */ }
      })
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((data) => {
    const { token: t, user: u, company: c } = data;
    localStorage.setItem(TOKEN_KEY,   t);
    localStorage.setItem(USER_KEY,    JSON.stringify(u));
    localStorage.setItem(COMPANY_KEY, JSON.stringify(c));
    setToken(t);
    setUser(u);
    setCompany(c);
    setImpersonating(false);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(COMPANY_KEY);
    setToken(null); setUser(null); setCompany(null);
    setImpersonating(false);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    window.location.href = '/';
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ token, user, company, loading, impersonating, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
