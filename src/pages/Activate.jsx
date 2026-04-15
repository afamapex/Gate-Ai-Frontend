import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://gate-ai-backend-production.up.railway.app';

export default function Activate() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();

  const [invite,   setInvite]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [invalid,  setInvalid]  = useState(null); // null | 'not_found' | 'expired' | 'revoked' | 'already_activated'
  const [submitting, setSubmitting] = useState(false);
  const [error,    setError]    = useState('');

  const [form, setForm] = useState({
    first_name: '',
    last_name:  '',
    password:   '',
    confirm:    '',
    phone:      '',
    industry:   '',
    timezone:   Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago',
  });

  // Was the user bounced back from Stripe checkout?
  const checkoutCancelled = searchParams.get('checkout') === 'cancelled';

  // Validate token on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/invites/validate/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setInvite(data.invite);
          if (data.invite.first_name) {
            setForm(f => ({ ...f, first_name: data.invite.first_name }));
          }
        } else {
          setInvalid(data.reason || 'not_found');
        }
      })
      .catch(() => setInvalid('not_found'))
      .finally(() => setLoading(false));
  }, [token]);

  function update(key, value) {
    setForm(f => ({ ...f, [key]: value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/invites/activate/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:      invite.email,
          first_name: form.first_name.trim(),
          last_name:  form.last_name.trim(),
          password:   form.password,
          phone:      form.phone.trim() || undefined,
          industry:   form.industry.trim() || undefined,
          timezone:   form.timezone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Activation failed');
      }

      // Stash the customer token so the success page can log them in.
      // Using sessionStorage so it doesn't interfere with any existing customer session.
      sessionStorage.setItem('gateai_activation_token', data.token);
      sessionStorage.setItem('gateai_activation_user', JSON.stringify(data.user));
      sessionStorage.setItem('gateai_activation_company', JSON.stringify(data.company));

      if (data.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url;
      } else {
        // Stripe failed to create a session — log them in directly.
        // They can add payment later from the dashboard billing page.
        localStorage.setItem('gateai_token', data.token);
        localStorage.setItem('gateai_user', JSON.stringify(data.user));
        localStorage.setItem('gateai_company', JSON.stringify(data.company));
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const planLabel = invite ? { starter: 'Starter ($79/mo)', pro: 'Pro ($149/mo)', business: 'Business ($249/mo)' }[invite.plan] || invite.plan : '';

  return (
    <>
      <style>{css}</style>

      <div className="act-wrap">
        <div className="act-card">
          {/* Logo */}
          <div className="act-logo">
            <div className="act-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="act-logo-text">Gate AI</span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="act-state">Validating your invite…</div>
          )}

          {/* Invalid token */}
          {!loading && invalid && (
            <div className="act-invalid">
              <div className="act-invalid-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 className="act-heading" style={{ textAlign: 'center' }}>
                {invalid === 'expired' && 'This invite has expired'}
                {invalid === 'revoked' && 'This invite has been revoked'}
                {invalid === 'already_activated' && 'This invite has already been used'}
                {invalid === 'not_found' && 'Invalid invite link'}
              </h2>
              <p className="act-muted" style={{ textAlign: 'center' }}>
                {invalid === 'expired' && 'Please contact the Gate AI team to request a new invite.'}
                {invalid === 'revoked' && 'This invite is no longer valid. Contact the Gate AI team if you think this is a mistake.'}
                {invalid === 'already_activated' && 'Your account is already set up. You can log in below.'}
                {invalid === 'not_found' && 'This link is invalid or has been tampered with. Contact the Gate AI team for help.'}
              </p>
              {invalid === 'already_activated' && (
                <a href="/login" className="act-btn act-btn-primary" style={{ display: 'inline-block', textDecoration: 'none', marginTop: 14 }}>
                  Go to login
                </a>
              )}
            </div>
          )}

          {/* Checkout cancelled */}
          {!loading && invite && checkoutCancelled && (
            <div className="act-notice">
              <strong>Payment setup cancelled.</strong> Your account was created but you still need to add a payment method. Complete the form below to try again.
            </div>
          )}

          {/* Valid invite — registration form */}
          {!loading && invite && (
            <>
              <h1 className="act-heading">Activate your account</h1>
              <p className="act-muted">
                Set up your Gate AI account for <strong style={{ color: '#e8e9ed' }}>{invite.company_name}</strong> on the <strong style={{ color: '#a29bfe' }}>{planLabel}</strong> plan.
              </p>

              <div className="act-info-row">
                <div className="act-info-label">Email (locked)</div>
                <div className="act-info-value">{invite.email}</div>
              </div>

              <form onSubmit={handleSubmit}>
                {error && <div className="act-error">{error}</div>}

                <div className="act-row">
                  <div className="act-field">
                    <label>First name *</label>
                    <input required value={form.first_name} onChange={e => update('first_name', e.target.value)} placeholder="Daniel" autoFocus />
                  </div>
                  <div className="act-field">
                    <label>Last name *</label>
                    <input required value={form.last_name} onChange={e => update('last_name', e.target.value)} placeholder="Okafor" />
                  </div>
                </div>

                <div className="act-field">
                  <label>Password *</label>
                  <input type="password" required minLength={8} value={form.password} onChange={e => update('password', e.target.value)} placeholder="At least 8 characters" />
                </div>

                <div className="act-field">
                  <label>Confirm password *</label>
                  <input type="password" required value={form.confirm} onChange={e => update('confirm', e.target.value)} placeholder="Type your password again" />
                </div>

                <div className="act-field">
                  <label>Phone (optional)</label>
                  <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 (555) 123-4567" />
                </div>

                <div className="act-field">
                  <label>Industry (optional)</label>
                  <input value={form.industry} onChange={e => update('industry', e.target.value)} placeholder="Logistics & Supply Chain" />
                </div>

                <div className="act-summary">
                  After clicking below, you'll be redirected to our secure payment page to enter your card details. Your <strong style={{ color: '#e8e9ed' }}>7-day free trial</strong> starts once you complete payment setup. You won't be charged until day 7 and can cancel anytime.
                </div>

                <button type="submit" className="act-btn act-btn-primary" disabled={submitting}>
                  {submitting ? 'Setting up your account…' : 'Continue to payment'}
                </button>
              </form>

              <div className="act-footer">
                Already have an account? <a href="/login">Sign in</a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0b0f; }

  .act-wrap {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    background: #0a0b0f;
    font-family: 'DM Sans', -apple-system, sans-serif;
    padding: 24px;
    -webkit-font-smoothing: antialiased;
    position: relative;
  }
  .act-wrap::before {
    content: '';
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(108,92,231,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .act-card {
    position: relative;
    width: 100%; max-width: 480px;
    background: #111218;
    border: 1px solid #252736;
    border-radius: 16px;
    padding: 40px;
  }

  .act-logo {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 24px;
  }
  .act-logo-icon {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 12px rgba(108,92,231,0.35);
  }
  .act-logo-text {
    font-size: 20px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px;
  }

  .act-heading {
    font-size: 22px; font-weight: 700; color: #e8e9ed;
    letter-spacing: -0.3px; margin-bottom: 8px;
  }
  .act-muted {
    font-size: 14px; color: #8b8fa3; line-height: 1.55; margin-bottom: 22px;
  }

  .act-info-row {
    background: #13141b; border: 1px solid #252736; border-radius: 8px;
    padding: 12px 14px; margin-bottom: 20px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .act-info-label { font-size: 12px; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  .act-info-value { font-size: 14px; color: #a29bfe; font-weight: 600; }

  .act-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .act-field { margin-bottom: 16px; }
  .act-field label {
    display: block; font-size: 12px; font-weight: 600; color: #8b8fa3;
    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 7px;
  }
  .act-field input {
    width: 100%; padding: 11px 14px;
    background: #13141b; border: 1px solid #252736; border-radius: 9px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: #e8e9ed;
    outline: none; transition: border-color 150ms ease;
  }
  .act-field input:focus { border-color: #6c5ce7; }
  .act-field input::placeholder { color: #3a3d52; }

  .act-summary {
    padding: 14px 16px; margin-bottom: 18px;
    background: rgba(108,92,231,0.06);
    border: 1px solid rgba(108,92,231,0.22);
    border-radius: 8px;
    font-size: 13px; color: #b0b3c5; line-height: 1.55;
  }

  .act-btn {
    width: 100%; padding: 13px;
    border: none; border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 600;
    cursor: pointer;
    transition: opacity 150ms ease, transform 100ms ease;
    text-align: center;
  }
  .act-btn:active:not(:disabled) { transform: scale(0.98); }
  .act-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .act-btn-primary {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff;
  }
  .act-btn-primary:hover:not(:disabled) { opacity: 0.88; }

  .act-error {
    background: rgba(255,107,107,0.1);
    border: 1px solid rgba(255,107,107,0.25);
    border-radius: 8px; padding: 10px 14px;
    font-size: 13px; color: #ff6b6b; margin-bottom: 16px;
  }

  .act-notice {
    background: rgba(255,165,0,0.08);
    border: 1px solid rgba(255,165,0,0.25);
    border-radius: 8px; padding: 12px 14px;
    font-size: 13.5px; color: #ffb347; margin-bottom: 18px; line-height: 1.5;
  }

  .act-invalid { padding: 20px 0; }
  .act-invalid-icon {
    width: 56px; height: 56px; margin: 0 auto 16px;
    background: rgba(255,107,107,0.12);
    border: 1px solid rgba(255,107,107,0.3);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    color: #ff6b6b;
  }

  .act-state {
    padding: 40px 0; text-align: center;
    color: #8b8fa3; font-size: 14px;
  }

  .act-footer {
    margin-top: 24px; text-align: center;
    font-size: 12px; color: #3a3d52;
  }
  .act-footer a { color: #6c5ce7; text-decoration: none; }
  .act-footer a:hover { text-decoration: underline; }

  @media (max-width: 500px) {
    .act-card { padding: 28px 22px; }
    .act-row { grid-template-columns: 1fr; }
  }
`;
