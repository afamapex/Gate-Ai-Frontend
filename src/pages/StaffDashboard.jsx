import { useStaffAuth } from '../context/StaffAuthContext.jsx';

export default function StaffDashboard() {
  const { user } = useStaffAuth();

  return (
    <>
      <style>{`
        .sd-header {
          margin-bottom: 28px;
        }

        .sd-greeting {
          font-size: 22px;
          font-weight: 700;
          color: #e8e9ed;
          letter-spacing: -0.3px;
          margin-bottom: 6px;
        }

        .sd-sub {
          font-size: 14px;
          color: #8b8fa3;
        }

        .sd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .sd-card {
          background: #111218;
          border: 1px solid #252736;
          border-radius: 12px;
          padding: 20px;
        }

        .sd-card-label {
          font-size: 11px;
          font-weight: 600;
          color: #8b8fa3;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 10px;
        }

        .sd-card-value {
          font-size: 24px;
          font-weight: 700;
          color: #e8e9ed;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .sd-card-meta {
          font-size: 12.5px;
          color: #8b8fa3;
        }

        .sd-info {
          background: #111218;
          border: 1px solid #252736;
          border-radius: 12px;
          padding: 24px;
        }

        .sd-info-title {
          font-size: 15px;
          font-weight: 700;
          color: #e8e9ed;
          margin-bottom: 10px;
        }

        .sd-info-body {
          font-size: 13.5px;
          color: #8b8fa3;
          line-height: 1.6;
        }

        .sd-info-body strong {
          color: #e8e9ed;
          font-weight: 600;
        }

        .sd-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 9px;
          background: rgba(108,92,231,0.12);
          border: 1px solid rgba(108,92,231,0.3);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          color: #a29bfe;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>

      <div className="sd-header">
        <h1 className="sd-greeting">
          Welcome, {user?.first_name || 'team'} <span className="sd-pill">{user?.role}</span>
        </h1>
        <p className="sd-sub">You're signed in to the Gate AI staff console.</p>
      </div>

      <div className="sd-grid">
        <div className="sd-card">
          <div className="sd-card-label">Companies</div>
          <div className="sd-card-value">—</div>
          <div className="sd-card-meta">Coming in Phase 6.2</div>
        </div>

        <div className="sd-card">
          <div className="sd-card-label">Pending Invites</div>
          <div className="sd-card-value">—</div>
          <div className="sd-card-meta">Coming in Phase 6.3</div>
        </div>

        <div className="sd-card">
          <div className="sd-card-label">New Demo Requests</div>
          <div className="sd-card-value">—</div>
          <div className="sd-card-meta">Coming in Phase 6.4</div>
        </div>

        <div className="sd-card">
          <div className="sd-card-label">MRR</div>
          <div className="sd-card-value">—</div>
          <div className="sd-card-meta">Coming in Phase 6.5</div>
        </div>
      </div>

      <div className="sd-info">
        <div className="sd-info-title">Phase 6.1 — Foundation complete</div>
        <div className="sd-info-body">
          Staff authentication, the protected route tree, the audit log infrastructure,
          and the system error feed are all wired up. <strong>Next up:</strong> Phase 6.2 —
          full company management, including search, filter, the company detail view, and
          re-provisioning. Use the sidebar to explore — pages that aren't built yet will
          land on a placeholder.
        </div>
      </div>
    </>
  );
}
