import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { staffInvites } from '../services/staffApi.js';

export default function StaffInviteNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    email:            searchParams.get('email')        || '',
    first_name:       searchParams.get('first_name')   || '',
    company_name:     searchParams.get('company_name') || '',
    plan:             searchParams.get('plan')         || 'pro',
    notes:            '',
    demo_request_id:  searchParams.get('demo_request_id') || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  function update(key, value) {
    setForm(f => ({ ...f, [key]: value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        company_name: form.company_name.trim(),
        plan: form.plan,
      };
      if (form.first_name.trim())      payload.first_name      = form.first_name.trim();
      if (form.notes.trim())           payload.notes           = form.notes.trim();
      if (form.demo_request_id)        payload.demo_request_id = form.demo_request_id;

      const res = await staffInvites.create(payload);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to create invite');
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (result) {
    return (
      <>
        <style>{pageCss}</style>
        <div className="sin-back">
          <Link to="/staff/invites" className="sin-back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            All invites
          </Link>
        </div>

        <div className="sin-card" style={{ maxWidth: 580 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: 'rgba(81,207,102,0.12)',
              border: '1px solid rgba(81,207,102,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#51cf66',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="sin-heading" style={{ margin: 0 }}>Invite sent</h2>
          </div>

          <div className="sin-muted" style={{ marginBottom: 18 }}>
            {result.emailed
              ? `An activation email was sent to ${result.invite.email}. It expires in 30 days.`
              : `Email delivery failed, but the invite was created. Share the activation link below with the prospect manually.`}
          </div>

          {!result.emailed && result.activation_url && (
            <div className="sin-link-box">
              <div className="sin-label" style={{ marginBottom: 6 }}>Activation link</div>
              <div className="sin-link">{result.activation_url}</div>
              <button
                className="sin-btn sin-btn-ghost"
                style={{ marginTop: 10 }}
                onClick={() => {
                  navigator.clipboard.writeText(result.activation_url);
                }}
              >Copy link</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button className="sin-btn sin-btn-primary" onClick={() => navigate(`/staff/invites/${result.invite.id}`)}>
              View invite
            </button>
            <button className="sin-btn sin-btn-ghost" onClick={() => {
              setResult(null);
              setForm({ email: '', first_name: '', company_name: '', plan: 'pro', notes: '', demo_request_id: '' });
            }}>
              Send another
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{pageCss}</style>

      <div className="sin-back">
        <Link to="/staff/invites" className="sin-back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          All invites
        </Link>
      </div>

      <h1 className="sin-heading">Generate invite</h1>
      <p className="sin-sub">
        Send a tokenised invite to a prospect. They'll receive an email with a link to set their password,
        enter payment details, and activate their 7-day trial.
      </p>

      <form onSubmit={handleSubmit} className="sin-card">
        {error && <div className="sin-error">{error}</div>}

        <div className="sin-field">
          <label>Prospect email *</label>
          <input
            type="email"
            required
            placeholder="owner@logisticscompany.com"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            autoFocus
          />
          <div className="sin-hint">The invite link is locked to this email address.</div>
        </div>

        <div className="sin-field">
          <label>First name</label>
          <input
            placeholder="Daniel"
            value={form.first_name}
            onChange={e => update('first_name', e.target.value)}
          />
          <div className="sin-hint">Optional — used to personalise the email greeting.</div>
        </div>

        <div className="sin-field">
          <label>Company name *</label>
          <input
            required
            placeholder="Logistics Company Inc."
            value={form.company_name}
            onChange={e => update('company_name', e.target.value)}
          />
        </div>

        <div className="sin-field">
          <label>Plan *</label>
          <div className="sin-plans">
            {['starter', 'pro', 'business'].map(p => (
              <label key={p} className={`sin-plan ${form.plan === p ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="plan"
                  value={p}
                  checked={form.plan === p}
                  onChange={() => update('plan', p)}
                />
                <div className="sin-plan-label">{p}</div>
                <div className="sin-plan-price">
                  {p === 'starter' ? '$79/mo' : p === 'pro' ? '$149/mo' : '$249/mo'}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="sin-field">
          <label>Internal notes</label>
          <textarea
            rows={3}
            placeholder="Optional — visible only to the Gate AI team."
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
          />
        </div>

        <div className="sin-summary">
          <strong style={{ color: '#e8e9ed' }}>Heads up:</strong>{' '}
          Sending this invite will email <strong style={{ color: '#e8e9ed' }}>{form.email || '—'}</strong> immediately
          with a 30-day activation link. They'll complete signup with a card on file and a 7-day free trial.
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button type="submit" className="sin-btn sin-btn-primary" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send invite'}
          </button>
          <Link to="/staff/invites">
            <button type="button" className="sin-btn sin-btn-ghost" disabled={submitting}>Cancel</button>
          </Link>
        </div>
      </form>
    </>
  );
}

const pageCss = `
  .sin-back { margin-bottom: 14px; }
  .sin-back-link {
    display: inline-flex; align-items: center; gap: 6px;
    color: #8b8fa3; font-size: 13px; text-decoration: none;
    padding: 4px 0;
  }
  .sin-back-link:hover { color: #e8e9ed; }

  .sin-heading {
    font-size: 22px; font-weight: 700; color: #e8e9ed;
    letter-spacing: -0.3px; margin-bottom: 6px;
  }
  .sin-sub {
    font-size: 14px; color: #8b8fa3;
    margin-bottom: 22px; max-width: 560px; line-height: 1.5;
  }

  .sin-card {
    background: #111218; border: 1px solid #252736;
    border-radius: 14px; padding: 26px;
    max-width: 580px;
  }

  .sin-field { margin-bottom: 18px; }
  .sin-field label {
    display: block;
    font-size: 11.5px; font-weight: 600; color: #8b8fa3;
    text-transform: uppercase; letter-spacing: 0.5px;
    margin-bottom: 7px;
  }
  .sin-field input,
  .sin-field textarea,
  .sin-field select {
    width: 100%; padding: 10px 13px;
    background: #13141b; border: 1px solid #252736; border-radius: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: #e8e9ed;
    outline: none; transition: border-color 140ms ease;
  }
  .sin-field input:focus,
  .sin-field textarea:focus,
  .sin-field select:focus { border-color: #6c5ce7; }
  .sin-field input::placeholder,
  .sin-field textarea::placeholder { color: #3a3d52; }
  .sin-field textarea { resize: vertical; min-height: 70px; font-family: inherit; }
  .sin-hint { margin-top: 5px; font-size: 11.5px; color: #6b6e82; }
  .sin-label {
    font-size: 11.5px; font-weight: 600; color: #8b8fa3;
    text-transform: uppercase; letter-spacing: 0.5px;
  }

  .sin-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .sin-plan {
    padding: 14px 12px;
    border: 1px solid #252736; background: #13141b;
    border-radius: 9px; cursor: pointer; text-align: center;
    transition: border-color 140ms ease, background 140ms ease;
    position: relative;
  }
  .sin-plan input { position: absolute; opacity: 0; pointer-events: none; }
  .sin-plan.active {
    border-color: #6c5ce7;
    background: rgba(108,92,231,0.08);
  }
  .sin-plan-label {
    font-size: 13.5px; font-weight: 700;
    color: #e8e9ed;
    text-transform: capitalize;
  }
  .sin-plan-price {
    font-size: 11.5px; color: #8b8fa3; margin-top: 3px;
  }

  .sin-summary {
    margin-top: 8px; padding: 12px 14px;
    background: rgba(108,92,231,0.06);
    border: 1px solid rgba(108,92,231,0.22);
    border-radius: 8px;
    font-size: 13px; color: #b0b3c5; line-height: 1.55;
  }

  .sin-muted { color: #8b8fa3; font-size: 14px; line-height: 1.55; }

  .sin-link-box {
    background: #13141b; border: 1px solid #252736;
    border-radius: 8px; padding: 14px;
  }
  .sin-link {
    font-family: ui-monospace, Menlo, monospace;
    font-size: 12px; color: #a29bfe;
    word-break: break-all;
  }

  .sin-btn {
    padding: 10px 18px; border: none; border-radius: 8px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600;
    transition: opacity 120ms ease, background 120ms ease, transform 100ms ease;
  }
  .sin-btn:active:not(:disabled) { transform: scale(0.97); }
  .sin-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .sin-btn-primary {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff;
  }
  .sin-btn-primary:hover:not(:disabled) { opacity: 0.88; }
  .sin-btn-ghost { background: #1c1e2a; color: #e8e9ed; }
  .sin-btn-ghost:hover:not(:disabled) { background: #252736; }

  .sin-error {
    background: rgba(255,107,107,0.08);
    border: 1px solid rgba(255,107,107,0.25);
    color: #ff6b6b; padding: 10px 14px;
    border-radius: 8px; font-size: 13.5px;
    margin-bottom: 16px;
  }
`;
