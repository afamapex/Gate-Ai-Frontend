import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { staffInvites } from '../services/staffApi.js';

const STATUS_FILTERS = [
  { value: '',          label: 'All statuses' },
  { value: 'pending',   label: 'Pending' },
  { value: 'activated', label: 'Activated' },
  { value: 'expired',   label: 'Expired' },
  { value: 'revoked',   label: 'Revoked' },
];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtRelative(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const hours = Math.floor(diff / 3.6e6);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
}

function StatusBadge({ value }) {
  const palettes = {
    pending:   ['rgba(91,192,222,0.12)', 'rgba(91,192,222,0.35)', '#5bc0de'],
    activated: ['rgba(81,207,102,0.12)', 'rgba(81,207,102,0.35)', '#51cf66'],
    expired:   ['rgba(139,143,163,0.12)','rgba(139,143,163,0.35)','#8b8fa3'],
    revoked:   ['rgba(255,107,107,0.12)','rgba(255,107,107,0.35)','#ff6b6b'],
  };
  const [bg, border, fg] = palettes[value] || palettes.pending;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      background: bg, border: `1px solid ${border}`, color: fg,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap',
    }}>{value}</span>
  );
}

function PlanBadge({ value }) {
  const palettes = {
    starter:  ['rgba(91,192,222,0.12)', 'rgba(91,192,222,0.35)', '#5bc0de'],
    pro:      ['rgba(108,92,231,0.15)', 'rgba(108,92,231,0.4)',  '#a29bfe'],
    business: ['rgba(255,165,0,0.12)',  'rgba(255,165,0,0.35)',  '#ffb347'],
  };
  const [bg, border, fg] = palettes[value] || palettes.starter;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      background: bg, border: `1px solid ${border}`, color: fg,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap',
    }}>{value}</span>
  );
}

export default function StaffInvites() {
  const navigate = useNavigate();

  const [data,    setData]    = useState({ invites: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const [search,       setSearch]       = useState('');
  const [searchInput,  setSearchInput]  = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page,         setPage]         = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await staffInvites.list(params);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load invites');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <style>{`
        .si-header {
          display: flex; justify-content: space-between; align-items: flex-end;
          gap: 16px; margin-bottom: 22px; flex-wrap: wrap;
        }
        .si-title { font-size: 22px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px; margin-bottom: 4px; }
        .si-sub { font-size: 13.5px; color: #8b8fa3; }
        .si-toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; align-items: center; }
        .si-search { flex: 1; min-width: 220px; display: flex; gap: 8px; }
        .si-search input {
          flex: 1; padding: 9px 13px;
          background: #13141b; border: 1px solid #252736; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #e8e9ed; outline: none;
        }
        .si-search input:focus { border-color: #6c5ce7; }
        .si-btn {
          padding: 9px 16px; border: none; border-radius: 8px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          transition: opacity 120ms ease, background 120ms ease, transform 100ms ease;
          white-space: nowrap;
        }
        .si-btn:active:not(:disabled) { transform: scale(0.97); }
        .si-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .si-btn-primary {
          background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff;
        }
        .si-btn-primary:hover:not(:disabled) { opacity: 0.88; }
        .si-btn-ghost { background: #13141b; color: #e8e9ed; border: 1px solid #252736; }
        .si-btn-ghost:hover:not(:disabled) { background: #1c1e2a; }
        .si-select {
          padding: 9px 13px; background: #13141b; border: 1px solid #252736; border-radius: 8px;
          color: #e8e9ed; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; outline: none;
        }
        .si-table-wrap { background: #111218; border: 1px solid #252736; border-radius: 12px; overflow: hidden; }
        .si-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .si-table th {
          text-align: left; padding: 12px 16px;
          font-size: 11px; font-weight: 700; color: #8b8fa3;
          text-transform: uppercase; letter-spacing: 0.5px;
          border-bottom: 1px solid #1c1e2a; background: #0d0e14; white-space: nowrap;
        }
        .si-table td { padding: 14px 16px; color: #e8e9ed; border-bottom: 1px solid #1c1e2a; vertical-align: middle; }
        .si-table tr:last-child td { border-bottom: none; }
        .si-table tbody tr { cursor: pointer; transition: background 100ms ease; }
        .si-table tbody tr:hover { background: #15171f; }
        .si-empty { padding: 60px 20px; text-align: center; color: #8b8fa3; font-size: 14px; }
        .si-primary-col { font-weight: 600; }
        .si-meta { font-size: 12px; color: #8b8fa3; margin-top: 2px; }
        .si-error {
          background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.25);
          color: #ff6b6b; padding: 12px 16px; border-radius: 8px; font-size: 13.5px; margin-bottom: 14px;
        }
        .si-pagination {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 18px; background: #0d0e14; border-top: 1px solid #1c1e2a;
          font-size: 13px; color: #8b8fa3;
        }
        @media (max-width: 900px) {
          .si-table { font-size: 12.5px; }
          .si-table th, .si-table td { padding: 10px 12px; }
          .si-hide-mobile { display: none; }
        }
      `}</style>

      <div className="si-header">
        <div>
          <h1 className="si-title">Invites</h1>
          <div className="si-sub">{loading ? 'Loading…' : `${data.total} ${data.total === 1 ? 'invite' : 'invites'} total`}</div>
        </div>
        <Link to="/staff/invites/new">
          <button className="si-btn si-btn-primary">+ Generate invite</button>
        </Link>
      </div>

      <div className="si-toolbar">
        <form className="si-search" onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput.trim()); }}>
          <input
            placeholder="Search by email or company…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button type="submit" className="si-btn si-btn-primary">Search</button>
        </form>
        <select className="si-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          {STATUS_FILTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {error && <div className="si-error">{error}</div>}

      <div className="si-table-wrap">
        <table className="si-table">
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Plan</th>
              <th>Status</th>
              <th className="si-hide-mobile">Sent by</th>
              <th className="si-hide-mobile">Sent</th>
              <th className="si-hide-mobile">Expires</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="si-empty">Loading invites…</td></tr>}
            {!loading && data.invites.length === 0 && (
              <tr><td colSpan={6} className="si-empty">
                No invites yet. <Link to="/staff/invites/new" style={{ color: '#a29bfe' }}>Generate one →</Link>
              </td></tr>
            )}
            {!loading && data.invites.map(inv => (
              <tr key={inv.id} onClick={() => navigate(`/staff/invites/${inv.id}`)}>
                <td>
                  <div className="si-primary-col">{inv.email}</div>
                  <div className="si-meta">
                    {inv.company_name}
                    {inv.first_name && ` · ${inv.first_name}`}
                  </div>
                </td>
                <td><PlanBadge value={inv.plan} /></td>
                <td><StatusBadge value={inv.status} /></td>
                <td className="si-hide-mobile" style={{ fontSize: 12.5, color: '#b0b3c5' }}>{inv.invited_by_email || '—'}</td>
                <td className="si-hide-mobile" style={{ fontSize: 12.5, color: '#b0b3c5' }}>
                  {fmtRelative(inv.last_sent_at || inv.created_at)}
                  {inv.send_count > 1 && <span style={{ marginLeft: 6, color: '#6c5ce7' }}>·{inv.send_count}×</span>}
                </td>
                <td className="si-hide-mobile" style={{ fontSize: 12.5, color: '#b0b3c5' }}>{fmtDate(inv.expires_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && data.pages > 1 && (
          <div className="si-pagination">
            <span>Page {data.page} of {data.pages} · {data.total} total</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="si-btn si-btn-ghost" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
              <button className="si-btn si-btn-ghost" disabled={page >= data.pages} onClick={() => setPage(p => Math.min(data.pages, p + 1))}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
