import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY   = 'gateai_token';
const USER_KEY    = 'gateai_user';
const COMPANY_KEY = 'gateai_company';

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [company, setCompany] = useState(() => {
    try { return JSON.parse(localStorage.getItem(COMPANY_KEY)); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setUser(data.user);
        setCompany(data.company);
        localStorage.setItem(USER_KEY,    JSON.stringify(data.user));
        localStorage.setItem(COMPANY_KEY, JSON.stringify(data.company));
      })
      .catch(() => {
        // Token invalid or expired — clear everything
        clearAuth();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((data) => {
    const { token: t, user: u, company: c } = data;
    localStorage.setItem(TOKEN_KEY,   t);
    localStorage.setItem(USER_KEY,    JSON.stringify(u));
    localStorage.setItem(COMPANY_KEY, JSON.stringify(c));
    setToken(t);
    setUser(u);
    setCompany(c);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(COMPANY_KEY);
    setToken(null);
    setUser(null);
    setCompany(null);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    window.location.href = '/login';
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ token, user, company, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
