import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../context/StaffAuthContext.jsx';
import { staffCompanies, staffInvites, staffDemoRequests, staffContactRequests, staffBilling, staffCalls } from '../services/staffApi.js';

export default function StaffDashboard() {
  const { user } = useStaffAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [companies, invites, demos, contacts, billing, calls] = await Promise.all([
          staffCompanies.list({ limit: 1 }).catch(() => ({ total: '—' })),
          staffInvites.list({ status: 'pending', limit: 1 }).catch(() => ({ total: '—' })),
          staffDemoRequests.list({ status: 'new', limit: 1 }).catch(() => ({ total: '—' })),
          staffContactRequests.list({ status: 'new', limit: 1 }).catch(() => ({ total: '—' })),
          staffBilling.summary().catch(() => ({ mrr: 0, active: 0, trialing: 0, past_due: 0 })),
          staffCalls.volume().catch(() => ({ totals: { today: 0, last_7_days: 0, last_30_days: 0, all_time: 0 } })),
        ]);
        setData({ companies, invites, demos, contacts, billing, calls });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const stats = data ? [
    { label: 'Companies',        value: data.companies.total,  color: '#a29bfe', link: '/staff/companies' },
    { label: 'Pending invites',  value: data.invites.total,    color: '#5bc0de', link: '/staff/invites' },
    { label: 'New demo requests',value: data.demos.total,      color: '#ffb347', link: '/staff/demo-requests' },
    { label: 'New messages',     value: data.contacts.total,   color: '#f06595', link: '/staff/contact-requests' },
    { label: 'MRR',              value: `$${(data.billing.mrr || 0).toLocaleString()}`, color: '#51cf66', link: '/staff/billing' },
    { label: 'Calls today',     value: data.calls.totals?.today ?? 0, color: '#a29bfe', link: '/staff/calls' },
    { label: 'Calls (30d)',     value: data.calls.totals?.last_30_days ?? 0, color: '#5bc0de', link: '/staff/calls' },
    { label: 'Active subs',     value: data.billing.active ?? 0,  color: '#51cf66', link: '/staff/billing' },
  ] : [];

  const quickLinks = [
    { label: 'Generate invite',     icon: 'mail',     link: '/staff/invites/new' },
    { label: 'View companies',      icon: 'building', link: '/staff/companies' },
    { label: 'Demo requests',       icon: 'calendar', link: '/staff/demo-requests' },
    { label: 'System health',       icon: 'activity', link: '/staff/system-health' },
    { label: 'Billing overview',    icon: 'card',     link: '/staff/billing' },
    { label: 'Audit log',           icon: 'shield',   link: '/staff/audit-log' },
  ];

  return (
    <>
      <style>{`
        .sd-header { margin-bottom: 24px; }
        .sd-greeting { font-size: 22px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px; margin-bottom: 6px; }
        .sd-sub { font-size: 14px; color: #8b8fa3; }
        .sd-pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; background: rgba(108,92,231,0.12); border: 1px solid rgba(108,92,231,0.3); border-radius: 999px; font-size: 11px; font-weight: 700; color: #a29bfe; text-transform: uppercase; letter-spacing: 0.5px; }
        .sd-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 12px; margin-bottom: 28px; }
        .sd-card { background: #111218; border: 1px solid #252736; border-radius: 12px; padding: 18px; cursor: pointer; transition: border-color 140ms ease, background 140ms ease; }
        .sd-card:hover { border-color: #3a3d52; background: #15171f; }
        .sd-card-label { font-size: 11px; font-weight: 600; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
        .sd-card-value { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; font-variant-numeric: tabular-nums; }
        .sd-section-title { font-size: 15px; font-weight: 700; color: #e8e9ed; margin-bottom: 12px; }
        .sd-quick-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 28px; }
        .sd-quick { display: flex; align-items: center; gap: 12px; background: #111218; border: 1px solid #252736; border-radius: 10px; padding: 14px 16px; cursor: pointer; transition: border-color 140ms ease, background 140ms ease; text-decoration: none; }
        .sd-quick:hover { border-color: #6c5ce7; background: #15171f; }
        .sd-quick-icon { width: 34px; height: 34px; border-radius: 8px; background: rgba(108,92,231,0.12); border: 1px solid rgba(108,92,231,0.3); display: flex; align-items: center; justify-content: center; color: #a29bfe; flex-shrink: 0; }
        .sd-quick-label { font-size: 13.5px; font-weight: 600; color: #e8e9ed; }
        .sd-info { background: #111218; border: 1px solid #252736; border-radius: 12px; padding: 20px; }
        .sd-info-title { font-size: 14px; font-weight: 700; color: #e8e9ed; margin-bottom: 8px; }
        .sd-info-body { font-size: 13.5px; color: #8b8fa3; line-height: 1.6; }
        .sd-loading { padding: 60px 20px; text-align: center; color: #8b8fa3; font-size: 14px; }
        @media (max-width: 900px) { .sd-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      <div className="sd-header">
        <h1 className="sd-greeting">Welcome, {user?.first_name || 'team'} <span className="sd-pill">{user?.role}</span></h1>
        <p className="sd-sub">Gate AI staff console — here's what's happening.</p>
      </div>

      {loading && <div className="sd-loading">Loading dashboard…</div>}

      {!loading && data && (
        <>
          <div className="sd-grid">
            {stats.map((s, i) => (
              <div key={i} className="sd-card" onClick={() => navigate(s.link)}>
                <div className="sd-card-label">{s.label}</div>
                <div className="sd-card-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="sd-section-title">Quick actions</div>
          <div className="sd-quick-grid">
            {quickLinks.map((q, i) => (
              <div key={i} className="sd-quick" onClick={() => navigate(q.link)}>
                <div className="sd-quick-icon"><QuickIcon name={q.icon} /></div>
                <div className="sd-quick-label">{q.label}</div>
              </div>
            ))}
          </div>

          {data.billing.past_due > 0 && (
            <div className="sd-info" style={{ borderColor: 'rgba(255,107,107,0.3)', marginBottom: 16 }}>
              <div className="sd-info-title" style={{ color: '#ff6b6b' }}>
                {data.billing.past_due} past-due {data.billing.past_due === 1 ? 'account' : 'accounts'}
              </div>
              <div className="sd-info-body">
                <span style={{ color: '#a29bfe', cursor: 'pointer' }} onClick={() => navigate('/staff/billing')}>View in billing →</span>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function QuickIcon({ name }) {
  const p = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'mail':     return <svg {...p}><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><polyline points="22,6 12,13 2,6"/><path d="M19 16v6M16 19h6"/></svg>;
    case 'building': return <svg {...p}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>;
    case 'calendar': return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case 'activity': return <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    case 'card':     return <svg {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
    case 'shield':   return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    default: return null;
  }
}
