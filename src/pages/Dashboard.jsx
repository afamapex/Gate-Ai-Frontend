import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';
import {
  calls as callsApi,
  users as usersApi,
  whitelist as whitelistApi,
  patterns as patternsApi,
  settings as settingsApi,
  notifications as notificationsApi,
  exportCallsCsv,
} from '../services/api.js';

// ─── ICONS ───────────────────────────────────────────────────
const Icons = {
  phone: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  activity: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  ban: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  forward: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  download: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  zap: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  wifi: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
};

// ─── HELPERS ─────────────────────────────────────────────────
function fmt(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDuration(secs) {
  if (!secs) return '0:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function outcomeLabel(outcome) {
  if (outcome === 'forwarded') return 'Forwarded';
  if (outcome === 'blocked')   return 'Blocked';
  return 'Screened';
}

function outcomeBadgeClass(outcome) {
  if (outcome === 'forwarded') return 'badge-green';
  if (outcome === 'blocked')   return 'badge-red';
  return 'badge-yellow';
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

// ─── LOADING SPINNER ─────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 24, height: 24, border: '2px solid #252736',
        borderTopColor: '#6c5ce7', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────
function EmptyState({ icon, message }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: '#3a3d52' }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  );
}

// ─── TOGGLE SETTING ──────────────────────────────────────────
function ToggleSetting({ label, desc, value, onChange }) {
  return (
    <div className="toggle-row">
      <div className="toggle-info">
        <div className="toggle-label">{label}</div>
        <div className="toggle-desc">{desc}</div>
      </div>
      <div
        className={`toggle ${value ? 'toggle-on' : ''}`}
        onClick={() => onChange(!value)}
      >
        <div className="toggle-thumb" />
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard',    label: 'Dashboard',       icon: 'activity' },
  { id: 'calls',        label: 'Call Log',         icon: 'phone' },
  { id: 'screening',    label: 'Screening Rules',  icon: 'shield' },
  { id: 'team',         label: 'Team & Routing',   icon: 'users' },
  { id: 'settings',     label: 'Settings',         icon: 'settings' },
];

function Sidebar({ active, setActive, isOpen, onClose }) {
  const { user, company, logout } = useAuth();
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div className="logo-text">Gate AI</div>
            <div className="logo-sub">{company?.name || 'Dashboard'}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`nav-item ${active === item.id ? 'nav-item-active' : ''}`}
              onClick={() => { setActive(item.id); onClose(); }}
            >
              <span className="nav-icon">{Icons[item.icon]}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-row">
            <div className="user-avatar">{initials(`${user?.first_name} ${user?.last_name}`)}</div>
            <div className="user-info">
              <div className="user-name">{user?.first_name} {user?.last_name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button className="icon-btn" onClick={logout} title="Sign out">{Icons.logout}</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── TOPBAR ──────────────────────────────────────────────────
function Topbar({ title, onMenuToggle, wsConnected }) {
  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="icon-btn menu-btn" onClick={onMenuToggle}>{Icons.menu}</button>
        <h1 className="page-title">{title}</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: wsConnected ? '#00d68f' : '#3a3d52' }}>
          {Icons.wifi}
          <span>{wsConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── CALL DETAIL MODAL ───────────────────────────────────────
function CallDetailModal({ call, onClose }) {
  if (!call) return null;
  const outcome = call.outcome || call.call_status || 'unknown';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-caller">{call.caller_name || 'Unknown Caller'}</div>
            <div className="modal-company">{call.caller_company || call.caller_number || '—'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge ${outcomeBadgeClass(outcome)}`}>{outcomeLabel(outcome)}</span>
            <button className="icon-btn" onClick={onClose}>{Icons.x}</button>
          </div>
        </div>
        <div className="modal-body">
          <div className="modal-meta">
            <div className="meta-item"><span className="meta-label">Time</span><span>{fmtDate(call.created_at)} {fmt(call.created_at)}</span></div>
            <div className="meta-item"><span className="meta-label">Duration</span><span>{fmtDuration(call.duration_seconds)}</span></div>
            <div className="meta-item"><span className="meta-label">Phone</span><span>{call.caller_number || '—'}</span></div>
            <div className="meta-item"><span className="meta-label">Confidence</span><span style={{ color: '#00d68f' }}>{call.confidence_score || 0}%</span></div>
            {call.forwarded_to && <div className="meta-item"><span className="meta-label">Forwarded to</span><span>{call.forwarded_to}</span></div>}
          </div>
          {call.summary && (
            <div className="modal-section">
              <div className="modal-section-title">AI Summary</div>
              <div className="modal-summary">{call.summary}</div>
            </div>
          )}
          {call.transcript && (
            <div className="modal-section">
              <div className="modal-section-title">Transcript</div>
              <div className="modal-transcript">{call.transcript}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STAT CARD ───────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: color || 'var(--text-primary)' }}>{value ?? '—'}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// ─── DASHBOARD PAGE ──────────────────────────────────────────
function DashboardPage({ onViewCall, liveCalls }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callsApi.list({ limit: 10, sort: 'desc' })
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const allCalls = liveCalls.length > 0
    ? [...liveCalls, ...(data?.calls || [])].slice(0, 10)
    : (data?.calls || []);

  const total     = data?.total || 0;
  const blocked   = allCalls.filter(c => c.outcome === 'blocked').length;
  const forwarded = allCalls.filter(c => c.outcome === 'forwarded').length;
  const blockRate = total > 0 ? Math.round((blocked / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="stats-grid">
        <StatCard label="Total Calls Today" value={total} />
        <StatCard label="Blocked" value={blocked} color="var(--red)" />
        <StatCard label="Forwarded" value={forwarded} color="var(--green)" />
        <StatCard label="Block Rate" value={`${blockRate}%`} color="var(--purple)" />
      </div>

      <div className="section">
        <div className="section-header">
          <span className="section-title">Recent Activity</span>
          {liveCalls.length > 0 && (
            <span style={{ fontSize: 11, color: '#00d68f', display: 'flex', alignItems: 'center', gap: 4 }}>
              {Icons.zap} Live
            </span>
          )}
        </div>
        {loading ? <Spinner /> : allCalls.length === 0 ? (
          <EmptyState icon="📞" message="No calls yet today" />
        ) : (
          <div className="call-list">
            {allCalls.map((call, i) => (
              <div key={call.id || i} className="call-row" onClick={() => onViewCall(call)}>
                <div className="call-avatar">{initials(call.caller_name)}</div>
                <div className="call-info">
                  <div className="call-name">{call.caller_name || 'Unknown'}</div>
                  <div className="call-company">{call.caller_company || call.caller_number || '—'}</div>
                </div>
                <div className="call-right">
                  <span className={`badge ${outcomeBadgeClass(call.outcome)}`}>{outcomeLabel(call.outcome)}</span>
                  <div className="call-time">{fmt(call.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CALL LOG PAGE ───────────────────────────────────────────
function CallLogPage({ onViewCall }) {
  const [callList, setCallList] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [exporting,setExporting]= useState(false);

  useEffect(() => {
    callsApi.list({ limit: 100, sort: 'desc' })
      .then(res => setCallList(res?.calls || res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = callList.filter(c => {
    const matchFilter = filter === 'all' || c.outcome === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || (c.caller_name || '').toLowerCase().includes(q)
      || (c.caller_company || '').toLowerCase().includes(q)
      || (c.caller_number || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  function handleExport() {
    setExporting(true);
    try {
      exportCallsCsv({ status: filter !== 'all' ? filter : undefined });
    } finally {
      setTimeout(() => setExporting(false), 1500);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">{Icons.search}</span>
          <input
            className="search-input"
            placeholder="Search caller, company, number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'forwarded', 'blocked'].map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button className="btn btn-sm" onClick={handleExport} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {Icons.download} {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="section">
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon="🔍" message="No calls match your search" />
        ) : (
          <div className="call-table">
            <div className="call-table-header">
              <span>Caller</span>
              <span>Status</span>
              <span>Confidence</span>
              <span>Duration</span>
              <span>Time</span>
            </div>
            {filtered.map((call, i) => (
              <div key={call.id || i} className="call-table-row" onClick={() => onViewCall(call)}>
                <div className="call-info">
                  <div className="call-name">{call.caller_name || 'Unknown'}</div>
                  <div className="call-company">{call.caller_company || call.caller_number || '—'}</div>
                </div>
                <span className={`badge ${outcomeBadgeClass(call.outcome)}`}>{outcomeLabel(call.outcome)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#00d68f' }}>{call.confidence_score || 0}%</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{fmtDuration(call.duration_seconds)}</span>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{fmt(call.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCREENING PAGE ──────────────────────────────────────────
function ScreeningPage() {
  const [wlList,    setWlList]    = useState([]);
  const [ptList,    setPtList]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [addingWl,  setAddingWl]  = useState(false);
  const [addingPt,  setAddingPt]  = useState(false);
  const [wlForm,    setWlForm]    = useState({ name: '', company_name: '', phone_number: '', tag: 'Client' });
  const [ptForm,    setPtForm]    = useState({ pattern: '', pattern_type: 'Keyword' });
  const [scrEmail,  setScrEmail]  = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    Promise.all([
      whitelistApi.list(),
      patternsApi.list(),
      settingsApi.get(),
    ]).then(([wl, pt, sett]) => {
      setWlList(wl?.contacts || wl || []);
      setPtList(pt?.patterns || pt || []);
      setScrEmail(sett?.screening_email || '');
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function addWhitelist() {
    if (!wlForm.name) return;
    try {
      const entry = await whitelistApi.create(wlForm);
      setWlList(prev => [entry, ...prev]);
      setWlForm({ name: '', company_name: '', phone_number: '', tag: 'Client' });
      setAddingWl(false);
    } catch (err) { alert(err.message); }
  }

  async function removeWhitelist(id) {
    if (!confirm('Remove from whitelist?')) return;
    try {
      await whitelistApi.remove(id);
      setWlList(prev => prev.filter(w => w.id !== id));
    } catch (err) { alert(err.message); }
  }

  async function addPattern() {
    if (!ptForm.pattern) return;
    try {
      const entry = await patternsApi.create(ptForm);
      setPtList(prev => [entry, ...prev]);
      setPtForm({ pattern: '', pattern_type: 'Keyword' });
      setAddingPt(false);
    } catch (err) { alert(err.message); }
  }

  async function removePattern(id) {
    if (!confirm('Remove this blocked pattern?')) return;
    try {
      await patternsApi.remove(id);
      setPtList(prev => prev.filter(p => p.id !== id));
    } catch (err) { alert(err.message); }
  }

  async function saveScreeningEmail() {
    setSavingEmail(true);
    try {
      await settingsApi.update({ screening_email: scrEmail });
    } catch (err) { alert(err.message); }
    finally { setSavingEmail(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Screening Email */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Screening Email</span>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Blocked callers are directed to email this address if they believe their call is a genuine business enquiry.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder="screening@yourcompany.com"
              value={scrEmail}
              onChange={e => setScrEmail(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" onClick={saveScreeningEmail} disabled={savingEmail}>
              {savingEmail ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Whitelist */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Whitelist</span>
          <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => setAddingWl(!addingWl)}>
            {Icons.plus} Add Contact
          </button>
        </div>

        {addingWl && (
          <div className="add-form">
            <input className="form-input" placeholder="Full name *" value={wlForm.name} onChange={e => setWlForm(p => ({ ...p, name: e.target.value }))} />
            <input className="form-input" placeholder="Company" value={wlForm.company_name} onChange={e => setWlForm(p => ({ ...p, company_name: e.target.value }))} />
            <input className="form-input" placeholder="Phone number" value={wlForm.phone_number} onChange={e => setWlForm(p => ({ ...p, phone_number: e.target.value }))} />
            <select className="form-input" value={wlForm.tag} onChange={e => setWlForm(p => ({ ...p, tag: e.target.value }))}>
              {['Client', 'Vendor', 'VIP', 'Partner'].map(t => <option key={t}>{t}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={addWhitelist}>Add</button>
              <button className="btn btn-sm" onClick={() => setAddingWl(false)}>Cancel</button>
            </div>
          </div>
        )}

        {wlList.length === 0 ? (
          <EmptyState icon="⭐" message="No whitelisted contacts yet" />
        ) : (
          <div className="list-items">
            {wlList.map(w => (
              <div key={w.id} className="list-item">
                <div className="list-avatar">{initials(w.name)}</div>
                <div className="list-info">
                  <div className="list-name">{w.name}</div>
                  <div className="list-sub">{w.company_name} {w.phone_number ? `· ${w.phone_number}` : ''}</div>
                </div>
                <span className="badge badge-purple">{w.tag}</span>
                <button className="icon-btn icon-btn-danger" onClick={() => removeWhitelist(w.id)}>{Icons.trash}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blocked Patterns */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Blocked Patterns</span>
          <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => setAddingPt(!addingPt)}>
            {Icons.plus} Add Pattern
          </button>
        </div>

        {addingPt && (
          <div className="add-form">
            <input className="form-input" placeholder="Pattern (e.g. Solar panel offers)" value={ptForm.pattern} onChange={e => setPtForm(p => ({ ...p, pattern: e.target.value }))} />
            <select className="form-input" value={ptForm.pattern_type} onChange={e => setPtForm(p => ({ ...p, pattern_type: e.target.value }))}>
              {['Keyword', 'Number Range', 'Caller ID'].map(t => <option key={t}>{t}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={addPattern}>Add</button>
              <button className="btn btn-sm" onClick={() => setAddingPt(false)}>Cancel</button>
            </div>
          </div>
        )}

        {ptList.length === 0 ? (
          <EmptyState icon="🚫" message="No blocked patterns yet" />
        ) : (
          <div className="list-items">
            {ptList.map(p => (
              <div key={p.id} className="list-item">
                <div className="list-info">
                  <div className="list-name">{p.pattern}</div>
                  <div className="list-sub">{p.pattern_type} · {p.hits || 0} hits</div>
                </div>
                <button className="icon-btn icon-btn-danger" onClick={() => removePattern(p.id)}>{Icons.trash}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TEAM PAGE ───────────────────────────────────────────────
function TeamPage() {
  const [team,    setTeam]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [form,    setForm]    = useState({ first_name: '', last_name: '', email: '', phone: '', extension: '', department: '', role: 'member' });

  useEffect(() => {
    usersApi.list()
      .then(res => setTeam(res?.users || res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function addMember() {
    if (!form.first_name || !form.email) return;
    try {
      const member = await usersApi.create({ ...form, password: Math.random().toString(36).slice(-10) });
      setTeam(prev => [...prev, member]);
      setForm({ first_name: '', last_name: '', email: '', phone: '', extension: '', department: '', role: 'member' });
      setAdding(false);
    } catch (err) { alert(err.message); }
  }

  async function removeMember(id) {
    if (!confirm('Remove this team member?')) return;
    try {
      await usersApi.remove(id);
      setTeam(prev => prev.filter(m => m.id !== id));
    } catch (err) { alert(err.message); }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section">
        <div className="section-header">
          <span className="section-title">Team Members</span>
          <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => setAdding(!adding)}>
            {Icons.plus} Add Member
          </button>
        </div>

        {adding && (
          <div className="add-form">
            <input className="form-input" placeholder="First name *" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
            <input className="form-input" placeholder="Last name" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
            <input className="form-input" placeholder="Email *" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <input className="form-input" placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            <input className="form-input" placeholder="Extension" value={form.extension} onChange={e => setForm(p => ({ ...p, extension: e.target.value }))} />
            <input className="form-input" placeholder="Department" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={addMember}>Add</button>
              <button className="btn btn-sm" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        )}

        {team.length === 0 ? (
          <EmptyState icon="👥" message="No team members yet" />
        ) : (
          <div className="list-items">
            {team.map(m => (
              <div key={m.id} className="list-item">
                <div className="list-avatar">{initials(`${m.first_name} ${m.last_name}`)}</div>
                <div className="list-info">
                  <div className="list-name">{m.first_name} {m.last_name}</div>
                  <div className="list-sub">{m.email} {m.extension ? `· Ext. ${m.extension}` : ''}</div>
                </div>
                <span className="badge badge-ghost">{m.role}</span>
                <button className="icon-btn icon-btn-danger" onClick={() => removeMember(m.id)}>{Icons.trash}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ───────────────────────────────────────────
function SettingsPage() {
  const { company } = useAuth();
  const [notifs,   setNotifs]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    notificationsApi.get()
      .then(res => setNotifs(res?.settings || res || {}))
      .catch(() => setNotifs({}))
      .finally(() => setLoading(false));
  }, []);

  async function saveNotifs(updated) {
    setSaving(true);
    try {
      await notificationsApi.update(updated);
      setNotifs(updated);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  function toggle(key) {
    const updated = { ...notifs, [key]: !notifs[key] };
    saveNotifs(updated);
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section">
        <div className="section-header"><span className="section-title">Company Profile</span></div>
        <div className="settings-grid" style={{ padding: 20 }}>
          {[
            { label: 'Company Name',  value: company?.name     || '—' },
            { label: 'Plan',          value: company?.plan     || '—' },
            { label: 'Industry',      value: company?.industry || '—' },
            { label: 'Timezone',      value: company?.timezone || '—' },
          ].map((f, i) => (
            <div key={i}>
              <div className="field-label">{f.label}</div>
              <div className="field-value">{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-header"><span className="section-title">Notification Preferences</span></div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ToggleSetting
            label="Real-time Slack alerts"
            desc="Get instant Slack notifications for blocked and forwarded calls"
            value={!!notifs?.slack_enabled}
            onChange={() => toggle('slack_enabled')}
          />
          <ToggleSetting
            label="Blocked call email alerts"
            desc="Receive an email when a call is blocked. Off by default."
            value={!!notifs?.blocked_call_email_enabled}
            onChange={() => toggle('blocked_call_email_enabled')}
          />
          <ToggleSetting
            label="Whitelist suggestion emails"
            desc="Get notified when Gate AI suggests adding a forwarded caller to your whitelist"
            value={notifs?.whitelist_suggestion_email !== false}
            onChange={() => toggle('whitelist_suggestion_email')}
          />
          <ToggleSetting
            label="Weekly analytics report"
            desc="Auto-generate and email a weekly call analytics summary"
            value={!!notifs?.weekly_report_enabled}
            onChange={() => toggle('weekly_report_enabled')}
          />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  calls:     'Call Log',
  screening: 'Screening Rules',
  team:      'Team & Routing',
  settings:  'Settings',
};

export default function Dashboard() {
  const [activePage,   setActivePage]   = useState('dashboard');
  const [selectedCall, setSelectedCall] = useState(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [liveCalls,    setLiveCalls]    = useState([]);

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'new_call') {
      setLiveCalls(prev => [msg.call, ...prev].slice(0, 20));
    }
  }, []);

  const { connected } = useWebSocket(handleWsMessage);

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <Sidebar active={activePage} setActive={setActivePage} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main">
          <Topbar title={PAGE_TITLES[activePage]} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} wsConnected={connected} />
          <div className="content">
            {activePage === 'dashboard'  && <DashboardPage onViewCall={setSelectedCall} liveCalls={liveCalls} />}
            {activePage === 'calls'      && <CallLogPage   onViewCall={setSelectedCall} />}
            {activePage === 'screening'  && <ScreeningPage />}
            {activePage === 'team'       && <TeamPage />}
            {activePage === 'settings'   && <SettingsPage />}
          </div>
        </div>
        {selectedCall && <CallDetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />}
      </div>
    </>
  );
}

// ─── CSS ─────────────────────────────────────────────────────
const CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-primary:    #0a0b0f;
    --bg-secondary:  #111218;
    --bg-tertiary:   #13141b;
    --border:        #252736;
    --border-subtle: #1a1c26;
    --text-primary:  #e8e9ed;
    --text-secondary:#a0a3b1;
    --text-tertiary: #8b8fa3;
    --purple:        #6c5ce7;
    --purple-light:  #a29bfe;
    --green:         #00d68f;
    --red:           #ff6b6b;
    --yellow:        #ffd93d;
    --radius-sm:     6px;
    --radius-md:     10px;
    --radius-lg:     14px;
    --font-mono:     'JetBrains Mono', monospace;
  }

  body {
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: 'DM Sans', -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }

  .app { display: flex; height: 100vh; overflow: hidden; }

  /* ── Sidebar ── */
  .sidebar {
    width: 220px; min-width: 220px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    height: 100vh; z-index: 100;
    transition: transform 250ms ease;
  }

  .sidebar-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 99;
  }

  .sidebar-logo {
    display: flex; align-items: center; gap: 10px;
    padding: 20px 16px 16px;
    border-bottom: 1px solid var(--border);
  }

  .logo-icon {
    width: 34px; height: 34px; flex-shrink: 0;
    background: linear-gradient(135deg, var(--purple), var(--purple-light));
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 10px rgba(108,92,231,0.3);
  }

  .logo-text { font-size: 15px; font-weight: 700; letter-spacing: -0.2px; }
  .logo-sub  { font-size: 11px; color: var(--text-tertiary); margin-top: 1px; }

  .sidebar-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }

  .nav-item {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 9px 10px; border: none; background: none;
    color: var(--text-tertiary); font-family: 'DM Sans', sans-serif;
    font-size: 13.5px; font-weight: 500; border-radius: var(--radius-md);
    cursor: pointer; transition: all 150ms ease; text-align: left;
  }

  .nav-item:hover { background: var(--bg-tertiary); color: var(--text-primary); }

  .nav-item-active {
    background: rgba(108,92,231,0.12);
    color: var(--purple-light);
  }

  .nav-icon { display: flex; align-items: center; opacity: 0.8; }

  .sidebar-footer {
    padding: 12px;
    border-top: 1px solid var(--border);
  }

  .user-row { display: flex; align-items: center; gap: 10px; }

  .user-avatar {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, var(--purple), var(--purple-light));
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff;
  }

  .user-info { flex: 1; min-width: 0; }
  .user-name { font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-role { font-size: 11px; color: var(--text-tertiary); text-transform: capitalize; }

  /* ── Main ── */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

  .topbar {
    height: 56px; min-height: 56px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
  }

  .page-title { font-size: 16px; font-weight: 700; letter-spacing: -0.2px; }
  .menu-btn   { display: none; }

  .content { flex: 1; overflow-y: auto; padding: 20px; }

  /* ── Buttons ── */
  .btn {
    padding: 8px 14px; border-radius: var(--radius-md);
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; border: 1px solid var(--border);
    background: var(--bg-tertiary); color: var(--text-secondary);
    transition: all 150ms ease;
  }

  .btn:hover:not(:disabled) { border-color: var(--purple); color: var(--text-primary); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-sm { padding: 6px 12px; font-size: 12px; }

  .btn-primary {
    background: linear-gradient(135deg, var(--purple), var(--purple-light));
    border-color: transparent; color: #fff;
  }

  .btn-primary:hover:not(:disabled) { opacity: 0.88; }

  .icon-btn {
    width: 30px; height: 30px; border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    border: none; background: none; color: var(--text-tertiary);
    cursor: pointer; transition: all 150ms ease; flex-shrink: 0;
  }

  .icon-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }
  .icon-btn-danger:hover { color: var(--red); }

  /* ── Badges ── */
  .badge {
    display: inline-flex; align-items: center;
    padding: 3px 9px; border-radius: 20px;
    font-size: 11px; font-weight: 600; white-space: nowrap;
  }

  .badge-green  { background: rgba(0,214,143,0.12);  color: #00d68f; }
  .badge-red    { background: rgba(255,107,107,0.12); color: #ff6b6b; }
  .badge-yellow { background: rgba(255,217,61,0.12);  color: #ffd93d; }
  .badge-purple { background: rgba(162,155,254,0.12); color: var(--purple-light); }
  .badge-ghost  { background: var(--bg-tertiary); color: var(--text-tertiary); border: 1px solid var(--border); }

  /* ── Section ── */
  .section {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .section-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .section-title { font-size: 13.5px; font-weight: 600; }

  /* ── Stats ── */
  .stats-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  }

  .stat-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 18px 20px;
  }

  .stat-label { font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .stat-value { font-size: 28px; font-weight: 700; font-family: var(--font-mono); letter-spacing: -1px; }
  .stat-sub   { font-size: 12px; color: var(--text-tertiary); margin-top: 4px; }

  /* ── Call List ── */
  .call-list { display: flex; flex-direction: column; }

  .call-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 18px; cursor: pointer;
    border-bottom: 1px solid var(--border-subtle);
    transition: background 100ms ease;
  }

  .call-row:last-child { border-bottom: none; }
  .call-row:hover { background: var(--bg-tertiary); }

  .call-avatar {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    background: var(--bg-tertiary); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: var(--text-tertiary);
  }

  .call-info { flex: 1; min-width: 0; }
  .call-name    { font-size: 13.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .call-company { font-size: 12px; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .call-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  .call-time  { font-size: 11px; color: var(--text-tertiary); font-family: var(--font-mono); }

  /* ── Call Table ── */
  .call-table { width: 100%; }

  .call-table-header {
    display: grid; grid-template-columns: 1fr 100px 90px 80px 90px;
    padding: 10px 18px; gap: 12px;
    font-size: 11px; font-weight: 600; color: var(--text-tertiary);
    text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .call-table-row {
    display: grid; grid-template-columns: 1fr 100px 90px 80px 90px;
    padding: 12px 18px; gap: 12px; align-items: center;
    border-bottom: 1px solid var(--border-subtle);
    cursor: pointer; transition: background 100ms ease;
  }

  .call-table-row:last-child { border-bottom: none; }
  .call-table-row:hover { background: var(--bg-tertiary); }

  /* ── Toolbar ── */
  .toolbar {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  }

  .search-wrap {
    flex: 1; min-width: 200px;
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .search-icon { color: var(--text-tertiary); display: flex; flex-shrink: 0; }

  .search-input {
    flex: 1; border: none; background: none;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    color: var(--text-primary); outline: none;
  }

  .search-input::placeholder { color: var(--text-tertiary); }

  /* ── List Items ── */
  .list-items { display: flex; flex-direction: column; }

  .list-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .list-item:last-child { border-bottom: none; }

  .list-avatar {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    background: rgba(108,92,231,0.15);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: var(--purple-light);
  }

  .list-info { flex: 1; min-width: 0; }
  .list-name  { font-size: 13.5px; font-weight: 600; }
  .list-sub   { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }

  /* ── Add Form ── */
  .add-form {
    display: flex; flex-wrap: wrap; gap: 8px;
    padding: 14px 18px;
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border-subtle);
  }

  .form-input {
    padding: 8px 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; color: var(--text-primary);
    outline: none; min-width: 150px;
    transition: border-color 150ms ease;
  }

  .form-input:focus { border-color: var(--purple); }
  .form-input::placeholder { color: var(--text-tertiary); }

  /* ── Settings ── */
  .settings-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }

  .field-label {
    font-size: 11px; font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;
  }

  .field-value {
    padding: 9px 14px;
    background: var(--bg-tertiary); border: 1px solid var(--border);
    border-radius: var(--radius-md); font-size: 13.5px;
    color: var(--text-primary);
  }

  /* ── Toggle ── */
  .toggle-row {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }

  .toggle-info { flex: 1; }
  .toggle-label { font-size: 13.5px; font-weight: 600; margin-bottom: 3px; }
  .toggle-desc  { font-size: 12px; color: var(--text-tertiary); line-height: 1.5; }

  .toggle {
    width: 40px; height: 22px; border-radius: 11px; flex-shrink: 0;
    background: var(--bg-tertiary); border: 1px solid var(--border);
    cursor: pointer; position: relative; transition: all 200ms ease;
  }

  .toggle-on { background: var(--purple); border-color: var(--purple); }

  .toggle-thumb {
    position: absolute; top: 2px; left: 2px;
    width: 16px; height: 16px; border-radius: 50%;
    background: #fff; transition: transform 200ms ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }

  .toggle-on .toggle-thumb { transform: translateX(18px); }

  /* ── Modal ── */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }

  .modal {
    width: 100%; max-width: 560px; max-height: 80vh;
    background: var(--bg-secondary);
    border: 1px solid var(--border); border-radius: var(--radius-lg);
    display: flex; flex-direction: column; overflow: hidden;
  }

  .modal-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 18px 20px; border-bottom: 1px solid var(--border-subtle);
  }

  .modal-caller  { font-size: 16px; font-weight: 700; }
  .modal-company { font-size: 13px; color: var(--text-tertiary); margin-top: 2px; }

  .modal-body { flex: 1; overflow-y: auto; padding: 18px 20px; display: flex; flex-direction: column; gap: 16px; }

  .modal-meta {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    padding: 14px; background: var(--bg-tertiary);
    border: 1px solid var(--border); border-radius: var(--radius-md);
  }

  .meta-item { display: flex; flex-direction: column; gap: 3px; }
  .meta-label { font-size: 10px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }

  .modal-section-title {
    font-size: 11px; font-weight: 700;
    color: var(--text-tertiary); text-transform: uppercase;
    letter-spacing: 0.5px; margin-bottom: 8px;
  }

  .modal-summary {
    font-size: 13.5px; line-height: 1.65; color: var(--text-secondary);
    padding: 12px 14px; background: var(--bg-tertiary);
    border: 1px solid var(--border); border-radius: var(--radius-md);
  }

  .modal-transcript {
    font-size: 12.5px; line-height: 1.7; color: var(--text-tertiary);
    font-family: var(--font-mono);
    padding: 12px 14px; background: var(--bg-tertiary);
    border: 1px solid var(--border); border-radius: var(--radius-md);
    white-space: pre-wrap; max-height: 200px; overflow-y: auto;
  }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .sidebar {
      position: fixed; top: 0; left: 0; height: 100vh;
      transform: translateX(-100%);
    }

    .sidebar-open { transform: translateX(0); }
    .sidebar-overlay { display: block; }
    .menu-btn { display: flex !important; }

    .stats-grid { grid-template-columns: 1fr 1fr; }

    .call-table-header,
    .call-table-row { grid-template-columns: 1fr 90px; }

    .call-table-header span:nth-child(n+3),
    .call-table-row  span:nth-child(n+3),
    .call-table-row  div:nth-child(n+3) { display: none; }

    .settings-grid { grid-template-columns: 1fr; }
    .toolbar { flex-direction: column; align-items: stretch; }
    .search-wrap { min-width: unset; }

    .content { padding: 14px; }
  }

  @media (max-width: 480px) {
    .stats-grid { grid-template-columns: 1fr 1fr; }
    .stat-value { font-size: 22px; }
  }
`;
