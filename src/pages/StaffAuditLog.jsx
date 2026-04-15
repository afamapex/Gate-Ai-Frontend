import { useState, useEffect, useCallback } from 'react';
import { staffAuditLog } from '../services/staffApi.js';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

const ENTITY_FILTERS = [
  { value: '',                label: 'All entities' },
  { value: 'company',        label: 'Company' },
  { value: 'invite',         label: 'Invite' },
  { value: 'user',           label: 'User' },
  { value: 'staff_user',     label: 'Staff user' },
  { value: 'demo_request',   label: 'Demo request' },
  { value: 'contact_request',label: 'Contact request' },
];

function ActionBadge({ action }) {
  let color = '#a29bfe';
  if (action.includes('deactivate') || action.includes('revoke')) color = '#ff6b6b';
  else if (action.includes('create') || action.includes('reactivate')) color = '#51cf66';
  else if (action.includes('login')) color = '#5bc0de';
  else if (action.includes('update') || action.includes('resend') || action.includes('regenerate')) color = '#ffb347';
  else if (action.includes('impersonate') || action.includes('reset')) color = '#f06595';

  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      background: `${color}18`, border: `1px solid ${color}40`, color,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
      fontFamily: 'ui-monospace, Menlo, monospace',
    }}>{action}</span>
  );
}

export default function StaffAuditLog() {
  const [data, setData]       = useState({ entries: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage]       = useState(1);
  const [expanded, setExpanded] = useState(null); // entry id

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit: 30 };
      if (search)       params.search      = search;
      if (entityFilter) params.entity_type = entityFilter;
      setData(await staffAuditLog.list(params));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [page, search, entityFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <style>{`
        .sal-title { font-size: 22px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px; margin-bottom: 6px; }
        .sal-sub { font-size: 13.5px; color: #8b8fa3; margin-bottom: 18px; }
        .sal-toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; align-items: center; }
        .sal-search { flex: 1; min-width: 220px; display: flex; gap: 8px; }
        .sal-search input { flex: 1; padding: 9px 13px; background: #13141b; border: 1px solid #252736; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #e8e9ed; outline: none; }
        .sal-search input:focus { border-color: #6c5ce7; }
        .sal-btn { padding: 9px 16px; border: none; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; transition: opacity 120ms ease; }
        .sal-btn-primary { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff; }
        .sal-btn-primary:hover { opacity: 0.88; }
        .sal-btn-ghost { background: #13141b; color: #e8e9ed; border: 1px solid #252736; }
        .sal-btn-ghost:hover:not(:disabled) { background: #1c1e2a; }
        .sal-btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
        .sal-select { padding: 9px 13px; background: #13141b; border: 1px solid #252736; border-radius: 8px; color: #e8e9ed; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; outline: none; }
        .sal-table-wrap { background: #111218; border: 1px solid #252736; border-radius: 12px; overflow: hidden; }
        .sal-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .sal-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1c1e2a; background: #0d0e14; white-space: nowrap; }
        .sal-table td { padding: 14px 16px; color: #e8e9ed; border-bottom: 1px solid #1c1e2a; vertical-align: top; }
        .sal-table tr:last-child td { border-bottom: none; }
        .sal-table tbody tr { cursor: pointer; transition: background 100ms ease; }
        .sal-table tbody tr:hover { background: #15171f; }
        .sal-empty { padding: 60px 20px; text-align: center; color: #8b8fa3; font-size: 14px; }
        .sal-error { background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.25); color: #ff6b6b; padding: 12px 16px; border-radius: 8px; font-size: 13.5px; margin-bottom: 14px; }
        .sal-meta { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; color: #8b8fa3; margin-top: 4px; }
        .sal-detail {
          margin-top: 8px; padding: 10px 12px;
          background: #0d0e14; border: 1px solid #1c1e2a; border-radius: 6px;
          font-family: ui-monospace, Menlo, monospace; font-size: 11.5px;
          color: #b0b3c5; white-space: pre-wrap; word-break: break-word;
          max-height: 200px; overflow-y: auto;
        }
        .sal-pagination { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #0d0e14; border-top: 1px solid #1c1e2a; font-size: 13px; color: #8b8fa3; }
        @media (max-width: 900px) { .sal-hide-mobile { display: none; } .sal-table { font-size: 12.5px; } .sal-table th, .sal-table td { padding: 10px 12px; } }
      `}</style>

      <h1 className="sal-title">Audit Log</h1>
      <div className="sal-sub">{loading ? 'Loading…' : `${data.total} ${data.total === 1 ? 'entry' : 'entries'} recorded`}</div>

      <div className="sal-toolbar">
        <form className="sal-search" onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput.trim()); }}>
          <input placeholder="Search by action, email, or entity…" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          <button type="submit" className="sal-btn sal-btn-primary">Search</button>
        </form>
        <select className="sal-select" value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }}>
          {ENTITY_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {error && <div className="sal-error">{error}</div>}

      <div className="sal-table-wrap">
        <table className="sal-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Staff</th>
              <th className="sal-hide-mobile">Entity</th>
              <th className="sal-hide-mobile">IP</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="sal-empty">Loading…</td></tr>}
            {!loading && data.entries.length === 0 && (
              <tr><td colSpan={5} className="sal-empty">No audit log entries yet. Actions will appear here as staff members use the console.</td></tr>
            )}
            {!loading && data.entries.map(e => (
              <tr key={e.id} onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                <td>
                  <ActionBadge action={e.action} />
                  {expanded === e.id && e.metadata && Object.keys(e.metadata).length > 0 && (
                    <div className="sal-detail">{JSON.stringify(e.metadata, null, 2)}</div>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{e.staff_email_snapshot}</div>
                </td>
                <td className="sal-hide-mobile">
                  <div style={{ fontSize: 12.5, color: '#b0b3c5' }}>{e.entity_type}</div>
                  <div className="sal-meta">{e.entity_id ? e.entity_id.slice(0, 8) + '…' : '—'}</div>
                </td>
                <td className="sal-hide-mobile" style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, color: '#8b8fa3' }}>
                  {e.ip_address || '—'}
                </td>
                <td style={{ fontSize: 12.5, color: '#b0b3c5', whiteSpace: 'nowrap' }}>{fmtDate(e.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && data.pages > 1 && (
          <div className="sal-pagination">
            <span>Page {data.page} of {data.pages} · {data.total} total</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="sal-btn sal-btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="sal-btn sal-btn-ghost" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
