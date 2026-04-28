// ═══════════════════════════════════════════════════════════════
// Gate AI — Notification Banner
// Shows pending whitelist suggestions and grey area call reviews
// at the top of the dashboard. Distinct from the bell notifications.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const API = import.meta.env.VITE_API_URL || 'https://gate-ai-backend-production.up.railway.app';

function getToken() {
  return localStorage.getItem('gateai_token');
}

async function apiRequest(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ─── Single notification card ────────────────────────────────
function NotifCard({ notif, onAction }) {
  const [acting,    setActing]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); // for block confirmation

  const isWhitelist = notif.type === 'whitelist_suggestion';
  const isGreyArea  = notif.type === 'grey_area_review';

  const callerLabel = notif.caller_name && notif.caller_name !== 'Unknown'
    ? `${notif.caller_name}${notif.caller_company ? ` · ${notif.caller_company}` : ''}`
    : notif.caller_company || notif.caller_phone || 'Unknown caller';

  async function act(action) {
    if (action === 'block' && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    setActing(true);
    try {
      await apiRequest('POST', `/api/notifications/action/${notif.id}`, { action });
      onAction(notif.id);
    } catch (err) {
      alert('Action failed: ' + err.message);
    } finally {
      setActing(false);
      setShowConfirm(false);
    }
  }

  // ── Block confirmation overlay ──
  if (showConfirm) {
    return (
      <div style={{
      background: 'var(--red-dim, rgba(255,107,107,0.06))',
      border: '1px solid rgba(255,107,107,0.25)',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex', alignItems: 'flex-start', flexDirection: 'column',
      gap: 12,
      }}>
      <div style={{
        fontSize: 13.5, color: 'var(--text-primary, #e8e9ed)', lineHeight: 1.5, flex: 1,
      }}>
        <span style={{ color: '#e03131', fontWeight: 600 }}>⚠ Block {notif.caller_phone}?</span>
        <span style={{ color: 'var(--text-secondary, #8b8fa3)', marginLeft: 8 }}>
          They will be permanently rejected on all future calls.
        </span>
      </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' }}>
          <button
            onClick={() => setShowConfirm(false)}
            style={{
              background: 'none', border: '1px solid var(--border, #252736)', borderRadius: 7,
              padding: '6px 14px', fontSize: 12.5, color: 'var(--text-secondary, #8b8fa3)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => act('block')}
            disabled={acting}
            style={{
              background: '#ff6b6b', border: 'none', borderRadius: 7,
              padding: '6px 14px', fontSize: 12.5, fontWeight: 600,
              color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              opacity: acting ? 0.6 : 1,
            }}
          >
            {acting ? 'Blocking…' : 'Yes, block'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: isWhitelist
        ? 'rgba(0,214,143,0.05)'
        : 'rgba(255,169,77,0.05)',
      border: `1px solid ${isWhitelist ? 'rgba(0,214,143,0.2)' : 'rgba(255,169,77,0.2)'}`,
      borderRadius: 10,
      padding: '13px 16px',
      display: 'flex', alignItems: 'flex-start', flexDirection: 'column',
      gap: 12,
    }}>
      {/* Icon + text */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', minWidth: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isWhitelist ? 'rgba(0,214,143,0.12)' : 'rgba(255,169,77,0.12)',
          border: `1px solid ${isWhitelist ? 'rgba(0,214,143,0.25)' : 'rgba(255,169,77,0.25)'}`,
          fontSize: 13, marginTop: 1,
        }}>
          {isWhitelist ? '✅' : '⚠️'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary, #e8e9ed)', marginBottom: 3, wordBreak: 'break-word' }}>
            {isWhitelist
              ? `Auto-whitelisted: ${callerLabel}`
              : `Uncertain call forwarded: ${callerLabel}`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary, #8b8fa3)', lineHeight: 1.5 }}>
            {isWhitelist
              ? `${notif.confidence}% confidence · Added to whitelist — confirm or remove below`
              : `${notif.confidence}% confidence · Was this a legitimate call?`}
          </div>
          {notif.call_summary && (
            <div style={{
              fontSize: 12, color: 'var(--text-tertiary, #5c6078)', marginTop: 5,
              fontStyle: 'italic', lineHeight: 1.5,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              "{notif.call_summary}"
            </div>
          )}
        </div>
      </div>

      {/* Action buttons — always full width row, wrap on overflow */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
        {isWhitelist && (
          <>
            <button onClick={() => act('confirm')} disabled={acting} style={btnStyle('#00d68f', 'rgba(0,214,143,0.1)')}>
              {acting ? '…' : '✓ Confirm'}
            </button>
            <button onClick={() => act('remove')} disabled={acting} style={btnStyle('var(--text-secondary, #8b8fa3)', 'transparent')}>
              Remove
            </button>
            <button onClick={() => act('block')} disabled={acting} style={btnStyle('#ff6b6b', 'rgba(255,107,107,0.08)')}>
              Remove & Block
            </button>
          </>
        )}
        {isGreyArea && (
          <>
            <button onClick={() => act('whitelist')} disabled={acting} style={btnStyle('#00d68f', 'rgba(0,214,143,0.1)')}>
              {acting ? '…' : '✓ Legitimate — whitelist'}
            </button>
            <button onClick={() => act('block')} disabled={acting} style={btnStyle('#ff6b6b', 'rgba(255,107,107,0.08)')}>
              Cold call — block
            </button>
            <button onClick={() => act('dismiss')} disabled={acting} style={btnStyle('var(--text-tertiary, #5c6078)', 'transparent')}>
              Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function btnStyle(color, bg) {
  return {
    background: bg,
    border: `1px solid ${color}40`,
    borderRadius: 7,
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 600,
    color,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    transition: 'all 180ms ease',
  };
}

// ─── Main NotificationBanner component ───────────────────────
export default function NotificationBanner() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest('GET', '/api/notifications/pending');
      setNotifications(data?.notifications || []);
    } catch {
      // fail silently — don't break the dashboard
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Re-poll every 30 seconds to pick up new notifications
  useEffect(() => {
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  function handleAction(notifId) {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  }

  if (loading || notifications.length === 0) return null;

  return (
    <div style={{
      marginBottom: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {/* Section label */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary, #5c6078)',
          textTransform: 'uppercase', letterSpacing: '0.8px',
        }}>
          Action Required
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, padding: '1px 7px',
          borderRadius: 20, background: 'rgba(108,92,231,0.15)',
          color: '#a29bfe',
        }}>
          {notifications.length}
        </div>
      </div>

      {notifications.map(notif => (
        <NotifCard key={notif.id} notif={notif} onAction={handleAction} />
      ))}
    </div>
  );
}
