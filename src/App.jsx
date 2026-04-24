import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { StaffAuthProvider } from './context/StaffAuthContext.jsx';
import StaffProtectedRoute from './components/StaffProtectedRoute.jsx';
import StaffLayout from './components/StaffLayout.jsx';

import Landing      from './pages/Landing.jsx';
import Login        from './pages/Login.jsx';
import Auth         from './pages/Auth.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import Provisioning from './pages/Provisioning.jsx';
import BookDemo     from './pages/BookDemo.jsx';
import Pricing      from './pages/Pricing.jsx';
import Capabilities from './pages/Capabilities.jsx';
import Integrations from './pages/Integrations.jsx';
import FAQ          from './pages/FAQ.jsx';
import Contact      from './pages/Contact.jsx';
import Privacy      from './pages/Privacy.jsx';
import Terms        from './pages/Terms.jsx';
import HelpPage     from './pages/HelpPage.jsx';

import Activate        from './pages/Activate.jsx';
import ActivateSuccess from './pages/ActivateSuccess.jsx';
import Book            from './pages/Book.jsx';

import StaffLogin              from './pages/StaffLogin.jsx';
import StaffDashboard          from './pages/StaffDashboard.jsx';
import StaffCompanies          from './pages/StaffCompanies.jsx';
import StaffCompanyDetail      from './pages/StaffCompanyDetail.jsx';
import StaffInvites            from './pages/StaffInvites.jsx';
import StaffInviteNew          from './pages/StaffInviteNew.jsx';
import StaffInviteDetail       from './pages/StaffInviteDetail.jsx';
import StaffDemoRequests       from './pages/StaffDemoRequests.jsx';
import StaffDemoRequestDetail  from './pages/StaffDemoRequestDetail.jsx';
import StaffContactRequests    from './pages/StaffContactRequests.jsx';
import StaffContactRequestDetail from './pages/StaffContactRequestDetail.jsx';
import StaffBilling            from './pages/StaffBilling.jsx';
import StaffBillingEvents      from './pages/StaffBillingEvents.jsx';
import StaffCalls              from './pages/StaffCalls.jsx';
import StaffSystemHealth       from './pages/StaffSystemHealth.jsx';
import StaffStaffUsers         from './pages/StaffStaffUsers.jsx';
import StaffAuditLog           from './pages/StaffAuditLog.jsx';
import StaffMeetings           from './pages/StaffMeetings.jsx';
import ScrollToTop             from './components/ScrollToTop.jsx';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0b0f', fontFamily: "'DM Sans', sans-serif", color: '#8b8fa3', fontSize: 14 }}>Loading...</div>
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
          <ScrollToTop />
          <Routes>
            <Route path="/"             element={<Landing />} />
            <Route path="/auth"         element={<Auth />} />
            <Route path="/login"        element={<Login />} />
            <Route path="/book-demo"    element={<BookDemo />} />
            <Route path="/pricing"      element={<Pricing />} />
            <Route path="/capabilities" element={<Capabilities />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/faq"          element={<FAQ />} />
            <Route path="/contact"      element={<Contact />} />
            <Route path="/privacy"      element={<Privacy />} />
            <Route path="/terms"        element={<Terms />} />

            <Route path="/activate/:token"         element={<Activate />} />
            <Route path="/activate/:token/success" element={<ActivateSuccess />} />
            <Route path="/book/:token"             element={<Book />} />

            {/* Provisioning screen — shown after registration while
                Twilio + Vapi are being set up in the background.
                Protected so unauthenticated users can't land here. */}
            <Route path="/provisioning" element={<ProtectedRoute><Provisioning /></ProtectedRoute>} />

            <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/help"        element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />

            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/staff"       element={<Navigate to="/staff/dashboard" replace />} />

            <Route path="/staff/dashboard"               element={<StaffPage><StaffDashboard /></StaffPage>} />
            <Route path="/staff/companies"               element={<StaffPage><StaffCompanies /></StaffPage>} />
            <Route path="/staff/companies/:id"           element={<StaffPage><StaffCompanyDetail /></StaffPage>} />
            <Route path="/staff/invites"                 element={<StaffPage><StaffInvites /></StaffPage>} />
            <Route path="/staff/invites/new"             element={<StaffPage><StaffInviteNew /></StaffPage>} />
            <Route path="/staff/invites/:id"             element={<StaffPage><StaffInviteDetail /></StaffPage>} />
            <Route path="/staff/demo-requests"           element={<StaffPage><StaffDemoRequests /></StaffPage>} />
            <Route path="/staff/demo-requests/:id"       element={<StaffPage><StaffDemoRequestDetail /></StaffPage>} />
            <Route path="/staff/meetings"                element={<StaffPage><StaffMeetings /></StaffPage>} />
            <Route path="/staff/contact-requests"        element={<StaffPage><StaffContactRequests /></StaffPage>} />
            <Route path="/staff/contact-requests/:id"    element={<StaffPage><StaffContactRequestDetail /></StaffPage>} />
            <Route path="/staff/billing"                 element={<StaffPage><StaffBilling /></StaffPage>} />
            <Route path="/staff/billing/events"          element={<StaffPage><StaffBillingEvents /></StaffPage>} />
            <Route path="/staff/calls"                   element={<StaffPage><StaffCalls /></StaffPage>} />
            <Route path="/staff/system-health"           element={<StaffPage><StaffSystemHealth /></StaffPage>} />
            <Route path="/staff/staff-users"             element={<StaffPage requiredRoles={['superadmin']}><StaffStaffUsers /></StaffPage>} />
            <Route path="/staff/audit-log"               element={<StaffPage><StaffAuditLog /></StaffPage>} />

            <Route path="/app/*"  element={<Navigate to="/dashboard" replace />} />
            <Route path="/signup" element={<Navigate to="/auth" replace />} />
            <Route path="*"       element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </StaffAuthProvider>
    </AuthProvider>
  );
}
