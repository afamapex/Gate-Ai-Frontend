import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const API = import.meta.env.VITE_API_URL || 'https://gate-ai-backend-production.up.railway.app';

export default function Auth() {
  const navigate = useNavigate();
  const { token, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ FIXED: useState must be declared before any conditional return.
  // Previously this was after the `if (token)` block, which broke React's
  // rules of hooks and caused a blank page at /auth.
  const [signin, setSignin] = useState({ email: '', password: '' });

  useEffect(() => {
    if (token) navigate('/', { replace: true });
  }, [token, navigate]);

  if (token) return null;

  async function handleSignin(e) {
    e.preventDefault();
    setError('');
    const { email, password } = signin;
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid email or password.'); return; }
      login(data);
      navigate('/dashboard');
    } catch { setError('Connection error. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <>
      <style>{CSS}</style>
      <button className="auth-back" onClick={() => navigate('/')}>← Back to home</button>
      <div className="auth-layout">
        <div className="auth-left">
          <a onClick={() => navigate('/')} className="auth-logo"><NavLogo /><span>Gate <span style={{color:'var(--accent-2)',fontWeight:500}}>AI</span></span></a>
          <div className="auth-form-wrap">
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSignin} className="auth-form">
              <h2 className="auth-heading">Welcome back</h2>
              <p className="auth-sub">Sign in to your Gate AI dashboard.</p>
              <div className="field"><label>Email</label><input type="email" placeholder="you@company.com" value={signin.email} onChange={e => setSignin(s=>({...s,email:e.target.value}))} autoFocus/></div>
              <div className="field"><label>Password</label><input type="password" placeholder="••••••••" value={signin.password} onChange={e => setSignin(s=>({...s,password:e.target.value}))}/></div>
              <button className="btn-submit" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
            </form>
            <div className="auth-switch">
              Want to try Gate AI? <button onClick={() => navigate('/book-demo')}>Book a demo</button>
            </div>
          </div>
          <div className="auth-footer-links">
            <a onClick={() => navigate('/privacy')}>Privacy</a>
            <a onClick={() => navigate('/terms')}>Terms</a>
            <a onClick={() => navigate('/contact')}>Contact</a>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-showcase">
            <div className="showcase-card">
              <div className="sc-header">
                <div className="dot dot-r"/><div className="dot dot-y"/><div className="dot dot-g"/>
                <div className="sc-title">live_call_screening</div>
              </div>
              <div className="sc-body">
                {[
                  { dot: 'blocked', name: 'SolarMax Inc', detail: 'Cold pitch — solar panels', badge: 'blocked' },
                  { dot: 'forwarded', name: 'Daniel Reeves', detail: 'AB Logistics — order pickup', badge: 'forwarded' },
                  { dot: 'blocked', name: 'Digital Marketing Pro', detail: 'SEO services pitch', badge: 'blocked' },
                  { dot: 'forwarded', name: 'Maria Gonzalez', detail: 'Pacific Freight — Q2 rates', badge: 'forwarded' },
                  { dot: 'live', name: 'Unknown caller', detail: '+1 (312) 555-0199 — screening…', badge: 'live' },
                ].map((c,i) => (
                  <div key={i} className="sc-row">
                    <div className={`sc-dot sc-dot-${c.dot}`}/>
                    <div className="sc-text">
                      <div className="sc-name">{c.name}</div>
                      <div className="sc-detail">{c.detail}</div>
                    </div>
                    <div className={`sc-badge sc-badge-${c.badge}`}>{c.badge}</div>
                  </div>
                ))}
              </div>
              <div className="sc-stats">
                <div className="sc-stat"><div className="sc-stat-num" style={{color:'var(--red)'}}>47</div><div className="sc-stat-label">Blocked today</div></div>
                <div className="sc-stat"><div className="sc-stat-num" style={{color:'var(--green)'}}>12</div><div className="sc-stat-label">Forwarded</div></div>
                <div className="sc-stat"><div className="sc-stat-num" style={{color:'var(--accent-2)'}}>94%</div><div className="sc-stat-label">Accuracy</div></div>
              </div>
            </div>
            <div className="auth-taglines">
              {['AI-powered cold call detection from day one','Built specifically for logistics & manufacturing','Book a demo to get started — invite-only access'].map((t,i)=>(
                <div key={i} className="auth-tagline">{t}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function NavLogo() {
  return <svg width="30" height="30" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="aG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#b8b1ff"/><stop offset="100%" stopColor="#6c5ce7"/></linearGradient><mask id="aM"><rect width="60" height="60" fill="white"/><rect x="22" y="30" width="2.2" height="6" rx="1.1" fill="black"/><rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/><rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/></mask></defs><path d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z" fill="url(#aG)" mask="url(#aM)"/></svg>;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');
:root{--bg:#08090d;--bg-2:#0d0e14;--bg-3:#13141b;--bg-4:#1a1c26;--border:#1f2130;--border-2:#2a2d40;--text:#f0f1f5;--text-2:#9da1b5;--text-3:#5c6078;--accent:#6c5ce7;--accent-2:#a29bfe;--accent-glow:rgba(108,92,231,0.35);--green:#00d68f;--red:#ff6b6b;--font:'DM Sans',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;}
*{margin:0;padding:0;box-sizing:border-box;}body{font-family:var(--font);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;}a{cursor:pointer;}
.auth-layout{display:flex;min-height:100vh;}
.auth-left{flex:0 0 480px;padding:48px;display:flex;flex-direction:column;border-right:1px solid var(--border);position:relative;overflow:hidden;}
.auth-left::before{content:'';position:absolute;top:-200px;left:-200px;width:600px;height:600px;background:radial-gradient(circle,rgba(108,92,231,0.12) 0%,transparent 60%);pointer-events:none;}
.auth-left::after{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(108,92,231,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(108,92,231,0.04) 1px,transparent 1px);background-size:40px 40px;mask-image:radial-gradient(ellipse 80% 60% at 20% 30%,black,transparent);pointer-events:none;}
.auth-logo{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:700;letter-spacing:-0.3px;position:relative;z-index:1;margin-bottom:auto;}
.auth-back{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--text-3);position:fixed;top:24px;right:32px;z-index:200;transition:color 180ms ease;background:none;border:none;font-family:var(--font);cursor:pointer;padding:0;}
.auth-back:hover{color:var(--text);}
.auth-footer-links{position:relative;z-index:1;margin-top:auto;padding-top:32px;display:flex;flex-wrap:wrap;gap:16px;}
.auth-footer-links a{font-size:12px;color:var(--text-3);transition:color 180ms ease;}
.auth-footer-links a:hover{color:var(--text);}
.auth-form-wrap{flex:1;display:flex;flex-direction:column;justify-content:center;position:relative;z-index:1;max-width:360px;}
.auth-form{display:flex;flex-direction:column;}
.auth-heading{font-size:26px;font-weight:700;letter-spacing:-0.03em;margin-bottom:6px;}
.auth-sub{font-size:14px;color:var(--text-2);margin-bottom:24px;line-height:1.5;}
.field{margin-bottom:14px;}
label{display:block;font-size:11.5px;font-weight:600;color:var(--text-2);margin-bottom:7px;letter-spacing:0.3px;text-transform:uppercase;}
input{width:100%;background:var(--bg-3);border:1px solid var(--border-2);border-radius:10px;padding:12px 14px;font-size:14px;color:var(--text);font-family:var(--font);transition:border-color 200ms,box-shadow 200ms;outline:none;}
input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(108,92,231,0.15);}
input::placeholder{color:var(--text-3);}
.btn-submit{width:100%;padding:14px;background:var(--accent);color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all 200ms;margin-top:8px;font-family:var(--font);}
.btn-submit:hover:not(:disabled){background:#7c6ef0;transform:translateY(-1px);box-shadow:0 8px 24px var(--accent-glow);}
.btn-submit:disabled{opacity:0.6;cursor:not-allowed;}
.auth-error{background:rgba(255,107,107,0.1);border:1px solid rgba(255,107,107,0.25);border-radius:10px;padding:12px 14px;font-size:13px;color:var(--red);margin-bottom:16px;}
.auth-switch{text-align:center;font-size:13px;color:var(--text-3);margin-top:16px;}
.auth-switch button{background:none;border:none;color:var(--accent-2);font-weight:500;cursor:pointer;font-family:var(--font);font-size:13px;}
.auth-right{flex:1;display:flex;align-items:center;justify-content:center;padding:60px;position:relative;overflow:hidden;}
.auth-right::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:800px;height:800px;background:radial-gradient(circle,rgba(108,92,231,0.1) 0%,transparent 60%);pointer-events:none;}
.auth-showcase{position:relative;z-index:1;width:100%;max-width:480px;}
.showcase-card{background:var(--bg-3);border:1px solid var(--border);border-radius:20px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,0.4);}
.showcase-card::before{content:'';display:block;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);}
.sc-header{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:7px;}
.dot{width:10px;height:10px;border-radius:50%;}.dot-r{background:#ff5f57;}.dot-y{background:#febc2e;}.dot-g{background:#28c840;}
.sc-title{font-size:11.5px;color:var(--text-3);font-family:var(--mono);margin-left:4px;}
.sc-body{padding:16px;display:flex;flex-direction:column;gap:10px;}
.sc-row{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg-4);border-radius:10px;border:1px solid var(--border);}
.sc-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.sc-dot-blocked{background:var(--red);box-shadow:0 0 6px rgba(255,107,107,0.5);}
.sc-dot-forwarded{background:var(--green);box-shadow:0 0 6px rgba(0,214,143,0.5);}
.sc-dot-live{background:#ffa94d;box-shadow:0 0 6px rgba(255,169,77,0.5);animation:pulse 1.5s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
.sc-text{flex:1;min-width:0;}.sc-name{font-size:12.5px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sc-detail{font-size:11px;color:var(--text-3);margin-top:2px;font-family:var(--mono);}
.sc-badge{font-size:10px;font-weight:700;padding:3px 9px;border-radius:100px;text-transform:uppercase;flex-shrink:0;}
.sc-badge-blocked{background:rgba(255,107,107,0.12);color:var(--red);}
.sc-badge-forwarded{background:rgba(0,214,143,0.12);color:var(--green);}
.sc-badge-live{background:rgba(255,169,77,0.12);color:#ffa94d;}
.sc-stats{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--border);}
.sc-stat{padding:16px;text-align:center;}.sc-stat-num{font-size:22px;font-weight:700;font-family:var(--mono);letter-spacing:-0.03em;}
.sc-stat-label{font-size:10px;color:var(--text-3);margin-top:2px;text-transform:uppercase;letter-spacing:0.5px;}
.auth-taglines{margin-top:28px;display:flex;flex-direction:column;gap:12px;}
.auth-tagline{display:flex;align-items:center;gap:12px;font-size:13.5px;color:var(--text-2);}
.auth-tagline::before{content:'';width:20px;height:20px;border-radius:50%;background:rgba(0,214,143,0.15);border:1px solid rgba(0,214,143,0.3);flex-shrink:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M4 10l4 4L16 6' stroke='%2300d68f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center;}
@media(max-width:900px){.auth-right{display:none;}.auth-left{flex:1;border-right:none;}}
@media(max-width:480px){.auth-left{padding:32px 24px;}}
`;
