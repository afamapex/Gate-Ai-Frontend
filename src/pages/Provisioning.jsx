// ═══════════════════════════════════════════════════════════════
// Gate AI — Provisioning Screen
// Shown immediately after registration. Polls /api/auth/me every
// 2.5 seconds until provisioning_status is 'ready' or 'failed'.
// Advances step indicators based on real DB data, not a fake timer.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const API = import.meta.env.VITE_API_URL || 'https://gate-ai-backend-production.up.railway.app';
const POLL_INTERVAL_MS = 2500;
const MAX_WAIT_MS      = 90000; // 90s — show a "taking longer" message after this

export default function Provisioning() {
  const navigate = useNavigate();
  const { token, login } = useAuth();

  const [phase, setPhase]           = useState('provisioning'); // 'provisioning' | 'success' | 'failed' | 'slow'
  const [twilioNumber, setTwilioNumber] = useState(null);
  const [twilioStep, setTwilioStep] = useState('active');  // 'active' | 'done'
  const [vapiStep,   setVapiStep]   = useState('waiting'); // 'waiting' | 'active' | 'done'
  const [countdown,  setCountdown]  = useState(5);

  const pollRef      = useRef(null);
  const countdownRef = useRef(null);
  const startRef     = useRef(Date.now());

  // ── Redirect if not logged in ──────────────────────────────
  useEffect(() => {
    if (!token) navigate('/auth', { replace: true });
  }, [token]);

  // ── Start polling on mount ─────────────────────────────────
  useEffect(() => {
    if (!token) return;

    // Run immediately then on interval
    pollMe();
    pollRef.current = setInterval(pollMe, POLL_INTERVAL_MS);

    return () => {
      clearInterval(pollRef.current);
      clearInterval(countdownRef.current);
    };
  }, [token]);

  async function pollMe() {
    // If we have been waiting too long, show the slow message
    if (Date.now() - startRef.current > MAX_WAIT_MS) {
      clearInterval(pollRef.current);
      setPhase('slow');
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      const company = data?.company;
      if (!company) return;

      // ── Advance steps based on real DB data ──
      if (company.twilio_number) {
        setTwilioNumber(company.twilio_number);
        setTwilioStep('done');
        setVapiStep(prev => prev === 'waiting' ? 'active' : prev);
      }

      if (company.vapi_assistant_id) {
        setVapiStep('done');
      }

      // ── Terminal states ──
      if (company.provisioning_status === 'ready') {
        clearInterval(pollRef.current);

        // Refresh auth context so the dashboard gets the phone number
        login({ token, user: data.user, company: data.company });

        setPhase('success');
        startCountdown();
        return;
      }

      if (company.provisioning_status === 'failed') {
        clearInterval(pollRef.current);
        setPhase('failed');
        return;
      }

    } catch {
      // Network hiccup — keep polling silently
    }
  }

  function startCountdown() {
    let n = 5;
    setCountdown(n);
    countdownRef.current = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        clearInterval(countdownRef.current);
        navigate('/dashboard', { replace: true });
      }
    }, 1000);
  }

  // ── Gate AI Logo ───────────────────────────────────────────
  function Logo() {
    return (
      <svg width="32" height="32" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="provG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b8b1ff"/>
            <stop offset="100%" stopColor="#6c5ce7"/>
          </linearGradient>
          <mask id="provM">
            <rect width="60" height="60" fill="white"/>
            <rect x="22" y="30" width="2.2" height="6"  rx="1.1" fill="black"/>
            <rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/>
            <rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/>
          </mask>
        </defs>
        <path
          d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z"
          fill="url(#provG)" mask="url(#provM)"
        />
      </svg>
    );
  }

  // ── Step indicator ─────────────────────────────────────────
  function Step({ state, label, sublabel, index }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '16px 0',
        borderBottom: index < 2 ? '1px solid #1f2130' : 'none',
        opacity: state === 'waiting' ? 0.4 : 1,
        transition: 'opacity 400ms ease',
      }}>
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: state === 'done'
            ? 'rgba(0,214,143,0.12)'
            : state === 'active'
              ? 'rgba(108,92,231,0.15)'
              : 'rgba(255,255,255,0.04)',
          border: `1px solid ${
            state === 'done'
              ? 'rgba(0,214,143,0.3)'
              : state === 'active'
                ? 'rgba(108,92,231,0.4)'
                : '#1f2130'
          }`,
          transition: 'all 400ms ease',
        }}>
          {state === 'done' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : state === 'active' ? (
            <div style={{
              width: 14, height: 14,
              border: '2px solid rgba(162,155,254,0.3)',
              borderTopColor: '#a29bfe',
              borderRadius: '50%',
              animation: 'prov-spin 0.8s linear infinite',
            }}/>
          ) : (
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a2d40' }}/>
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1, paddingTop: 2 }}>
          <div style={{
            fontSize: 14, fontWeight: 600,
            color: state === 'done' ? '#e8e9ed' : state === 'active' ? '#a29bfe' : '#5c6078',
            marginBottom: 3,
            transition: 'color 400ms ease',
          }}>
            {label}
          </div>
          <div style={{ fontSize: 12.5, color: '#5c6078', lineHeight: 1.5 }}>
            {sublabel}
          </div>
        </div>

        {/* Status badge */}
        {state === 'done' && (
          <div style={{
            fontSize: 11, fontWeight: 700, padding: '3px 9px',
            borderRadius: 20, background: 'rgba(0,214,143,0.1)',
            color: '#00d68f', flexShrink: 0, marginTop: 2,
          }}>
            Done
          </div>
        )}
        {state === 'active' && (
          <div style={{
            fontSize: 11, fontWeight: 700, padding: '3px 9px',
            borderRadius: 20, background: 'rgba(108,92,231,0.1)',
            color: '#a29bfe', flexShrink: 0, marginTop: 2,
          }}>
            In progress
          </div>
        )}
      </div>
    );
  }

  // ── Progress bar ───────────────────────────────────────────
  const stepsDone = [twilioStep, vapiStep].filter(s => s === 'done').length;
  const totalSteps = 2;
  const progressPct = phase === 'success' ? 100 : Math.round((stepsDone / totalSteps) * 85) + 5;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0b0f; }
        @keyframes prov-spin { to { transform: rotate(360deg); } }
        @keyframes prov-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes prov-number-in { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes prov-progress { from { width: 5%; } }
        .prov-wrap {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: #0a0b0f;
          font-family: 'DM Sans', -apple-system, sans-serif;
          padding: 24px;
          -webkit-font-smoothing: antialiased;
          position: relative;
          overflow: hidden;
        }
        .prov-wrap::before {
          content: '';
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(108,92,231,0.07) 0%, transparent 65%);
          pointer-events: none;
        }
        .prov-card {
          position: relative;
          width: 100%; max-width: 480px;
          background: #111218;
          border: 1px solid #252736;
          border-radius: 18px;
          overflow: hidden;
          animation: prov-fade-in 350ms ease;
        }
        .prov-progress-bar {
          height: 3px;
          background: #1a1c26;
          position: relative;
          overflow: hidden;
        }
        .prov-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6c5ce7, #a29bfe);
          border-radius: 0 2px 2px 0;
          transition: width 800ms cubic-bezier(0.4, 0, 0.2, 1);
          animation: prov-progress 400ms ease;
        }
        .prov-inner { padding: 36px 40px; }
        .prov-logo {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 28px;
        }
        .prov-logo-text { font-size: 18px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px; }
        .prov-heading { font-size: 21px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px; margin-bottom: 6px; }
        .prov-sub { font-size: 13.5px; color: #8b8fa3; line-height: 1.55; margin-bottom: 28px; }
        .prov-steps { background: #0d0e14; border: 1px solid #1f2130; border-radius: 12px; padding: 0 20px; }
        .prov-number-reveal {
          background: #0d0e14;
          border: 1px solid rgba(108,92,231,0.3);
          border-radius: 14px;
          padding: 28px 24px;
          text-align: center;
          margin-top: 24px;
          animation: prov-number-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .prov-number {
          font-size: 30px; font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          color: #a29bfe; letter-spacing: 0.04em;
          margin: 10px 0 8px;
        }
        .prov-redirect {
          font-size: 12px; color: #3a3d52; margin-top: 20px; text-align: center;
        }
        .prov-btn {
          display: block; width: 100%; padding: 13px;
          background: linear-gradient(135deg, #6c5ce7, #a29bfe);
          color: white; text-align: center; text-decoration: none;
          border: none; border-radius: 10px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
          transition: opacity 150ms ease; margin-top: 20px;
        }
        .prov-btn:hover { opacity: 0.88; }
        @media (max-width: 520px) { .prov-inner { padding: 28px 24px; } }
      `}</style>

      <div className="prov-wrap">
        <div className="prov-card">

          {/* Progress bar */}
          <div className="prov-progress-bar">
            <div className="prov-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="prov-inner">
            {/* Logo */}
            <div className="prov-logo">
              <Logo />
              <span className="prov-logo-text">Gate AI</span>
            </div>

            {/* ── PROVISIONING STATE ── */}
            {(phase === 'provisioning' || phase === 'slow') && (
              <>
                <h1 className="prov-heading">Setting up your account</h1>
                <p className="prov-sub">
                  {phase === 'slow'
                    ? "This is taking a little longer than usual — hang tight. We're still working on it."
                    : 'This takes about 10–15 seconds. Your AI call screener is being configured now.'}
                </p>

                <div className="prov-steps">
                  <Step
                    index={0}
                    state="done"
                    label="Account created"
                    sublabel="Your company profile and login are ready."
                  />
                  <Step
                    index={1}
                    state={twilioStep}
                    label="Purchasing your phone number"
                    sublabel="Reserving a local number that your contacts will call."
                  />
                  <Step
                    index={2}
                    state={vapiStep}
                    label="Creating your AI assistant"
                    sublabel="Building the screener with your company's settings."
                  />
                </div>
              </>
            )}

            {/* ── SUCCESS STATE ── */}
            {phase === 'success' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'rgba(0,214,143,0.12)', border: '1px solid rgba(0,214,143,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h1 className="prov-heading" style={{ marginBottom: 0 }}>You're all set!</h1>
                </div>
                <p className="prov-sub">
                  Your Gate AI call screener is live. Share your number with clients and contacts — all inbound calls will now be screened automatically.
                </p>

                {/* Number reveal */}
                <div className="prov-number-reveal">
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#5c6078', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Your Gate AI Number
                  </div>
                  <div className="prov-number">{twilioNumber}</div>
                  <div style={{ fontSize: 12.5, color: '#5c6078', lineHeight: 1.5 }}>
                    All calls to this number will be screened by your AI assistant.
                  </div>
                </div>

                <button className="prov-btn" onClick={() => navigate('/dashboard', { replace: true })}>
                  Go to your dashboard →
                </button>

                <div className="prov-redirect">
                  Redirecting automatically in {countdown} second{countdown !== 1 ? 's' : ''}…
                </div>
              </>
            )}

            {/* ── FAILED STATE ── */}
            {phase === 'failed' && (
              <>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>

                <h1 className="prov-heading">We hit a snag</h1>
                <p className="prov-sub">
                  Something went wrong setting up your phone number or AI assistant. Our team has been notified and will have this resolved shortly.
                </p>

                <div style={{
                  background: 'rgba(255,107,107,0.06)',
                  border: '1px solid rgba(255,107,107,0.15)',
                  borderRadius: 10, padding: '16px 18px',
                  fontSize: 13.5, color: '#8b8fa3', lineHeight: 1.6,
                }}>
                  You'll receive an email at your registered address once your account is fully set up. This usually takes less than 30 minutes.
                </div>

                <button
                  className="prov-btn"
                  style={{ background: '#1a1c26', border: '1px solid #252736', color: '#e8e9ed', marginTop: 16 }}
                  onClick={() => navigate('/dashboard', { replace: true })}
                >
                  Continue to dashboard anyway
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
