import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../context/StaffAuthContext.jsx';
import { staffAuth } from '../services/staffApi.js';

export default function StaffLogin() {
  const { login } = useStaffAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await staffAuth.login(email, password);
      login(data);
      navigate('/staff/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0b0f; }

        .slogin-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0b0f;
          font-family: 'DM Sans', -apple-system, sans-serif;
          padding: 24px;
          -webkit-font-smoothing: antialiased;
          position: relative;
          overflow: hidden;
        }

        .slogin-wrap::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(108,92,231,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .slogin-card {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: #111218;
          border: 1px solid #252736;
          border-radius: 16px;
          padding: 40px;
        }

        .slogin-staff-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(108,92,231,0.12);
          border: 1px solid rgba(108,92,231,0.3);
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          color: #a29bfe;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 18px;
        }

        .slogin-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        .slogin-logo-icon {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #6c5ce7, #a29bfe);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(108,92,231,0.35);
          flex-shrink: 0;
        }

        .slogin-logo-text {
          font-size: 20px;
          font-weight: 700;
          color: #e8e9ed;
          letter-spacing: -0.3px;
        }

        .slogin-heading {
          font-size: 22px;
          font-weight: 700;
          color: #e8e9ed;
          letter-spacing: -0.3px;
          margin-bottom: 6px;
        }

        .slogin-sub {
          font-size: 14px;
          color: #8b8fa3;
          margin-bottom: 28px;
        }

        .field {
          margin-bottom: 16px;
        }

        .field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #8b8fa3;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 7px;
        }

        .field input {
          width: 100%;
          padding: 11px 14px;
          background: #13141b;
          border: 1px solid #252736;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #e8e9ed;
          outline: none;
          transition: border-color 150ms ease;
        }

        .field input:focus { border-color: #6c5ce7; }
        .field input::placeholder { color: #3a3d52; }

        .error-box {
          background: rgba(255,107,107,0.1);
          border: 1px solid rgba(255,107,107,0.25);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #ff6b6b;
          margin-bottom: 16px;
        }

        .btn-login {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #6c5ce7, #a29bfe);
          border: none;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: opacity 150ms ease, transform 100ms ease;
          margin-top: 4px;
        }

        .btn-login:hover:not(:disabled) { opacity: 0.88; }
        .btn-login:active:not(:disabled) { transform: scale(0.98); }
        .btn-login:disabled { opacity: 0.5; cursor: not-allowed; }

        .slogin-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 12px;
          color: #3a3d52;
        }

        .slogin-footer a {
          color: #6c5ce7;
          text-decoration: none;
        }

        .slogin-footer a:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="slogin-wrap">
        <div className="slogin-card">
          <div className="slogin-staff-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Internal Staff Access
          </div>

          <div className="slogin-logo">
            <div className="slogin-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="slogin-logo-text">Gate AI · Staff</span>
          </div>

          <h1 className="slogin-heading">Sign in</h1>
          <p className="slogin-sub">Internal admin console for the Gate AI team</p>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-box">{error}</div>}

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@gateai.io"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn-login" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="slogin-footer">
            Customer? <a href="/login">Sign in here</a>
          </div>
        </div>
      </div>
    </>
  );
}
