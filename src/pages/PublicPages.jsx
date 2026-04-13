// ─── Shared nav used by all public pages ─────────────────────
import { useNavigate } from 'react-router-dom';

export function PublicNav({ active }) {
  const navigate = useNavigate();
  const go = (path) => (e) => { e.preventDefault(); navigate(path); };

  return (
    <>
      <style>{NAV_CSS}</style>
      <nav className="pub-nav">
        <div className="pub-nav-inner">
          <a href="/" onClick={go('/')} className="pub-logo">
            <PubLogo />
            <span>Gate <span style={{ color: 'var(--accent-2)' }}>AI</span></span>
          </a>
          <ul className="pub-links">
            {[
              ['Capabilities', '/capabilities'],
              ['Pricing', '/pricing'],
              ['Integrations', '/integrations'],
              ['FAQ', '/faq'],
              ['Contact', '/contact'],
            ].map(([label, path]) => (
              <li key={path}>
                <a href={path} onClick={go(path)} className={active === path ? 'active' : ''}>{label}</a>
              </li>
            ))}
          </ul>
          <div className="pub-cta">
            <a href="/auth" onClick={go('/auth')} className="pub-btn-ghost">Sign Up / Sign In</a>
            <a href="/book-demo" onClick={go('/book-demo')} className="pub-btn-primary">Book Demo</a>
          </div>
        </div>
      </nav>
    </>
  );
}

function PubLogo() {
  return <svg width="28" height="28" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="pG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#b8b1ff"/><stop offset="100%" stopColor="#6c5ce7"/></linearGradient><mask id="pM"><rect width="60" height="60" fill="white"/><rect x="22" y="30" width="2.2" height="6" rx="1.1" fill="black"/><rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/><rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/></mask></defs><path d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z" fill="url(#pG)" mask="url(#pM)"/></svg>;
}

function PubFooter() {
  const navigate = useNavigate();
  const go = p => e => { e.preventDefault(); navigate(p); };
  return (
    <footer className="pub-footer">
      <div className="pub-footer-inner">
        <a href="/" onClick={go('/')} className="pub-logo"><PubLogo /><span>Gate <span style={{color:'var(--accent-2)'}}>AI</span></span></a>
        <ul className="pub-footer-links">
          {[['Capabilities','/capabilities'],['Pricing','/pricing'],['Integrations','/integrations'],['FAQ','/faq'],['Contact','/contact'],['Privacy','/privacy'],['Terms','/terms']].map(([l,p])=>(
            <li key={p}><a href={p} onClick={go(p)}>{l}</a></li>
          ))}
        </ul>
        <div className="pub-copy">© 2026 Gate AI, Inc.</div>
      </div>
    </footer>
  );
}

const BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');
:root{--bg:#08090d;--bg-2:#0d0e14;--bg-3:#13141b;--bg-4:#1a1c26;--border:#1f2130;--border-2:#2a2d40;--text:#f0f1f5;--text-2:#9da1b5;--text-3:#5c6078;--accent:#6c5ce7;--accent-2:#a29bfe;--accent-glow:rgba(108,92,231,0.35);--green:#00d68f;--red:#ff6b6b;--font:'DM Sans',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;--radius:14px;--radius-lg:20px;}
*{margin:0;padding:0;box-sizing:border-box;}html{scroll-behavior:smooth;}
body{font-family:var(--font);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;line-height:1.5;}
a{color:inherit;text-decoration:none;cursor:pointer;}
.container{max-width:1100px;margin:0 auto;padding:0 32px;}
@media(max-width:720px){.container{padding:0 20px;}}
.page-hero{padding:100px 0 72px;text-align:center;position:relative;}
.page-hero::before{content:'';position:absolute;top:-40%;left:50%;transform:translateX(-50%);width:800px;height:800px;background:radial-gradient(circle,rgba(108,92,231,0.1) 0%,transparent 55%);pointer-events:none;}
.eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--accent-2);text-transform:uppercase;letter-spacing:1.5px;padding:6px 14px;background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.25);border-radius:100px;margin-bottom:20px;}
.eyebrow::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--accent-2);box-shadow:0 0 8px var(--accent-2);}
.page-title{font-size:clamp(36px,5vw,64px);font-weight:700;letter-spacing:-0.035em;line-height:1.05;margin-bottom:18px;}
.page-sub{font-size:clamp(15px,1.4vw,18px);color:var(--text-2);max-width:560px;margin:0 auto;line-height:1.65;}
.section{padding:72px 0;}
.section-title{font-size:clamp(26px,3vw,40px);font-weight:700;letter-spacing:-0.03em;margin-bottom:14px;}
.section-sub{font-size:15px;color:var(--text-2);line-height:1.65;max-width:600px;}
.btn-accent{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:var(--accent);color:white;border:none;border-radius:100px;font-size:14px;font-weight:600;transition:all 200ms;cursor:pointer;font-family:var(--font);}
.btn-accent:hover{background:#7c6ef0;transform:translateY(-1px);box-shadow:0 8px 24px var(--accent-glow);}
.btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:transparent;color:var(--text);border:1px solid var(--border-2);border-radius:100px;font-size:14px;font-weight:600;transition:all 200ms;cursor:pointer;font-family:var(--font);}
.btn-ghost:hover{background:var(--bg-3);border-color:var(--text-3);}
`;

const NAV_CSS = BASE_CSS + `
.pub-nav{position:sticky;top:0;z-index:100;padding:18px 32px;backdrop-filter:blur(16px);background:rgba(8,9,13,0.85);border-bottom:1px solid rgba(31,33,48,0.6);}
.pub-nav-inner{max-width:1100px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;}
.pub-logo{display:flex;align-items:center;gap:9px;font-size:16px;font-weight:700;letter-spacing:-0.3px;}
.pub-links{display:flex;gap:28px;list-style:none;}
.pub-links a{font-size:13.5px;color:var(--text-2);font-weight:500;transition:color 180ms;}
.pub-links a:hover,.pub-links a.active{color:var(--text);}
.pub-cta{display:flex;gap:10px;align-items:center;}
.pub-btn-primary{padding:9px 18px;background:var(--text);color:var(--bg);border-radius:100px;font-size:13px;font-weight:600;transition:all 200ms;}
.pub-btn-primary:hover{background:white;transform:translateY(-1px);}
.pub-btn-ghost{padding:9px 18px;background:transparent;color:var(--text);border:1px solid var(--border-2);border-radius:100px;font-size:13px;font-weight:600;transition:all 200ms;}
.pub-btn-ghost:hover{background:var(--bg-3);}
.pub-footer{padding:48px 0 36px;border-top:1px solid var(--border);margin-top:80px;}
.pub-footer-inner{max-width:1100px;margin:0 auto;padding:0 32px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;}
.pub-footer-links{display:flex;gap:24px;list-style:none;flex-wrap:wrap;}
.pub-footer-links a{font-size:13px;color:var(--text-3);transition:color 180ms;}
.pub-footer-links a:hover{color:var(--text);}
.pub-copy{font-size:12px;color:var(--text-3);}
@media(max-width:820px){.pub-links{display:none;}.pub-nav{padding:14px 20px;}}
`;

// ═══════════════════════════════════════════════════════════════
// PRICING PAGE
// ═══════════════════════════════════════════════════════════════
export function Pricing() {
  const navigate = useNavigate();
  const go = p => e => { e.preventDefault(); navigate(p); };

  const tiers = [
    { name: 'Starter', price: 79, desc: 'For small teams getting 5–20 calls a day.', features: ['1 phone number', 'Up to 3 team members', 'AI cold-call blocking', 'Call summaries by email', 'Slack notifications', '14-day free trial'], cta: 'Get started', path: '/auth?plan=starter', featured: false },
    { name: 'Pro', price: 149, desc: 'Built for logistics and manufacturing SMBs with real inbound call volume.', features: ['3 phone numbers', 'Unlimited team members', 'SMS + Slack + Email alerts', 'Custom AI screening scripts', 'Intent-based smart routing', 'Analytics dashboard', '14-day free trial'], cta: 'Get started', path: '/auth?plan=pro', featured: true },
    { name: 'Business', price: 249, desc: 'For multi-location operations that need custom integrations and priority support.', features: ['Unlimited phone numbers', 'Priority support (4h SLA)', 'CRM integrations', 'Advanced analytics', 'Dedicated account manager', 'Custom voice cloning'], cta: 'Contact sales', path: '/contact', featured: false },
  ];

  return (
    <>
      <PublicNav active="/pricing" />
      <style>{PRICING_CSS}</style>
      <div className="page-hero">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="eyebrow">Pricing</div>
          <h1 className="page-title">One flat price.<br />No per-minute surprises.</h1>
          <p className="page-sub">Start with a 14-day free trial. No credit card required. Cancel anytime.</p>
        </div>
      </div>

      <div className="section">
        <div className="container">
          <div className="pricing-grid">
            {tiers.map(tier => (
              <div key={tier.name} className={`tier${tier.featured ? ' featured' : ''}`}>
                <div className="tier-name">{tier.name}</div>
                <div className="tier-price"><span className="num">${tier.price}</span><span className="per">/ month</span></div>
                <div className="tier-desc">{tier.desc}</div>
                <ul className="tier-features">{tier.features.map((f, i) => <li key={i}>{f}</li>)}</ul>
                <a href={tier.path} onClick={go(tier.path)} className={tier.featured ? 'btn-accent tier-btn' : 'btn-ghost tier-btn'}>{tier.cta}</a>
              </div>
            ))}
          </div>

          <div className="pricing-faq">
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 40 }}>Pricing questions</h2>
            <div className="pfaq-grid">
              {[
                { q: 'Is there a free trial?', a: 'Yes — all plans include a 14-day free trial with no credit card required. Your phone number is provisioned automatically when you sign up.' },
                { q: 'What counts as a "call"?', a: 'Every inbound call to your Gate AI number counts, including blocked ones. Your flat monthly subscription covers typical SMB call volume.' },
                { q: 'Can I change plans?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.' },
                { q: 'Do you charge per minute?', a: 'No. That\'s the point. Your subscription covers your call volume — we absorb the AI and telephony costs.' },
                { q: 'What if I go over my plan limits?', a: 'You\'ll get a notification. Overage charges apply at $0.10/min beyond plan limits, giving you a natural path to upgrade.' },
                { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your dashboard at any time. Your service continues until the end of your billing period.' },
              ].map((item, i) => (
                <div key={i} className="pfaq-item">
                  <div className="pfaq-q">{item.q}</div>
                  <div className="pfaq-a">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <PubFooter />
    </>
  );
}

const PRICING_CSS = NAV_CSS + `
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1000px;margin:0 auto;}
@media(max-width:900px){.pricing-grid{grid-template-columns:1fr;max-width:440px;}}
.tier{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:36px 32px;display:flex;flex-direction:column;gap:12px;transition:all 250ms;}
.tier:hover{border-color:var(--border-2);transform:translateY(-3px);}
.tier.featured{border-color:var(--accent);background:linear-gradient(180deg,rgba(108,92,231,0.08),var(--bg-2));box-shadow:0 20px 60px -20px var(--accent-glow);position:relative;}
.tier.featured::before{content:'Most Popular';position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--accent);color:white;font-size:11px;font-weight:600;padding:5px 14px;border-radius:100px;text-transform:uppercase;letter-spacing:0.8px;}
.tier-name{font-size:13px;color:var(--text-2);font-weight:600;text-transform:uppercase;letter-spacing:1px;}
.tier-price{display:flex;align-items:baseline;gap:6px;}
.tier-price .num{font-size:52px;font-weight:700;letter-spacing:-0.035em;line-height:1;}
.tier-price .per{font-size:14px;color:var(--text-3);}
.tier-desc{font-size:13.5px;color:var(--text-2);line-height:1.55;padding-bottom:16px;border-bottom:1px solid var(--border);}
.tier-features{list-style:none;display:flex;flex-direction:column;gap:10px;flex:1;}
.tier-features li{font-size:13.5px;color:var(--text-2);display:flex;align-items:center;gap:9px;}
.tier-features li::before{content:'';min-width:16px;height:16px;border-radius:50%;background:rgba(0,214,143,0.14);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2300d68f' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center;}
.tier-btn{justify-content:center;width:100%;margin-top:auto;}
.pricing-faq{margin-top:96px;}
.pfaq-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;}
@media(max-width:720px){.pfaq-grid{grid-template-columns:1fr;}}
.pfaq-item{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);padding:28px;}
.pfaq-q{font-size:15px;font-weight:600;margin-bottom:10px;}
.pfaq-a{font-size:14px;color:var(--text-2);line-height:1.65;}
`;

// ═══════════════════════════════════════════════════════════════
// CAPABILITIES PAGE
// ═══════════════════════════════════════════════════════════════
export function Capabilities() {
  const navigate = useNavigate();
  const caps = [
    { num: '01', title: 'Cold-call detection in under 10 seconds', desc: 'Our AI listens to the opening line and classifies intent before the caller finishes their pitch. Solar, SEO, warranties, robocalls — identified and blocked.', demo: { prompt: 'caller:', speech: '"Hi, I\'m calling about your commercial solar..."', result: '→ blocked (98% confidence)', bad: true } },
    { num: '02', title: 'Polite rejection in your voice', desc: 'Cold callers hear a professional, branded decline message — not dead air. Your rejection script is fully customisable and stored in your dashboard.', demo: { prompt: 'gate-ai:', speech: '"Thanks for calling. We\'re not taking unsolicited calls right now. Have a good day."' } },
    { num: '03', title: 'Smart routing by intent', desc: 'Legitimate callers get matched to the right employee based on what they\'re calling about. Logistics goes to ops, vendors go to purchasing, IT goes to IT.', demo: { prompt: 'intent:', speech: 'Logistics Coordination', result: '→ Dave M. (Ops Manager, ext. 201)' } },
    { num: '04', title: 'Pre-call AI briefings', desc: 'Before the phone rings, the employee already sees a one-line summary of who\'s calling and why. No more "who was that?" after every call.', demo: { prompt: 'summary:', speech: 'Daniel at AB Logistics re: Tuesday pickup — needs dock #3 confirmation.' } },
    { num: '05', title: 'Whitelist & VIP bypass', desc: 'Known contacts — clients, partners, suppliers — skip the AI entirely and ring straight through. Whitelist by number, company domain, or name.', demo: { prompt: 'whitelist:', speech: '+1 (214) 882-3301 (AB Logistics)', result: '→ Direct forward, no screening' } },
    { num: '06', title: 'Full call log & analytics', desc: 'Every call is logged with transcript, intent score, confidence level, and outcome. Your dashboard shows block rates, top blocked patterns, and cost savings.', demo: { prompt: 'logged:', speech: '127 calls this week · 94% blocked · 12hrs saved' } },
  ];

  return (
    <>
      <PublicNav active="/capabilities" />
      <style>{CAPS_CSS}</style>
      <div className="page-hero">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="eyebrow">Capabilities</div>
          <h1 className="page-title">Four things. All at once.<br />Every single call.</h1>
          <p className="page-sub">Gate AI is not a voicemail menu. It's a real conversational agent powered by Vapi, Twilio, and Claude.</p>
        </div>
      </div>
      <div className="section">
        <div className="container">
          <div className="caps-grid">
            {caps.map(cap => (
              <div key={cap.num} className="cap">
                <span className="cap-num">{cap.num}</span>
                <h3>{cap.title}</h3>
                <p>{cap.desc}</p>
                <div className="cap-demo">
                  <span className="cap-prompt">{cap.demo.prompt} </span>
                  <span className="cap-speech">"{cap.demo.speech}"</span>
                  {cap.demo.result && <><br /><span className={cap.demo.bad ? 'cap-result-bad' : 'cap-result'}>{cap.demo.result}</span></>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 64 }}>
            <a className="btn-accent" onClick={() => navigate('/book-demo')}>See it live — Book a Demo →</a>
          </div>
        </div>
      </div>
      <PubFooter />
    </>
  );
}

const CAPS_CSS = NAV_CSS + `
.caps-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;}
@media(max-width:720px){.caps-grid{grid-template-columns:1fr;}}
.cap{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:36px;transition:all 250ms;position:relative;overflow:hidden;}
.cap::before{content:'';position:absolute;top:0;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);opacity:0;transition:opacity 300ms;}
.cap:hover{border-color:var(--border-2);transform:translateY(-3px);}
.cap:hover::before{opacity:1;}
.cap-num{font-family:var(--mono);font-size:11px;color:var(--accent-2);letter-spacing:1px;margin-bottom:16px;display:block;font-weight:500;}
.cap h3{font-size:22px;font-weight:700;letter-spacing:-0.02em;margin-bottom:12px;}
.cap p{font-size:14px;color:var(--text-2);line-height:1.65;margin-bottom:20px;}
.cap-demo{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px 16px;font-family:var(--mono);font-size:12.5px;line-height:1.7;}
.cap-prompt{color:var(--accent-2);}
.cap-speech{color:var(--text-2);}
.cap-result{color:var(--green);}
.cap-result-bad{color:var(--red);}
`;

// ═══════════════════════════════════════════════════════════════
// INTEGRATIONS PAGE
// ═══════════════════════════════════════════════════════════════
export function Integrations() {
  const integrations = [
    { id: 'twilio',    name: 'Twilio',          file: 'twilio.png',           category: 'Telephony',      color: '#f22f46', desc: 'Gate AI is built on Twilio. Every inbound call is handled through Twilio\'s voice infrastructure — giving you carrier-grade reliability and a real phone number that works anywhere.' },
    { id: 'vapi',      name: 'Vapi',             file: 'vapi.svg',             category: 'AI Voice',       color: '#6c5ce7', desc: 'Vapi powers the real-time voice AI that screens every call. It handles speech-to-text, the Claude LLM reasoning engine, and text-to-speech in a single sub-500ms loop.' },
    { id: 'openphone', name: 'OpenPhone',        file: 'openphone.png',        category: 'Business Phone', color: '#5865f2', desc: 'Connect Gate AI as a screening layer in front of your OpenPhone workspace. Cold calls never reach your team.' },
    { id: 'ringcentral',name:'RingCentral',      file: 'RingCentral.webp',     category: 'Business Phone', color: '#ff8800', desc: 'Route inbound calls through Gate AI before they hit your RingCentral system. Works via SIP forwarding.' },
    { id: 'avaya',     name: 'Avaya',            file: 'avaya.png',            category: 'Enterprise',     color: '#cc0000', desc: 'Enterprise SIP integration with Avaya communications platforms for large-scale manufacturing and logistics operations.' },
    { id: 'talkroute', name: 'Talkroute',        file: 'talkroute.png',        category: 'Business Phone', color: '#00b894', desc: 'Forward your Talkroute number to Gate AI for screening, then route approved calls back to your team.' },
    { id: 'slack',     name: 'Slack',            file: 'slack.png',            category: 'Notifications',  color: '#e01e5a', desc: 'Get instant Slack alerts when calls are blocked, forwarded, or flagged. Call summaries and daily digests delivered to any channel.' },
    { id: 'teams',     name: 'Microsoft Teams',  file: 'microsoft-teams.png',  category: 'Notifications',  color: '#5059c9', desc: 'Push call notifications and AI summaries directly into Teams channels. Keep your team informed without leaving their workspace.' },
    { id: 'email',     name: 'Email / SMTP',     file: 'email.webp',           category: 'Notifications',  color: '#ffa94d', desc: 'Transactional email notifications for call summaries, blocked call reports, and daily digest emails sent to employees and admins.' },
    { id: 'zapier',    name: 'Zapier',           file: 'zapier.webp',          category: 'Automation',     color: '#ff4a00', desc: 'Connect Gate AI to 5,000+ apps with custom automation workflows. Trigger actions in your CRM, helpdesk, or any other tool when calls happen.' },
  ];

  return (
    <>
      <PublicNav active="/integrations" />
      <style>{INT_CSS}</style>
      <div className="page-hero">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="eyebrow">Integrations</div>
          <h1 className="page-title">Works with the stack<br />you already have.</h1>
          <p className="page-sub">Gate AI plugs into your existing phone system and notification tools — no ripping and replacing.</p>
        </div>
      </div>
      <div className="section">
        <div className="container">
          <div className="int-grid">
            {integrations.map(int => (
              <div key={int.id} id={int.id} className="int-card">
                <div className="int-icon" style={{ background: int.color + '15' }}>
                  <img src={`/images/integrations/${int.file}`} alt={int.name} style={{width:'30px',height:'30px',objectFit:'contain',borderRadius:'4px'}} />
                </div>
                <div className="int-body">
                  <div className="int-header">
                    <div className="int-name">{int.name}</div>
                    <span className="int-cat">{int.category}</span>
                  </div>
                  <p className="int-desc">{int.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PubFooter />
    </>
  );
}

const INT_CSS = NAV_CSS + `
.int-grid{display:flex;flex-direction:column;gap:16px;}
.int-card{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:28px;display:flex;gap:20px;align-items:flex-start;transition:all 250ms;}
.int-card:hover{border-color:var(--border-2);transform:translateX(4px);}
.int-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0;}
.int-body{flex:1;}
.int-header{display:flex;align-items:center;gap:12px;margin-bottom:8px;}
.int-name{font-size:16px;font-weight:700;}
.int-cat{font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.8px;background:var(--bg-4);border:1px solid var(--border);border-radius:100px;padding:3px 10px;}
.int-desc{font-size:14px;color:var(--text-2);line-height:1.65;}
`;

// ═══════════════════════════════════════════════════════════════
// FAQ PAGE
// ═══════════════════════════════════════════════════════════════
export function FAQ() {
  const faqs = [
    { q: 'How long does setup take?', a: 'Under 10 minutes. You sign up, we automatically provision a phone number, you configure your team and routing rules, and you\'re live. Most customers handle their first real call within an hour.' },
    { q: 'Will Gate AI replace my receptionist?', a: 'It depends. Gate AI handles every inbound call before it gets to a human — for many SMBs that removes the need for a part-time receptionist entirely. For larger teams, it works as a force multiplier: your receptionist only sees the 10–20% of calls that actually matter.' },
    { q: 'What happens if the AI misclassifies a call?', a: 'You get the transcript, the recording, and the confidence score for every call. You can whitelist numbers instantly, adjust screening rules, and provide corrections. In practice, cold-call detection is 94%+ accurate out of the box.' },
    { q: 'Does it work with my existing phone system?', a: 'Yes. Gate AI plugs into Twilio, OpenPhone, RingCentral, Talkroute, and Avaya. If you have a SIP-capable system, we can route calls through Gate AI as a screening layer without replacing your main phone system.' },
    { q: 'What about VIP callers — clients who should never be screened?', a: 'Add them to your whitelist. VIP callers skip the AI entirely and ring through directly. You can whitelist by phone number, company domain, or individual name.' },
    { q: 'How much does it actually cost per call?', a: 'Less than you think. The average blocked cold call costs us about 3 cents in AI and telephony fees. Your flat monthly subscription covers typical SMB call volume with plenty of headroom.' },
    { q: 'Can I use my existing phone number?', a: 'Yes — you can port your existing number to Gate AI. The porting process typically takes 5–10 business days. In the meantime you can use your provisioned Gate AI number immediately.' },
    { q: 'What AI model powers Gate AI?', a: 'Gate AI uses Anthropic\'s Claude Haiku for real-time intent classification and call summarisation, combined with Deepgram for speech-to-text and ElevenLabs for text-to-speech — all orchestrated through Vapi.' },
    { q: 'Is my call data secure?', a: 'Yes. All call data is encrypted in transit and at rest. We do not sell or share your data. Each company\'s data is fully isolated in a multi-tenant architecture.' },
    { q: 'Do you offer a free trial?', a: 'Yes — all plans come with a 14-day free trial. No credit card required. Your phone number is provisioned automatically when you sign up.' },
  ];

  return (
    <>
      <PublicNav active="/faq" />
      <style>{FAQ_CSS}</style>
      <div className="page-hero">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="eyebrow">FAQ</div>
          <h1 className="page-title">Questions?<br />We've got answers.</h1>
          <p className="page-sub">Everything you need to know about Gate AI before getting started.</p>
        </div>
      </div>
      <div className="section">
        <div className="container">
          <div className="faq-list">
            {faqs.map((item, i) => (
              <details key={i} className="faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <p style={{ color: 'var(--text-2)', marginBottom: 20 }}>Still have questions?</p>
            <a className="btn-accent" onClick={() => useNavigateHook('/contact')}>Contact us →</a>
          </div>
        </div>
      </div>
      <PubFooter />
    </>
  );
}

// workaround for FAQ CTA
function useNavigateHook(path) {
  // This is called directly, not as a hook — handled via inline navigate below
}

export function FAQPage() {
  const navigate = useNavigate();
  const faqs = [
    { q: 'How long does setup take?', a: 'Under 10 minutes. You sign up, we automatically provision a phone number, you configure your team and routing rules, and you\'re live. Most customers handle their first real call within an hour.' },
    { q: 'Will Gate AI replace my receptionist?', a: 'It depends. Gate AI handles every inbound call before it gets to a human — for many SMBs that removes the need for a part-time receptionist entirely. For larger teams, it works as a force multiplier: your receptionist only sees the 10–20% of calls that actually matter.' },
    { q: 'What happens if the AI misclassifies a call?', a: 'You get the transcript, the recording, and the confidence score for every call. You can whitelist numbers instantly, adjust screening rules, and provide corrections. In practice, cold-call detection is 94%+ accurate out of the box.' },
    { q: 'Does it work with my existing phone system?', a: 'Yes. Gate AI plugs into Twilio, OpenPhone, RingCentral, Talkroute, and Avaya. If you have a SIP-capable system, we can route calls through Gate AI as a screening layer without replacing your main phone system.' },
    { q: 'What about VIP callers — clients who should never be screened?', a: 'Add them to your whitelist. VIP callers skip the AI entirely and ring through directly. You can whitelist by phone number, company domain, or individual name.' },
    { q: 'How much does it actually cost per call?', a: 'Less than you think. The average blocked cold call costs us about 3 cents in AI and telephony fees. Your flat monthly subscription covers typical SMB call volume with plenty of headroom.' },
    { q: 'Can I use my existing phone number?', a: 'Yes — you can port your existing number to Gate AI. The porting process typically takes 5–10 business days. In the meantime you can use your provisioned Gate AI number immediately.' },
    { q: 'What AI model powers Gate AI?', a: 'Gate AI uses Anthropic\'s Claude Haiku for real-time intent classification and call summarisation, combined with Deepgram for speech-to-text and ElevenLabs for text-to-speech — all orchestrated through Vapi.' },
    { q: 'Is my call data secure?', a: 'Yes. All call data is encrypted in transit and at rest. We do not sell or share your data. Each company\'s data is fully isolated in a multi-tenant architecture.' },
    { q: 'Do you offer a free trial?', a: 'Yes — all plans come with a 14-day free trial. No credit card required. Your phone number is provisioned automatically when you sign up.' },
  ];

  return (
    <>
      <PublicNav active="/faq" />
      <style>{FAQ_CSS}</style>
      <div className="page-hero">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="eyebrow">FAQ</div>
          <h1 className="page-title">Questions?<br />We've got answers.</h1>
          <p className="page-sub">Everything you need to know about Gate AI before getting started.</p>
        </div>
      </div>
      <div className="section">
        <div className="container">
          <div className="faq-list">
            {faqs.map((item, i) => (
              <details key={i} className="faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <p style={{ color: 'var(--text-2)', marginBottom: 20, fontSize: 15 }}>Still have questions?</p>
            <a className="btn-accent" onClick={() => navigate('/contact')}>Contact us →</a>
          </div>
        </div>
      </div>
      <PubFooter />
    </>
  );
}

const FAQ_CSS = NAV_CSS + `
.faq-list{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:10px;}
.faq-item{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;transition:all 200ms;}
.faq-item[open]{border-color:var(--border-2);}
.faq-item summary{padding:22px 28px;cursor:pointer;font-size:15.5px;font-weight:600;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:20px;}
.faq-item summary::-webkit-details-marker{display:none;}
.faq-item summary::after{content:'+';font-size:24px;color:var(--text-3);font-weight:300;transition:transform 200ms;line-height:1;flex-shrink:0;}
.faq-item[open] summary::after{transform:rotate(45deg);color:var(--accent-2);}
.faq-item p{padding:0 28px 24px;color:var(--text-2);font-size:14.5px;line-height:1.7;}
`;

// ═══════════════════════════════════════════════════════════════
// CONTACT PAGE
// ═══════════════════════════════════════════════════════════════
export function Contact() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setDone(true);
  }

  return (
    <>
      <PublicNav active="/contact" />
      <style>{CONTACT_CSS}</style>
      <div className="page-hero">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="eyebrow">Contact</div>
          <h1 className="page-title">Get in touch.</h1>
          <p className="page-sub">Have a question, want a demo, or need help with something? We typically respond within 1 business day.</p>
        </div>
      </div>
      <div className="section">
        <div className="container">
          <div className="contact-layout">
            <div className="contact-left">
              {!done ? (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="field"><label>Your name</label><input type="text" placeholder="John Smith" value={form.name} onChange={set('name')} /></div>
                  <div className="field"><label>Email</label><input type="email" placeholder="john@company.com" value={form.email} onChange={set('email')} /></div>
                  <div className="field"><label>Company <span style={{color:'var(--text-3)',fontWeight:400,textTransform:'none'}}>(optional)</span></label><input type="text" placeholder="Acme Logistics" value={form.company} onChange={set('company')} /></div>
                  <div className="field"><label>Message</label><textarea placeholder="How can we help?" value={form.message} onChange={set('message')} style={{ minHeight: 140 }} /></div>
                  <button type="submit" className="btn-accent" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                    {loading ? 'Sending...' : 'Send message →'}
                  </button>
                </form>
              ) : (
                <div className="contact-success">
                  <div className="cs-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h3>Message sent.</h3>
                  <p>We'll get back to you within 1 business day. Want to explore in the meantime? <a onClick={() => navigate('/auth')}>Create a free account</a> or <a onClick={() => navigate('/book-demo')}>book a demo</a>.</p>
                </div>
              )}
            </div>
            <div className="contact-right">
              {[
                { icon: '✉', label: 'Email', value: 'hello@gateai.io', sub: 'General enquiries' },
                { icon: '📅', label: 'Book a Demo', value: 'Schedule a call', sub: '20 mins, no pressure', action: () => navigate('/book-demo') },
                { icon: '⚡', label: 'Response time', value: '< 1 business day', sub: 'Mon–Fri, 9am–6pm CT' },
              ].map((item, i) => (
                <div key={i} className="contact-info" onClick={item.action} style={{ cursor: item.action ? 'pointer' : 'default' }}>
                  <div className="ci-icon">{item.icon}</div>
                  <div>
                    <div className="ci-label">{item.label}</div>
                    <div className="ci-value">{item.value}</div>
                    <div className="ci-sub">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <PubFooter />
    </>
  );
}

const CONTACT_CSS = NAV_CSS + `
.contact-layout{display:grid;grid-template-columns:1fr 360px;gap:64px;align-items:start;max-width:860px;margin:0 auto;}
@media(max-width:820px){.contact-layout{grid-template-columns:1fr;}}
.contact-form{display:flex;flex-direction:column;gap:0;}
.field{margin-bottom:16px;}
label{display:block;font-size:11.5px;font-weight:600;color:var(--text-2);margin-bottom:7px;letter-spacing:0.3px;text-transform:uppercase;}
input,textarea{width:100%;background:var(--bg-3);border:1px solid var(--border-2);border-radius:10px;padding:12px 14px;font-size:14px;color:var(--text);font-family:var(--font);transition:border-color 200ms,box-shadow 200ms;outline:none;}
input:focus,textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(108,92,231,0.15);}
input::placeholder,textarea::placeholder{color:var(--text-3);}
textarea{resize:vertical;}
.contact-success{background:var(--bg-3);border:1px solid var(--border);border-radius:16px;padding:40px;text-align:center;}
.cs-icon{width:56px;height:56px;border-radius:50%;background:rgba(0,214,143,0.12);border:1px solid rgba(0,214,143,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;}
.contact-success h3{font-size:20px;font-weight:700;margin-bottom:10px;}
.contact-success p{font-size:14px;color:var(--text-2);line-height:1.6;}
.contact-success a{color:var(--accent-2);font-weight:500;}
.contact-right{display:flex;flex-direction:column;gap:16px;padding-top:8px;}
.contact-info{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);padding:22px;display:flex;align-items:flex-start;gap:16px;transition:border-color 200ms;}
.contact-info:hover{border-color:var(--border-2);}
.ci-icon{font-size:20px;flex-shrink:0;width:40px;height:40px;background:var(--bg-3);border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;justify-content:center;}
.ci-label{font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;}
.ci-value{font-size:14.5px;font-weight:600;color:var(--text);margin-bottom:2px;}
.ci-sub{font-size:12px;color:var(--text-3);}
`;

// ═══════════════════════════════════════════════════════════════
// PRIVACY PAGE
// ═══════════════════════════════════════════════════════════════
export function Privacy() {
  return (
    <>
      <PublicNav />
      <style>{LEGAL_CSS}</style>
      <div className="legal-page">
        <div className="container">
          <div className="legal-header">
            <div className="eyebrow">Privacy Policy</div>
            <h1 className="page-title" style={{ textAlign: 'left', fontSize: 'clamp(28px,4vw,48px)' }}>Privacy Policy</h1>
            <p className="legal-updated">Last updated: April 2026</p>
          </div>
          <div className="legal-body">
            {[
              { title: '1. Information We Collect', body: 'We collect information you provide directly to us when you create an account, including your name, email address, company name, and payment information. We also collect data generated by your use of Gate AI, including call logs, transcripts, screening configurations, and usage analytics.' },
              { title: '2. How We Use Your Information', body: 'We use the information we collect to provide, maintain, and improve Gate AI, process transactions, send service notifications, respond to your requests, and ensure compliance with our Terms of Service. We do not sell your personal information to third parties.' },
              { title: '3. Call Data & Transcripts', body: 'Call transcripts and recordings are stored securely and used solely to provide the Gate AI service (including generating summaries and improving detection accuracy). Your call data is isolated to your company account and is not shared with other Gate AI customers.' },
              { title: '4. Data Retention', body: 'Call logs and transcripts are retained for 90 days by default. Account data is retained for the duration of your subscription plus 30 days following cancellation. You may request deletion of your data at any time by contacting us.' },
              { title: '5. Security', body: 'We implement industry-standard security measures including encryption in transit (TLS) and at rest, access controls, and regular security audits. No method of transmission over the internet is 100% secure, however we take reasonable steps to protect your information.' },
              { title: '6. Third-Party Services', body: 'Gate AI uses the following third-party services to deliver its functionality: Twilio (telephony), Vapi (voice AI), Anthropic (LLM), Deepgram (speech-to-text), ElevenLabs (text-to-speech), Stripe (payments), and Railway (hosting). Each service has their own privacy policies governing your data.' },
              { title: '7. Contact Us', body: 'If you have questions about this Privacy Policy or how we handle your data, contact us at privacy@gateai.io.' },
            ].map((section, i) => (
              <div key={i} className="legal-section">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PubFooter />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// TERMS PAGE
// ═══════════════════════════════════════════════════════════════
export function Terms() {
  return (
    <>
      <PublicNav />
      <style>{LEGAL_CSS}</style>
      <div className="legal-page">
        <div className="container">
          <div className="legal-header">
            <div className="eyebrow">Terms of Service</div>
            <h1 className="page-title" style={{ textAlign: 'left', fontSize: 'clamp(28px,4vw,48px)' }}>Terms of Service</h1>
            <p className="legal-updated">Last updated: April 2026</p>
          </div>
          <div className="legal-body">
            {[
              { title: '1. Acceptance of Terms', body: 'By accessing or using Gate AI, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the service.' },
              { title: '2. Description of Service', body: 'Gate AI provides an AI-powered call screening and routing platform for businesses. The service includes a dedicated phone number, AI call screening, call logging, team routing, and notification features as described on our pricing page.' },
              { title: '3. Account Registration', body: 'You must create an account to use Gate AI. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You must provide accurate and complete information when creating your account.' },
              { title: '4. Subscription and Payment', body: 'Gate AI is offered on a subscription basis. Fees are charged monthly in advance. All fees are non-refundable except as expressly stated in these Terms. We reserve the right to change pricing with 30 days notice.' },
              { title: '5. Acceptable Use', body: 'You may not use Gate AI for any unlawful purpose, to harass or deceive callers, to record calls without legally required consent, or to violate any applicable laws or regulations. You are responsible for complying with all applicable call recording and disclosure laws in your jurisdiction.' },
              { title: '6. Call Recording Compliance', body: 'Some jurisdictions require that all parties to a telephone call consent to recording. You are solely responsible for ensuring that your use of Gate AI complies with applicable wiretapping and call recording laws. Gate AI is not responsible for any legal liability arising from your use of the service.' },
              { title: '7. Limitation of Liability', body: 'Gate AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages. Our total liability to you shall not exceed the fees paid by you in the three months preceding the claim.' },
              { title: '8. Termination', body: 'You may cancel your subscription at any time from your dashboard. We reserve the right to terminate or suspend your account for violation of these Terms. Upon termination, your access to the service will cease.' },
              { title: '9. Contact', body: 'For questions about these Terms, contact us at legal@gateai.io.' },
            ].map((section, i) => (
              <div key={i} className="legal-section">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PubFooter />
    </>
  );
}

const LEGAL_CSS = NAV_CSS + `
.legal-page{padding:80px 0;}
.legal-header{max-width:760px;margin-bottom:56px;}
.legal-updated{font-size:13px;color:var(--text-3);margin-top:12px;}
.legal-body{max-width:760px;display:flex;flex-direction:column;gap:0;}
.legal-section{padding:28px 0;border-bottom:1px solid var(--border);}
.legal-section:last-child{border-bottom:none;}
.legal-section h2{font-size:17px;font-weight:700;margin-bottom:12px;letter-spacing:-0.01em;}
.legal-section p{font-size:14.5px;color:var(--text-2);line-height:1.75;}
`;
