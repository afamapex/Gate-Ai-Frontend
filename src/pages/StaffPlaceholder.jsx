import { useLocation } from 'react-router-dom';

const PHASE_MAP = {
  '/staff/companies':        { phase: '6.2', name: 'Customer Management' },
  '/staff/invites':          { phase: '6.3', name: 'Invite System' },
  '/staff/demo-requests':    { phase: '6.4', name: 'Demo Request Inbox' },
  '/staff/contact-requests': { phase: '6.4', name: 'Contact Inbox' },
  '/staff/billing':          { phase: '6.5', name: 'Billing Oversight' },
  '/staff/calls':            { phase: '6.5', name: 'System-Wide Call Analytics' },
  '/staff/system-health':    { phase: '6.6', name: 'System Health' },
  '/staff/staff-users':      { phase: '6.6', name: 'Staff User Management' },
  '/staff/audit-log':        { phase: '6.7', name: 'Audit Log Viewer' },
};

export default function StaffPlaceholder() {
  const { pathname } = useLocation();
  const matchKey = Object.keys(PHASE_MAP).find(k => pathname.startsWith(k));
  const info = matchKey ? PHASE_MAP[matchKey] : { phase: '6.x', name: 'This page' };

  return (
    <>
      <style>{`
        .sp-card {
          background: #111218;
          border: 1px solid #252736;
          border-radius: 16px;
          padding: 48px;
          text-align: center;
          max-width: 540px;
          margin: 60px auto;
        }

        .sp-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 18px;
          background: rgba(108,92,231,0.12);
          border: 1px solid rgba(108,92,231,0.3);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a29bfe;
        }

        .sp-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          background: rgba(108,92,231,0.12);
          border: 1px solid rgba(108,92,231,0.3);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          color: #a29bfe;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 14px;
        }

        .sp-title {
          font-size: 22px;
          font-weight: 700;
          color: #e8e9ed;
          letter-spacing: -0.3px;
          margin-bottom: 8px;
        }

        .sp-body {
          font-size: 14px;
          color: #8b8fa3;
          line-height: 1.6;
        }
      `}</style>

      <div className="sp-card">
        <div className="sp-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>

        <div className="sp-pill">Phase {info.phase}</div>

        <h1 className="sp-title">{info.name}</h1>
        <p className="sp-body">
          This section is part of the staff admin panel build, scheduled for Phase {info.phase}.
          The route is wired up — the page will land here as soon as we build it.
        </p>
      </div>
    </>
  );
}
