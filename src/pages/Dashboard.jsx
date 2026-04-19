import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import ImpersonationBanner from "../components/ImpersonationBanner.jsx";
import NotificationBanner from '../components/NotificationBanner.jsx';
import JWTExpiryBanner from '../components/JWTExpiryBanner.jsx';
import GettingStartedChecklist from "../components/GettingStartedChecklist.jsx";
import { useWebSocket } from "../hooks/useWebSocket.js";
import {
  calls as callsApi,
  users as usersApi,
  whitelist as whitelistApi,
  patterns as patternsApi,
  routing as routingApi,
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
    dateTime:    (() => { const d = c.started_at || c.created_at; if (!d) return "—"; return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }); })(),
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

// Simple sentence-case helper used in Settings
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
  bot: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>),
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

.employee-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; padding: 16px 20px; }
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
.action-menu { position: absolute; right: 0; top: calc(100% + 4px); background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-md); min-width: 160px; box-shadow: var(--shadow-md); z-index: 50; overflow: hidden; animation: fadeIn 120ms ease; }
.action-menu-item { padding: 9px 14px; font-size: 12.5px; color: var(--text-secondary); cursor: pointer; transition: all var(--transition); }
.action-menu-item:hover { background: var(--bg-hover); color: var(--text-primary); }
.action-menu-item.danger { color: var(--red); }
.action-menu-item.danger:hover { background: var(--red-dim); }
.action-menu-item.success { color: var(--green); }
.action-menu-item.success:hover { background: var(--green-dim); }

@media (max-width: 768px) {
  .sidebar { position: fixed; left: -240px; top: 0; height: 100vh; transition: left 200ms ease; z-index: 50; }
  .sidebar.open { left: 0; }
  .sidebar-overlay.visible { display: block; }
  .mobile-menu-btn { display: flex; }
  .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
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
    { id: "aiassistant",  icon: Icons.bot,      label: "AI Assistant" },
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
          {navItems.slice(0, 5).map(item => (
            <div key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`} onClick={() => { setActive(item.id); onClose(); }}>
              {item.icon}<span>{item.label}</span>
            </div>
          ))}
          <div className="nav-section-label">System</div>
          {navItems.slice(5).map(item => (
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

// ─── SEARCH ITEMS ────────────────────────────────────────────
const SEARCH_ITEMS = [
  { label: "AI Assistant",             page: "aiassistant", filter: null,        keywords: ["ai","assistant","jarvis","sphere","gate-ai","bot","live","status"] },
  { label: "Dashboard",                page: "dashboard",    filter: null,        keywords: ["home","overview","dashboard","main"] },
  { label: "Call Log",                 page: "calls",        filter: "all",       keywords: ["calls","log","history","all calls"] },
  { label: "Blocked calls",            page: "calls",        filter: "blocked",   keywords: ["blocked","spam","block","rejected"] },
  { label: "Forwarded calls",          page: "calls",        filter: "forwarded", keywords: ["forwarded","connected","routed"] },
  { label: "Screened calls",           page: "calls",        filter: "screened",  keywords: ["screened","flagged","pending"] },
  { label: "Screening Rules",          page: "screening",    filter: null,        keywords: ["screen","patterns","rules","keywords","block list"] },
  { label: "Whitelist / VIP",          page: "screening",    filter: null,        keywords: ["whitelist","vip","allow","bypass","contact"] },
  { label: "Team & Routing",           page: "team",         filter: null,        keywords: ["team","routing","employees","members","staff"] },
  { label: "Integrations",             page: "integrations", filter: null,        keywords: ["integrations","slack","twilio","connect","zapier","teams"] },
  { label: "Settings",                 page: "settings",     filter: null,        keywords: ["settings","preferences","account","profile"] },
  { label: "Account Details",          page: "settings",     filter: null,        keywords: ["account","name","email","phone","forwarding"] },
  { label: "Billing & Subscription",   page: "settings",     filter: null,        keywords: ["billing","subscription","plan","payment","invoice","stripe"] },
  { label: "Notification Preferences", page: "settings",     filter: null,        keywords: ["notifications","alerts","email alerts","slack alerts","weekly"] },
  { label: "AI Assistant",             page: "settings",     filter: null,        keywords: ["assistant","ai","gate-ai","name","vapi"] },
  { label: "Change Password",          page: "settings",     filter: null,        keywords: ["password","security","change password"] },
];

// ─── TOPBAR ──────────────────────────────────────────────────
function Topbar({ title, onMenuToggle, setActivePage, onSearchNavigate }) {
  const { user, logout } = useAuth();
  const [showMenu,    setShowMenu]    = useState(false);
  const [showNotif,   setShowNotif]   = useState(false);
  const [notifCalls,  setNotifCalls]  = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch,  setShowSearch]  = useState(false);
  const menuRef   = useRef(null);
  const notifRef  = useRef(null);
  const searchRef = useRef(null);

  // Filter suggestions as user types
  const q = searchQuery.trim().toLowerCase();
  const suggestions = q.length < 1 ? [] : SEARCH_ITEMS.filter(item =>
    item.label.toLowerCase().includes(q) ||
    item.keywords.some(k => k.includes(q))
  ).slice(0, 6);

  function handleSearchSelect(item) {
    setSearchQuery("");
    setShowSearch(false);
    if (onSearchNavigate) onSearchNavigate(item.page, item.filter);
    else setActivePage(item.page);
  }

  const avatarText = user ? initials(`${user.first_name || ""} ${user.last_name || ""}`) : "?";

  useEffect(() => {
    if (showNotif && notifCalls.length === 0) {
      callsApi.list({ limit: 5, sort: "desc" })
        .then(res => setNotifCalls((res?.calls || res || []).map(normalizeCall)))
        .catch(() => {});
    }
  }, [showNotif]);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
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
        <div className="topbar-search" ref={searchRef} style={{ position: "relative" }}>
          {Icons.search}
          <input
            placeholder="Search pages, settings..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            onKeyDown={e => {
              if (e.key === "Escape") { setShowSearch(false); setSearchQuery(""); }
              if (e.key === "Enter" && suggestions.length > 0) handleSearchSelect(suggestions[0]);
            }}
          />
          {showSearch && suggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
              background: "var(--bg-card)", border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)",
              zIndex: 300, overflow: "hidden", minWidth: 220,
            }}>
              {suggestions.map((item, i) => (
                <div
                  key={i}
                  onClick={() => handleSearchSelect(item)}
                  style={{
                    padding: "9px 14px", fontSize: 13, color: "var(--text-secondary)",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>
                    {item.page.charAt(0).toUpperCase() + item.page.slice(1)}
                  </span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

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
function StatCard({ label, value, icon, iconBg, change, changeDir, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
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
      else throw new Error("Could not open checkout. Please try again or contact hello@gate-ai.io");
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  }

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await billingApi.portal();
      if (res?.url) window.open(res.url, "_blank");
      else throw new Error("Billing portal unavailable. Please contact hello@gate-ai.io for help with your subscription.");
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
  const [confirm, setConfirm] = useState(null);
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
            <div className="modal-row"><span className="modal-label">Time</span><span className="modal-value">{c.dateTime} · {c.duration}</span></div>
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
function CallActionMenu({ call, onWhitelist, onBlock, onUnblock }) {
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
            {c.status === "blocked" ? (
              <>
                <div className="action-menu-item" onClick={() => { setOpen(false); setConfirm("unblock"); }}>↩ Unblock number</div>
                <div className="action-menu-item success" onClick={() => { setOpen(false); setConfirm("whitelist"); }}>✓ Whitelist number</div>
              </>
            ) : (
              <>
                <div className="action-menu-item success" onClick={() => { setOpen(false); setConfirm("whitelist"); }}>✓ Whitelist number</div>
                <div className="action-menu-item danger" onClick={() => { setOpen(false); setConfirm("block"); }}>✕ Block number</div>
              </>
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
      {confirm === "unblock" && (
        <ConfirmModal
          title="Unblock this number?"
          message={`${c.phone} will be removed from your blocked patterns and go through normal screening on future calls.`}
          confirmLabel="Unblock"
          onConfirm={() => onUnblock(call)}
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

async function unblockCaller(call) {
  const c = normalizeCall(call);
  try {
    const res = await patternsApi.list();
    const all = res?.patterns || res || [];
    const match = all.find(p => p.pattern === c.phone);
    if (match) await patternsApi.remove(match.id);
    else alert("No blocked pattern found for this number.");
  } catch (err) { alert("Failed to unblock: " + err.message); }
}

// ─── DASHBOARD PAGE ──────────────────────────────────────────
function DashboardPage({ onViewCall, liveCalls, setActivePage, setCallLogFilter }) {
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
      {/* Notification banner — whitelist suggestions and grey area reviews */}
      <NotificationBanner />
      {/* Getting Started checklist — shown to new companies until dismissed */}
      <GettingStartedChecklist setActivePage={setActivePage} />

      <BillingBanner />
      <div className="stats-grid">
        <StatCard label="Total Calls Today" value={total} icon={Icons.phone} iconBg="var(--accent-dim)" change={total > 0 ? `${total} calls` : "No calls yet"} changeDir="up"
          onClick={() => { setActivePage("calls"); setCallLogFilter("all"); }} />
        <StatCard label="Blocked / Spam" value={blocked} icon={Icons.ban} iconBg="var(--red-dim)" change={total > 0 ? `${Math.round(blocked/total*100)}% of calls` : "0% of calls"} changeDir="down"
          onClick={() => { setActivePage("calls"); setCallLogFilter("blocked"); }} />
        <StatCard label="Forwarded" value={forwarded} icon={Icons.forward} iconBg="var(--green-dim)" change={forwarded > 0 ? "Connected" : "None yet"} changeDir="up"
          onClick={() => { setActivePage("calls"); setCallLogFilter("forwarded"); }} />
        <StatCard label="Flagged / Screened" value={screened} icon={Icons.eye} iconBg="var(--orange-dim)" change="Pending review" changeDir={null}
          onClick={() => { setActivePage("calls"); setCallLogFilter("screened"); }} />
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
                        <CallActionMenu call={allCalls[i]} onWhitelist={whitelistCaller} onBlock={blockCaller} onUnblock={unblockCaller} />
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
        <div className="section" style={{ cursor: "pointer" }} onClick={() => setActivePage("screening")}>
          <div className="section-header">
            <span className="section-title">Top Blocked Patterns</span>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>View all →</span>
          </div>
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
        <div className="section" style={{ cursor: "pointer" }} onClick={() => setActivePage("team")}>
          <div className="section-header">
            <span className="section-title">Active Team Members</span>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>View all →</span>
          </div>
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
function CallLogPage({ onViewCall, initialFilter }) {
  const [callList,  setCallList]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState(initialFilter || "all");
  const [exporting, setExporting] = useState(false);
  const [page,      setPage]      = useState(1);

  const PAGE_SIZE = 20;

  useEffect(() => {
    callsApi.list({ limit: 500, sort: "desc" })
      .then(res => setCallList(res?.calls || res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Reset to page 1 whenever the filter changes
  useEffect(() => { setPage(1); }, [filter]);

  const normalized = callList.map(normalizeCall);
  const filtered   = filter === "all" ? normalized : normalized.filter(c => c.status === filter);
  const pageCount  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleExport() {
    setExporting(true);
    try {
      await exportCallsCsv({ status: filter !== "all" ? filter : undefined });
    } catch (err) {
      alert("Export failed: " + (err.message || "Unknown error"));
    } finally {
      setExporting(false);
    }
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
              <thead>
                <tr><th>Caller</th><th>Company</th><th>Phone</th><th>Date & Time</th><th>Duration</th><th>Status</th><th>Intent</th><th>Confidence</th><th>Routed To</th><th></th></tr>
              </thead>
              <tbody>
                {paginated.map((call, i) => {
                  const rawIdx = normalized.indexOf(call);
                  const rawCall = callList[rawIdx] ?? callList[(page - 1) * PAGE_SIZE + i];
                  return (
                    <tr key={call.id || i} onClick={() => onViewCall(rawCall)}>
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{call.caller}</td>
                      <td>{call.company || <span style={{ color: "var(--text-tertiary)" }}>—</span>}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{call.phone}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{call.dateTime}</td>
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
                        <CallActionMenu call={rawCall} onWhitelist={whitelistCaller} onBlock={blockCaller} onUnblock={unblockCaller} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mobile-call-cards">
            {paginated.map((call, i) => {
              const rawIdx = normalized.indexOf(call);
              return <MobileCallCard key={call.id || i} call={callList[rawIdx]} onView={onViewCall} />;
            })}
          </div>

          {/* Pagination controls */}
          {pageCount > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 20px", borderTop: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} calls
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn btn-sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Previous
                </button>
                <span style={{ padding: "4px 10px", fontSize: 12, color: "var(--text-secondary)", alignSelf: "center" }}>
                  Page {page} of {pageCount}
                </span>
                <button
                  className="btn btn-sm"
                  onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
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
  const [team,       setTeam]       = useState([]);
  const [rules,      setRules]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [adding,     setAdding]     = useState(false);
  const [editEmp,    setEditEmp]    = useState(null);
  const [savingEmp,  setSavingEmp]  = useState(false);
  const [addingRule,     setAddingRule]     = useState(false);
  const [editingRuleId,  setEditingRuleId]  = useState(null);
  const [editingIntent,  setEditingIntent]  = useState("");
  const [ruleForm,   setRuleForm]   = useState({ intent_match: "", route_to_id: "", priority: "medium" });
  const [form,       setForm]       = useState({ first_name: "", last_name: "", email: "", phone: "", extension: "", role: "employee" });

  useEffect(() => {
    Promise.all([
      usersApi.list(),
      routingApi.list(),
    ]).then(([teamRes, routingRes]) => {
      setTeam(teamRes?.users || teamRes || []);
      setRules(routingRes?.rules || routingRes || []);
    }).catch(console.error).finally(() => setLoading(false));
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

  async function saveEmployee() {
    if (!editEmp) return;
    setSavingEmp(true);
    try {
      await usersApi.update(editEmp.id, {
        first_name: editEmp.first_name,
        last_name:  editEmp.last_name,
        phone:      editEmp.phone,
        extension:  editEmp.extension,
        role:       editEmp.role,
      });
      setTeam(prev => prev.map(m => m.id === editEmp.id ? { ...m, ...editEmp } : m));
      setEditEmp(null);
    } catch (err) { alert(err.message); }
    finally { setSavingEmp(false); }
  }

  async function removeMember(id) {
    if (!confirm("Remove this team member?")) return;
    try { await usersApi.remove(id); setTeam(prev => prev.filter(m => m.id !== id)); }
    catch (err) { alert(err.message); }
  }

  async function addRule() {
    if (!ruleForm.intent_match || !ruleForm.route_to_id) return;
    try {
      const rule = await routingApi.create(ruleForm);
      setRules(prev => [...prev, rule]);
      setRuleForm({ intent_match: "", route_to_id: "", priority: "medium" });
      setAddingRule(false);
    } catch (err) { alert(err.message); }
  }

  async function removeRule(id) {
    if (!confirm("Remove this routing rule?")) return;
    try { await routingApi.remove(id); setRules(prev => prev.filter(r => r.id !== id)); }
    catch (err) { alert(err.message); }
  }

  async function saveRuleIntent(ruleId) {
    if (!editingIntent.trim()) return;
    try {
      await routingApi.update(ruleId, { intent_match: editingIntent.trim() });
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, intent_match: editingIntent.trim() } : r));
    } catch (err) { alert(err.message); }
    finally { setEditingRuleId(null); setEditingIntent(""); }
  }

  async function toggleRule(rule) {
    try {
      await routingApi.update(rule.id, { is_active: !rule.is_active });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
    } catch (err) { alert(err.message); }
  }

  const COLORS = ["linear-gradient(135deg, var(--accent), #a29bfe)", "linear-gradient(135deg, var(--green), #0abf76)", "linear-gradient(135deg, var(--blue), #228be6)", "linear-gradient(135deg, var(--orange), #e67700)"];
  if (loading) return <Spinner />;

  const PRIORITY_COLORS = { high: "var(--red)", medium: "var(--orange)", low: "var(--text-tertiary)" };

  return (
    <>
      {/* ── Edit Employee Modal ── */}
      {editEmp && (
        <div className="modal-overlay" onClick={() => setEditEmp(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Edit {editEmp.first_name} {editEmp.last_name}</span>
              <button className="modal-close" onClick={() => setEditEmp(null)}>{Icons.x}</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="form-label">First Name</label>
                  <input className="form-input-full" value={editEmp.first_name || ""} onChange={e => setEditEmp(p => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input className="form-input-full" value={editEmp.last_name || ""} onChange={e => setEditEmp(p => ({ ...p, last_name: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Phone Number <span style={{ color: "var(--accent-light)", fontSize: 10 }}>← Required for call forwarding</span></label>
                <input className="form-input-full" placeholder="+1 (555) 123-4567" value={editEmp.phone || ""} onChange={e => setEditEmp(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="form-label">Extension</label>
                  <input className="form-input-full" placeholder="e.g. 201" value={editEmp.extension || ""} onChange={e => setEditEmp(p => ({ ...p, extension: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Role</label>
                  <select className="form-input-full" value={editEmp.role || "employee"} onChange={e => setEditEmp(p => ({ ...p, role: e.target.value }))}>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
              </div>
              {!editEmp.phone && (
                <div style={{ background: "rgba(255,169,77,0.08)", border: "1px solid rgba(255,169,77,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "var(--orange)", lineHeight: 1.5 }}>
                  ⚠ No phone number set — Gate AI cannot forward calls to this person until a number is added.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-sm" onClick={() => setEditEmp(null)}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={saveEmployee} disabled={savingEmp}>
                {savingEmp ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Team Members ── */}
      <div className="section" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <span className="section-title">Team Members</span>
          <button className="btn btn-sm btn-primary" onClick={() => setAdding(!adding)}>{Icons.plus} Add Employee</button>
        </div>
        {adding && (
          <div className="add-form-row">
            <input className="form-input" placeholder="First name *" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
            <input className="form-input" placeholder="Last name" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
            <input className="form-input" placeholder="Email *" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <input className="form-input" placeholder="Phone *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            <input className="form-input" placeholder="Extension" value={form.extension} onChange={e => setForm(p => ({ ...p, extension: e.target.value }))} />
            <button className="btn btn-sm btn-primary" onClick={addMember}>Add</button>
            <button className="btn btn-sm" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        )}
        {team.length === 0 ? <div className="empty-state"><p>No team members yet — add your first employee above</p></div> : (
          <div className="employee-grid">
            {team.map((emp, i) => (
              <div
                key={emp.id}
                className="employee-card"
                style={{ cursor: emp.role === "owner" ? "default" : "pointer" }}
                onClick={() => emp.role !== "owner" && setEditEmp({ ...emp })}
              >
                {/* Avatar + status dot */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div className="emp-avatar" style={{ background: COLORS[i % COLORS.length], width: 44, height: 44, borderRadius: 10, fontSize: 14 }}>
                    {initials(`${emp.first_name || ""} ${emp.last_name || ""}`)}
                  </div>
                  <div style={{
                    position: "absolute", bottom: -1, right: -1,
                    width: 11, height: 11, borderRadius: "50%",
                    background: emp.phone ? "var(--green)" : "var(--orange)",
                    border: "2px solid var(--bg-tertiary)",
                  }} />
                </div>

                {/* Info */}
                <div className="emp-info" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {emp.first_name} {emp.last_name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2, textTransform: "capitalize" }}>
                    {emp.role}{emp.extension ? ` · Ext. ${emp.extension}` : ""}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 5, fontFamily: "var(--font-mono)" }}>
                    {emp.phone
                      ? <span style={{ color: "var(--green)" }}>{emp.phone}</span>
                      : <span style={{ color: "var(--orange)" }}>No phone — {emp.role === "owner" ? "edit in Settings" : "click to add"}</span>
                    }
                  </div>
                </div>

                {/* Remove button — stops click-to-edit propagation */}
                <div onClick={e => e.stopPropagation()}>
                  {emp.role !== "owner" && (
                    <button
                      className="btn btn-sm"
                      style={{ color: "var(--red)", fontSize: 11, padding: "3px 8px" }}
                      onClick={() => removeMember(emp.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Routing Rules ── */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Call Routing Rules</span>
          <button className="btn btn-sm btn-primary" onClick={() => setAddingRule(!addingRule)}>{Icons.plus} Add Rule</button>
        </div>
        <div style={{ padding: "8px 16px 4px", fontSize: 12.5, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
          Define which types of calls get routed to which team members. The AI uses these rules to decide who to connect the caller to.
        </div>
        {addingRule && (
          <div className="add-form-row" style={{ alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 200 }}>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Intent / Call Type</span>
              <input className="form-input" placeholder="e.g. Logistics Coordination" value={ruleForm.intent_match} onChange={e => setRuleForm(p => ({ ...p, intent_match: e.target.value }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 180 }}>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Route To</span>
              <select className="form-input" value={ruleForm.route_to_id} onChange={e => setRuleForm(p => ({ ...p, route_to_id: e.target.value }))}>
                <option value="">Select employee...</option>
                {team.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}{emp.phone ? "" : " ⚠ no phone"}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 120 }}>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Priority</span>
              <select className="form-input" value={ruleForm.priority} onChange={e => setRuleForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <button className="btn btn-sm btn-primary" onClick={addRule}>Add</button>
            <button className="btn btn-sm" onClick={() => setAddingRule(false)}>Cancel</button>
          </div>
        )}
        {rules.length === 0 ? (
          <div className="empty-state"><p>No routing rules yet — add your first rule to start routing calls</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Intent / Call Type</th>
                  <th>Routes To</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => {
                  const employee = team.find(m => m.id === rule.route_to_id);
                  return (
                    <tr key={rule.id}>
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {editingRuleId === rule.id ? (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <input
                              className="form-input"
                              style={{ minWidth: 180, padding: "4px 10px", fontSize: 13 }}
                              value={editingIntent}
                              onChange={e => setEditingIntent(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveRuleIntent(rule.id); if (e.key === "Escape") { setEditingRuleId(null); setEditingIntent(""); } }}
                              autoFocus
                            />
                            <button className="btn btn-sm btn-primary" style={{ padding: "3px 8px" }} onClick={() => saveRuleIntent(rule.id)}>Save</button>
                            <button className="btn btn-sm" style={{ padding: "3px 8px" }} onClick={() => { setEditingRuleId(null); setEditingIntent(""); }}>Cancel</button>
                          </div>
                        ) : (
                          rule.intent_match
                        )}
                      </td>
                      <td>
                        {employee ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, var(--accent), #a29bfe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "white" }}>
                              {initials(`${employee.first_name || ""} ${employee.last_name || ""}`)}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{employee.first_name} {employee.last_name}</div>
                              {!employee.phone && <div style={{ fontSize: 11, color: "var(--orange)" }}>⚠ No phone number</div>}
                            </div>
                          </div>
                        ) : <span style={{ color: "var(--text-tertiary)" }}>Unknown employee</span>}
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, color: PRIORITY_COLORS[rule.priority] || "var(--text-tertiary)", textTransform: "capitalize" }}>
                          {rule.priority}
                        </span>
                      </td>
                      <td>
                        <div className="toggle-wrap" onClick={() => toggleRule(rule)}>
                          <div className={`toggle ${rule.is_active ? "on" : ""}`}><div className="toggle-knob" /></div>
                          <span className="toggle-label" style={{ fontSize: 12 }}>{rule.is_active ? "Active" : "Inactive"}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-sm"
                            onClick={() => { setEditingRuleId(rule.id); setEditingIntent(rule.intent_match); }}
                          >
                            Edit
                          </button>
                          <button className="btn btn-sm" style={{ color: "var(--red)" }} onClick={() => removeRule(rule.id)}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}


// ─── INTEGRATIONS PAGE ───────────────────────────────────────
function IntegrationsPage() {
  const { company } = useAuth();
  const [activeModal, setActiveModal] = useState(null); // integration name

  // Slack state
  const [slackWebhook,   setSlackWebhook]   = useState("");
  const [slackSaving,    setSlackSaving]    = useState(false);
  const [slackSaved,     setSlackSaved]     = useState(false);
  const [slackEnabled,   setSlackEnabled]   = useState(false);

  // Load existing Slack config on mount
  useEffect(() => {
    notificationsApi.get().then(res => {
      const s = res?.settings || res || {};
      setSlackWebhook(s.slack_webhook_url || "");
      setSlackEnabled(!!s.slack_enabled);
    }).catch(() => {});
  }, []);

  async function saveSlack() {
    setSlackSaving(true); setSlackSaved(false);
    try {
      await notificationsApi.update({ slack_webhook_url: slackWebhook, slack_enabled: slackEnabled });
      setSlackSaved(true);
      setTimeout(() => setSlackSaved(false), 3000);
    } catch (err) { alert(err.message); }
    finally { setSlackSaving(false); }
  }

  async function disconnectSlack() {
    if (!confirm("Disconnect Slack? You will stop receiving Slack notifications.")) return;
    try {
      await notificationsApi.update({ slack_webhook_url: "", slack_enabled: false });
      setSlackWebhook(""); setSlackEnabled(false);
      setActiveModal(null);
    } catch (err) { alert(err.message); }
  }

  const integrations = [
    { name: "Twilio",          file: "twilio.png",          desc: "VoIP telephony, SIP trunking, programmable voice — the backbone of your Gate AI phone system.", color: "#f22f46", connected: true },
    { name: "Slack",           file: "slack.png",           desc: "Deliver call summaries, blocked-call alerts, and screening reports to your Slack channels.",     color: "#e01e5a", connected: !!slackWebhook },
    { name: "Email (SMTP)",    file: "email.webp",          desc: "Send call summaries and daily digests via email to employees and admins.",                       color: "#ffa94d", connected: true },
    { name: "OpenPhone",       file: "openphone.png",       desc: "Business phone system with shared numbers, team inboxes, and CRM integration.",                  color: "#5865f2", connected: false },
    { name: "Microsoft Teams", file: "microsoft-teams.png", desc: "Push call notifications and summaries directly into Teams channels.",                            color: "#5059c9", connected: false },
    { name: "Zapier",          file: "zapier.webp",         desc: "Connect Gate AI to 5000+ apps with custom automation workflows.",                                color: "#ff4a00", connected: false },
    { name: "Talkroute",       file: "talkroute.png",       desc: "Virtual phone system with call forwarding, voicemail, and auto-attendant.",                      color: "#00b894", connected: false },
    { name: "Avaya",           file: "avaya.png",           desc: "Enterprise communications platform with advanced call center capabilities.",                     color: "#cc0000", connected: false },
  ];

  const modalStyle = { padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6, display: "block" };
  const fieldStyle = { width: "100%", padding: "9px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-primary)", outline: "none" };

  return (
    <>
      <div className="section">
        <div className="section-header">
          <span className="section-title">Integrations & Plugins</span>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{integrations.filter(i => i.connected).length} connected</span>
        </div>
        <div className="integrations-grid">
          {integrations.map((int, i) => (
            <div key={i} className="integration-card">
              <div className="integration-top">
                <div className="integration-icon" style={{ background: int.color + "20" }}>
                  <img src={`/images/integrations/${int.file}`} alt={int.name} style={{ width: "26px", height: "26px", objectFit: "contain", borderRadius: "4px" }} />
                </div>
                <span className={`badge ${int.connected ? "badge-green" : "badge-ghost"}`}>{int.connected ? "Connected" : "Available"}</span>
              </div>
              <div className="integration-name">{int.name}</div>
              <div className="integration-desc">{int.desc}</div>
              <button
                className={`btn btn-sm ${int.connected ? "" : "btn-primary"}`}
                style={{ alignSelf: "flex-start", marginTop: 4 }}
                onClick={() => setActiveModal(int.name)}
              >
                {int.connected ? "Configure" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Twilio Modal ── */}
      {activeModal === "Twilio" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Twilio — Phone System</span>
              <button className="modal-close" onClick={() => setActiveModal(null)}>{Icons.x}</button>
            </div>
            <div style={modalStyle}>
              <div style={{ background: "var(--green-dim)", border: "1px solid rgba(0,214,143,0.2)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13, color: "var(--green)" }}>
                ✓ Twilio is active and handling all inbound calls
              </div>
              <div>
                <label style={labelStyle}>Gate AI Phone Number</label>
                <div style={{ ...fieldStyle, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: 14 }}>
                  {company?.twilio_number || "+18337142521"}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Account</label>
                <div style={{ ...fieldStyle, color: "var(--text-secondary)" }}>Managed by Gate AI — contact support to change your number</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.6 }}>
                Twilio is the telephony backbone of Gate AI. Your phone number, call routing, and voice AI are all managed through this integration. To update your number or account settings, contact <span style={{ color: "var(--accent-light)" }}>hello@gate-ai.io</span>.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-sm" onClick={() => setActiveModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slack Modal ── */}
      {activeModal === "Slack" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Slack Notifications</span>
              <button className="modal-close" onClick={() => setActiveModal(null)}>{Icons.x}</button>
            </div>
            <div style={modalStyle}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Paste your Slack Incoming Webhook URL below. Gate AI will post blocked and forwarded call alerts to that channel in real time.
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", padding: "10px 14px", lineHeight: 1.6 }}>
                To get a webhook URL: go to <span style={{ color: "var(--accent-light)" }}>api.slack.com/apps</span> → Create an app → Incoming Webhooks → Activate → Add New Webhook to Workspace.
              </div>
              <div>
                <label style={labelStyle}>Webhook URL</label>
                <input
                  style={fieldStyle}
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhook}
                  onChange={e => setSlackWebhook(e.target.value)}
                  onFocus={e => e.target.style.borderColor = "var(--accent)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
              </div>
              <ToggleSetting
                label="Enable Slack alerts"
                desc="Send blocked and forwarded call notifications to Slack"
                value={slackEnabled}
                onChange={v => setSlackEnabled(v)}
              />
            </div>
            <div className="modal-footer">
              {slackWebhook && (
                <button className="btn btn-sm" style={{ color: "var(--red)", marginRight: "auto" }} onClick={disconnectSlack}>
                  Disconnect
                </button>
              )}
              <button className="btn btn-sm" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={saveSlack} disabled={slackSaving}>
                {slackSaved ? "✓ Saved!" : slackSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Modal ── */}
      {activeModal === "Email (SMTP)" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Email Notifications</span>
              <button className="modal-close" onClick={() => setActiveModal(null)}>{Icons.x}</button>
            </div>
            <div style={modalStyle}>
              <div style={{ background: "var(--green-dim)", border: "1px solid rgba(0,214,143,0.2)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: 13, color: "var(--green)" }}>
                ✓ Email delivery is active via SendGrid
              </div>
              <div>
                <label style={labelStyle}>Sending Address</label>
                <div style={{ ...fieldStyle, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                  notifications@gate-ai.io
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.6 }}>
                Email notifications are sent via SendGrid to the addresses configured under each team member and your account email. To manage which emails are sent, go to <strong style={{ color: "var(--text-secondary)" }}>Settings → Notification Preferences</strong>.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-sm" onClick={() => setActiveModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Coming Soon Modal (all other integrations) ── */}
      {activeModal && !["Twilio", "Slack", "Email (SMTP)"].includes(activeModal) && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{activeModal}</span>
              <button className="modal-close" onClick={() => setActiveModal(null)}>{Icons.x}</button>
            </div>
            <div style={modalStyle}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "20px 0", gap: 14, textAlign: "center",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: "var(--accent-dim)", border: "1px solid var(--accent-glow)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                    {activeModal} — Coming Soon
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 300 }}>
                    This integration is on our roadmap. We'll notify you by email when it's available.
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
                  Want to request early access? Email <span style={{ color: "var(--accent-light)" }}>hello@gate-ai.io</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-sm btn-primary" onClick={() => setActiveModal(null)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </>
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
  const [accountForm,   setAccountForm]   = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSaved,  setAccountSaved]  = useState(false);

  // Password state
  const [pwForm,    setPwForm]    = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [savingPw,  setSavingPw]  = useState(false);
  const [pwError,   setPwError]   = useState("");
  const [pwSaved,   setPwSaved]   = useState(false);

  // Test notification state
  const [testingB,     setTestingB]     = useState(false);
  const [testingF,     setTestingF]     = useState(false);
  const [testBSent,    setTestBSent]    = useState(false);
  const [testFSent,    setTestFSent]    = useState(false);

  // AI Assistant state
  const [assistantName,    setAssistantName]    = useState("GATE-AI");
  const [savingAssistant,  setSavingAssistant]  = useState(false);
  const [assistantSaved,   setAssistantSaved]   = useState(false);

  useEffect(() => {
    notificationsApi.get()
      .then(res => setNotifs(res?.settings || res || {}))
      .catch(() => setNotifs({}))
      .finally(() => setLoading(false));
    if (company) {
      setCompanyForm({ name: company.name || "", industry: company.industry || "", timezone: company.timezone || "" });
      setAssistantName(company.assistant_name || "GATE-AI");
    }
    if (user) setAccountForm({ first_name: user.first_name || "", last_name: user.last_name || "", email: user.email || "", phone: user.phone || "" });
  }, []);

  async function saveCompany() {
    setSavingCompany(true); setCompanySaved(false);
    try {
      await settingsApi.update({ company_name: companyForm.name, industry: companyForm.industry, timezone: companyForm.timezone });
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
      await usersApi.update(user.id, {
        first_name: accountForm.first_name,
        last_name:  accountForm.last_name,
        email:      accountForm.email,
        phone:      accountForm.phone,          // ← forwarding number for this owner/user
      });
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
    try {
      const res = await billingApi.portal();
      if (res?.url) {
        window.open(res.url, "_blank");
      } else {
        throw new Error("Billing portal unavailable — please email hello@gate-ai.io for subscription help.");
      }
    } catch (err) {
      alert(err.message || "Could not open billing portal. Please email hello@gate-ai.io.");
    }
  }

  async function saveAssistantName() {
    if (!assistantName.trim()) return;
    setSavingAssistant(true); setAssistantSaved(false);
    try {
      // Save name to company record + push update to Vapi
      const token = localStorage.getItem("gateai_token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "https://gate-ai-backend-production.up.railway.app"}/api/settings/assistant-name`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: assistantName.trim() }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update assistant name");
      }
      setAssistantSaved(true);
      setTimeout(() => setAssistantSaved(false), 3000);
    } catch (err) { alert(err.message); }
    finally { setSavingAssistant(false); }
  }

  async function sendTestBlocked() {
    setTestingB(true);
    try {
      await notificationsApi.testBlocked();
      setTestBSent(true);
      setTimeout(() => setTestBSent(false), 5000);
    } catch (err) { alert("Test failed: " + (err.message || "Unknown error")); }
    finally { setTestingB(false); }
  }

  async function sendTestForwarded() {
    setTestingF(true);
    try {
      await notificationsApi.testForwarded();
      setTestFSent(true);
      setTimeout(() => setTestFSent(false), 5000);
    } catch (err) { alert("Test failed: " + (err.message || "Unknown error")); }
    finally { setTestingF(false); }
  }

  if (loading) return <Spinner />;

  const fieldStyle = { width: "100%", padding: "9px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-primary)", outline: "none", transition: "border-color 180ms ease" };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6, display: "block" };
  const savedBadge = { fontSize: 12, color: "var(--green)", fontWeight: 500 };
  const readonlyStyle = { ...fieldStyle, color: "var(--text-secondary)", cursor: "default" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Company Profile ── */}
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
            {/* FIX: sentence-case the plan name */}
            <div style={readonlyStyle}>{capitalize(company?.plan || "starter")}</div>
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

      {/* ── Account Details ── */}
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
          {/* NEW: Forwarding phone number field */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>
              Forwarding Phone Number
              <span style={{ fontWeight: 400, color: "var(--accent-light)", marginLeft: 6, textTransform: "none", letterSpacing: 0 }}>← Gate AI forwards calls here</span>
            </label>
            <input
              type="tel"
              style={fieldStyle}
              placeholder="+1 (555) 123-4567"
              value={accountForm.phone}
              onChange={e => setAccountForm(f => ({ ...f, phone: e.target.value }))}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 6 }}>
              This is the number Gate AI will ring when a legitimate call is forwarded to you.
            </div>
          </div>
        </div>
        <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-sm btn-primary" onClick={saveAccount} disabled={savingAccount}>{savingAccount ? "Saving..." : "Save changes"}</button>
        </div>
      </div>

      {/* ── Change Password ── */}
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

      {/* ── Billing & Subscription ── */}
      <div className="section">
        <div className="section-header"><span className="section-title">Billing & Subscription</span></div>
        <div style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>
              Current plan: <span style={{ color: "var(--accent-light)" }}>{capitalize(company?.plan || "starter")}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
              Manage your subscription, invoices, and payment method via Stripe.
            </div>
          </div>
          <button className="btn btn-sm btn-primary" onClick={openBillingPortal}>{Icons.creditCard} Manage billing</button>
        </div>
      </div>

      {/* ── AI Assistant ── */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">AI Assistant</span>
          {assistantSaved && <span style={savedBadge}>✓ Saved</span>}
        </div>
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Assistant Name</label>
            <input
              style={fieldStyle}
              placeholder="GATE-AI"
              value={assistantName}
              onChange={e => setAssistantName(e.target.value)}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 6 }}>
              The name your AI assistant uses when greeting callers.
            </div>
          </div>
          <div>
            <label style={labelStyle}>Gate AI Phone Number</label>
            <div style={{ ...readonlyStyle, fontFamily: "var(--font-mono)", fontSize: 14 }}>
              {company?.twilio_number || "+18337142521"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 6 }}>
              This is the number your AI assistant answers calls on. To change it, contact support.
            </div>
          </div>
        </div>
        <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-sm btn-primary" onClick={saveAssistantName} disabled={savingAssistant}>
            {savingAssistant ? "Saving..." : "Save assistant name"}
          </button>
        </div>
      </div>

      {/* ── Notification Preferences ── */}
      <div className="section">
        <div className="section-header"><span className="section-title">Notification Preferences</span></div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <ToggleSetting label="Whitelist suggestion emails" desc="Get notified when Gate AI recommends adding a forwarded caller to your whitelist" value={notifs?.whitelist_suggestion_email !== false} onChange={() => toggle("whitelist_suggestion_email")} />
          <ToggleSetting label="Blocked call email alerts" desc="Receive an email when a call is blocked. Off by default." value={!!notifs?.blocked_call_email_enabled} onChange={() => toggle("blocked_call_email_enabled")} />
          <ToggleSetting label="Real-time Slack alerts" desc="Get instant Slack notifications for blocked and forwarded calls" value={!!notifs?.slack_enabled} onChange={() => toggle("slack_enabled")} />
          <ToggleSetting label="Weekly analytics report" desc="Auto-generate and email a weekly call analytics summary" value={!!notifs?.weekly_report_enabled} onChange={() => toggle("weekly_report_enabled")} />

          {/* Test notification buttons */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 18, marginTop: 2 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              Test your notifications
            </div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 14, lineHeight: 1.5 }}>
              Send a test notification to confirm your email and Slack setup is working correctly.
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-sm" onClick={sendTestBlocked} disabled={testingB}
                style={testBSent ? { color: "var(--green)", borderColor: "rgba(0,214,143,0.3)" } : {}}>
                {testBSent ? "✓ Sent!" : testingB ? "Sending…" : "🚫 Test blocked call"}
              </button>
              <button className="btn btn-sm" onClick={sendTestForwarded} disabled={testingF}
                style={testFSent ? { color: "var(--green)", borderColor: "rgba(0,214,143,0.3)" } : {}}>
                {testFSent ? "✓ Sent!" : testingF ? "Sending…" : "📞 Test forwarded call"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AI ASSISTANT PAGE ───────────────────────────────────────
function AIAssistantPage() {
  const { company } = useAuth();
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const [stats, setStats] = useState({ blocked: 0, forwarded: 0, total: 0 });

  const assistantName = company?.assistant_name || "GATE-AI";
  const twilioNumber  = company?.twilio_number  || "+18337142521";

  // Load today's call stats
  useEffect(() => {
    callsApi.list({ limit: 200, sort: "desc" }).then(res => {
      const all = res?.calls || res || [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayCalls = all.filter(c => new Date(c.started_at || c.created_at) >= today);
      setStats({
        blocked:   todayCalls.filter(c => (c.call_status || c.status) === "blocked").length,
        forwarded: todayCalls.filter(c => (c.call_status || c.status) === "forwarded").length,
        total:     todayCalls.length,
      });
    }).catch(() => {});
  }, []);

  // 2D JARVIS HUD canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let frameId;
    let t = 0;

    function resize() {
      const size = canvas.parentElement?.clientWidth || 420;
      canvas.width  = size;
      canvas.height = size;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const base = Math.min(W, H) * 0.46; // base radius

      ctx.clearRect(0, 0, W, H);

      // ── Background glow ──
      const grd = ctx.createRadialGradient(cx, cy, base * 0.1, cx, cy, base * 1.1);
      grd.addColorStop(0,   "rgba(108,92,231,0.10)");
      grd.addColorStop(0.5, "rgba(108,92,231,0.04)");
      grd.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      function drawRing({ radius, tickCount, tickLen, tickGap, lineWidth, color, alpha, rotation, arcGaps }) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth   = lineWidth;

        // Full ring (slightly transparent base)
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.globalAlpha = alpha * 0.25;
        ctx.stroke();

        // Arc segments (gaps cut out for JARVIS look)
        ctx.globalAlpha = alpha;
        if (arcGaps) {
          arcGaps.forEach(([start, end]) => {
            ctx.beginPath();
            ctx.arc(0, 0, radius, start, end);
            ctx.stroke();
          });
        }

        // Tick marks
        if (tickCount) {
          for (let i = 0; i < tickCount; i++) {
            const angle  = (i / tickCount) * Math.PI * 2;
            const skip   = tickGap && (i % tickGap === 0);
            const len    = skip ? tickLen * 1.8 : tickLen;
            const outerR = radius + len / 2;
            const innerR = radius - len / 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
            ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
            ctx.globalAlpha = skip ? alpha : alpha * 0.5;
            ctx.lineWidth   = skip ? lineWidth * 1.5 : lineWidth * 0.8;
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // ── Outermost ring — slow CW rotation, tick marks ──
      drawRing({
        radius: base * 0.98, tickCount: 120, tickLen: base * 0.025, tickGap: 10,
        lineWidth: 1.2, color: "#6c5ce7", alpha: 0.55, rotation: t * 0.18,
        arcGaps: [
          [0.05, Math.PI * 0.45],
          [Math.PI * 0.52, Math.PI * 1.05],
          [Math.PI * 1.12, Math.PI * 1.65],
          [Math.PI * 1.72, Math.PI * 2 - 0.05],
        ],
      });

      // ── Second ring — CCW, dotted segments ──
      drawRing({
        radius: base * 0.84, tickCount: 72, tickLen: base * 0.02, tickGap: 8,
        lineWidth: 1.0, color: "#a29bfe", alpha: 0.45, rotation: -t * 0.28,
        arcGaps: [
          [0.2, Math.PI * 0.7],
          [Math.PI * 0.8, Math.PI * 1.4],
          [Math.PI * 1.5, Math.PI * 2 - 0.2],
        ],
      });

      // ── Third ring — faster CW ──
      drawRing({
        radius: base * 0.70, tickCount: 48, tickLen: base * 0.018, tickGap: 6,
        lineWidth: 1.2, color: "#6c5ce7", alpha: 0.50, rotation: t * 0.42,
        arcGaps: [
          [0.3, Math.PI * 0.9],
          [Math.PI * 1.0, Math.PI * 1.7],
          [Math.PI * 1.85, Math.PI * 2 - 0.15],
        ],
      });

      // ── Inner circle — solid glow ring ──
      ctx.save();
      ctx.translate(cx, cy);
      const pulse = 0.82 + 0.04 * Math.sin(t * 2.2);
      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = "#a29bfe";
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, base * 0.54 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Inner glow fill
      const igrd = ctx.createRadialGradient(0, 0, 0, 0, 0, base * 0.54);
      igrd.addColorStop(0,   "rgba(108,92,231,0.18)");
      igrd.addColorStop(0.6, "rgba(108,92,231,0.08)");
      igrd.addColorStop(1,   "rgba(108,92,231,0.01)");
      ctx.globalAlpha = 1;
      ctx.fillStyle   = igrd;
      ctx.beginPath();
      ctx.arc(0, 0, base * 0.54, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Orbiting bright dot on ring 2 ──
      ctx.save();
      ctx.translate(cx, cy);
      const dotAngle = t * 1.1;
      const dotR     = base * 0.84;
      const dx = Math.cos(dotAngle) * dotR;
      const dy = Math.sin(dotAngle) * dotR;
      const dotGlow = ctx.createRadialGradient(dx, dy, 0, dx, dy, base * 0.055);
      dotGlow.addColorStop(0,   "rgba(162,155,254,0.95)");
      dotGlow.addColorStop(0.4, "rgba(108,92,231,0.5)");
      dotGlow.addColorStop(1,   "rgba(108,92,231,0)");
      ctx.fillStyle   = dotGlow;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(dx, dy, base * 0.055, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Second orbiting dot on ring 3, opposite phase ──
      ctx.save();
      ctx.translate(cx, cy);
      const dot2Angle = -t * 1.6 + Math.PI;
      const dot2R     = base * 0.70;
      const d2x = Math.cos(dot2Angle) * dot2R;
      const d2y = Math.sin(dot2Angle) * dot2R;
      ctx.fillStyle   = "#6c5ce7";
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(d2x, d2y, base * 0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Assistant name in centre ──
      const fontSize = Math.max(13, base * 0.13);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = 0.9 + 0.1 * Math.sin(t * 1.5);
      ctx.fillStyle   = "#a29bfe";
      ctx.font        = `700 ${fontSize}px 'JetBrains Mono', monospace`;
      ctx.textAlign   = "center";
      ctx.textBaseline = "middle";
      // Subtle text glow
      ctx.shadowColor  = "#6c5ce7";
      ctx.shadowBlur   = 18;
      ctx.fillText(assistantName, 0, 0);
      // Sub-label
      ctx.shadowBlur   = 0;
      ctx.globalAlpha  = 0.4;
      ctx.fillStyle    = "#8b8fa3";
      ctx.font         = `500 ${fontSize * 0.42}px 'DM Sans', sans-serif`;
      ctx.fillText("AI RECEPTIONIST", 0, fontSize * 0.85);
      ctx.restore();

      t += 0.012;
      frameId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, [assistantName]);

  const statCard = (label, value, color) => (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)", padding: "18px 20px",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-1px", color: color || "var(--text-primary)" }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 24, alignItems: "start" }} className="ai-assistant-grid">

        {/* Left — HUD canvas */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)", overflow: "hidden",
          position: "relative", aspectRatio: "1",
        }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
          {/* Live badge */}
          <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(10,11,15,0.80)", backdropFilter: "blur(8px)",
              border: "1px solid var(--border-light)", borderRadius: 30, padding: "6px 18px",
            }}>
              <span className="status-dot" style={{ width: 7, height: 7 }} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", color: "var(--accent-light)" }}>{assistantName}</span>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* Right — info panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 16 }}>Assistant Identity</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["Name",       <span style={{ color: "var(--accent-light)", fontWeight: 600 }}>{assistantName}</span>],
                ["Phone Number", <span style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, fontWeight: 600 }}>{twilioNumber}</span>],
                ["Status",     <span style={{ display:"flex", alignItems:"center", gap:6 }}><span className="status-dot"/><span style={{ color:"var(--green)", fontWeight:600, fontSize:12.5 }}>Active — Answering Calls</span></span>],
                ["Powered by", <span style={{ color:"var(--text-tertiary)", fontSize:12.5 }}>Vapi · Claude · Twilio</span>],
              ].map(([label, val], i, arr) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
                    <span>{val}</span>
                  </div>
                  {i < arr.length - 1 && <div style={{ height: 1, background: "var(--border)", marginTop: 12 }} />}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 16 }}>Today's Activity</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {statCard("Total Calls",  stats.total,     "var(--accent-light)")}
              {statCard("Blocked",      stats.blocked,   "var(--red)")}
              {statCard("Forwarded",    stats.forwarded, "var(--green)")}
            </div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, rgba(108,92,231,0.08), rgba(162,155,254,0.04))",
            border: "1px solid rgba(108,92,231,0.2)", borderRadius: "var(--radius-lg)", padding: "20px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>How it works</div>
            {[
              ["📞", "Answers every inbound call instantly, 24/7"],
              ["🛡️", "Screens for cold callers, spam, and robocalls"],
              ["🧠", "Classifies intent using Claude AI"],
              ["📡", "Routes legitimate calls to the right team member"],
              ["📋", "Generates a summary of every call automatically"],
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < 4 ? "1px solid rgba(108,92,231,0.1)" : "none" }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "18px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>Rename your assistant</div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 3 }}>This is the name callers hear and that appears on this page.</div>
        </div>
        <button className="btn btn-sm btn-primary" onClick={() => document.dispatchEvent(new CustomEvent("gateai:navigate", { detail: "settings" }))}>
          Go to Settings →
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ai-assistant-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:    "Dashboard",
  calls:        "Call Log",
  aiassistant:  "AI Assistant",
  screening:    "Screening Rules",
  team:         "Team & Routing",
  integrations: "Integrations",
  settings:     "Settings",
};

export default function Dashboard() {
  const [activePage,    setActivePage]    = useState("dashboard");
  const [selectedCall,  setSelectedCall]  = useState(null);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [liveCalls,     setLiveCalls]     = useState([]);
  const [callLogFilter, setCallLogFilter] = useState("all");

  // When navigating away from calls, reset filter so it starts fresh next time
  // unless the navigation explicitly sets a filter (stat card clicks)
  function navigateTo(page) {
    if (page !== "calls") setCallLogFilter("all");
    setActivePage(page);
  }

  // Called by the search bar — optionally carries a filter for the calls page
  function handleSearchNavigate(page, filter) {
    if (page === "calls" && filter) setCallLogFilter(filter);
    else if (page !== "calls") setCallLogFilter("all");
    setActivePage(page);
  }

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === "new_call") setLiveCalls(prev => [msg.call, ...prev].slice(0, 20));
  }, []);
  useWebSocket(handleWsMessage);

  // Cross-component navigation (e.g. AI Assistant page → Settings)
  useEffect(() => {
    function onNav(e) { if (e.detail) { setActivePage(e.detail); } }
    document.addEventListener("gateai:navigate", onNav);
    return () => document.removeEventListener("gateai:navigate", onNav);
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <ImpersonationBanner />
      <JWTExpiryBanner />
      <div className="app">
        <Sidebar active={activePage} setActive={navigateTo} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main">
          <Topbar title={PAGE_TITLES[activePage] || "Dashboard"} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} setActivePage={navigateTo} onSearchNavigate={handleSearchNavigate} />
          <div className="content">
            {activePage === "dashboard"    && <DashboardPage onViewCall={setSelectedCall} liveCalls={liveCalls} setActivePage={setActivePage} setCallLogFilter={setCallLogFilter} />}
            {activePage === "calls"        && <CallLogPage   onViewCall={setSelectedCall} initialFilter={callLogFilter} />}
            {activePage === "aiassistant"  && <AIAssistantPage />}
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
