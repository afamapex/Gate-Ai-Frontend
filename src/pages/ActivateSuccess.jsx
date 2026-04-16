import { useEffect, useState } from 'react';

export default function ActivateSuccess() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'

  useEffect(() => {
    // Retrieve the token stashed by Activate.jsx before Stripe redirect.
    const token   = sessionStorage.getItem('gateai_activation_token');
    const userStr = sessionStorage.getItem('gateai_activation_user');
    const compStr = sessionStorage.getItem('gateai_activation_company');

    if (!token || !userStr || !compStr) {
      // No stashed session — maybe they refreshed or came here directly.
      // Check if they're already logged in via localStorage.
      const existingToken = localStorage.getItem('gateai_token');
      if (existingToken) {
        setStatus('success');
        // Go to provisioning screen — it handles already-provisioned accounts gracefully
        setTimeout(() => { window.location.href = '/provisioning'; }, 2000);
        return;
      }
      setStatus('error');
      return;
    }

    // Promote from sessionStorage to localStorage — this logs them in.
    localStorage.setItem('gateai_token',   token);
    localStorage.setItem('gateai_user',    userStr);
    localStorage.setItem('gateai_company', compStr);

    // Clean up sessionStorage
    sessionStorage.removeItem('gateai_activation_token');
    sessionStorage.removeItem('gateai_activation_user');
    sessionStorage.removeItem('gateai_activation_company');

    setStatus('success');

    // Redirect to provisioning screen — it polls for the phone number
    // and AI assistant, then transitions to the dashboard once ready.
    setTimeout(() => {
      window.location.href = '/provisioning';
    }, 2500);
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0b0f; }

        .as-wrap {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: #0a0b0f;
          font-family: 'DM Sans', -apple-system, sans-serif;
          padding: 24px;
          -webkit-font-smoothing: antialiased;
        }
        .as-card {
          width: 100%; max-width: 480px;
          background: #111218;
          border: 1px solid #252736;
          border-radius: 16px;
          padding: 48px 40px;
          text-align: center;
        }
        .as-icon {
          width: 64px; height: 64px; margin: 0 auto 20px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
        }
        .as-icon-success {
          background: rgba(81,207,102,0.12);
          border: 1px solid rgba(81,207,102,0.35);
          color: #51cf66;
        }
        .as-icon-error {
          background: rgba(255,107,107,0.12);
          border: 1px solid rgba(255,107,107,0.35);
          color: #ff6b6b;
        }
        .as-icon-loading {
          background: rgba(108,92,231,0.12);
          border: 1px solid rgba(108,92,231,0.35);
          color: #a29bfe;
        }
        .as-heading {
          font-size: 24px; font-weight: 700; color: #e8e9ed;
          letter-spacing: -0.3px; margin-bottom: 10px;
        }
        .as-body {
          font-size: 15px; color: #8b8fa3; line-height: 1.6; margin-bottom: 24px;
        }
        .as-spinner {
          width: 24px; height: 24px;
          border: 2.5px solid rgba(162,155,254,0.3);
          border-top-color: #a29bfe;
          border-radius: 50%;
          animation: as-spin 0.8s linear infinite;
        }
        @keyframes as-spin { to { transform: rotate(360deg); } }
        .as-btn {
          display: inline-block; padding: 12px 24px;
          background: linear-gradient(135deg, #6c5ce7, #a29bfe);
          color: #fff; text-decoration: none; border-radius: 9px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
          transition: opacity 150ms ease;
        }
        .as-btn:hover { opacity: 0.88; }
        .as-redirect {
          font-size: 12.5px; color: #6b6e82; margin-top: 18px;
        }
      `}</style>

      <div className="as-wrap">
        <div className="as-card">
          {status === 'loading' && (
            <>
              <div className="as-icon as-icon-loading">
                <div className="as-spinner"/>
              </div>
              <h1 className="as-heading">Setting up your account…</h1>
              <p className="as-body">Just a moment while we get things ready.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="as-icon as-icon-success">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h1 className="as-heading">Payment confirmed!</h1>
              <p className="as-body">
                Your 7-day free trial has started. Setting up your Gate AI phone number now — this takes about 15 seconds.
              </p>
              <div className="as-redirect">Taking you to your setup screen…</div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="as-icon as-icon-error">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h1 className="as-heading">Something went wrong</h1>
              <p className="as-body">
                We couldn't complete your activation. This can happen if you refreshed the page or your browser cleared session data. Try logging in — your account may already be set up.
              </p>
              <a href="/login" className="as-btn">Go to login</a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
