import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { staffBilling } from '../services/staffApi.js';

function StatusBadge({ value }) {
  const palettes = {
    trialing: ['rgba(91,192,222,0.12)', 'rgba(91,192,222,0.35)', '#5bc0de'],
    active:   ['rgba(81,207,102,0.12)', 'rgba(81,207,102,0.35)', '#51cf66'],
    past_due: ['rgba(255,165,0,0.12)',  'rgba(255,165,0,0.35)',  '#ffb347'],
    canceled: ['rgba(139,143,163,0.12)','rgba(139,143,163,0.35)','#8b8fa3'],
    unpaid:   ['rgba(255,107,107,0.12)','rgba(255,107,107,0.35)','#ff6b6b'],
  };
  const [bg, border, fg] = palettes[value] || palettes.active;
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: bg, border: `1px solid ${border}`, color: fg, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {(value || '—').replace('_', ' ')}
    </span>
  );
}

export default function StaffBilling() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [subs, setSubs] = useState({ subscriptions: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, sub] = await Promise.all([
        staffBilling.summary(),
        staffBilling.subscriptions({ page, limit: 20, ...(statusFilter ? { status: statusFilter } : {}) }),
      ]);
      setSummary(s);
      setSubs(sub);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <style>{`
        .sb-title { font-size: 22px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px; margin-bottom: 22px; }
        .sb-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
        .sb-stat { background: #111218; border: 1px solid #252736; border-radius: 12px; padding: 18px; }
        .sb-stat-label { font-size: 11px; font-weight: 600; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
        .sb-stat-value { font-size: 26px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.5px; font-variant-numeric: tabular-nums; }
        .sb-stat-value.green { color: #51cf66; }
        .sb-stat-value.orange { color: #ffb347; }
        .sb-stat-value.red { color: #ff6b6b; }
        .sb-toolbar { display: flex; gap: 10px; margin-bottom: 14px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
        .sb-select { padding: 9px 13px; background: #13141b; border: 1px solid #252736; border-radius: 8px; color: #e8e9ed; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; outline: none; }
        .sb-table-wrap { background: #111218; border: 1px solid #252736; border-radius: 12px; overflow: hidden; }
        .sb-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .sb-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1c1e2a; background: #0d0e14; }
        .sb-table td { padding: 14px 16px; color: #e8e9ed; border-bottom: 1px solid #1c1e2a; vertical-align: middle; }
        .sb-table tr:last-child td { border-bottom: none; }
        .sb-table tbody tr { cursor: pointer; transition: background 100ms ease; }
        .sb-table tbody tr:hover { background: #15171f; }
        .sb-empty { padding: 60px 20px; text-align: center; color: #8b8fa3; font-size: 14px; }
        .sb-pagination { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #0d0e14; border-top: 1px solid #1c1e2a; font-size: 13px; color: #8b8fa3; }
        .sb-btn { padding: 8px 14px; border: none; border-radius: 7px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 600; background: #13141b; color: #e8e9ed; border: 1px solid #252736; }
        .sb-btn:hover:not(:disabled) { background: #1c1e2a; }
        .sb-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        @media (max-width: 900px) { .sb-hide-mobile { display: none; } }
      `}</style>

      <h1 className="sb-title">Billing</h1>

      {summary && (
        <div className="sb-grid">
          <div className="sb-stat">
            <div className="sb-stat-label">MRR</div>
            <div className="sb-stat-value green">${summary.mrr.toLocaleString()}</div>
          </div>
          <div className="sb-stat">
            <div className="sb-stat-label">Active</div>
            <div className="sb-stat-value">{summary.active}</div>
          </div>
          <div className="sb-stat">
            <div className="sb-stat-label">Trialing</div>
            <div className="sb-stat-value">{summary.trialing}</div>
          </div>
          <div className="sb-stat">
            <div className="sb-stat-label">Past due</div>
            <div className="sb-stat-value red">{summary.past_due}</div>
          </div>
          <div className="sb-stat">
            <div className="sb-stat-label">Canceled</div>
            <div className="sb-stat-value">{summary.canceled}</div>
          </div>
        </div>
      )}

      <div className="sb-toolbar">
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e9ed' }}>Subscriptions</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="sb-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past due</option>
            <option value="canceled">Canceled</option>
          </select>
          <Link to="/staff/billing/events" style={{ fontSize: 13, color: '#a29bfe', textDecoration: 'none' }}>View webhook log →</Link>
        </div>
      </div>

      <div className="sb-table-wrap">
        <table className="sb-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Plan</th>
              <th>Status</th>
              <th className="sb-hide-mobile">MRR</th>
              <th className="sb-hide-mobile">Trial ends</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="sb-empty">Loading…</td></tr>}
            {!loading && subs.subscriptions.length === 0 && <tr><td colSpan={5} className="sb-empty">No subscriptions yet.</td></tr>}
            {!loading && subs.subscriptions.map(s => (
              <tr key={s.id} onClick={() => navigate(`/staff/companies/${s.id}`)}>
                <td>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: '#8b8fa3', marginTop: 2 }}>{s.owner_email || '—'}</div>
                </td>
                <td style={{ textTransform: 'capitalize' }}>{s.plan}</td>
                <td><StatusBadge value={s.subscription_status} /></td>
                <td className="sb-hide-mobile" style={{ fontVariantNumeric: 'tabular-nums', color: s.mrr_contribution > 0 ? '#51cf66' : '#8b8fa3' }}>
                  {s.mrr_contribution > 0 ? `$${s.mrr_contribution}` : '—'}
                </td>
                <td className="sb-hide-mobile" style={{ fontSize: 12.5, color: '#b0b3c5' }}>
                  {s.trial_ends_at ? new Date(s.trial_ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && subs.pages > 1 && (
          <div className="sb-pagination">
            <span>Page {subs.page} of {subs.pages}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="sb-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="sb-btn" disabled={page >= subs.pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
