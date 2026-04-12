import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BookDemo() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', company: '', industry: '', calls: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.first_name || !form.last_name || !form.email || !form.company) {
      setError('Please fill in your name, email, and company.'); return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setDone(true);
  }

  return (
    <>
      <style>{CSS}</style>
      <nav className="demo-nav">
        <a onClick={() => navigate('/')} className="demo-logo">
          <Logo /><span>Gate <span style={{ color: 'var(--accent-2)' }}>AI</span></span>
        </a>
        <a onClick={() => navigate(-1)} className="demo-back">← Back</a>
      </nav>

      <div className="demo-layout">
        {/* LEFT */}
        <div className="demo-left">
          <div className="demo-eyebrow">Book a Demo</div>
          <h1 className="demo-heading">See Gate AI in action — live.</h1>
          <p className="demo-sub">We'll walk you through a real call screening demo tailored to your industry. Takes 20 minutes. No sales pressure.</p>

          {error && <div className="demo-error">{error}</div>}

          {!done ? (
            <form onSubmit={handleSubmit}>
              <div className="field-row">
                <div className="field"><label>First name</label><input type="text" placeholder="John" value={form.first_name} onChange={set('first_name')} /></div>
                <div className="field"><label>Last name</label><input type="text" placeholder="Smith" value={form.last_name} onChange={set('last_name')} /></div>
              </div>
              <div className="field"><label>Work email</label><input type="email" placeholder="john@company.com" value={form.email} onChange={set('email')} /></div>
              <div className="field"><label>Company name</label><input type="text" placeholder="Acme Logistics LLC" value={form.company} onChange={set('company')} /></div>
              <div className="field">
                <label>Industry</label>
                <select value={form.industry} onChange={set('industry')}>
                  <option value="">Select your industry</option>
                  <option value="logistics">Logistics & Freight</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="distribution">Distribution & Warehousing</option>
                  <option value="construction">Construction</option>
                  <option value="transport">Transport & Haulage</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="field">
                <label>Inbound calls per day?</label>
                <select value={form.calls} onChange={set('calls')}>
                  <option value="">Select a range</option>
                  <option value="under10">Under 10</option>
                  <option value="10-30">10 – 30</option>
                  <option value="30-60">30 – 60</option>
                  <option value="60+">60+</option>
                </select>
              </div>
              <div className="field">
                <label>Anything specific you'd like to see? <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                <textarea placeholder="e.g. Cold call blocking, routing, Slack integration..." value={form.notes} onChange={set('notes')} />
              </div>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Book my demo →'}
              </button>
              <p className="form-note">We'll reach out within 1 business day to confirm a time.</p>
            </form>
          ) : (
            <div className="demo-success">
              <div className="success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3>You're booked in.</h3>
              <p>We'll be in touch within 1 business day. In the meantime, feel free to <a onClick={() => navigate('/auth')}>create a free account</a> and explore the dashboard.</p>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="demo-right">
          <div className="demo-card">
            <div className="dc-header">
              <span className="dot dot-r"/><span className="dot dot-y"/><span className="dot dot-g"/>
              <span className="dc-title">gate-ai · live call feed</span>
            </div>
            <div className="dc-body">
              <div className="dc-live"><span className="live-dot"/>Live</div>
              {[
                { type: 'blocked', name: 'Unknown Caller — Cold Call', detail: '+1 (555) 102-8821 · 0:07', summary: '"Hi, I\'m calling about your commercial energy rates—" → Blocked (97%)' },
                { type: 'forwarded', name: 'Daniel @ AB Logistics', detail: '+1 (214) 882-3301 · Forwarded', summary: 'Calling re: Tuesday pickup — dock #3. Routed to Dave M. (Ops)' },
                { type: 'blocked', name: 'Unknown — SEO pitch', detail: '+1 (888) 441-0099 · 0:05', summary: '"We help businesses rank on Google—" → Blocked (99%)' },
              ].map((row, i) => (
                <div key={i} className="dc-row">
                  <div className="dc-row-top">
                    <span className={`dc-dot dc-dot-${row.type}`}/>
                    <div><div className="dc-name">{row.name}</div><div className="dc-detail">{row.detail}</div></div>
                  </div>
                  <div className="dc-summary">{row.summary}</div>
                </div>
              ))}
            </div>
            <div className="dc-stats">
              <div className="dc-stat"><div className="dc-snum" style={{color:'var(--red)'}}>38</div><div className="dc-slbl">Blocked</div></div>
              <div className="dc-stat"><div className="dc-snum" style={{color:'var(--green)'}}>9</div><div className="dc-slbl">Forwarded</div></div>
              <div className="dc-stat"><div className="dc-snum" style={{color:'var(--accent-2)'}}>94%</div><div className="dc-slbl">Accuracy</div></div>
            </div>
          </div>
          <div className="demo-trust">
            {['20-minute demo, no fluff', 'Tailored to logistics & manufacturing', 'No hard sell — just a real demo'].map((t, i) => (
              <div key={i} className="trust-item">{t}</div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Logo() {
  return <svg width="28" height="28" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#b8b1ff"/><stop offset="100%" stopColor="#6c5ce7"/></linearGradient><mask id="dM"><rect width="60" height="60" fill="white"/><rect x="22" y="30" width="2.2" height="6" rx="1.1" fill="black"/><rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/><rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/></mask></defs><path d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z" fill="url(#dG)" mask="url(#dM)"/></svg>;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');
:root{--bg:#08090d;--bg-2:#0d0e14;--bg-3:#13141b;--bg-4:#1a1c26;--border:#1f2130;--border-2:#2a2d40;--text:#f0f1f5;--text-2:#9da1b5;--text-3:#5c6078;--accent:#6c5ce7;--accent-2:#a29bfe;--accent-glow:rgba(108,92,231,0.35);--green:#00d68f;--red:#ff6b6b;--font:'DM Sans',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:var(--font);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;}
a{cursor:pointer;}
.demo-nav{padding:20px 32px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:10;background:rgba(8,9,13,0.9);backdrop-filter:blur(16px);}
.demo-logo{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:700;cursor:pointer;color:var(--text);}
.demo-back{font-size:13px;color:var(--text-3);transition:color 180ms;}
.demo-back:hover{color:var(--text);}
.demo-layout{max-width:1100px;margin:0 auto;padding:80px 32px;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start;}
@media(max-width:820px){.demo-layout{grid-template-columns:1fr;gap:48px;padding:48px 20px;}}
.demo-eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:600;color:var(--accent-2);text-transform:uppercase;letter-spacing:1.5px;padding:6px 12px;background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.25);border-radius:100px;margin-bottom:20px;}
.demo-eyebrow::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--accent-2);box-shadow:0 0 8px var(--accent-2);}
.demo-heading{font-size:clamp(28px,4vw,42px);font-weight:700;letter-spacing:-0.03em;line-height:1.1;margin-bottom:14px;}
.demo-sub{font-size:15px;color:var(--text-2);line-height:1.65;margin-bottom:32px;max-width:420px;}
.demo-error{background:rgba(255,107,107,0.1);border:1px solid rgba(255,107,107,0.25);border-radius:10px;padding:12px 14px;font-size:13px;color:var(--red);margin-bottom:16px;}
.field{margin-bottom:14px;}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
label{display:block;font-size:11.5px;font-weight:600;color:var(--text-2);margin-bottom:7px;letter-spacing:0.3px;text-transform:uppercase;}
input,select,textarea{width:100%;background:var(--bg-3);border:1px solid var(--border-2);border-radius:10px;padding:12px 14px;font-size:14px;color:var(--text);font-family:var(--font);transition:border-color 200ms,box-shadow 200ms;outline:none;}
input:focus,select:focus,textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(108,92,231,0.15);}
input::placeholder,textarea::placeholder{color:var(--text-3);}
textarea{resize:vertical;min-height:90px;}
.btn-submit{width:100%;padding:14px;background:var(--accent);color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all 200ms;margin-top:4px;font-family:var(--font);}
.btn-submit:hover:not(:disabled){background:#7c6ef0;transform:translateY(-1px);box-shadow:0 8px 24px var(--accent-glow);}
.btn-submit:disabled{opacity:0.6;cursor:not-allowed;}
.form-note{font-size:12px;color:var(--text-3);text-align:center;margin-top:12px;}
.demo-success{background:var(--bg-3);border:1px solid var(--border);border-radius:16px;padding:40px;text-align:center;}
.success-icon{width:60px;height:60px;border-radius:50%;background:rgba(0,214,143,0.12);border:1px solid rgba(0,214,143,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;}
.demo-success h3{font-size:20px;font-weight:700;margin-bottom:10px;}
.demo-success p{font-size:14px;color:var(--text-2);line-height:1.6;}
.demo-success a{color:var(--accent-2);font-weight:500;}
.demo-right{position:sticky;top:100px;}
.demo-card{background:var(--bg-3);border:1px solid var(--border);border-radius:20px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,0.4);}
.demo-card::before{content:'';display:block;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);}
.dc-header{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:7px;}
.dot{width:10px;height:10px;border-radius:50%;}
.dot-r{background:#ff5f57;}.dot-y{background:#febc2e;}.dot-g{background:#28c840;}
.dc-title{font-size:11px;color:var(--text-3);font-family:var(--mono);margin-left:4px;}
.dc-body{padding:18px;display:flex;flex-direction:column;gap:10px;}
.dc-live{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--green);background:rgba(0,214,143,0.1);border:1px solid rgba(0,214,143,0.2);border-radius:100px;padding:4px 10px;margin-bottom:6px;}
.live-dot{width:5px;height:5px;border-radius:50%;background:var(--green);animation:pulse 1.5s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
.dc-row{background:var(--bg-4);border:1px solid var(--border);border-radius:10px;padding:12px 14px;}
.dc-row-top{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;}
.dc-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:4px;}
.dc-dot-blocked{background:var(--red);box-shadow:0 0 6px rgba(255,107,107,0.5);}
.dc-dot-forwarded{background:var(--green);box-shadow:0 0 6px rgba(0,214,143,0.5);}
.dc-name{font-size:12.5px;font-weight:600;}
.dc-detail{font-size:11px;color:var(--text-3);font-family:var(--mono);margin-top:1px;}
.dc-summary{font-size:12px;color:var(--text-2);line-height:1.5;padding:8px 10px;background:rgba(108,92,231,0.06);border:1px solid rgba(108,92,231,0.12);border-radius:7px;}
.dc-stats{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--border);}
.dc-stat{padding:14px;text-align:center;}
.dc-snum{font-size:20px;font-weight:700;font-family:var(--mono);}
.dc-slbl{font-size:10px;color:var(--text-3);margin-top:2px;text-transform:uppercase;letter-spacing:0.4px;}
.demo-trust{margin-top:24px;display:flex;flex-direction:column;gap:10px;}
.trust-item{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text-2);}
.trust-item::before{content:'✓';width:22px;height:22px;border-radius:50%;background:rgba(0,214,143,0.12);border:1px solid rgba(0,214,143,0.25);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--green);flex-shrink:0;}
`;
