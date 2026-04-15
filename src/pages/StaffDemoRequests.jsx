import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { staffDemoRequests } from '../services/staffApi.js';

const STATUS_FILTERS = [
  { value: '',          label: 'All statuses' },
  { value: 'new',       label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'invited',   label: 'Invited' },
  { value: 'declined',  label: 'Declined' },
];

function fmtRelative(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const hours = Math.floor(diff / 3.6e6);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatusBadge({ value }) {
  const palettes = {
    new:       ['rgba(91,192,222,0.12)', 'rgba(91,192,222,0.35)', '#5bc0de'],
    contacted: ['rgba(108,92,231,0.15)', 'rgba(108,92,231,0.4)',  '#a29bfe'],
    scheduled: ['rgba(255,165,0,0.12)',  'rgba(255,165,0,0.35)',  '#ffb347'],
    completed: ['rgba(81,207,102,0.12)', 'rgba(81,207,102,0.35)', '#51cf66'],
    invited:   ['rgba(81,207,102,0.12)', 'rgba(81,207,102,0.35)', '#51cf66'],
    declined:  ['rgba(139,143,163,0.12)','rgba(139,143,163,0.35)','#8b8fa3'],
  };
  const [bg, border, fg] = palettes[value] || palettes.new;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      background: bg, border: `1px solid ${border}`, color: fg,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4,
    }}>{value}</span>
  );
}

export default function StaffDemoRequests() {
  const navigate = useNavigate();
  const [data,    setData]    = useState({ demo_requests: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      setData(await staffDemoRequests.list(params));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <style>{`
        .sdr-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 22px; flex-wrap: wrap; }
        .sdr-title { font-size: 22px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px; margin-bottom: 4px; }
        .sdr-sub { font-size: 13.5px; color: #8b8fa3; }
        .sdr-toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; align-items: center; }
        .sdr-search { flex: 1; min-width: 220px; display: flex; gap: 8px; }
        .sdr-search input { flex: 1; padding: 9px 13px; background: #13141b; border: 1px solid #252736; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #e8e9ed; outline: none; }
        .sdr-search input:focus { border-color: #6c5ce7; }
        .sdr-btn { padding: 9px 16px; border: none; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; transition: opacity 120ms ease; }
        .sdr-btn-primary { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff; }
        .sdr-btn-primary:hover { opacity: 0.88; }
        .sdr-btn-ghost { background: #13141b; color: #e8e9ed; border: 1px solid #252736; }
        .sdr-btn-ghost:hover:not(:disabled) { background: #1c1e2a; }
        .sdr-btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
        .sdr-select { padding: 9px 13px; background: #13141b; border: 1px solid #252736; border-radius: 8px; color: #e8e9ed; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; outline: none; }
        .sdr-table-wrap { background: #111218; border: 1px solid #252736; border-radius: 12px; overflow: hidden; }
        .sdr-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .sdr-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1c1e2a; background: #0d0e14; white-space: nowrap; }
        .sdr-table td { padding: 14px 16px; color: #e8e9ed; border-bottom: 1px solid #1c1e2a; vertical-align: middle; }
        .sdr-table tr:last-child td { border-bottom: none; }
        .sdr-table tbody tr { cursor: pointer; transition: background 100ms ease; }
        .sdr-table tbody tr:hover { background: #15171f; }
        .sdr-empty { padding: 60px 20px; text-align: center; color: #8b8fa3; font-size: 14px; }
        .sdr-error { background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.25); color: #ff6b6b; padding: 12px 16px; border-radius: 8px; font-size: 13.5px; margin-bottom: 14px; }
        .sdr-meta { font-size: 12px; color: #8b8fa3; margin-top: 2px; }
        .sdr-pagination { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #0d0e14; border-top: 1px solid #1c1e2a; font-size: 13px; color: #8b8fa3; }
        @media (max-width: 900px) { .sdr-hide-mobile { display: none; } .sdr-table { font-size: 12.5px; } .sdr-table th, .sdr-table td { padding: 10px 12px; } }
      `}</style>

      <div className="sdr-header">
        <div>
          <h1 className="sdr-title">Demo Requests</h1>
          <div className="sdr-sub">{loading ? 'Loading…' : `${data.total} ${data.total === 1 ? 'request' : 'requests'} total`}</div>
        </div>
      </div>

      <div className="sdr-toolbar">
        <form className="sdr-search" onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput.trim()); }}>
          <input placeholder="Search by name, email, or company…" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          <button type="submit" className="sdr-btn sdr-btn-primary">Search</button>
        </form>
        <select className="sdr-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          {STATUS_FILTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {error && <div className="sdr-error">{error}</div>}

      <div className="sdr-table-wrap">
        <table className="sdr-table">
          <thead>
            <tr>
              <th>Prospect</th>
              <th>Status</th>
              <th className="sdr-hide-mobile">Industry</th>
              <th className="sdr-hide-mobile">Calls/day</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="sdr-empty">Loading…</td></tr>}
            {!loading && data.demo_requests.length === 0 && (
              <tr><td colSpan={5} className="sdr-empty">No demo requests yet. They'll appear here when someone submits the Book Demo form.</td></tr>
            )}
            {!loading && data.demo_requests.map(dr => (
              <tr key={dr.id} onClick={() => navigate(`/staff/demo-requests/${dr.id}`)}>
                <td>
                  <div style={{ fontWeight: 600 }}>{dr.name}</div>
                  <div className="sdr-meta">{dr.email}{dr.company ? ` · ${dr.company}` : ''}</div>
                </td>
                <td><StatusBadge value={dr.status} /></td>
                <td className="sdr-hide-mobile" style={{ color: '#b0b3c5' }}>{dr.industry || '—'}</td>
                <td className="sdr-hide-mobile" style={{ color: '#b0b3c5' }}>{dr.calls_per_day || '—'}</td>
                <td style={{ fontSize: 12.5, color: '#b0b3c5', whiteSpace: 'nowrap' }}>{fmtRelative(dr.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && data.pages > 1 && (
          <div className="sdr-pagination">
            <span>Page {data.page} of {data.pages} · {data.total} total</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="sdr-btn sdr-btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="sdr-btn sdr-btn-ghost" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
