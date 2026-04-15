import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const StaffAuthContext = createContext(null);

const TOKEN_KEY = 'gateai_staff_token';
const USER_KEY  = 'gateai_staff_user';

const API_BASE = import.meta.env.VITE_API_URL || 'https://gate-ai-backend-production.up.railway.app';

export function StaffAuthProvider({ children }) {
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user,    setUser]    = useState(() => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } });
  const [loading, setLoading] = useState(true);

  // Re-validate the staff token on mount.
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data.type !== 'staff') {
          // Wrong token type — clear it.
          clearAuth();
          return;
        }
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      })
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Accepts full response: { token, user }
  const login = useCallback((data) => {
    const { token: t, user: u } = data;
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY,  JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    // Best-effort audit log, then redirect.
    try {
      await fetch(`${API_BASE}/api/auth/staff/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
    clearAuth();
    window.location.href = '/staff/login';
  }, [token, clearAuth]);

  return (
    <StaffAuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error('useStaffAuth must be used inside StaffAuthProvider');
  return ctx;
}
