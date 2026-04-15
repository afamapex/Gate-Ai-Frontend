import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { staffBilling } from '../services/staffApi.js';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function StaffBillingEvents() {
  const [data, setData] = useState({ events: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await staffBilling.events({ page, limit: 50 })); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <style>{`
        .sbe-back { margin-bottom: 14px; }
        .sbe-back-link { display: inline-flex; align-items: center; gap: 6px; color: #8b8fa3; font-size: 13px; text-decoration: none; }
        .sbe-back-link:hover { color: #e8e9ed; }
        .sbe-title { font-size: 22px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px; margin-bottom: 6px; }
        .sbe-sub { font-size: 13.5px; color: #8b8fa3; margin-bottom: 18px; }
        .sbe-table-wrap { background: #111218; border: 1px solid #252736; border-radius: 12px; overflow: hidden; }
        .sbe-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .sbe-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1c1e2a; background: #0d0e14; }
        .sbe-table td { padding: 12px 16px; color: #e8e9ed; border-bottom: 1px solid #1c1e2a; vertical-align: middle; }
        .sbe-table tr:last-child td { border-bottom: none; }
        .sbe-empty { padding: 60px 20px; text-align: center; color: #8b8fa3; font-size: 14px; }
        .sbe-mono { font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; color: #b0b3c5; }
        .sbe-pagination { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #0d0e14; border-top: 1px solid #1c1e2a; font-size: 13px; color: #8b8fa3; }
        .sbe-btn { padding: 6px 12px; background: #13141b; border: 1px solid #252736; border-radius: 6px; color: #e8e9ed; font-family: 'DM Sans', sans-serif; font-size: 12.5px; cursor: pointer; }
        .sbe-btn:hover:not(:disabled) { background: #1c1e2a; }
        .sbe-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        @media (max-width: 900px) { .sbe-hide-mobile { display: none; } .sbe-table { font-size: 12px; } }
      `}</style>

      <div className="sbe-back">
        <Link to="/staff/billing" className="sbe-back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Billing overview
        </Link>
      </div>

      <h1 className="sbe-title">Billing Events</h1>
      <div className="sbe-sub">{loading ? 'Loading…' : `${data.total} Stripe webhook events`}</div>

      <div className="sbe-table-wrap">
        <table className="sbe-table">
          <thead>
            <tr>
              <th>Event</th>
              <th className="sbe-hide-mobile">Company</th>
              <th>Amount</th>
              <th className="sbe-hide-mobile">Stripe ID</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="sbe-empty">Loading…</td></tr>}
            {!loading && data.events.length === 0 && <tr><td colSpan={5} className="sbe-empty">No billing events yet.</td></tr>}
            {!loading && data.events.map(e => (
              <tr key={e.id}>
                <td style={{ fontWeight: 600 }}>{e.event_type}</td>
                <td className="sbe-hide-mobile">
                  {e.company_name ? (
                    <Link to={`/staff/companies/${e.company_id}`} style={{ color: '#a29bfe', textDecoration: 'none' }}>{e.company_name}</Link>
                  ) : '—'}
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {e.amount_cents != null ? `$${(e.amount_cents / 100).toFixed(2)}` : '—'}
                </td>
                <td className="sbe-hide-mobile sbe-mono">{e.stripe_event_id || '—'}</td>
                <td style={{ fontSize: 12.5, color: '#b0b3c5', whiteSpace: 'nowrap' }}>{fmtDate(e.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && data.pages > 1 && (
          <div className="sbe-pagination">
            <span>Page {data.page} of {data.pages}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="sbe-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="sbe-btn" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
