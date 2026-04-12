import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public — landing */}
          <Route path="/"             element={<Landing />} />

          {/* Auth */}
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

          {/* Protected — dashboard */}
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Redirects */}
          <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={<Navigate to="/auth" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
