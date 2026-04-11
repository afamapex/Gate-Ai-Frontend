import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll reveal
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // Stat counter animation
    const statIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.target, 10);
        if (!target) { statIO.unobserve(el); return; }
        let cur = 0;
        const step = Math.max(1, Math.ceil(target / 40));
        const tick = () => {
          cur += step;
          if (cur >= target) cur = target;
          if (el.dataset.target === '24') {
            el.innerHTML = cur + '<span style="font-size:0.5em;color:var(--text-3)">/7</span>';
          } else if (el.dataset.target === '12') {
            el.innerHTML = cur + '<span style="font-size:0.5em;color:var(--text-3)">hrs/wk</span>';
          } else {
            el.innerHTML = cur + '%';
          }
          if (cur < target) requestAnimationFrame(tick);
        };
        tick();
        statIO.unobserve(el);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.stat-num[data-target]').forEach(el => statIO.observe(el));

    return () => { io.disconnect(); statIO.disconnect(); };
  }, []);

  const goLogin  = (e) => { e.preventDefault(); navigate('/login'); };
  const goSignup = (e) => { e.preventDefault(); navigate('/login'); };

  return (
    <>
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="logo" style={{ gap: 12 }}>
            <NavLogo />
            <span style={{ fontFamily: "Inter,'DM Sans',sans-serif", fontWeight: 600, letterSpacing: '-0.3px' }}>
              Gate<span style={{ color: 'var(--accent-2)', fontWeight: 500 }}> AI</span>
            </span>
          </a>
          <ul className="nav-links">
            <li><a href="#capabilities">Capabilities</a></li>
            <li><a href="#integrations">Integrations</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <div className="nav-cta">
            <a href="/login" onClick={goLogin} className="btn btn-ghost" style={{ padding: '10px 20px', fontSize: 13 }}>Sign in</a>
            <a href="/login" onClick={goSignup} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>Start free trial</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="eyebrow">AI Call Screening · Built for SMBs</div>
          <h1 className="h-display">
            Block the noise.<br />
            Forward what <span className="accent">matters.</span>
          </h1>
          <p className="hero-lede">
            Gate AI answers every incoming call, detects cold sales pitches in seconds, and routes legitimate calls to the right person — with a full AI summary before the phone even rings.
          </p>
          <div className="hero-ctas">
            <a href="/login" onClick={goSignup} className="btn btn-primary">Start free trial →</a>
            <a href="#capabilities" className="btn btn-ghost">See how it works</a>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-inner">
              <div className="hv-bar">
                <div className="hv-dot" /><div className="hv-dot" /><div className="hv-dot" />
                <span>gate-ai · live screening · +1 (833) 714-2521</span>
              </div>
              <div className="hv-body">
                <div className="hv-call">
                  <div className="hv-call-row incoming">
                    <span className="hv-pill pill-orange">Screening</span>
                    <strong>Incoming call</strong>
                    <span>· unknown caller</span>
                    <span className="hv-mono">09:42</span>
                  </div>
                  <div className="hv-call-row blocked">
                    <span className="hv-pill pill-red">Blocked</span>
                    <strong>SolarMax Inc.</strong>
                    <span>· cold sales pitch</span>
                    <span className="hv-mono">09:38</span>
                  </div>
                  <div className="hv-call-row forwarded">
                    <span className="hv-pill pill-green">Forwarded</span>
                    <strong>Daniel R.</strong>
                    <span>· AB Logistics → Dave</span>
                    <span className="hv-mono">09:14</span>
                  </div>
                  <div className="hv-call-row blocked">
                    <span className="hv-pill pill-red">Blocked</span>
                    <strong>Digital Marketing Pro</strong>
                    <span>· SEO pitch</span>
                    <span className="hv-mono">09:02</span>
                  </div>
                </div>
                <div className="hv-summary">
                  <div className="hv-summary-label">AI Summary</div>
                  <div className="hv-summary-caller">Daniel — AB Logistics</div>
                  <div className="hv-summary-text">
                    Calling about the Tuesday pickup. Needs confirmation of dock #3 availability before dispatching the driver.
                  </div>
                  <div className="hv-summary-meta">
                    <span className="hv-tag">Logistics</span>
                    <span className="hv-tag">97% confidence</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="industries">
        <div className="container">
          <div className="industries-label">Built for the industries that pick up every call</div>
          <div className="industries-grid">
            {[
              { label: 'Logistics & Freight', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
              { label: 'Manufacturing', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20"/><path d="M4 20V8l8-5 8 5v12"/><path d="M10 20v-6h4v6"/></svg> },
              { label: 'Warehousing', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-7L10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg> },
              { label: 'Construction', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> },
              { label: 'Distribution', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/></svg> },
              { label: 'Fleet Services', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg> },
              { label: 'Industrial Services', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33"/></svg> },
            ].map((item, i) => (
              <div key={i} className="industry-chip">{item.icon}{item.label}</div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="container">
          <div className="stats-head reveal">
            <div className="eyebrow">The numbers after 30 days</div>
            <h2 className="h-section">Real results from real call logs.</h2>
          </div>
          <div className="stats-grid reveal">
            <div className="stat">
              <div className="stat-num" data-target="94">0%</div>
              <div className="stat-label">of cold calls<br />blocked automatically</div>
            </div>
            <div className="stat">
              <div className="stat-num" data-target="12">0<span style={{ fontSize: '0.5em', color: 'var(--text-3)' }}>hrs/wk</span></div>
              <div className="stat-label">saved per team<br />on unwanted calls</div>
            </div>
            <div className="stat">
              <div className="stat-num" data-target="24">24<span style={{ fontSize: '0.5em', color: 'var(--text-3)' }}>/7</span></div>
              <div className="stat-label">coverage,<br />no shifts, no sick days</div>
            </div>
            <div className="stat">
              <div className="stat-num">$0</div>
              <div className="stat-label">upfront cost —<br />7 day free trial</div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="problem">
        <div className="container">
          <div className="problem-head reveal">
            <div className="eyebrow">The Problem</div>
            <h2 className="h-section">Cold calls are eating your day.</h2>
            <p className="lede">The average logistics SMB fields 15–40 cold sales calls every single day. Every one interrupts a dispatcher, a driver, or a manager who should be moving freight.</p>
          </div>
          <div className="problem-grid">
            <div className="problem-card reveal">
              <div className="big">25<span className="unit">calls/day</span></div>
              <div className="head">Unwanted sales calls</div>
              <div className="sub">The median logistics SMB logs 25 cold pitches per day — solar, insurance, SEO, warranties, the works.</div>
            </div>
            <div className="problem-card reveal">
              <div className="big">3<span className="unit">min each</span></div>
              <div className="head">Stolen from real work</div>
              <div className="sub">Every cold call costs 2–5 minutes between answering, declining, and refocusing. That's over an hour a day, per employee.</div>
            </div>
            <div className="problem-card reveal">
              <div className="big">$14k<span className="unit">/year</span></div>
              <div className="head">Wasted payroll</div>
              <div className="sub">At $25/hour loaded cost, a 5-person ops team loses roughly $14,000 a year to calls that should never have been picked up.</div>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities">
        <div className="container">
          <div className="caps-head reveal">
            <div className="eyebrow">Capabilities</div>
            <h2 className="h-section">Four things. All at once.<br />Every single call.</h2>
            <p className="lede">Gate AI is not a voicemail menu. It's a real conversational agent that screens, classifies, routes, and summarizes in real time — powered by Vapi, Twilio, and Claude.</p>
          </div>
          <div className="caps-grid">
            <div className="cap reveal">
              <span className="cap-num">01 · DETECT</span>
              <h3>Cold-call detection in under 10 seconds</h3>
              <p>Our AI listens to the opening line and classifies intent before the caller finishes their pitch. Solar, SEO, warranties, robocalls — gone.</p>
              <div className="cap-demo">
                <span className="prompt">caller:</span> "Hi, I'm calling about your commercial solar..."<br />
                <span className="ok">gate-ai:</span> <span className="err">→ blocked (98% confidence)</span>
              </div>
            </div>
            <div className="cap reveal">
              <span className="cap-num">02 · SCREEN</span>
              <h3>Polite rejection in your voice</h3>
              <p>Cold callers hear a professional, branded decline message — not dead air. Your brand stays intact, your team stays focused.</p>
              <div className="cap-demo">
                <span className="prompt">gate-ai:</span> "Thanks for calling. We're not taking<br />unsolicited calls right now. Have a good day."
              </div>
            </div>
            <div className="cap reveal">
              <span className="cap-num">03 · ROUTE</span>
              <h3>Smart routing by intent</h3>
              <p>Legit callers get matched to the right person based on what they're calling about — logistics goes to ops, vendors go to purchasing, IT goes to IT.</p>
              <div className="cap-demo">
                <span className="prompt">intent:</span> Logistics Coordination<br />
                <span className="ok">route →</span> Dave M. (Ops Manager, ext. 201)
              </div>
            </div>
            <div className="cap reveal">
              <span className="cap-num">04 · SUMMARIZE</span>
              <h3>Pre-call AI briefings</h3>
              <p>Before the phone rings, the employee already sees a one-line summary: who's calling, what company, and why. No more "who was that?"</p>
              <div className="cap-demo">
                <span className="prompt">summary:</span> Daniel at AB Logistics re:<br />
                Tuesday pickup — needs dock #3 confirmation.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section id="integrations" className="integrations">
        <div className="container">
          <div className="integrations-label">Works with the stack you already have</div>
          <div className="integrations-grid">
            {['Twilio', 'Vapi', 'OpenPhone', 'RingCentral', 'Avaya', 'Talkroute', 'Slack', 'Microsoft Teams', 'Email / SMTP', 'Zapier'].map(name => (
              <div key={name} className="int-card"><span className="int-dot" />{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="container">
          <div className="pricing-head reveal">
            <div className="eyebrow">Pricing</div>
            <h2 className="h-section">One flat price.<br />No per-minute surprises.</h2>
            <p className="lede" style={{ margin: '0 auto' }}>Start with a 7-day free trial. No credit card. Cancel anytime.</p>
          </div>
          <div className="pricing-grid">
            <div className="tier reveal">
              <div className="tier-name">Starter</div>
              <div className="tier-price"><span className="num">$79</span><span className="per">/ month</span></div>
              <div className="tier-desc">For small teams getting 5–20 calls a day. Everything you need to silence cold callers.</div>
              <ul className="tier-features">
                <li>1 phone number</li>
                <li>Up to 3 team members</li>
                <li>AI cold-call blocking</li>
                <li>Call summaries by email</li>
                <li>Slack notifications</li>
              </ul>
              <a href="/login" onClick={goSignup} className="btn btn-ghost">Start free trial</a>
            </div>
            <div className="tier featured reveal">
              <div className="tier-name">Pro</div>
              <div className="tier-price"><span className="num">$149</span><span className="per">/ month</span></div>
              <div className="tier-desc">Built for logistics and manufacturing SMBs with real inbound call volume.</div>
              <ul className="tier-features">
                <li>3 phone numbers</li>
                <li>Unlimited team members</li>
                <li>SMS + Slack + Email alerts</li>
                <li>Custom AI screening scripts</li>
                <li>Intent-based smart routing</li>
                <li>Analytics dashboard</li>
              </ul>
              <a href="/login" onClick={goSignup} className="btn btn-primary">Start free trial</a>
            </div>
            <div className="tier reveal">
              <div className="tier-name">Business</div>
              <div className="tier-price"><span className="num">$249</span><span className="per">/ month</span></div>
              <div className="tier-desc">For multi-location operations that need custom integrations and priority support.</div>
              <ul className="tier-features">
                <li>Unlimited phone numbers</li>
                <li>Priority support (4h SLA)</li>
                <li>CRM integrations</li>
                <li>Advanced analytics</li>
                <li>Dedicated account manager</li>
                <li>Custom voice cloning</li>
              </ul>
              <a href="/login" onClick={goSignup} className="btn btn-ghost">Contact sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="container">
          <div className="faq-head reveal">
            <div className="eyebrow">FAQ</div>
            <h2 className="h-section">Questions? We've got answers.</h2>
          </div>
          <div className="faq-list">
            {[
              { q: 'How long does setup take?', a: 'Under 10 minutes. You sign up, we provision a Twilio number (or port your existing one), you configure your team and routing rules, and you\'re live. Most customers handle their first real call within an hour.' },
              { q: 'Will Gate AI replace my receptionist?', a: 'It depends. Gate AI handles every inbound call before it gets to a human — for many SMBs that removes the need for a part-time receptionist entirely. For larger teams, it works as a force multiplier: your receptionist only sees the 10–20% of calls that actually matter.' },
              { q: 'What happens if the AI misclassifies a call?', a: 'You get the transcript, the recording, and the confidence score for every call. You can whitelist numbers instantly, adjust screening rules, and Gate AI learns from corrections. In practice, our cold-call detection is 94%+ accurate out of the box.' },
              { q: 'Does it work with my existing phone system?', a: 'Yes. Gate AI plugs into Twilio, OpenPhone, RingCentral, Talkroute, and Avaya. If you have a SIP-capable system, we can route calls through Gate AI as a screening layer without replacing your main phone system.' },
              { q: 'What about VIP callers — clients who should never be screened?', a: 'Add them to your whitelist. VIP callers skip the AI entirely and ring through directly. You can whitelist by number, company domain, or individual name.' },
              { q: 'How much does it actually cost per call?', a: 'Less than you think. The average blocked cold call costs us about 3 cents in AI and telephony fees. Your flat monthly subscription covers typical SMB call volume with plenty of headroom.' },
            ].map((item, i) => (
              <details key={i} className="faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container cta-inner reveal">
          <h2>Stop answering<br />calls that waste your time.</h2>
          <p>Gate AI takes 10 minutes to set up and starts saving your team time on day one.</p>
          <a href="/login" onClick={goSignup} className="btn btn-primary" style={{ padding: '16px 32px', fontSize: 15 }}>Start your free trial →</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container footer-inner">
          <a href="/" className="logo" style={{ gap: 12 }}>
            <FootLogo />
            <span style={{ fontFamily: "Inter,'DM Sans',sans-serif", fontWeight: 600, letterSpacing: '-0.3px' }}>
              Gate<span style={{ color: 'var(--accent-2)', fontWeight: 500 }}> AI</span>
            </span>
          </a>
          <ul className="footer-links">
            <li><a href="#capabilities">Capabilities</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="mailto:hello@gate-ai.io">Contact</a></li>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
          </ul>
          <div className="footer-copy">© 2026 Gate AI, Inc.</div>
        </div>
      </footer>
    </>
  );
}

// ─── SVG LOGOS ───────────────────────────────────────────────
function NavLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="navLogoG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8b1ff"/>
          <stop offset="100%" stopColor="#6c5ce7"/>
        </linearGradient>
        <mask id="navLogoMask">
          <rect width="60" height="60" fill="white"/>
          <rect x="22" y="30" width="2.2" height="6" rx="1.1" fill="black"/>
          <rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/>
          <rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/>
        </mask>
      </defs>
      <path d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z" fill="url(#navLogoG)" mask="url(#navLogoMask)"/>
    </svg>
  );
}

function FootLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="footLogoG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8b1ff"/>
          <stop offset="100%" stopColor="#6c5ce7"/>
        </linearGradient>
        <mask id="footLogoMask">
          <rect width="60" height="60" fill="white"/>
          <rect x="22" y="30" width="2.2" height="6" rx="1.1" fill="black"/>
          <rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/>
          <rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/>
        </mask>
      </defs>
      <path d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z" fill="url(#footLogoG)" mask="url(#footLogoMask)"/>
    </svg>
  );
}

// ─── CSS ─────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=Inter:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --bg: #08090d;
  --bg-2: #0d0e14;
  --bg-3: #13141b;
  --bg-4: #1a1c26;
  --border: #1f2130;
  --border-2: #2a2d40;
  --text: #f0f1f5;
  --text-2: #9da1b5;
  --text-3: #5c6078;
  --accent: #6c5ce7;
  --accent-2: #a29bfe;
  --accent-glow: rgba(108, 92, 231, 0.35);
  --green: #00d68f;
  --red: #ff6b6b;
  --orange: #ffa94d;
  --radius: 14px;
  --radius-lg: 20px;
  --font: 'DM Sans', -apple-system, system-ui, sans-serif;
  --mono: 'JetBrains Mono', monospace;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family: var(--font); background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; line-height: 1.5; overflow-x: hidden; }
::selection { background: var(--accent); color: white; }
a { color: inherit; text-decoration: none; }
button { font-family: inherit; border: none; cursor: pointer; }

.container { max-width: 1240px; margin: 0 auto; padding: 0 32px; }
section { position: relative; padding: 120px 0; }
@media (max-width: 720px) { section { padding: 72px 0; } .container { padding: 0 20px; } }

.eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: var(--accent-2); text-transform: uppercase; letter-spacing: 1.5px; padding: 7px 14px; background: rgba(108, 92, 231, 0.1); border: 1px solid rgba(108, 92, 231, 0.25); border-radius: 100px; margin-bottom: 24px; }
.eyebrow::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--accent-2); box-shadow: 0 0 10px var(--accent-2); }
h1, h2, h3 { font-weight: 700; letter-spacing: -0.03em; line-height: 1.05; }
.h-display { font-size: clamp(44px, 7vw, 92px); font-weight: 700; letter-spacing: -0.04em; line-height: 0.98; }
.h-section { font-size: clamp(36px, 5vw, 60px); font-weight: 700; letter-spacing: -0.035em; line-height: 1.02; margin-bottom: 20px; }
.lede { font-size: clamp(16px, 1.4vw, 19px); color: var(--text-2); max-width: 620px; line-height: 1.6; }

.btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 26px; border-radius: 100px; font-size: 14px; font-weight: 600; transition: all 200ms ease; white-space: nowrap; cursor: pointer; }
.btn-primary { background: var(--text); color: var(--bg); border: none; }
.btn-primary:hover { background: white; transform: translateY(-1px); box-shadow: 0 10px 30px rgba(255,255,255,0.15); }
.btn-ghost { background: transparent; color: var(--text); border: 1px solid var(--border-2); }
.btn-ghost:hover { background: var(--bg-3); border-color: var(--text-3); }

.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 20px 32px; backdrop-filter: blur(16px); background: rgba(8, 9, 13, 0.72); border-bottom: 1px solid rgba(31, 33, 48, 0.6); }
.nav-inner { max-width: 1240px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
.logo { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 700; letter-spacing: -0.3px; }
.nav-links { display: flex; gap: 36px; list-style: none; }
.nav-links a { font-size: 14px; color: var(--text-2); font-weight: 500; transition: color 180ms ease; }
.nav-links a:hover { color: var(--text); }
.nav-cta { display: flex; gap: 10px; align-items: center; }
@media (max-width: 820px) { .nav-links { display: none; } .nav { padding: 16px 20px; } }

.hero { padding: 200px 0 120px; position: relative; overflow: hidden; }
.hero::before { content: ''; position: absolute; top: -40%; left: 50%; transform: translateX(-50%); width: 1200px; height: 1200px; background: radial-gradient(circle, rgba(108, 92, 231, 0.15) 0%, transparent 55%); pointer-events: none; z-index: 0; }
.hero::after { content: ''; position: absolute; inset: 0; background-image: linear-gradient(rgba(108, 92, 231, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(108, 92, 231, 0.06) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black, transparent); pointer-events: none; z-index: 0; }
.hero-inner { position: relative; z-index: 1; text-align: center; max-width: 960px; margin: 0 auto; }
.hero h1 { margin-bottom: 28px; }
.hero h1 .accent { background: linear-gradient(180deg, var(--accent-2) 0%, var(--accent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-style: italic; font-weight: 600; }
.hero-lede { font-size: clamp(17px, 1.4vw, 20px); color: var(--text-2); max-width: 640px; margin: 0 auto 40px; line-height: 1.55; }
.hero-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 72px; }

.hero-visual { position: relative; max-width: 980px; margin: 0 auto; padding: 14px; background: linear-gradient(180deg, rgba(108, 92, 231, 0.18), rgba(108, 92, 231, 0.02)); border-radius: 20px; border: 1px solid rgba(108, 92, 231, 0.25); box-shadow: 0 40px 80px -20px rgba(0,0,0,0.6), 0 0 100px -20px var(--accent-glow); }
.hero-visual-inner { background: var(--bg-2); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
.hv-bar { display: flex; align-items: center; gap: 7px; padding: 12px 16px; background: var(--bg-3); border-bottom: 1px solid var(--border); }
.hv-dot { width: 11px; height: 11px; border-radius: 50%; background: var(--bg-4); }
.hv-bar span { margin-left: auto; font-size: 11px; color: var(--text-3); font-family: var(--mono); }
.hv-body { padding: 22px; display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; }
@media (max-width: 680px) { .hv-body { grid-template-columns: 1fr; padding: 16px; gap: 12px; } }
.hv-call { background: var(--bg-3); border: 1px solid var(--border); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
.hv-call-row { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.hv-call-row.blocked { animation: fadeIn 500ms ease 600ms both; }
.hv-call-row.forwarded { animation: fadeIn 500ms ease 1000ms both; }
.hv-call-row.incoming { animation: fadeIn 500ms ease 200ms both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.hv-pill { font-size: 10px; font-weight: 600; padding: 3px 9px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.5px; }
.pill-red { background: rgba(255, 107, 107, 0.14); color: var(--red); }
.pill-green { background: rgba(0, 214, 143, 0.14); color: var(--green); }
.pill-orange { background: rgba(255, 169, 77, 0.14); color: var(--orange); animation: pulse 1.8s ease infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.hv-call-row strong { color: var(--text); font-weight: 600; }
.hv-call-row span { color: var(--text-3); }
.hv-mono { font-family: var(--mono); font-size: 11px; color: var(--text-3); margin-left: auto; }
.hv-summary { background: var(--bg-3); border: 1px solid var(--border); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 12px; animation: fadeIn 500ms ease 1400ms both; }
.hv-summary-label { font-size: 10px; font-weight: 700; color: var(--accent-2); text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; }
.hv-summary-label::before { content: ''; width: 5px; height: 5px; background: var(--accent-2); border-radius: 50%; box-shadow: 0 0 8px var(--accent-2); }
.hv-summary-caller { font-size: 14px; font-weight: 600; }
.hv-summary-text { font-size: 12.5px; color: var(--text-2); line-height: 1.55; }
.hv-summary-meta { display: flex; gap: 8px; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border); }
.hv-tag { font-size: 10px; padding: 3px 8px; background: var(--bg-4); border-radius: 100px; color: var(--text-2); font-weight: 500; }

.industries { padding: 60px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.industries-label { text-align: center; font-size: 12px; color: var(--text-3); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 32px; font-weight: 500; }
.industries-grid { display: flex; justify-content: center; flex-wrap: wrap; gap: 14px 18px; }
.industry-chip { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background: var(--bg-3); border: 1px solid var(--border); border-radius: 100px; font-size: 13.5px; color: var(--text-2); font-weight: 500; transition: all 200ms ease; }
.industry-chip:hover { border-color: var(--accent); color: var(--text); transform: translateY(-2px); }
.industry-chip svg { width: 14px; height: 14px; color: var(--accent-2); }

.stats { padding: 120px 0; }
.stats-head { text-align: center; margin-bottom: 72px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
@media (max-width: 820px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
.stat { background: var(--bg-2); padding: 40px 32px; transition: background 250ms ease; }
.stat:hover { background: var(--bg-3); }
.stat-num { font-size: clamp(48px, 6vw, 72px); font-weight: 700; letter-spacing: -0.04em; line-height: 1; background: linear-gradient(180deg, var(--text) 0%, var(--text-2) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 14px; }
.stat-label { font-size: 13px; color: var(--text-2); font-weight: 500; line-height: 1.4; }

.problem { background: var(--bg-2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.problem-head { max-width: 700px; margin-bottom: 64px; }
.problem-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
@media (max-width: 820px) { .problem-grid { grid-template-columns: 1fr; } }
.problem-card { background: var(--bg-3); border: 1px solid var(--border); border-radius: var(--radius); padding: 36px 32px; transition: all 250ms ease; }
.problem-card:hover { border-color: var(--border-2); transform: translateY(-3px); }
.problem-card .big { font-size: clamp(44px, 5vw, 60px); font-weight: 700; letter-spacing: -0.035em; line-height: 1; color: var(--text); margin-bottom: 14px; }
.problem-card .big .unit { font-size: 0.5em; color: var(--text-3); font-weight: 500; margin-left: 4px; }
.problem-card .head { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 10px; }
.problem-card .sub { font-size: 13.5px; color: var(--text-2); line-height: 1.55; }

.caps-head { max-width: 760px; margin-bottom: 64px; }
.caps-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
@media (max-width: 820px) { .caps-grid { grid-template-columns: 1fr; } }
.cap { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 36px 36px 40px; position: relative; overflow: hidden; transition: all 250ms ease; }
.cap::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 1px; background: linear-gradient(90deg, transparent, var(--accent), transparent); opacity: 0; transition: opacity 300ms ease; }
.cap:hover { border-color: var(--border-2); transform: translateY(-3px); }
.cap:hover::before { opacity: 1; }
.cap-num { font-family: var(--mono); font-size: 12px; color: var(--accent-2); letter-spacing: 1px; margin-bottom: 20px; display: block; font-weight: 500; }
.cap h3 { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 12px; }
.cap p { font-size: 14.5px; color: var(--text-2); line-height: 1.6; margin-bottom: 24px; }
.cap-demo { background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; font-family: var(--mono); font-size: 12px; color: var(--text-2); line-height: 1.6; }
.cap-demo .prompt { color: var(--accent-2); }
.cap-demo .ok { color: var(--green); }
.cap-demo .err { color: var(--red); }

.integrations { padding: 80px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); background: var(--bg-2); }
.integrations-label { text-align: center; font-size: 12px; color: var(--text-3); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 32px; }
.integrations-grid { display: flex; justify-content: center; flex-wrap: wrap; gap: 16px; }
.int-card { display: flex; align-items: center; gap: 10px; padding: 14px 22px; background: var(--bg-3); border: 1px solid var(--border); border-radius: 12px; font-size: 14px; font-weight: 600; color: var(--text); transition: all 200ms ease; }
.int-card:hover { border-color: var(--accent); box-shadow: 0 0 30px -10px var(--accent-glow); }
.int-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); }

.pricing-head { text-align: center; margin-bottom: 64px; }
.pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1100px; margin: 0 auto; }
@media (max-width: 900px) { .pricing-grid { grid-template-columns: 1fr; max-width: 440px; } }
.tier { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 36px 32px; display: flex; flex-direction: column; transition: all 250ms ease; }
.tier:hover { border-color: var(--border-2); transform: translateY(-3px); }
.tier.featured { border-color: var(--accent); background: linear-gradient(180deg, rgba(108, 92, 231, 0.08), var(--bg-2)); box-shadow: 0 20px 60px -20px var(--accent-glow); position: relative; }
.tier.featured::before { content: 'Most Popular'; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent); color: white; font-size: 11px; font-weight: 600; padding: 5px 14px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.8px; }
.tier-name { font-size: 14px; color: var(--text-2); font-weight: 500; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
.tier-price { display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px; }
.tier-price .num { font-size: 52px; font-weight: 700; letter-spacing: -0.035em; line-height: 1; }
.tier-price .per { font-size: 14px; color: var(--text-3); }
.tier-desc { font-size: 13.5px; color: var(--text-2); margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid var(--border); line-height: 1.5; }
.tier-features { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; flex: 1; }
.tier-features li { display: flex; gap: 10px; font-size: 13.5px; color: var(--text-2); line-height: 1.5; }
.tier-features li::before { content: ''; min-width: 16px; height: 16px; margin-top: 2px; border-radius: 50%; background: rgba(0, 214, 143, 0.14); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2300d68f' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: center; }
.tier .btn { justify-content: center; width: 100%; }

.faq-head { text-align: center; margin-bottom: 60px; }
.faq-list { max-width: 780px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
.faq-item { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: all 200ms ease; }
.faq-item[open] { border-color: var(--border-2); }
.faq-item summary { padding: 22px 28px; cursor: pointer; font-size: 16px; font-weight: 600; list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary::after { content: '+'; font-size: 26px; color: var(--text-3); font-weight: 300; transition: transform 200ms ease; line-height: 1; }
.faq-item[open] summary::after { transform: rotate(45deg); color: var(--accent-2); }
.faq-item p { padding: 0 28px 24px; color: var(--text-2); font-size: 14.5px; line-height: 1.65; }

.cta { padding: 140px 0; text-align: center; position: relative; overflow: hidden; background: var(--bg-2); border-top: 1px solid var(--border); }
.cta::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 800px; height: 800px; background: radial-gradient(circle, var(--accent-glow) 0%, transparent 60%); pointer-events: none; }
.cta-inner { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; }
.cta h2 { font-size: clamp(40px, 6vw, 72px); font-weight: 700; letter-spacing: -0.035em; line-height: 1.02; margin-bottom: 24px; }
.cta p { font-size: 17px; color: var(--text-2); margin-bottom: 36px; }

footer { padding: 48px 0 40px; border-top: 1px solid var(--border); }
.footer-inner { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
.footer-links { display: flex; gap: 28px; list-style: none; }
.footer-links a { font-size: 13px; color: var(--text-3); transition: color 180ms ease; }
.footer-links a:hover { color: var(--text); }
.footer-copy { font-size: 13px; color: var(--text-3); }

.reveal { opacity: 0; transform: translateY(24px); transition: opacity 700ms cubic-bezier(.2,.8,.2,1), transform 700ms cubic-bezier(.2,.8,.2,1); }
.reveal.in { opacity: 1; transform: translateY(0); }
`;
