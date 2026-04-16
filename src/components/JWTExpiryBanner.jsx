// ═══════════════════════════════════════════════════════════════
// Gate AI — JWT Expiry Banner
// Reads the token from localStorage, decodes the expiry time,
// and shows a subtle warning banner when less than 24 hours remain.
// No backend call needed — JWT payload is readable client-side.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';

const WARNING_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

function getTokenExpiry() {
  try {
    const token = localStorage.getItem('gateai_token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload?.exp) return null;
    return payload.exp * 1000; // convert seconds → ms
  } catch {
    return null;
  }
}

export default function JWTExpiryBanner() {
  const [hoursLeft, setHoursLeft] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function check() {
      const expiresAt = getTokenExpiry();
      if (!expiresAt) return;

      const msLeft = expiresAt - Date.now();
      if (msLeft > 0 && msLeft < WARNING_THRESHOLD_MS) {
        setHoursLeft(Math.max(1, Math.floor(msLeft / (1000 * 60 * 60))));
      } else {
        setHoursLeft(null);
      }
    }

    check();
    // Re-check every 5 minutes in case the tab stays open a long time
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!hoursLeft || dismissed) return null;

  return (
    <div style={{
      background: 'rgba(255,169,77,0.08)',
      borderBottom: '1px solid rgba(255,169,77,0.2)',
      padding: '9px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      fontSize: 13,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14 }}>⏱</span>
        <span style={{ color: '#ffa94d' }}>
          Your session expires in{' '}
          <strong>{hoursLeft} hour{hoursLeft !== 1 ? 's' : ''}</strong>.
          {' '}Sign in again to stay logged in.
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <a
          href="/auth"
          style={{
            fontSize: 12, fontWeight: 600, color: '#ffa94d',
            textDecoration: 'none', padding: '4px 10px',
            border: '1px solid rgba(255,169,77,0.35)',
            borderRadius: 6, transition: 'all 180ms ease',
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(255,169,77,0.1)'}
          onMouseLeave={e => e.target.style.background = 'transparent'}
        >
          Sign in
        </a>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,169,77,0.5)', fontSize: 16, lineHeight: 1,
            padding: '2px 4px', fontFamily: 'inherit',
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
