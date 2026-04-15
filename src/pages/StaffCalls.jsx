import { useState, useEffect } from 'react';
import { staffCalls } from '../services/staffApi.js';

export default function StaffCalls() {
  const [volume, setVolume]       = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [topBlocked, setTop]      = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      staffCalls.volume(),
      staffCalls.breakdown(),
      staffCalls.topBlocked(),
    ])
      .then(([v, b, t]) => { setVolume(v); setBreakdown(b); setTop(t); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const statusColors = {
    blocked:   '#ff6b6b',
    forwarded: '#51cf66',
    flagged:   '#ffb347',
    screened:  '#5bc0de',
  };

  return (
    <>
      <style>{`
        .sca-title { font-size: 22px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px; margin-bottom: 22px; }
        .sca-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
        .sca-stat { background: #111218; border: 1px solid #252736; border-radius: 12px; padding: 18px; }
        .sca-stat-label { font-size: 11px; font-weight: 600; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
        .sca-stat-value { font-size: 26px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.5px; font-variant-numeric: tabular-nums; }
        .sca-section { font-size: 15px; font-weight: 700; color: #e8e9ed; margin-bottom: 12px; margin-top: 28px; }
        .sca-card { background: #111218; border: 1px solid #252736; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
        .sca-bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .sca-bar-label { width: 90px; font-size: 13px; color: #8b8fa3; text-transform: capitalize; flex-shrink: 0; }
        .sca-bar-track { flex: 1; height: 22px; background: #13141b; border-radius: 6px; overflow: hidden; position: relative; }
        .sca-bar-fill { height: 100%; border-radius: 6px; transition: width 400ms ease; }
        .sca-bar-count { font-size: 13px; color: #e8e9ed; font-weight: 600; width: 50px; text-align: right; font-variant-numeric: tabular-nums; flex-shrink: 0; }
        .sca-table-wrap { background: #111218; border: 1px solid #252736; border-radius: 12px; overflow: hidden; }
        .sca-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .sca-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1c1e2a; background: #0d0e14; }
        .sca-table td { padding: 14px 16px; color: #e8e9ed; border-bottom: 1px solid #1c1e2a; vertical-align: middle; }
        .sca-table tr:last-child td { border-bottom: none; }
        .sca-empty { padding: 40px 16px; text-align: center; color: #8b8fa3; }
        .sca-state { padding: 60px 20px; text-align: center; color: #8b8fa3; font-size: 14px; }
        @media (max-width: 900px) { .sca-hide-mobile { display: none; } }
      `}</style>

      <h1 className="sca-title">Call Analytics</h1>

      {loading && <div className="sca-state">Loading analytics…</div>}

      {!loading && volume && (
        <div className="sca-grid">
          <div className="sca-stat">
            <div className="sca-stat-label">Today</div>
            <div className="sca-stat-value">{volume.totals.today}</div>
          </div>
          <div className="sca-stat">
            <div className="sca-stat-label">Last 7 days</div>
            <div className="sca-stat-value">{volume.totals.last_7_days}</div>
          </div>
          <div className="sca-stat">
            <div className="sca-stat-label">Last 30 days</div>
            <div className="sca-stat-value">{volume.totals.last_30_days}</div>
          </div>
          <div className="sca-stat">
            <div className="sca-stat-label">All time</div>
            <div className="sca-stat-value">{volume.totals.all_time}</div>
          </div>
        </div>
      )}

      {!loading && breakdown && (
        <>
          <div className="sca-section">Breakdown by status</div>
          <div className="sca-card">
            {breakdown.breakdown.length === 0 && <div className="sca-empty">No calls yet.</div>}
            {(() => {
              const max = Math.max(...breakdown.breakdown.map(r => r.count), 1);
              return breakdown.breakdown.map(r => (
                <div key={r.status} className="sca-bar-row">
                  <div className="sca-bar-label">{r.status}</div>
                  <div className="sca-bar-track">
                    <div className="sca-bar-fill" style={{ width: `${(r.count / max) * 100}%`, background: statusColors[r.status] || '#8b8fa3' }} />
                  </div>
                  <div className="sca-bar-count">{r.count}</div>
                </div>
              ));
            })()}
          </div>
        </>
      )}

      {!loading && topBlocked && (
        <>
          <div className="sca-section">Top blocked callers</div>
          <div className="sca-table-wrap">
            <table className="sca-table">
              <thead>
                <tr>
                  <th>Caller</th>
                  <th className="sca-hide-mobile">Phone</th>
                  <th>Times blocked</th>
                  <th className="sca-hide-mobile">Last blocked</th>
                </tr>
              </thead>
              <tbody>
                {topBlocked.top_blocked.length === 0 && <tr><td colSpan={4} className="sca-empty">No blocked calls yet.</td></tr>}
                {topBlocked.top_blocked.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{r.caller}</td>
                    <td className="sca-hide-mobile" style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12.5, color: '#b0b3c5' }}>{r.caller_phone}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', color: '#ff6b6b', fontWeight: 700 }}>{r.times_blocked}</td>
                    <td className="sca-hide-mobile" style={{ fontSize: 12.5, color: '#b0b3c5' }}>
                      {r.last_blocked ? new Date(r.last_blocked).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
