import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffMeetings } from '../services/staffApi.js';

const STATUS_FILTERS = [
  { value: '',             label: 'All statuses' },
  { value: 'pending',      label: 'Awaiting booking' },
  { value: 'scheduled',    label: 'Scheduled' },
  { value: 'completed',    label: 'Completed' },
  { value: 'no_show',      label: 'No-show' },
  { value: 'rescheduling', label: 'Rescheduling' },
  { value: 'declined',     label: 'Declined' },
  { value: 'cancelled',    label: 'Cancelled' },
];

const STATUS_PALETTES = {
  pending:      ['rgba(91,192,222,0.12)', 'rgba(91,192,222,0.35)', '#5bc0de', 'Awaiting booking'],
  scheduled:    ['rgba(81,207,102,0.12)', 'rgba(81,207,102,0.35)', '#51cf66', 'Scheduled'],
  completed:    ['rgba(108,92,231,0.15)', 'rgba(108,92,231,0.4)',  '#a29bfe', 'Completed'],
  no_show:      ['rgba(255,107,107,0.1)', 'rgba(255,107,107,0.3)', '#ff6b6b', 'No-show'],
  rescheduling: ['rgba(255,165,0,0.12)',  'rgba(255,165,0,0.35)',  '#ffb347', 'Rescheduling'],
  declined:     ['rgba(139,143,163,0.12)','rgba(139,143,163,0.35)','#8b8fa3', 'Declined'],
  cancelled:    ['rgba(139,143,163,0.12)','rgba(139,143,163,0.35)','#8b8fa3', 'Cancelled'],
};

function StatusBadge({ value }) {
  const [bg, border, fg, label] = STATUS_PALETTES[value] || STATUS_PALETTES.pending;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      background: bg, border: `1px solid ${border}`, color: fg,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4,
    }}>{label}</span>
  );
}

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

function fmtSlot(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
}

export default function StaffMeetings() {
  const navigate = useNavigate();
  const [data, setData] = useState({ meetings: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit: 30 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      setData(await staffMeetings.list(params));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <style>{`
        .smt-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 22px; flex-wrap: wrap; }
        .smt-title { font-size: 22px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px; margin-bottom: 4px; }
        .smt-sub { font-size: 13.5px; color: #8b8fa3; }
        .smt-toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; align-items: center; }
        .smt-search { flex: 1; min-width: 220px; display: flex; gap: 8px; }
        .smt-search input { flex: 1; padding: 9px 13px; background: #13141b; border: 1px solid #252736; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #e8e9ed; outline: none; }
        .smt-search input:focus { border-color: #6c5ce7; }
        .smt-btn { padding: 9px 16px; border: none; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; transition: opacity 120ms ease; }
        .smt-btn-primary { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff; }
        .smt-btn-primary:hover { opacity: 0.88; }
        .smt-btn-ghost { background: #13141b; color: #e8e9ed; border: 1px solid #252736; }
        .smt-btn-ghost:hover:not(:disabled) { background: #1c1e2a; }
        .smt-btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
        .smt-select { padding: 9px 13px; background: #13141b; border: 1px solid #252736; border-radius: 8px; color: #e8e9ed; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; outline: none; }
        .smt-table-wrap { background: #111218; border: 1px solid #252736; border-radius: 12px; overflow: hidden; }
        .smt-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .smt-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1c1e2a; background: #0d0e14; white-space: nowrap; }
        .smt-table td { padding: 14px 16px; color: #e8e9ed; border-bottom: 1px solid #1c1e2a; vertical-align: middle; }
        .smt-table tr:last-child td { border-bottom: none; }
        .smt-table tbody tr { cursor: pointer; transition: background 100ms ease; }
        .smt-table tbody tr:hover { background: #15171f; }
        .smt-empty { padding: 60px 20px; text-align: center; color: #8b8fa3; font-size: 14px; }
        .smt-error { background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.25); color: #ff6b6b; padding: 12px 16px; border-radius: 8px; font-size: 13.5px; margin-bottom: 14px; }
        .smt-meta { font-size: 12px; color: #8b8fa3; margin-top: 2px; }
        .smt-pagination { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #0d0e14; border-top: 1px solid #1c1e2a; font-size: 13px; color: #8b8fa3; }
        @media (max-width: 900px) { .smt-hide-mobile { display: none; } .smt-table { font-size: 12.5px; } .smt-table th, .smt-table td { padding: 10px 12px; } }
      `}</style>

      <div className="smt-header">
        <div>
          <h1 className="smt-title">Meetings</h1>
          <div className="smt-sub">{loading ? 'Loading…' : `${data.total} ${data.total === 1 ? 'meeting' : 'meetings'} total`}</div>
        </div>
      </div>

      <div className="smt-toolbar">
        <form className="smt-search" onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput.trim()); }}>
          <input placeholder="Search by name, email, or company…" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          <button type="submit" className="smt-btn smt-btn-primary">Search</button>
        </form>
        <select className="smt-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          {STATUS_FILTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {error && <div className="smt-error">{error}</div>}

      <div className="smt-table-wrap">
        <table className="smt-table">
          <thead>
            <tr>
              <th>Prospect</th>
              <th>Status</th>
              <th>When</th>
              <th className="smt-hide-mobile">Reminders</th>
              <th className="smt-hide-mobile">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="smt-empty">Loading…</td></tr>}
            {!loading && data.meetings.length === 0 && (
              <tr><td colSpan={5} className="smt-empty">No meetings yet. Send a meeting invite from a demo request to get started.</td></tr>
            )}
            {!loading && data.meetings.map(m => (
              <tr key={m.id} onClick={() => navigate(`/staff/demo-requests/${m.demo_request_id}`)}>
                <td>
                  <div style={{ fontWeight: 600 }}>{m.prospect_name}</div>
                  <div className="smt-meta">{m.prospect_email}{m.prospect_company ? ` · ${m.prospect_company}` : ''}</div>
                </td>
                <td><StatusBadge value={m.status} /></td>
                <td style={{ fontSize: 12.5, color: '#b0b3c5' }}>
                  {m.scheduled_start_at ? fmtSlot(m.scheduled_start_at) : <span style={{ color: '#6b6e82' }}>Not picked yet</span>}
                </td>
                <td className="smt-hide-mobile" style={{ color: '#b0b3c5' }}>{m.reminder_count || 0}</td>
                <td className="smt-hide-mobile" style={{ fontSize: 12.5, color: '#b0b3c5', whiteSpace: 'nowrap' }}>{fmtRelative(m.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && data.pages > 1 && (
          <div className="smt-pagination">
            <span>Page {data.page} of {data.pages} · {data.total} total</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="smt-btn smt-btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="smt-btn smt-btn-ghost" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
