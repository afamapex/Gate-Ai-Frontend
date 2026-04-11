import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { auth } from '../services/api.js';

export default function Login() {
  const { login } = useAuth();
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
      const data = await auth.login(email, password);
      login(data);
      navigate('/', { replace: true });
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

        .login-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0b0f;
          font-family: 'DM Sans', -apple-system, sans-serif;
          padding: 24px;
          -webkit-font-smoothing: antialiased;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: #111218;
          border: 1px solid #252736;
          border-radius: 16px;
          padding: 40px;
        }

        .login-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
        }

        .login-logo-icon {
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

        .login-logo-text {
          font-size: 20px;
          font-weight: 700;
          color: #e8e9ed;
          letter-spacing: -0.3px;
        }

        .login-heading {
          font-size: 22px;
          font-weight: 700;
          color: #e8e9ed;
          letter-spacing: -0.3px;
          margin-bottom: 6px;
        }

        .login-sub {
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

        .field input:focus {
          border-color: #6c5ce7;
        }

        .field input::placeholder {
          color: #3a3d52;
        }

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

        .login-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 12px;
          color: #3a3d52;
        }
      `}</style>

      <div className="login-wrap">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="login-logo-text">Gate AI</span>
          </div>

          <h1 className="login-heading">Welcome back</h1>
          <p className="login-sub">Sign in to your dashboard</p>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-box">{error}</div>}

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@company.com"
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

          <div className="login-footer">
            Gate AI · AI-powered call screening
          </div>
        </div>
      </div>
    </>
  );
}
