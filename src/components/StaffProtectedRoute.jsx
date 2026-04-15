import { Navigate } from 'react-router-dom';
import { useStaffAuth } from '../context/StaffAuthContext.jsx';

export default function StaffProtectedRoute({ children, requiredRoles = null }) {
  const { token, user, loading } = useStaffAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#0a0b0f',
        fontFamily: "'DM Sans', sans-serif", color: '#8b8fa3', fontSize: 14,
      }}>
        Loading...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/staff/login" replace />;
  }

  // Optional role-gating — if requiredRoles is provided and user.role isn't in it, send to dashboard.
  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return children;
}
