import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { StaffAuthProvider } from './context/StaffAuthContext.jsx';
import StaffProtectedRoute from './components/StaffProtectedRoute.jsx';
import StaffLayout from './components/StaffLayout.jsx';

import Landing      from './pages/Landing.jsx';
import Login        from './pages/Login.jsx';
import Auth         from './pages/Auth.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import BookDemo     from './pages/BookDemo.jsx';
import Pricing      from './pages/Pricing.jsx';
import Capabilities from './pages/Capabilities.jsx';
import Integrations from './pages/Integrations.jsx';
import FAQ          from './pages/FAQ.jsx';
import Contact      from './pages/Contact.jsx';
import Privacy      from './pages/Privacy.jsx';
import Terms        from './pages/Terms.jsx';

import StaffLogin         from './pages/StaffLogin.jsx';
import StaffDashboard     from './pages/StaffDashboard.jsx';
import StaffPlaceholder   from './pages/StaffPlaceholder.jsx';
import StaffCompanies     from './pages/StaffCompanies.jsx';
import StaffCompanyDetail from './pages/StaffCompanyDetail.jsx';
import StaffInvites       from './pages/StaffInvites.jsx';
import StaffInviteNew     from './pages/StaffInviteNew.jsx';
import StaffInviteDetail  from './pages/StaffInviteDetail.jsx';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

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

  return token ? children : <Navigate to="/auth" replace />;
}

function StaffPage({ children, requiredRoles = null }) {
  return (
    <StaffProtectedRoute requiredRoles={requiredRoles}>
      <StaffLayout>{children}</StaffLayout>
    </StaffProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StaffAuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public — landing */}
            <Route path="/"             element={<Landing />} />

            {/* Customer auth */}
            <Route path="/auth"         element={<Auth />} />
            <Route path="/login"        element={<Login />} />

            {/* Public pages */}
            <Route path="/book-demo"    element={<BookDemo />} />
            <Route path="/pricing"      element={<Pricing />} />
            <Route path="/capabilities" element={<Capabilities />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/faq"          element={<FAQ />} />
            <Route path="/contact"      element={<Contact />} />
            <Route path="/privacy"      element={<Privacy />} />
            <Route path="/terms"        element={<Terms />} />

            {/* Customer dashboard */}
            <Route path="/dashboard/*" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* ── Staff console ─────────────────────────── */}
            <Route path="/staff/login"           element={<StaffLogin />} />
            <Route path="/staff"                 element={<Navigate to="/staff/dashboard" replace />} />

            <Route path="/staff/dashboard"            element={<StaffPage><StaffDashboard /></StaffPage>} />
            <Route path="/staff/companies"            element={<StaffPage><StaffCompanies /></StaffPage>} />
            <Route path="/staff/companies/:id"        element={<StaffPage><StaffCompanyDetail /></StaffPage>} />
            <Route path="/staff/invites"              element={<StaffPage><StaffInvites /></StaffPage>} />
            <Route path="/staff/invites/new"          element={<StaffPage><StaffInviteNew /></StaffPage>} />
            <Route path="/staff/invites/:id"          element={<StaffPage><StaffInviteDetail /></StaffPage>} />
            <Route path="/staff/demo-requests"        element={<StaffPage><StaffPlaceholder /></StaffPage>} />
            <Route path="/staff/demo-requests/:id"    element={<StaffPage><StaffPlaceholder /></StaffPage>} />
            <Route path="/staff/contact-requests"     element={<StaffPage><StaffPlaceholder /></StaffPage>} />
            <Route path="/staff/contact-requests/:id" element={<StaffPage><StaffPlaceholder /></StaffPage>} />
            <Route path="/staff/billing"              element={<StaffPage><StaffPlaceholder /></StaffPage>} />
            <Route path="/staff/billing/events"       element={<StaffPage><StaffPlaceholder /></StaffPage>} />
            <Route path="/staff/calls"                element={<StaffPage><StaffPlaceholder /></StaffPage>} />
            <Route path="/staff/system-health"        element={<StaffPage><StaffPlaceholder /></StaffPage>} />
            <Route path="/staff/staff-users"          element={<StaffPage requiredRoles={['superadmin']}><StaffPlaceholder /></StaffPage>} />
            <Route path="/staff/audit-log"            element={<StaffPage><StaffPlaceholder /></StaffPage>} />

            {/* Redirects */}
            <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />
            <Route path="/signup" element={<Navigate to="/auth" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </StaffAuthProvider>
    </AuthProvider>
  );
}
