import { useAuth } from '../context/AuthContext.jsx';

export default function ImpersonationBanner() {
  const { impersonating, user, company } = useAuth();

  if (!impersonating) return null;

  function exit() {
    localStorage.removeItem('gateai_token');
    localStorage.removeItem('gateai_user');
    localStorage.removeItem('gateai_company');
    // Close the tab if it was opened by the staff console; otherwise go to /staff/dashboard.
    if (window.opener) {
      window.close();
    } else {
      window.location.href = '/staff/dashboard';
    }
  }

  return (
    <>
      <style>{`
        .imp-banner {
          position: sticky;
          top: 0;
          z-index: 200;
          background: linear-gradient(135deg, #ff6b6b, #f06595);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(0,0,0,0.25);
        }
        .imp-banner-text {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }
        .imp-banner-dot {
          width: 8px; height: 8px;
          background: #fff;
          border-radius: 50%;
          animation: imp-pulse 1.8s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes imp-pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
        .imp-banner-body {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .imp-exit-btn {
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.25);
          color: #fff;
          padding: 5px 12px;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 120ms ease;
        }
        .imp-exit-btn:hover { background: rgba(0,0,0,0.4); }
      `}</style>

      <div className="imp-banner">
        <div className="imp-banner-text">
          <span className="imp-banner-dot"/>
          <span className="imp-banner-body">
            Impersonating <strong>{user?.email}</strong>{company?.name ? ` at ${company.name}` : ''} — every action is logged
          </span>
        </div>
        <button className="imp-exit-btn" onClick={exit}>Exit session</button>
      </div>
    </>
  );
}
