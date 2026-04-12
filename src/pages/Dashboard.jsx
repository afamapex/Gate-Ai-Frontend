import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useWebSocket } from "../hooks/useWebSocket.js";
import {
  calls as callsApi,
  users as usersApi,
  whitelist as whitelistApi,
  patterns as patternsApi,
  settings as settingsApi,
  notifications as notificationsApi,
  billing as billingApi,
  exportCallsCsv,
} from "../services/api.js";

// ─── FIELD NORMALISER ────────────────────────────────────────
function normalizeCall(c) {
  if (!c) return c;
  return {
    ...c,
    caller:      c.caller_name      || c.caller      || "Unknown",
    company:     c.caller_company   || c.company      || null,
    phone:       c.caller_phone     || c.caller_number|| c.phone || "—",
    status:      c.call_status      || c.outcome      || c.status || "screened",
    confidence:  c.confidence_score ?? c.confidence   ?? 0,
    intent:      c.classification   || c.intent       || "Unknown",
    time:        c.started_at ? new Date(c.started_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : (c.created_at ? new Date(c.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : (c.time || "—")),
    duration:    c.duration_seconds != null ? fmtDuration(c.duration_seconds) : (c.duration || "0:00"),
    forwardedTo: c.forwarded_to     || c.forwardedTo  || null,
    summary:     c.summary          || "",
  };
}

function fmtDuration(secs) {
  if (!secs) return "0:00";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

// ─── GATE AI LOGO SVG ────────────────────────────────────────
function GateAILogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sideG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8b1ff"/>
          <stop offset="100%" stopColor="#6c5ce7"/>
        </linearGradient>
        <mask id="sideM">
          <rect width="60" height="60" fill="white"/>
          <rect x="22" y="30" width="2.2" height="6" rx="1.1" fill="black"/>
          <rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/>
          <rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/>
        </mask>
      </defs>
      <path d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z" fill="url(#sideG)" mask="url(#sideM)"/>
    </svg>
  );
}

// ─── ICONS ───────────────────────────────────────────────────
const Icons = {
  phone: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>),
  shield: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
  users: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  settings: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  activity: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>),
  ban: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>),
  check: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  x: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  forward: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>),
  mic: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>),
  plug: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v6"/><path d="M6 2v6"/><path d="M18 2v6"/><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M9 16v4"/><path d="M15 16v4"/></svg>),
  search: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  chevDown: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>),
  bell: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>),
  zap: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>),
  clock: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  arrowUp: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>),
  arrowDown: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>),
  play: (<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>),
  eye: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>),
  plus: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  home: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  logout: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
  download: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>),
  user: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  creditCard: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>),
};

// ─── STYLES ──────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg-primary: #0a0b0f;
  --bg-secondary: #111218;
  --bg-tertiary: #181a23;
  --bg-card: #13141b;
  --bg-hover: #1a1c26;
  --bg-active: #1f2130;
  --border: #252736;
  --border-light: #2a2d40;
  --text-primary: #e8e9ed;
  --text-secondary: #8b8fa3;
  --text-tertiary: #5c6078;
  --accent: #6c5ce7;
  --accent-light: #a29bfe;
  --accent-dim: rgba(108, 92, 231, 0.15);
  --accent-glow: rgba(108, 92, 231, 0.3);
  --green: #00d68f;
  --green-dim: rgba(0, 214, 143, 0.12);
  --red: #ff6b6b;
  --red-dim: rgba(255, 107, 107, 0.12);
  --orange: #ffa94d;
  --orange-dim: rgba(255, 169, 77, 0.12);
  --blue: #4dabf7;
  --blue-dim: rgba(77, 171, 247, 0.12);
  --yellow: #ffd43b;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 30px rgba(0,0,0,0.5);
  --font-sans: 'DM Sans', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --transition: 180ms ease;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: var(--font-sans); background: var(--bg-primary); color: var(--text-primary); -webkit-font-smoothing: antialiased; overflow: hidden; }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }

.app { display: flex; height: 100vh; width: 100vw; overflow: hidden; }
.sidebar { width: 240px; min-width: 240px; background: var(--bg-secondary); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 0; z-index: 10; }
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.topbar { height: 60px; min-height: 60px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 28px; background: var(--bg-secondary); }
.content { flex: 1; overflow-y: auto; padding: 24px 28px; background: var(--bg-primary); }

.sidebar-logo { padding: 20px 20px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
.logo-text { font-size: 17px; font-weight: 700; letter-spacing: -0.3px; color: var(--text-primary); }
.sidebar-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }
.nav-section-label { font-size: 10px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1.2px; padding: 12px 12px 6px; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: var(--radius-md); cursor: pointer; color: var(--text-secondary); font-size: 13.5px; font-weight: 450; transition: all var(--transition); position: relative; }
.nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
.nav-item.active { background: var(--accent-dim); color: var(--accent-light); }
.nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 18px; background: var(--accent); border-radius: 0 3px 3px 0; }
.nav-badge { margin-left: auto; font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 20px; background: var(--red-dim); color: var(--red); }
.sidebar-footer { padding: 14px 16px; border-top: 1px solid var(--border); }
.sidebar-status { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--green-dim); border-radius: var(--radius-md); font-size: 12px; color: var(--green); font-weight: 500; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); animation: pulse-dot 2s ease infinite; }
@keyframes pulse-dot { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,214,143,0.5); } 50% { opacity: 0.7; box-shadow: 0 0 0 5px rgba(0,214,143,0); } }

.topbar-left { display: flex; align-items: center; gap: 16px; }
.topbar-title { font-size: 16px; font-weight: 600; letter-spacing: -0.2px; }
.topbar-right { display: flex; align-items: center; gap: 12px; position: relative; }
.topbar-search { display: flex; align-items: center; gap: 8px; padding: 7px 14px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-tertiary); font-size: 13px; cursor: text; transition: all var(--transition); }
.topbar-search:hover { border-color: var(--border-light); }
.topbar-search input { background: none; border: none; outline: none; color: var(--text-primary); font-family: var(--font-sans); font-size: 13px; width: 160px; }
.topbar-search input::placeholder { color: var(--text-tertiary); }
.topbar-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--bg-tertiary); color: var(--text-secondary); cursor: pointer; transition: all var(--transition); position: relative; }
.topbar-btn:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-light); }
.topbar-btn .notif-dot { position: absolute; top: 6px; right: 6px; width: 7px; height: 7px; border-radius: 50%; background: var(--red); border: 2px solid var(--bg-secondary); }
.topbar-avatar { width: 34px; height: 34px; border-radius: var(--radius-sm); background: linear-gradient(135deg, var(--accent), #a29bfe); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: white; cursor: pointer; transition: all var(--transition); }
.topbar-avatar:hover { opacity: 0.85; }

/* Avatar dropdown */
.avatar-menu { position: absolute; top: calc(100% + 10px); right: 0; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); width: 200px; box-shadow: var(--shadow-lg); z-index: 200; overflow: hidden; animation: fadeIn 150ms ease; }
.avatar-menu-header { padding: 14px 16px; border-bottom: 1px solid var(--border); }
.avatar-menu-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); }
.avatar-menu-email { font-size: 11.5px; color: var(--text-tertiary); margin-top: 2px; }
.avatar-menu-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; font-size: 13px; color: var(--text-secondary); cursor: pointer; transition: all var(--transition); }
.avatar-menu-item:hover { background: var(--bg-hover); color: var(--text-primary); }
.avatar-menu-item.danger { color: var(--red); }
.avatar-menu-item.danger:hover { background: var(--red-dim); }
.avatar-menu-divider { height: 1px; background: var(--border); margin: 4px 0; }

/* Notifications panel */
.notif-panel { position: absolute; top: calc(100% + 10px); right: 48px; background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); width: 340px; box-shadow: var(--shadow-lg); z-index: 200; animation: fadeIn 150ms ease; }
.notif-panel-header { padding: 14px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.notif-panel-title { font-size: 13.5px; font-weight: 600; }
.notif-item { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; gap: 10px; transition: background var(--transition); }
.notif-item:hover { background: var(--bg-hover); }
.notif-item:last-child { border-bottom: none; }
.notif-dot-r { width: 8px; height: 8px; border-radius: 50%; background: var(--red); flex-shrink: 0; margin-top: 4px; }
.notif-dot-g { width: 8px; height: 8px; border-radius: 50%; background: var(--green); flex-shrink: 0; margin-top: 4px; }
.notif-dot-o { width: 8px; height: 8px; border-radius: 50%; background: var(--orange); flex-shrink: 0; margin-top: 4px; }
.notif-body { flex: 1; min-width: 0; }
.notif-text { font-size: 12.5px; color: var(--text-primary); line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.notif-time { font-size: 11px; color: var(--text-tertiary); margin-top: 3px; }
.notif-empty { padding: 32px 16px; text-align: center; font-size: 13px; color: var(--text-tertiary); }

/* Billing banner */
.billing-banner { background: linear-gradient(135deg, rgba(108,92,231,0.15), rgba(162,155,254,0.08)); border: 1px solid rgba(108,92,231,0.3); border-radius: var(--radius-lg); padding: 16px 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.billing-banner-text { font-size: 13.5px; color: var(--text-primary); }
.billing-banner-sub { font-size: 12px; color: var(--text-secondary); margin-top: 3px; }
.billing-banner-actions { display: flex; gap: 8px; flex-shrink: 0; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; transition: all var(--transition); }
.stat-card:hover { border-color: var(--border-light); transform: translateY(-1px); }
.stat-header { display: flex; justify-content: space-between; align-items: center; }
.stat-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.stat-icon { width: 32px; height: 32px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; }
.stat-value { font-size: 28px; font-weight: 700; letter-spacing: -1px; line-height: 1; }
.stat-change { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 500; }

.section { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 20px; }
.section-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); }
.section-title { font-size: 14px; font-weight: 600; letter-spacing: -0.1px; }
.section-actions { display: flex; gap: 8px; align-items: center; }

.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
thead th { text-align: left; padding: 10px 16px; font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.8px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border); white-space: nowrap; }
tbody td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid var(--border); white-space: nowrap; color: var(--text-secondary); vertical-align: middle; }
tbody tr { transition: background var(--transition); }
tbody tr:hover { background: var(--bg-hover); cursor: pointer; }
tbody tr:last-child td { border-bottom: none; }

.badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.2px; }
.badge-green { background: var(--green-dim); color: var(--green); }
.badge-red { background: var(--red-dim); color: var(--red); }
.badge-orange { background: var(--orange-dim); color: var(--orange); }
.badge-blue { background: var(--blue-dim); color: var(--blue); }
.badge-purple { background: var(--accent-dim); color: var(--accent-light); }
.badge-ghost { background: rgba(255,255,255,0.05); color: var(--text-secondary); }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: var(--radius-md); font-size: 12.5px; font-weight: 550; cursor: pointer; transition: all var(--transition); border: 1px solid var(--border); background: var(--bg-tertiary); color: var(--text-secondary); font-family: var(--font-sans); white-space: nowrap; }
.btn:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-light); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: var(--accent); border-color: var(--accent); color: white; }
.btn-primary:hover { background: #7c6df0; border-color: #7c6df0; }
.btn-sm { padding: 4px 10px; font-size: 11.5px; }
.btn-icon { width: 30px; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center; }

.tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); padding: 0 20px; }
.tab { padding: 12px 16px; font-size: 13px; font-weight: 500; color: var(--text-tertiary); cursor: pointer; border-bottom: 2px solid transparent; transition: all var(--transition); margin-bottom: -1px; }
.tab:hover { color: var(--text-secondary); }
.tab.active { color: var(--accent-light); border-bottom-color: var(--accent); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; animation: fadeIn 150ms ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-xl); width: 520px; max-width: 92vw; max-height: 85vh; overflow-y: auto; box-shadow: var(--shadow-lg); animation: slideUp 200ms ease; }
@keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.modal-sm { width: 380px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid var(--border); }
.modal-title { font-size: 15px; font-weight: 600; }
.modal-close { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); cursor: pointer; color: var(--text-tertiary); transition: all var(--transition); background: none; border: none; }
.modal-close:hover { background: var(--bg-hover); color: var(--text-primary); }
.modal-body { padding: 20px 22px; }
.modal-footer { padding: 14px 22px; border-top: 1px solid var(--border); display: flex; gap: 8px; justify-content: flex-end; }
.modal-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.modal-label { font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.6px; min-width: 90px; padding-top: 2px; }
.modal-value { font-size: 13.5px; color: var(--text-primary); line-height: 1.5; }
.summary-box { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; font-size: 13.5px; line-height: 1.65; color: var(--text-primary); }
.transcript-box { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; font-size: 12.5px; line-height: 1.7; color: var(--text-secondary); font-family: var(--font-mono); white-space: pre-wrap; max-height: 200px; overflow-y: auto; margin-top: 10px; }
.confidence-bar-wrap { display: flex; align-items: center; gap: 10px; }
.confidence-bar { flex: 1; height: 6px; background: var(--bg-hover); border-radius: 10px; overflow: hidden; }
.confidence-fill { height: 100%; border-radius: 10px; transition: width 600ms ease; }
.confidence-pct { font-size: 13px; font-weight: 600; font-family: var(--font-mono); }

.live-indicator { display: flex; align-items: center; gap: 8px; padding: 5px 12px; background: var(--green-dim); border-radius: 20px; font-size: 12px; font-weight: 600; color: var(--green); }
.live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse-dot 1.5s ease infinite; }

.toggle-wrap { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.toggle { width: 38px; height: 20px; background: var(--bg-hover); border: 1px solid var(--border); border-radius: 20px; position: relative; transition: all var(--transition); }
.toggle.on { background: var(--accent); border-color: var(--accent); }
.toggle-knob { position: absolute; width: 14px; height: 14px; background: white; border-radius: 50%; top: 2px; left: 2px; transition: all var(--transition); }
.toggle.on .toggle-knob { left: 20px; }
.toggle-label { font-size: 13px; color: var(--text-secondary); }

.integrations-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; padding: 16px 20px; }
.integration-card { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; display: flex; flex-direction: column; gap: 12px; transition: all var(--transition); }
.integration-card:hover { border-color: var(--border-light); }
.integration-top { display: flex; justify-content: space-between; align-items: flex-start; }
.integration-icon { width: 40px; height: 40px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; }
.integration-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.integration-desc { font-size: 12px; color: var(--text-tertiary); line-height: 1.5; }

.employee-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; padding: 16px 20px; }
.employee-card { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; display: flex; align-items: center; gap: 12px; transition: all var(--transition); }
.employee-card:hover { border-color: var(--border-light); }
.emp-avatar { width: 38px; height: 38px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: white; flex-shrink: 0; }
.emp-info { flex: 1; min-width: 0; }
.emp-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.emp-role { font-size: 11.5px; color: var(--text-tertiary); margin-top: 2px; }
.emp-ext { font-size: 11px; font-family: var(--font-mono); color: var(--text-tertiary); }
.emp-status { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.filter-bar { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.filter-chip { padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all var(--transition); border: 1px solid var(--border); background: transparent; color: var(--text-secondary); font-family: var(--font-sans); }
.filter-chip:hover { background: var(--bg-hover); border-color: var(--border-light); }
.filter-chip.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent-light); }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: var(--text-tertiary); gap: 12px; }
.empty-state svg { opacity: 0.3; }
.empty-state p { font-size: 14px; }

.mobile-menu-btn { display: none; width: 36px; height: 36px; align-items: center; justify-content: center; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--bg-tertiary); color: var(--text-secondary); cursor: pointer; transition: all var(--transition); flex-shrink: 0; }
.mobile-menu-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(2px); z-index: 49; animation: fadeIn 150ms ease; }
.mobile-call-cards { display: none; }
.mobile-call-card { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; transition: all var(--transition); }
.mobile-call-card:active { background: var(--bg-hover); }
.mcc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.mcc-caller { font-size: 14px; font-weight: 600; color: var(--text-primary); line-height: 1.3; }
.mcc-company { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
.mcc-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.mcc-meta-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-tertiary); }
.mcc-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--border); }
.mcc-intent { font-size: 11px; color: var(--text-tertiary); max-width: 60%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.add-form-row { display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 20px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border); }
.form-input { padding: 7px 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13px; color: var(--text-primary); outline: none; transition: border-color var(--transition); min-width: 140px; }
.form-input:focus { border-color: var(--accent); }
.form-input::placeholder { color: var(--text-tertiary); }
.form-input-full { width: 100%; padding: 9px 14px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); font-family: var(--font-sans); font-size: 13.5px; color: var(--text-primary); outline: none; transition: border-color var(--transition); }
.form-input-full:focus { border-color: var(--accent); }
.form-input-full::placeholder { color: var(--text-tertiary); }
.form-label { font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; display: block; }
.form-group { margin-bottom: 16px; }

/* Action dropdown */
.action-menu-wrap { position: relative; display: inline-block; }
.action-menu { position: absolute; right: 0; top: calc(100% + 4px); background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); width: 180px; box-shadow: var(--shadow-md); z-index: 50; overflow: hidden; animation: fadeIn 120ms ease; }
.action-menu-item { display: flex; align-items: center; gap: 8px; padding: 9px 14px; font-size: 12.5px; color: var(--text-secondary); cursor: pointer; transition: all var(--transition); font-family: var(--font-sans); }
.action-menu-item:hover { background: var(--bg-hover); color: var(--text-primary); }
.action-menu-item.danger { color: var(--red); }
.action-menu-item.danger:hover { background: var(--red-dim); }
.action-menu-item.success { color: var(--green); }
.action-menu-item.success:hover { background: var(--green-dim); }

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .sidebar { position: fixed; left: 0; top: 0; bottom: 0; z-index: 50; transform: translateX(-100%); transition: transform 250ms ease; box-shadow: none; }
  .sidebar.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.5); }
  .sidebar-overlay.visible { display: block; }
  .mobile-menu-btn { display: flex; }
  .topbar-search { display: none; }
  .topbar-title { font-size: 15px; }
  .topbar { padding: 0 16px; }
  .content { padding: 16px; }
  .dashboard-bottom-grid { grid-template-columns: 1fr !important; }
  .employee-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
  .integrations-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .stat-card { padding: 14px 16px; }
  .stat-value { font-size: 24px; }
  .content { padding: 12px; }
  .topbar { padding: 0 12px; height: 54px; min-height: 54px; }
  .live-indicator { padding: 3px 8px; font-size: 11px; }
  .table-wrap.desktop-table { display: none; }
  .mobile-call-cards { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; }
  .employee-grid { grid-template-columns: 1fr; gap: 8px; padding: 12px 14px; }
  .tabs { padding: 0 14px; overflow-x: auto; }
  .tab { padding: 10px 12px; font-size: 12px; white-space: nowrap; }
  .modal { width: 100vw; max-width: 100vw; max-height: 100vh; height: 100vh; border-radius: 0; }
  .modal-header { padding: 14px 16px; }
  .modal-body { padding: 16px; }
  .modal-row { flex-direction: column; gap: 4px; }
  .modal-label { min-width: unset; }
}
`;

// ─── CONFIRM MODAL ───────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel = "Confirm", confirmStyle = "primary", onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>{Icons.x}</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className={`btn btn-sm ${confirmStyle === "danger" ? "" : "btn-primary"}`}
            style={confirmStyle === "danger" ? { background: "var(--red)", borderColor: "var(--red)", color: "white" } : {}}
            onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────
function Sidebar({ active, setActive, isOpen, onClose }) {
  const navItems = [
    { id: "dashboard",    icon: Icons.home,     label: "Dashboard" },
    { id: "calls",        icon: Icons.phone,    label: "Call Log" },
    { id: "screening",    icon: Icons.shield,   label: "Screening Rules" },
    { id: "team",         icon: Icons.users,    label: "Team & Routing" },
    { id: "integrations", icon: Icons.plug,     label: "Integrations" },
    { id: "settings",     icon: Icons.settings, label: "Settings" },
  ];
  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "visible" : ""}`} onClick={onClose} />
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <GateAILogo size={32} />
          <span className="logo-text">Gate AI</span>
        </div>
        <div className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {navItems.slice(0, 4).map(item => (
            <div key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`} onClick={() => { setActive(item.id); onClose(); }}>
              {item.icon}<span>{item.label}</span>
            </div>
          ))}
          <div className="nav-section-label">System</div>
          {navItems.slice(4).map(item => (
            <div key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`} onClick={() => { setActive(item.id); onClose(); }}>
              {item.icon}<span>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-status">
            <span className="status-dot" />
            AI Receptionist Active
          </div>
        </div>
      </div>
    </>
  );
}

// ─── TOPBAR ──────────────────────────────────────────────────
function Topbar({ title, onMenuToggle, setActivePage }) {
  const { user, logout } = useAuth();
  const [showMenu,  setShowMenu]  = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifCalls, setNotifCalls] = useState([]);
  const menuRef  = useRef(null);
  const notifRef = useRef(null);

  const avatarText = user ? initials(`${user.first_name || ""} ${user.last_name || ""}`) : "?";

  // Load recent calls for notifications panel
  useEffect(() => {
    if (showNotif && notifCalls.length === 0) {
      callsApi.list({ limit: 5, sort: "desc" })
        .then(res => setNotifCalls((res?.calls || res || []).map(normalizeCall)))
        .catch(() => {});
    }
  }, [showNotif]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSignOut() {
    logout();
    window.location.href = "/";
  }

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="mobile-menu-btn" onClick={onMenuToggle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </div>
        <span className="topbar-title">{title}</span>
        <div className="live-indicator"><span className="live-dot" /> Live</div>
      </div>
      <div className="topbar-right">
        <div className="topbar-search">{Icons.search}<input placeholder="Search calls, contacts..." /></div>

        {/* Notifications bell */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <div className="topbar-btn" onClick={() => { setShowNotif(v => !v); setShowMenu(false); }}>
            {Icons.bell}
            {notifCalls.length > 0 && <span className="notif-dot" />}
          </div>
          {showNotif && (
            <div className="notif-panel">
              <div className="notif-panel-header">
                <span className="notif-panel-title">Recent Activity</span>
                <button className="btn btn-sm" onClick={() => { setShowNotif(false); setActivePage("calls"); }}>View all</button>
              </div>
              {notifCalls.length === 0 ? (
                <div className="notif-empty">No calls yet — your number is listening</div>
              ) : notifCalls.map((c, i) => (
                <div key={i} className="notif-item">
                  <span className={c.status === "blocked" ? "notif-dot-r" : c.status === "forwarded" ? "notif-dot-g" : "notif-dot-o"} />
                  <div className="notif-body">
                    <div className="notif-text">{c.caller}{c.company ? ` — ${c.company}` : ""}</div>
                    <div className="notif-time">{c.status} · {c.time} · {c.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avatar dropdown */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <div className="topbar-avatar" onClick={() => { setShowMenu(v => !v); setShowNotif(false); }}>{avatarText}</div>
          {showMenu && (
            <div className="avatar-menu">
              <div className="avatar-menu-header">
                <div className="avatar-menu-name">{user?.first_name} {user?.last_name}</div>
                <div className="avatar-menu-email">{user?.email}</div>
              </div>
              <div className="avatar-menu-item" onClick={() => { setShowMenu(false); setActivePage("settings"); }}>
                {Icons.user} Update Profile
              </div>
              <div className="avatar-menu-item" onClick={() => { setShowMenu(false); setActivePage("settings"); }}>
                {Icons.settings} Settings
              </div>
              <div className="avatar-menu-divider" />
              <div className="avatar-menu-item danger" onClick={handleSignOut}>
                {Icons.logout} Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────
function StatCard({ label, value, icon, iconBg, change, changeDir }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={{ background: iconBg }}>{icon}</div>
      </div>
      <div className="stat-value">{value ?? "—"}</div>
      <div className="stat-change" style={{ color: changeDir === "up" ? "var(--green)" : changeDir === "down" ? "var(--red)" : "var(--text-tertiary)" }}>
        {changeDir === "up" ? Icons.arrowUp : changeDir === "down" ? Icons.arrowDown : null}
        {change}
      </div>
    </div>
  );
}

// ─── BILLING BANNER ──────────────────────────────────────────
function BillingBanner() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(false);
  const status = company?.subscription_status;

  if (!status || status === "active") return null;

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await billingApi.checkout(company?.plan || "pro");
      if (res?.url) window.location.href = res.url;
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  }

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await billingApi.portal();
      if (res?.url) window.location.href = res.url;
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  }

  if (status === "trialing") {
    const trialEnd = company?.trial_ends_at ? new Date(company.trial_ends_at) : null;
    const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24))) : null;
    return (
      <div className="billing-banner">
        <div>
          <div className="billing-banner-text">🎉 You're on your free trial{daysLeft !== null ? ` — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining` : ""}</div>
          <div className="billing-banner-sub">Subscribe now to keep your AI receptionist running after your trial ends.</div>
        </div>
        <div className="billing-banner-actions">
          <button className="btn btn-sm btn-primary" onClick={handleUpgrade} disabled={loading}>{Icons.creditCard} {loading ? "Loading..." : "Subscribe now"}</button>
        </div>
      </div>
    );
  }

  if (status === "past_due") {
    return (
      <div className="billing-banner" style={{ background: "rgba(255,107,107,0.08)", borderColor: "rgba(255,107,107,0.3)" }}>
        <div>
          <div className="billing-banner-text" style={{ color: "var(--red)" }}>⚠️ Payment failed — your account may be suspended soon</div>
          <div className="billing-banner-sub">Update your payment method to keep your service running.</div>
        </div>
        <div className="billing-banner-actions">
          <button className="btn btn-sm" style={{ background: "var(--red)", borderColor: "var(--red)", color: "white" }} onClick={handlePortal} disabled={loading}>{loading ? "Loading..." : "Fix payment"}</button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── CALL DETAIL MODAL ───────────────────────────────────────
function CallDetailModal({ call, onClose, onWhitelist, onBlock }) {
  const [confirm, setConfirm] = useState(null); // 'whitelist' | 'block'
  if (!call) return null;
  const c = normalizeCall(call);
  const confColor = c.confidence >= 90 ? "var(--green)" : c.confidence >= 75 ? "var(--orange)" : "var(--red)";

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">Call Summary</span>
            <button className="modal-close" onClick={onClose}>{Icons.x}</button>
          </div>
          <div className="modal-body">
            <div className="modal-row"><span className="modal-label">Caller</span><span className="modal-value" style={{ fontWeight: 600 }}>{c.caller}{c.company ? ` — ${c.company}` : ""}</span></div>
            <div className="modal-row"><span className="modal-label">Phone</span><span className="modal-value" style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{c.phone}</span></div>
            <div className="modal-row"><span className="modal-label">Time</span><span className="modal-value">{c.time} · {c.duration}</span></div>
            <div className="modal-row">
              <span className="modal-label">Status</span>
              <span className="modal-value">
                <span className={`badge ${c.status === "forwarded" ? "badge-green" : c.status === "blocked" ? "badge-red" : "badge-orange"}`}>
                  {c.status === "forwarded" ? Icons.check : c.status === "blocked" ? Icons.x : Icons.eye}
                  {c.status}
                </span>
              </span>
            </div>
            {c.forwardedTo && <div className="modal-row"><span className="modal-label">Routed To</span><span className="modal-value">{c.forwardedTo}</span></div>}
            <div className="modal-row"><span className="modal-label">Intent</span><span className="modal-value"><span className="badge badge-purple">{Icons.zap} {c.intent}</span></span></div>
            <div className="modal-row">
              <span className="modal-label">Confidence</span>
              <span className="modal-value" style={{ flex: 1 }}>
                <div className="confidence-bar-wrap">
                  <div className="confidence-bar"><div className="confidence-fill" style={{ width: `${c.confidence}%`, background: confColor }} /></div>
                  <span className="confidence-pct" style={{ color: confColor }}>{c.confidence}%</span>
                </div>
              </span>
            </div>
            {c.summary && <div style={{ marginTop: 8 }}><span className="modal-label" style={{ display: "block", marginBottom: 8 }}>AI Summary</span><div className="summary-box">{c.summary}</div></div>}
            {c.transcript && <div style={{ marginTop: 12 }}><span className="modal-label" style={{ display: "block", marginBottom: 8 }}>Transcript</span><div className="transcript-box">{c.transcript}</div></div>}
          </div>
          {c.phone && c.phone !== "—" && (
            <div className="modal-footer">
              <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginRight: "auto" }}>Actions for {c.phone}</span>
              <button className="btn btn-sm" style={{ color: "var(--green)", borderColor: "rgba(0,214,143,0.3)" }} onClick={() => setConfirm("whitelist")}>✓ Whitelist number</button>
              <button className="btn btn-sm" style={{ color: "var(--red)", borderColor: "rgba(255,107,107,0.3)" }} onClick={() => setConfirm("block")}>✕ Block number</button>
            </div>
          )}
        </div>
      </div>
      {confirm === "whitelist" && (
        <ConfirmModal
          title="Whitelist this number?"
          message={`${c.phone} will bypass AI screening and ring through directly on all future calls.`}
          confirmLabel="Whitelist"
          onConfirm={() => { onWhitelist(call); onClose(); }}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === "block" && (
        <ConfirmModal
          title="Block this number?"
          message={`${c.phone} will be added to your blocked patterns and rejected on all future calls.`}
          confirmLabel="Block number"
          confirmStyle="danger"
          onConfirm={() => { onBlock(call); onClose(); }}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  );
}

// ─── CALL ACTION MENU ────────────────────────────────────────
function CallActionMenu({ call, onWhitelist, onBlock }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const c = normalizeCall(call);

  return (
    <>
      <div className="action-menu-wrap" ref={ref} onClick={e => e.stopPropagation()}>
        <button className="btn btn-sm" onClick={() => setOpen(v => !v)}>Actions {Icons.chevDown}</button>
        {open && (
          <div className="action-menu">
  <div className="action-menu-item success" onClick={() => { setOpen(false); setConfirm("whitelist"); }}>
    ✓ {c.status === "blocked" ? "Unblock / Whitelist" : "Whitelist number"}
  </div>
  {c.status !== "blocked" && (
    <div className="action-menu-item danger" onClick={() => { setOpen(false); setConfirm("block"); }}>✕ Block number</div>
  )}
</div>
        )}
      </div>
      {confirm === "whitelist" && (
        <ConfirmModal
          title="Whitelist this number?"
          message={`${c.phone} will bypass AI screening on all future calls.`}
          confirmLabel="Whitelist"
          onConfirm={() => onWhitelist(call)}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === "block" && (
        <ConfirmModal
          title="Block this number?"
          message={`${c.phone} will be rejected on all future calls.`}
          confirmLabel="Block number"
          confirmStyle="danger"
          onConfirm={() => onBlock(call)}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  );
}

// ─── MOBILE CALL CARD ────────────────────────────────────────
function MobileCallCard({ call, onView }) {
  const c = normalizeCall(call);
  return (
    <div className="mobile-call-card" onClick={() => onView(call)}>
      <div className="mcc-top">
        <div><div className="mcc-caller">{c.caller}</div>{c.company && <div className="mcc-company">{c.company}</div>}</div>
        <span className={`badge ${c.status === "forwarded" ? "badge-green" : c.status === "blocked" ? "badge-red" : "badge-orange"}`}>{c.status}</span>
      </div>
      <div className="mcc-meta">
        <span className="mcc-meta-item">{Icons.clock} {c.time}</span>
        <span className="mcc-meta-item">{c.duration}</span>
        {c.forwardedTo && <span className="mcc-meta-item">{Icons.forward} {c.forwardedTo}</span>}
      </div>
      <div className="mcc-bottom">
        <span className="mcc-intent"><span className="badge badge-ghost">{c.intent}</span></span>
        <button className="btn btn-sm" onClick={e => { e.stopPropagation(); onView(call); }}>{Icons.eye} View</button>
      </div>
    </div>
  );
}

// ─── TOGGLE SETTING ──────────────────────────────────────────
function ToggleSetting({ label, desc, value, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 3 }}>{desc}</div>
      </div>
      <div className="toggle-wrap" onClick={() => onChange && onChange(!value)}>
        <div className={`toggle ${value ? "on" : ""}`}><div className="toggle-knob" /></div>
      </div>
    </div>
  );
}

// ─── SPINNER ─────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 24, height: 24, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── SHARED CALL ACTIONS ─────────────────────────────────────
async function whitelistCaller(call) {
  const c = normalizeCall(call);
  try {
    await whitelistApi.create({
      name: c.caller || "Unknown",
      phone_number: c.phone,
      company_name: c.company || "",
      tag: "Client",
    });
  } catch (err) { alert("Failed to whitelist: " + err.message); }
}

async function blockCaller(call) {
  const c = normalizeCall(call);
  try {
    await patternsApi.create({
      pattern: c.phone,
      pattern_type: "Caller ID",
      is_active: true,
    });
  } catch (err) { alert("Failed to block: " + err.message); }
}

// ─── DASHBOARD PAGE ──────────────────────────────────────────
function DashboardPage({ onViewCall, liveCalls }) {
  const [callList, setCallList] = useState([]);
  const [ptList,   setPtList]   = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      callsApi.list({ limit: 20, sort: "desc" }),
      patternsApi.list(),
      usersApi.list(),
    ]).then(([callRes, ptRes, teamRes]) => {
      setCallList(callRes?.calls || callRes || []);
      setPtList(ptRes?.patterns || ptRes || []);
      setTeamList(teamRes?.users || teamRes || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const allCalls   = liveCalls.length > 0 ? [...liveCalls, ...callList].slice(0, 20) : callList;
  const normalized = allCalls.map(normalizeCall);
  const blocked    = normalized.filter(c => c.status === "blocked").length;
  const forwarded  = normalized.filter(c => c.status === "forwarded").length;
  const screened   = normalized.filter(c => c.status === "screened").length;
  const total      = normalized.length;
  const recentCalls = normalized.slice(0, 5);

  if (loading) return <Spinner />;

  return (
    <>
      <BillingBanner />
      <div className="stats-grid">
        <StatCard label="Total Calls Today" value={total} icon={Icons.phone} iconBg="var(--accent-dim)" change={total > 0 ? `${total} calls` : "No calls yet"} changeDir="up" />
        <StatCard label="Blocked / Spam" value={blocked} icon={Icons.ban} iconBg="var(--red-dim)" change={total > 0 ? `${Math.round(blocked/total*100)}% of calls` : "0% of calls"} changeDir="down" />
        <StatCard label="Forwarded" value={forwarded} icon={Icons.forward} iconBg="var(--green-dim)" change={forwarded > 0 ? "Connected" : "None yet"} changeDir="up" />
        <StatCard label="Flagged / Screened" value={screened} icon={Icons.eye} iconBg="var(--orange-dim)" change="Pending review" changeDir={null} />
      </div>

      <div className="section">
        <div className="section-header">
          <span className="section-title">Recent Activity</span>
          <span className="live-indicator" style={{ fontSize: 11 }}><span className="live-dot" /> Listening</span>
        </div>
        {recentCalls.length === 0 ? (
          <div className="empty-state"><p>No calls yet — your Gate AI number is live and listening</p></div>
        ) : (
          <>
            <div className="table-wrap desktop-table">
              <table>
                <thead><tr><th>Caller</th><th>Phone</th><th>Time</th><th>Status</th><th>Intent</th><th>Routed To</th><th></th></tr></thead>
                <tbody>
                  {recentCalls.map((call, i) => (
                    <tr key={call.id || i} onClick={() => onViewCall(allCalls[i])}>
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{call.caller}{call.company && <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}> · {call.company}</span>}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{call.phone}</td>
                      <td><span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-tertiary)" }}>{Icons.clock} {call.time}</span></td>
                      <td><span className={`badge ${call.status === "forwarded" ? "badge-green" : call.status === "blocked" ? "badge-red" : "badge-orange"}`}>{call.status}</span></td>
                      <td><span className="badge badge-ghost">{call.intent}</span></td>
                      <td>{call.forwardedTo || <span style={{ color: "var(--text-tertiary)" }}>—</span>}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <CallActionMenu call={allCalls[i]} onWhitelist={whitelistCaller} onBlock={blockCaller} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-call-cards">
              {recentCalls.map((call, i) => <MobileCallCard key={call.id || i} call={allCalls[i]} onView={onViewCall} />)}
            </div>
          </>
        )}
      </div>

      <div className="dashboard-bottom-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="section">
          <div className="section-header"><span className="section-title">Top Blocked Patterns</span></div>
          <div style={{ padding: 16 }}>
            {ptList.length === 0 ? (
              <div style={{ color: "var(--text-tertiary)", fontSize: 13, padding: "8px 0" }}>No blocked patterns configured yet</div>
            ) : ptList.slice(0, 3).map((p, i) => (
              <div key={p.id || i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{p.pattern}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{p.pattern_type || p.type}</div>
                </div>
                <span className="badge badge-red">{p.hits || 0} blocked</span>
              </div>
            ))}
          </div>
        </div>
        <div className="section">
          <div className="section-header"><span className="section-title">Active Team Members</span></div>
          <div style={{ padding: 16 }}>
            {teamList.length === 0 ? (
              <div style={{ color: "var(--text-tertiary)", fontSize: 13, padding: "8px 0" }}>No team members added yet</div>
            ) : teamList.slice(0, 4).map((emp, i) => (
              <div key={emp.id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div className="emp-avatar" style={{ background: "linear-gradient(135deg, var(--accent), #a29bfe)", width: 30, height: 30, fontSize: 11 }}>
                  {initials(`${emp.first_name || ""} ${emp.last_name || ""}`)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{emp.first_name} {emp.last_name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{emp.role}</div>
                </div>
                <div className="emp-status" style={{ background: "var(--green)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── CALL LOG PAGE ───────────────────────────────────────────
function CallLogPage({ onViewCall }) {
  const [callList,  setCallList]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    callsApi.list({ limit: 100, sort: "desc" })
      .then(res => setCallList(res?.calls || res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const normalized = callList.map(normalizeCall);
  const filtered = filter === "all" ? normalized : normalized.filter(c => c.status === filter);

  function handleExport() {
    setExporting(true);
    try { exportCallsCsv({ status: filter !== "all" ? filter : undefined }); }
    finally { setTimeout(() => setExporting(false), 1500); }
  }

  return (
    <div className="section">
      <div className="section-header">
        <span className="section-title">Call Log</span>
        <div className="section-actions">
          <button className="btn btn-sm btn-primary" onClick={handleExport} disabled={exporting}>{Icons.download} {exporting ? "Exporting..." : "Export CSV"}</button>
        </div>
      </div>
      <div className="filter-bar">
        {["all", "forwarded", "blocked", "screened"].map(f => (
          <button key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All Calls" : f.charAt(0).toUpperCase() + f.slice(1)}
            <span style={{ marginLeft: 4, opacity: 0.6 }}>({f === "all" ? normalized.length : normalized.filter(c => c.status === f).length})</span>
          </button>
        ))}
      </div>
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="empty-state"><p>No {filter !== "all" ? filter : ""} calls found</p></div>
      ) : (
        <>
          <div className="table-wrap desktop-table">
            <table>
              <thead><tr><th>Caller</th><th>Company</th><th>Phone</th><th>Time</th><th>Duration</th><th>Status</th><th>Intent</th><th>Confidence</th><th>Routed To</th><th></th></tr></thead>
              <tbody>
                {filtered.map((call, i) => (
                  <tr key={call.id || i} onClick={() => onViewCall(callList[normalized.indexOf(call)] ?? callList[i])}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{call.caller}</td>
                    <td>{call.company || <span style={{ color: "var(--text-tertiary)" }}>—</span>}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{call.phone}</td>
                    <td>{call.time}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{call.duration}</td>
                    <td><span className={`badge ${call.status === "forwarded" ? "badge-green" : call.status === "blocked" ? "badge-red" : "badge-orange"}`}>{call.status}</span></td>
                    <td><span className="badge badge-ghost">{call.intent}</span></td>
                    <td>
                      <div className="confidence-bar-wrap" style={{ minWidth: 80 }}>
                        <div className="confidence-bar" style={{ flex: 1 }}><div className="confidence-fill" style={{ width: `${call.confidence}%`, background: call.confidence >= 90 ? "var(--green)" : "var(--orange)" }} /></div>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>{call.confidence}%</span>
                      </div>
                    </td>
                    <td>{call.forwardedTo || <span style={{ color: "var(--text-tertiary)" }}>—</span>}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <CallActionMenu call={callList[i]} onWhitelist={whitelistCaller} onBlock={blockCaller} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-call-cards">
            {filtered.map((call, i) => <MobileCallCard key={call.id || i} call={callList[i]} onView={onViewCall} />)}
          </div>
        </>
      )}
    </div>
  );
}

// ─── SCREENING PAGE ──────────────────────────────────────────
function ScreeningPage() {
  const [ptList,   setPtList]   = useState([]);
  const [wlList,   setWlList]   = useState([]);
  const [tab,      setTab]      = useState("blocked");
  const [loading,  setLoading]  = useState(true);
  const [addingPt, setAddingPt] = useState(false);
  const [addingWl, setAddingWl] = useState(false);
  const [ptForm,   setPtForm]   = useState({ pattern: "", pattern_type: "Keyword" });
  const [wlForm,   setWlForm]   = useState({ name: "", company_name: "", phone_number: "", tag: "Client" });
  const [scrEmail, setScrEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [notifSettings, setNotifSettings] = useState({});

  useEffect(() => {
    Promise.all([patternsApi.list(), whitelistApi.list(), settingsApi.get(), notificationsApi.get()])
      .then(([pt, wl, sett, notif]) => {
        setPtList(pt?.patterns || pt || []);
        setWlList(wl?.contacts || wl || []);
        setScrEmail(sett?.screening_email || "");
        setNotifSettings(notif?.settings || notif || {});
      }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function addPattern() {
    if (!ptForm.pattern) return;
    try { const entry = await patternsApi.create(ptForm); setPtList(prev => [entry, ...prev]); setPtForm({ pattern: "", pattern_type: "Keyword" }); setAddingPt(false); }
    catch (err) { alert(err.message); }
  }
  async function removePattern(id) {
    if (!confirm("Remove this pattern?")) return;
    try { await patternsApi.remove(id); setPtList(prev => prev.filter(p => p.id !== id)); }
    catch (err) { alert(err.message); }
  }
  async function addWhitelist() {
    if (!wlForm.name) return;
    try { const entry = await whitelistApi.create(wlForm); setWlList(prev => [entry, ...prev]); setWlForm({ name: "", company_name: "", phone_number: "", tag: "Client" }); setAddingWl(false); }
    catch (err) { alert(err.message); }
  }
  async function removeWhitelist(id) {
    if (!confirm("Remove from whitelist?")) return;
    try { await whitelistApi.remove(id); setWlList(prev => prev.filter(w => w.id !== id)); }
    catch (err) { alert(err.message); }
  }
  async function saveScreeningEmail() {
    setSavingEmail(true);
    try { await settingsApi.update({ screening_email: scrEmail }); }
    catch (err) { alert(err.message); }
    finally { setSavingEmail(false); }
  }
  async function toggleNotif(key) {
    const updated = { ...notifSettings, [key]: !notifSettings[key] };
    try { await notificationsApi.update(updated); setNotifSettings(updated); }
    catch (err) { alert(err.message); }
  }

  if (loading) return <Spinner />;

  return (
    <>
      <div className="tabs">
        <div className={`tab ${tab === "blocked" ? "active" : ""}`} onClick={() => setTab("blocked")}>Blocked Patterns</div>
        <div className={`tab ${tab === "whitelist" ? "active" : ""}`} onClick={() => setTab("whitelist")}>Whitelist / VIP</div>
        <div className={`tab ${tab === "ai" ? "active" : ""}`} onClick={() => setTab("ai")}>AI Behavior</div>
      </div>

      {tab === "blocked" && (
        <div className="section" style={{ border: "none", borderRadius: 0 }}>
          <div className="section-header" style={{ borderTop: "none" }}>
            <span className="section-title">Blocked Patterns & Keywords</span>
            <button className="btn btn-sm btn-primary" onClick={() => setAddingPt(!addingPt)}>{Icons.plus} Add Pattern</button>
          </div>
          {addingPt && (
            <div className="add-form-row">
              <input className="form-input" placeholder="Pattern (e.g. Solar panel offers)" value={ptForm.pattern} onChange={e => setPtForm(p => ({ ...p, pattern: e.target.value }))} />
              <select className="form-input" value={ptForm.pattern_type} onChange={e => setPtForm(p => ({ ...p, pattern_type: e.target.value }))}>
                {["Keyword", "Number Range", "Caller ID"].map(t => <option key={t}>{t}</option>)}
              </select>
              <button className="btn btn-sm btn-primary" onClick={addPattern}>Add</button>
              <button className="btn btn-sm" onClick={() => setAddingPt(false)}>Cancel</button>
            </div>
          )}
          {ptList.length === 0 ? <div className="empty-state"><p>No blocked patterns configured yet</p></div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Pattern</th><th>Type</th><th>Hits</th><th>Actions</th></tr></thead>
              <tbody>{ptList.map(p => (
                <tr key={p.id}>
                  <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{p.pattern}</td>
                  <td><span className="badge badge-ghost">{p.pattern_type || p.type}</span></td>
                  <td style={{ fontFamily: "var(--font-mono)" }}>{p.hits || 0}</td>
                  <td><button className="btn btn-sm" style={{ color: "var(--red)" }} onClick={() => removePattern(p.id)}>Remove</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      )}

      {tab === "whitelist" && (
        <div className="section" style={{ border: "none", borderRadius: 0 }}>
          <div className="section-header">
            <span className="section-title">Whitelisted Contacts — Bypass Screening</span>
            <button className="btn btn-sm btn-primary" onClick={() => setAddingWl(!addingWl)}>{Icons.plus} Add Contact</button>
          </div>
          {addingWl && (
            <div className="add-form-row">
              <input className="form-input" placeholder="Full name *" value={wlForm.name} onChange={e => setWlForm(p => ({ ...p, name: e.target.value }))} />
              <input className="form-input" placeholder="Company" value={wlForm.company_name} onChange={e => setWlForm(p => ({ ...p, company_name: e.target.value }))} />
              <input className="form-input" placeholder="Phone" value={wlForm.phone_number} onChange={e => setWlForm(p => ({ ...p, phone_number: e.target.value }))} />
              <select className="form-input" value={wlForm.tag} onChange={e => setWlForm(p => ({ ...p, tag: e.target.value }))}>
                {["Client", "Vendor", "VIP", "Partner"].map(t => <option key={t}>{t}</option>)}
              </select>
              <button className="btn btn-sm btn-primary" onClick={addWhitelist}>Add</button>
              <button className="btn btn-sm" onClick={() => setAddingWl(false)}>Cancel</button>
            </div>
          )}
          {wlList.length === 0 ? <div className="empty-state"><p>No whitelisted contacts yet</p></div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Tag</th><th>Actions</th></tr></thead>
              <tbody>{wlList.map(c => (
                <tr key={c.id}>
                  <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{c.name}</td>
                  <td>{c.company_name || c.company}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{c.phone_number || c.phone}</td>
                  <td><span className={`badge ${c.tag === "VIP" ? "badge-purple" : c.tag === "Client" ? "badge-blue" : "badge-green"}`}>{c.tag}</span></td>
                  <td><button className="btn btn-sm" style={{ color: "var(--red)" }} onClick={() => removeWhitelist(c.id)}>Remove</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      )}

      {tab === "ai" && (
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="section" style={{ marginBottom: 0 }}>
            <div className="section-header"><span className="section-title">Screening Email</span></div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 12 }}>Blocked callers are told to email this address for genuine business enquiries.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="form-input" style={{ flex: 1 }} placeholder="screening@yourcompany.com" value={scrEmail} onChange={e => setScrEmail(e.target.value)} />
                <button className="btn btn-sm btn-primary" onClick={saveScreeningEmail} disabled={savingEmail}>{savingEmail ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
          <div className="section" style={{ marginBottom: 0 }}>
            <div className="section-header"><span className="section-title">Notification Settings</span></div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
              <ToggleSetting label="Whitelist suggestion emails" desc="Get notified when Gate AI suggests adding a forwarded caller to your whitelist" value={notifSettings?.whitelist_suggestion_email !== false} onChange={() => toggleNotif("whitelist_suggestion_email")} />
              <ToggleSetting label="Blocked call email alerts" desc="Receive an email when a call is blocked. Off by default." value={!!notifSettings?.blocked_call_email_enabled} onChange={() => toggleNotif("blocked_call_email_enabled")} />
              <ToggleSetting label="Real-time Slack alerts" desc="Get instant Slack notifications for blocked and forwarded calls" value={!!notifSettings?.slack_enabled} onChange={() => toggleNotif("slack_enabled")} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── TEAM PAGE ───────────────────────────────────────────────
function TeamPage() {
  const [team,    setTeam]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [form,    setForm]    = useState({ first_name: "", last_name: "", email: "", phone: "", extension: "", role: "employee" });

  useEffect(() => {
    usersApi.list().then(res => setTeam(res?.users || res || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function addMember() {
    if (!form.first_name || !form.email) return;
    try {
      const member = await usersApi.create({ ...form, password: Math.random().toString(36).slice(-10) + "A1!" });
      setTeam(prev => [...prev, member]);
      setForm({ first_name: "", last_name: "", email: "", phone: "", extension: "", role: "employee" });
      setAdding(false);
    } catch (err) { alert(err.message); }
  }
  async function removeMember(id) {
    if (!confirm("Remove this team member?")) return;
    try { await usersApi.remove(id); setTeam(prev => prev.filter(m => m.id !== id)); }
    catch (err) { alert(err.message); }
  }

  const COLORS = ["linear-gradient(135deg, var(--accent), #a29bfe)", "linear-gradient(135deg, var(--green), #0abf76)", "linear-gradient(135deg, var(--blue), #228be6)", "linear-gradient(135deg, var(--orange), #e67700)"];
  if (loading) return <Spinner />;

  return (
    <div className="section">
      <div className="section-header">
        <span className="section-title">Team Members & Routing</span>
        <button className="btn btn-sm btn-primary" onClick={() => setAdding(!adding)}>{Icons.plus} Add Employee</button>
      </div>
      {adding && (
        <div className="add-form-row">
          <input className="form-input" placeholder="First name *" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
          <input className="form-input" placeholder="Last name" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
          <input className="form-input" placeholder="Email *" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <input className="form-input" placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          <input className="form-input" placeholder="Extension" value={form.extension} onChange={e => setForm(p => ({ ...p, extension: e.target.value }))} />
          <button className="btn btn-sm btn-primary" onClick={addMember}>Add</button>
          <button className="btn btn-sm" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      )}
      {team.length === 0 ? <div className="empty-state"><p>No team members yet — add your first employee above</p></div> : (
        <div className="employee-grid">
          {team.map((emp, i) => (
            <div key={emp.id} className="employee-card">
              <div className="emp-avatar" style={{ background: COLORS[i % COLORS.length] }}>{initials(`${emp.first_name || ""} ${emp.last_name || ""}`)}</div>
              <div className="emp-info">
                <div className="emp-name">{emp.first_name} {emp.last_name}</div>
                <div className="emp-role">{emp.role || emp.department}</div>
                {emp.extension && <div className="emp-ext">Ext. {emp.extension}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div className="emp-status" style={{ background: "var(--green)" }} />
                <button className="btn btn-sm" style={{ color: "var(--red)", fontSize: 10, padding: "2px 7px" }} onClick={() => removeMember(emp.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── INTEGRATIONS PAGE ───────────────────────────────────────
function IntegrationsPage() {
  const integrations = [
    { name: "Twilio",          desc: "VoIP telephony, SIP trunking, programmable voice — the backbone of your phone system.",        color: "#f22f46", letter: "T", connected: true },
    { name: "OpenPhone",       desc: "Business phone system with shared numbers, team inboxes, and CRM integration.",                color: "#5865f2", letter: "O", connected: false },
    { name: "Talkroute",       desc: "Virtual phone system with call forwarding, voicemail, and auto-attendant.",                    color: "#00b894", letter: "T", connected: false },
    { name: "Avaya",           desc: "Enterprise communications platform with advanced call center capabilities.",                   color: "#cc0000", letter: "A", connected: false },
    { name: "Slack",           desc: "Deliver call summaries, blocked-call alerts, and screening reports to channels.",             color: "#e01e5a", letter: "S", connected: true },
    { name: "Microsoft Teams", desc: "Push call notifications and summaries directly into Teams channels.",                         color: "#5059c9", letter: "M", connected: false },
    { name: "Email (SMTP)",    desc: "Send call summaries and daily digests via email to employees and admins.",                    color: "#ffa94d", letter: "@", connected: true },
    { name: "Zapier",          desc: "Connect Gate AI to 5000+ apps with custom automation workflows.",                             color: "#ff4a00", letter: "Z", connected: false },
  ];
  return (
    <div className="section">
      <div className="section-header">
        <span className="section-title">Integrations & Plugins</span>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{integrations.filter(i => i.connected).length} connected</span>
      </div>
      <div className="integrations-grid">
        {integrations.map((int, i) => (
          <div key={i} className="integration-card">
            <div className="integration-top">
              <div className="integration-icon" style={{ background: int.color + "20", color: int.color, fontSize: 16 }}>{int.letter}</div>
              <span className={`badge ${int.connected ? "badge-green" : "badge-ghost"}`}>{int.connected ? "Connected" : "Available"}</span>
            </div>
            <div className="integration-name">{int.name}</div>
            <div className="integration-desc">{int.desc}</div>
            <button className={`btn btn-sm ${int.connected ? "" : "btn-primary"}`} style={{ alignSelf: "flex-start", marginTop: 4 }}>{int.connected ? "Configure" : "Connect"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ───────────────────────────────────────────
function SettingsPage() {
  const { user, company, login } = useAuth();
  const [notifs,   setNotifs]   = useState(null);
  const [loading,  setLoading]  = useState(true);

  // Company profile state
  const [companyForm,   setCompanyForm]   = useState({ name: "", industry: "", timezone: "" });
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySaved,  setCompanySaved]  = useState(false);

  // Account state
  const [accountForm,   setAccountForm]   = useState({ first_name: "", last_name: "", email: "" });
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSaved,  setAccountSaved]  = useState(false);

  // Password state
  const [pwForm,    setPwForm]    = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [savingPw,  setSavingPw]  = useState(false);
  const [pwError,   setPwError]   = useState("");
  const [pwSaved,   setPwSaved]   = useState(false);

  useEffect(() => {
    notificationsApi.get()
      .then(res => setNotifs(res?.settings || res || {}))
      .catch(() => setNotifs({}))
      .finally(() => setLoading(false));
    if (company) setCompanyForm({ name: company.name || "", industry: company.industry || "", timezone: company.timezone || "" });
    if (user)    setAccountForm({ first_name: user.first_name || "", last_name: user.last_name || "", email: user.email || "" });
  }, []);

  async function saveCompany() {
    setSavingCompany(true); setCompanySaved(false);
    try {
      const updated = await settingsApi.update({ company_name: companyForm.name, industry: companyForm.industry, timezone: companyForm.timezone });
      // Update local auth context
      const token = localStorage.getItem("gateai_token");
      if (token) {
        const me = await fetch(`${import.meta.env.VITE_API_URL || "https://gate-ai-backend-production.up.railway.app"}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        if (me.token || token) login({ token, user: me.user || user, company: me.company || company });
      }
      setCompanySaved(true);
      setTimeout(() => setCompanySaved(false), 3000);
    } catch (err) { alert(err.message); }
    finally { setSavingCompany(false); }
  }

  async function saveAccount() {
    setSavingAccount(true); setAccountSaved(false);
    try {
      await usersApi.update(user.id, { first_name: accountForm.first_name, last_name: accountForm.last_name, email: accountForm.email });
      const token = localStorage.getItem("gateai_token");
      login({ token, user: { ...user, ...accountForm }, company });
      setAccountSaved(true);
      setTimeout(() => setAccountSaved(false), 3000);
    } catch (err) { alert(err.message); }
    finally { setSavingAccount(false); }
  }

  async function savePassword() {
    setPwError(""); setPwSaved(false);
    if (!pwForm.current_password || !pwForm.new_password) { setPwError("Please fill in all password fields."); return; }
    if (pwForm.new_password.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (pwForm.new_password !== pwForm.confirm_password) { setPwError("New passwords do not match."); return; }
    setSavingPw(true);
    try {
      await usersApi.update(user.id, { current_password: pwForm.current_password, password: pwForm.new_password });
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err) { setPwError(err.message); }
    finally { setSavingPw(false); }
  }

  async function toggle(key) {
    const updated = { ...notifs, [key]: !notifs[key] };
    try { await notificationsApi.update(updated); setNotifs(updated); }
    catch (err) { alert(err.message); }
  }

  async function openBillingPortal() {
    try { const res = await billingApi.portal(); if (res?.url) window.location.href = res.url; }
    catch (err) { alert(err.message); }
  }

  if (loading) return <Spinner />;

  const fieldStyle = { width: "100%", padding: "9px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-primary)", outline: "none", transition: "border-color 180ms ease" };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6, display: "block" };
  const savedBadge = { fontSize: 12, color: "var(--green)", fontWeight: 500 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Company Profile */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Company Profile</span>
          {companySaved && <span style={savedBadge}>✓ Saved</span>}
        </div>
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Company Name</label>
            <input style={fieldStyle} value={companyForm.name} onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
          <div>
            <label style={labelStyle}>Plan</label>
            <div style={{ ...fieldStyle, color: "var(--text-secondary)", cursor: "default" }}>{company?.plan || "starter"}</div>
          </div>
          <div>
            <label style={labelStyle}>Industry</label>
            <select style={fieldStyle} value={companyForm.industry} onChange={e => setCompanyForm(f => ({ ...f, industry: e.target.value }))} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"}>
              <option value="">Select industry</option>
              <option value="logistics">Logistics & Freight</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="distribution">Distribution & Warehousing</option>
              <option value="construction">Construction</option>
              <option value="transport">Transport & Haulage</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Timezone</label>
            <select style={fieldStyle} value={companyForm.timezone} onChange={e => setCompanyForm(f => ({ ...f, timezone: e.target.value }))} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"}>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Central Europe (CET)</option>
            </select>
          </div>
        </div>
        <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-sm btn-primary" onClick={saveCompany} disabled={savingCompany}>{savingCompany ? "Saving..." : "Save changes"}</button>
        </div>
      </div>

      {/* Account Details */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Account Details</span>
          {accountSaved && <span style={savedBadge}>✓ Saved</span>}
        </div>
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>First Name</label>
            <input style={fieldStyle} value={accountForm.first_name} onChange={e => setAccountForm(f => ({ ...f, first_name: e.target.value }))} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <input style={fieldStyle} value={accountForm.last_name} onChange={e => setAccountForm(f => ({ ...f, last_name: e.target.value }))} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Email Address</label>
            <input type="email" style={fieldStyle} value={accountForm.email} onChange={e => setAccountForm(f => ({ ...f, email: e.target.value }))} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
        </div>
        <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-sm btn-primary" onClick={saveAccount} disabled={savingAccount}>{savingAccount ? "Saving..." : "Save changes"}</button>
        </div>
      </div>

      {/* Change Password */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Change Password</span>
          {pwSaved && <span style={savedBadge}>✓ Password updated</span>}
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {pwError && <div style={{ background: "var(--red-dim)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13, color: "var(--red)" }}>{pwError}</div>}
          <div>
            <label style={labelStyle}>Current Password</label>
            <input type="password" style={fieldStyle} placeholder="Enter current password" value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>New Password</label>
              <input type="password" style={fieldStyle} placeholder="Min. 8 characters" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input type="password" style={fieldStyle} placeholder="Repeat new password" value={pwForm.confirm_password} onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-sm btn-primary" onClick={savePassword} disabled={savingPw}>{savingPw ? "Updating..." : "Update password"}</button>
          </div>
        </div>
      </div>

      {/* Billing */}
      <div className="section">
        <div className="section-header"><span className="section-title">Billing & Subscription</span></div>
        <div style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Current plan: <span style={{ color: "var(--accent-light)", textTransform: "capitalize" }}>{company?.plan || "Starter"}</span></div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>Manage your subscription, invoices, and payment method.</div>
          </div>
          <button className="btn btn-sm btn-primary" onClick={openBillingPortal}>{Icons.creditCard} Manage billing</button>
        </div>
      </div>

      {/* Notifications */}
      <div className="section">
        <div className="section-header"><span className="section-title">Notification Preferences</span></div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <ToggleSetting label="Whitelist suggestion emails" desc="Get notified when Gate AI recommends adding a forwarded caller to your whitelist" value={notifs?.whitelist_suggestion_email !== false} onChange={() => toggle("whitelist_suggestion_email")} />
          <ToggleSetting label="Blocked call email alerts" desc="Receive an email when a call is blocked. Off by default." value={!!notifs?.blocked_call_email_enabled} onChange={() => toggle("blocked_call_email_enabled")} />
          <ToggleSetting label="Real-time Slack alerts" desc="Get instant Slack notifications for blocked and forwarded calls" value={!!notifs?.slack_enabled} onChange={() => toggle("slack_enabled")} />
          <ToggleSetting label="Weekly analytics report" desc="Auto-generate and email a weekly call analytics summary" value={!!notifs?.weekly_report_enabled} onChange={() => toggle("weekly_report_enabled")} />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:    "Dashboard",
  calls:        "Call Log",
  screening:    "Screening Rules",
  team:         "Team & Routing",
  integrations: "Integrations",
  settings:     "Settings",
};

export default function Dashboard() {
  const [activePage,   setActivePage]   = useState("dashboard");
  const [selectedCall, setSelectedCall] = useState(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [liveCalls,    setLiveCalls]    = useState([]);

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === "new_call") setLiveCalls(prev => [msg.call, ...prev].slice(0, 20));
  }, []);
  useWebSocket(handleWsMessage);

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <Sidebar active={activePage} setActive={setActivePage} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main">
          <Topbar title={PAGE_TITLES[activePage]} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} setActivePage={setActivePage} />
          <div className="content">
            {activePage === "dashboard"    && <DashboardPage onViewCall={setSelectedCall} liveCalls={liveCalls} />}
            {activePage === "calls"        && <CallLogPage   onViewCall={setSelectedCall} />}
            {activePage === "screening"    && <ScreeningPage />}
            {activePage === "team"         && <TeamPage />}
            {activePage === "integrations" && <IntegrationsPage />}
            {activePage === "settings"     && <SettingsPage />}
          </div>
        </div>
        {selectedCall && (
          <CallDetailModal
            call={selectedCall}
            onClose={() => setSelectedCall(null)}
            onWhitelist={whitelistCaller}
            onBlock={blockCaller}
          />
        )}
      </div>
    </>
  );
}
