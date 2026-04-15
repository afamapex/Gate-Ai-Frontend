import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useStaffAuth } from '../context/StaffAuthContext.jsx';

const NAV_ITEMS = [
  { to: '/staff/dashboard',         label: 'Dashboard',        icon: 'grid' },
  { to: '/staff/companies',         label: 'Companies',        icon: 'building' },
  { to: '/staff/invites',           label: 'Invites',          icon: 'mail-plus' },
  { to: '/staff/demo-requests',     label: 'Demo Requests',    icon: 'calendar' },
  { to: '/staff/meetings',          label: 'Meetings',         icon: 'video' },
  { to: '/staff/contact-requests',  label: 'Contact Inbox',    icon: 'inbox' },
  { to: '/staff/billing',           label: 'Billing',          icon: 'card' },
  { to: '/staff/calls',             label: 'Call Analytics',   icon: 'phone' },
  { to: '/staff/system-health',     label: 'System Health',    icon: 'activity' },
  { to: '/staff/staff-users',       label: 'Staff Users',      icon: 'users', superadminOnly: true },
  { to: '/staff/audit-log',         label: 'Audit Log',        icon: 'shield' },
];

function Icon({ name }) {
  const props = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'grid':      return (<svg {...props}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>);
    case 'building':  return (<svg {...props}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>);
    case 'mail-plus': return (<svg {...props}><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><polyline points="22,6 12,13 2,6"/><path d="M19 16v6M16 19h6"/></svg>);
    case 'calendar': return (<svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
    case 'video':    return (<svg {...props}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>);
    case 'inbox':    return (<svg {...props}><polyline points="22,12 16,12 14,15 10,15 8,12 2,12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>);
    case 'card':     return (<svg {...props}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>);
    case 'phone':    return (<svg {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
    case 'activity': return (<svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>);
    case 'users':    return (<svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
    case 'shield':   return (<svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
    case 'logout':   return (<svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
    case 'menu':     return (<svg {...props}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
    case 'close':    return (<svg {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
    default:         return null;
  }
}

export default function StaffLayout({ children }) {
  const { user, logout } = useStaffAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter(item => {
    if (item.superadminOnly && user?.role !== 'superadmin') return false;
    return true;
  });

  const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : '';
  const initials = user ? ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase() || (user.email?.[0] || 'S').toUpperCase() : 'S';

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0b0f; }

        .staff-shell { min-height: 100vh; display: flex; background: #0a0b0f; font-family: 'DM Sans', -apple-system, sans-serif; color: #e8e9ed; -webkit-font-smoothing: antialiased; }
        .staff-sidebar { width: 240px; background: #0d0e14; border-right: 1px solid #1c1e2a; display: flex; flex-direction: column; flex-shrink: 0; position: sticky; top: 0; height: 100vh; }
        .staff-brand { display: flex; align-items: center; gap: 10px; padding: 20px 20px 16px; border-bottom: 1px solid #1c1e2a; }
        .staff-brand-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #6c5ce7, #a29bfe); border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(108,92,231,0.35); flex-shrink: 0; }
        .staff-brand-text { display: flex; flex-direction: column; line-height: 1.1; }
        .staff-brand-name { font-size: 15px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.2px; }
        .staff-brand-sub { font-size: 10px; font-weight: 600; color: #6c5ce7; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 2px; }
        .staff-nav { flex: 1; padding: 12px 10px; overflow-y: auto; }
        .staff-nav-link { display: flex; align-items: center; gap: 11px; padding: 9px 12px; margin-bottom: 2px; border-radius: 8px; text-decoration: none; color: #8b8fa3; font-size: 13.5px; font-weight: 500; transition: background 120ms ease, color 120ms ease; }
        .staff-nav-link:hover { background: #15171f; color: #e8e9ed; }
        .staff-nav-link.active { background: rgba(108,92,231,0.12); color: #e8e9ed; }
        .staff-nav-link.active svg { color: #a29bfe; }
        .staff-user { padding: 14px; border-top: 1px solid #1c1e2a; display: flex; align-items: center; gap: 10px; }
        .staff-user-avatar { width: 34px; height: 34px; background: linear-gradient(135deg, #6c5ce7, #a29bfe); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #fff; flex-shrink: 0; }
        .staff-user-info { flex: 1; min-width: 0; }
        .staff-user-name { font-size: 13px; font-weight: 600; color: #e8e9ed; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .staff-user-role { font-size: 10.5px; color: #6c5ce7; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-top: 1px; }
        .staff-logout-btn { background: transparent; border: none; color: #8b8fa3; cursor: pointer; padding: 6px; border-radius: 6px; transition: background 120ms ease, color 120ms ease; }
        .staff-logout-btn:hover { background: #15171f; color: #ff6b6b; }
        .staff-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .staff-mobile-bar { display: none; align-items: center; justify-content: space-between; padding: 14px 18px; background: #0d0e14; border-bottom: 1px solid #1c1e2a; position: sticky; top: 0; z-index: 10; }
        .staff-mobile-brand { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #e8e9ed; }
        .staff-mobile-toggle { background: transparent; border: none; color: #e8e9ed; cursor: pointer; padding: 6px; }
        .staff-content { flex: 1; padding: 28px 32px; }
        @media (max-width: 900px) {
          .staff-sidebar { position: fixed; top: 0; left: 0; transform: translateX(-100%); transition: transform 200ms ease; z-index: 100; box-shadow: 4px 0 20px rgba(0,0,0,0.5); }
          .staff-sidebar.open { transform: translateX(0); }
          .staff-mobile-bar { display: flex; }
          .staff-content { padding: 20px 18px; }
          .staff-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; }
        }
      `}</style>

      <div className="staff-shell">
        <aside className={`staff-sidebar ${mobileOpen ? 'open' : ''}`}>
          <div className="staff-brand">
            <div className="staff-brand-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="staff-brand-text">
              <span className="staff-brand-name">Gate AI</span>
              <span className="staff-brand-sub">Staff Console</span>
            </div>
          </div>

          <nav className="staff-nav">
            {visibleNav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `staff-nav-link ${isActive || location.pathname.startsWith(item.to) ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="staff-user">
            <div className="staff-user-avatar">{initials}</div>
            <div className="staff-user-info">
              <div className="staff-user-name">{fullName}</div>
              <div className="staff-user-role">{user?.role}</div>
            </div>
            <button className="staff-logout-btn" onClick={logout} title="Log out">
              <Icon name="logout" />
            </button>
          </div>
        </aside>

        {mobileOpen && <div className="staff-backdrop" onClick={() => setMobileOpen(false)} />}

        <main className="staff-main">
          <div className="staff-mobile-bar">
            <div className="staff-mobile-brand">
              <div className="staff-brand-icon" style={{ width: 26, height: 26, borderRadius: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              Gate AI · Staff
            </div>
            <button className="staff-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
              <Icon name={mobileOpen ? 'close' : 'menu'} />
            </button>
          </div>

          <div className="staff-content">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
