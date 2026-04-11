import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const timersRef = useRef([]);

  useEffect(() => {
    // Scroll reveal
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // Stat counter
    const statIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.target, 10);
        if (!target) { statIO.unobserve(el); return; }
        let cur = 0;
        const step = Math.max(1, Math.ceil(target / 40));
        const tick = () => {
          cur += step; if (cur >= target) cur = target;
          if (el.dataset.target === '24') el.innerHTML = cur + '<span style="font-size:0.5em;color:var(--text-3)">/7</span>';
          else if (el.dataset.target === '12') el.innerHTML = cur + '<span style="font-size:0.5em;color:var(--text-3)">hrs/wk</span>';
          else el.innerHTML = cur + '%';
          if (cur < target) requestAnimationFrame(tick);
        };
        tick(); statIO.unobserve(el);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.stat-num[data-target]').forEach(el => statIO.observe(el));

    // Chat animation
    startChatSequence(timersRef.current);

    return () => {
      io.disconnect(); statIO.disconnect();
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const goLogin = (e) => { e.preventDefault(); navigate('/login'); };

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
            <a href="/login" onClick={goLogin} className="btn btn-ghost nav-btn">Sign in</a>
            <a href="/login" onClick={goLogin} className="btn btn-primary nav-btn">Start free trial</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── two-column layout */}
      <section className="hero">
        <div className="container hero-inner">
          {/* Left */}
          <div className="hero-left">
            <div className="eyebrow"><span className="eyebrow-dot"></span>AI Call Screening · Built for SMBs</div>
            <h1 className="h-display">
              Block the noise.<br />
              Forward what <span className="accent">matters.</span>
            </h1>
            <p className="hero-lede">
              Gate AI answers every incoming call, detects cold sales pitches in seconds, and routes legitimate calls to the right person — with a full AI briefing before the phone even rings.
            </p>
            <div className="hero-ctas">
              <a href="/login" onClick={goLogin} className="btn btn-primary">Start free trial →</a>
              <a href="#capabilities" className="btn btn-ghost">See how it works</a>
            </div>
          </div>

          {/* Right — animated chat widget */}
          <div className="hero-right">
            <div className="phone-shell">
              <div className="phone-frame">
                {/* Mac bar */}
                <div className="pf-top">
                  <div className="mac-dot mac-r"></div>
                  <div className="mac-dot mac-y"></div>
                  <div className="mac-dot mac-g"></div>
                  <div className="pf-bar-right">
                    <ShieldLogo size={13} id="bar" />
                    <span className="pf-label"><b>Gate AI</b> · screening call</span>
                  </div>
                </div>

                <div className="pf-body">
                  {/* Phase 1: ringing */}
                  <div className="ph ph-ring" id="ph-ring">
                    <div className="ring-bg"></div>
                    <div className="ring-content">
                      <div className="ring-wrap">
                        <div className="rp"></div><div className="rp"></div><div className="rp"></div>
                        <div className="ring-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#08090d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                          </svg>
                        </div>
                      </div>
                      <span className="ring-lbl">Incoming call · screening...</span>
                    </div>
                  </div>

                  {/* Phase 2: answered */}
                  <div className="ph ph-done" id="ph-done">
                    <div className="done-circle" id="done-circle">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <span className="done-lbl" id="done-lbl">Gate AI answered</span>
                  </div>

                  {/* Phase 3: chat */}
                  <div className="ph ph-chat" id="ph-chat">
                    <div className="chat-tabs">
                      <button className="c-tab active" id="tab-b" onClick={() => window.switchChatTab('blocked')}>Blocked call</button>
                      <button className="c-tab" id="tab-f" onClick={() => window.switchChatTab('forwarded')}>Forwarded call</button>
                    </div>
                    <div className="chat-hdr">
                      <div className="hdr-pill">
                        <ShieldLogo size={12} id="hdr" />
                        <span className="hdr-live"></span>
                        Call started
                      </div>
                    </div>
                    <div className="msgs-wrap">
                      <div className="msgs" id="chat-msgs"></div>
                      <div className="result-takeover" id="result-takeover">
                        <div className="shield-big" id="shield-big"></div>
                        <div className="result-title" id="result-title"></div>
                        <div className="result-sub" id="result-sub"></div>

                      </div>
                    </div>
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
            <div className="eyebrow"><span className="eyebrow-dot"></span>The numbers after 30 days</div>
            <h2 className="h-section">Real results from real call logs.</h2>
          </div>
          <div className="stats-grid reveal">
            <div className="stat"><div className="stat-num" data-target="94">0%</div><div className="stat-label">of cold calls<br/>blocked automatically</div></div>
            <div className="stat"><div className="stat-num" data-target="12">0<span style={{fontSize:'0.5em',color:'var(--text-3)'}}>hrs/wk</span></div><div className="stat-label">saved per team<br/>on unwanted calls</div></div>
            <div className="stat"><div className="stat-num" data-target="24">24<span style={{fontSize:'0.5em',color:'var(--text-3)'}}>/7</span></div><div className="stat-label">coverage,<br/>no shifts, no sick days</div></div>
            <div className="stat"><div className="stat-num">$0</div><div className="stat-label">upfront cost —<br/>7 day free trial</div></div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="problem">
        <div className="container">
          <div className="problem-head reveal">
            <div className="eyebrow"><span className="eyebrow-dot"></span>The Problem</div>
            <h2 className="h-section">Cold calls are eating your day.</h2>
            <p className="lede">The average logistics SMB fields 15–40 cold sales calls every single day. Every one interrupts a dispatcher, a driver, or a manager who should be moving freight.</p>
          </div>
          <div className="problem-grid">
            <div className="problem-card reveal"><div className="big">25<span className="unit">calls/day</span></div><div className="head">Unwanted sales calls</div><div className="sub">The median logistics SMB logs 25 cold pitches per day — solar, insurance, SEO, warranties, the works.</div></div>
            <div className="problem-card reveal"><div className="big">3<span className="unit">min each</span></div><div className="head">Stolen from real work</div><div className="sub">Every cold call costs 2–5 minutes between answering, declining, and refocusing. That's over an hour a day, per employee.</div></div>
            <div className="problem-card reveal"><div className="big">$14k<span className="unit">/year</span></div><div className="head">Wasted payroll</div><div className="sub">At $25/hour loaded cost, a 5-person ops team loses roughly $14,000 a year to calls that should never have been picked up.</div></div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities">
        <div className="container">
          <div className="caps-head reveal">
            <div className="eyebrow"><span className="eyebrow-dot"></span>Capabilities</div>
            <h2 className="h-section">Four things. All at once.<br/>Every single call.</h2>
            <p className="lede">Gate AI is not a voicemail menu. It's a real conversational agent that screens, classifies, routes, and summarizes in real time — powered by Vapi, Twilio, and Claude.</p>
          </div>
          <div className="caps-grid">
            <div className="cap reveal"><span className="cap-num">01 · DETECT</span><h3>Cold-call detection in under 10 seconds</h3><p>Our AI listens to the opening line and classifies intent before the caller finishes their pitch. Solar, SEO, warranties, robocalls — gone.</p><div className="cap-demo"><span className="prompt">caller:</span> "Hi, I'm calling about your commercial solar..."<br/><span className="ok">gate-ai:</span> <span className="err">→ blocked (98% confidence)</span></div></div>
            <div className="cap reveal"><span className="cap-num">02 · SCREEN</span><h3>Polite rejection in your voice</h3><p>Cold callers hear a professional, branded decline message — not dead air. Your brand stays intact, your team stays focused.</p><div className="cap-demo"><span className="prompt">gate-ai:</span> "Thanks for calling. We're not taking<br/>unsolicited calls right now. Have a good day."</div></div>
            <div className="cap reveal"><span className="cap-num">03 · ROUTE</span><h3>Smart routing by intent</h3><p>Legit callers get matched to the right person based on what they're calling about — logistics goes to ops, vendors go to purchasing, IT goes to IT.</p><div className="cap-demo"><span className="prompt">intent:</span> Logistics Coordination<br/><span className="ok">route →</span> Dave M. (Ops Manager, ext. 201)</div></div>
            <div className="cap reveal"><span className="cap-num">04 · SUMMARIZE</span><h3>Pre-call AI briefings</h3><p>Before the phone rings, the employee already sees a one-line summary: who's calling, what company, and why. No more "who was that?"</p><div className="cap-demo"><span className="prompt">summary:</span> Daniel at AB Logistics re:<br/>Tuesday pickup — needs dock #3 confirmation.</div></div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section id="integrations" className="integrations">
        <div className="container">
          <div className="integrations-label">Works with the stack you already have</div>
          <div className="integrations-grid">
            {['Twilio','Vapi','OpenPhone','RingCentral','Avaya','Talkroute','Slack','Microsoft Teams','Email / SMTP','Zapier'].map(n => (
              <div key={n} className="int-card"><span className="int-dot"/>{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="container">
          <div className="pricing-head reveal">
            <div className="eyebrow"><span className="eyebrow-dot"></span>Pricing</div>
            <h2 className="h-section">One flat price.<br/>No per-minute surprises.</h2>
            <p className="lede" style={{margin:'0 auto'}}>Start with a 7-day free trial. No credit card. Cancel anytime.</p>
          </div>
          <div className="pricing-grid">
            <div className="tier reveal"><div className="tier-name">Starter</div><div className="tier-price"><span className="num">$79</span><span className="per">/ month</span></div><div className="tier-desc">For small teams getting 5–20 calls a day. Everything you need to silence cold callers.</div><ul className="tier-features"><li>1 phone number</li><li>Up to 3 team members</li><li>AI cold-call blocking</li><li>Call summaries by email</li><li>Slack notifications</li></ul><a href="/login" onClick={goLogin} className="btn btn-ghost">Start free trial</a></div>
            <div className="tier featured reveal"><div className="tier-name">Pro</div><div className="tier-price"><span className="num">$149</span><span className="per">/ month</span></div><div className="tier-desc">Built for logistics and manufacturing SMBs with real inbound call volume.</div><ul className="tier-features"><li>3 phone numbers</li><li>Unlimited team members</li><li>SMS + Slack + Email alerts</li><li>Custom AI screening scripts</li><li>Intent-based smart routing</li><li>Analytics dashboard</li></ul><a href="/login" onClick={goLogin} className="btn btn-primary">Start free trial</a></div>
            <div className="tier reveal"><div className="tier-name">Business</div><div className="tier-price"><span className="num">$249</span><span className="per">/ month</span></div><div className="tier-desc">For multi-location operations that need custom integrations and priority support.</div><ul className="tier-features"><li>Unlimited phone numbers</li><li>Priority support (4h SLA)</li><li>CRM integrations</li><li>Advanced analytics</li><li>Dedicated account manager</li><li>Custom voice cloning</li></ul><a href="/login" onClick={goLogin} className="btn btn-ghost">Contact sales</a></div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="container">
          <div className="faq-head reveal"><div className="eyebrow"><span className="eyebrow-dot"></span>FAQ</div><h2 className="h-section">Questions? We've got answers.</h2></div>
          <div className="faq-list">
            {[
              {q:'How long does setup take?',a:"Under 10 minutes. You sign up, we provision a Twilio number (or port your existing one), you configure your team and routing rules, and you're live. Most customers handle their first real call within an hour."},
              {q:'Will Gate AI replace my receptionist?',a:"It depends. Gate AI handles every inbound call before it gets to a human — for many SMBs that removes the need for a part-time receptionist entirely. For larger teams, it works as a force multiplier: your receptionist only sees the 10–20% of calls that actually matter."},
              {q:'What happens if the AI misclassifies a call?',a:"You get the transcript, the recording, and the confidence score for every call. You can whitelist numbers instantly, adjust screening rules, and Gate AI learns from corrections. In practice, our cold-call detection is 94%+ accurate out of the box."},
              {q:'Does it work with my existing phone system?',a:"Yes. Gate AI plugs into Twilio, OpenPhone, RingCentral, Talkroute, and Avaya. If you have a SIP-capable system, we can route calls through Gate AI as a screening layer without replacing your main phone system."},
              {q:'What about VIP callers — clients who should never be screened?',a:"Add them to your whitelist. VIP callers skip the AI entirely and ring through directly. You can whitelist by number, company domain, or individual name."},
              {q:'How much does it actually cost per call?',a:"Less than you think. The average blocked cold call costs us about 3 cents in AI and telephony fees. Your flat monthly subscription covers typical SMB call volume with plenty of headroom."},
            ].map((item,i) => (
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
          <h2>Stop answering<br/>calls that waste your time.</h2>
          <p>Gate AI takes 10 minutes to set up and starts saving your team time on day one.</p>
          <a href="/login" onClick={goLogin} className="btn btn-primary" style={{padding:'16px 32px',fontSize:15}}>Start your free trial →</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container footer-inner">
          <a href="/" className="logo" style={{gap:12}}><FootLogo /><span style={{fontFamily:"Inter,'DM Sans',sans-serif",fontWeight:600,letterSpacing:'-0.3px'}}>Gate<span style={{color:'var(--accent-2)',fontWeight:500}}> AI</span></span></a>
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

// ─── SVG COMPONENTS ──────────────────────────────────────────
function ShieldLogo({ size = 13, id = '' }) {
  const gId = `sg${id}`, mId = `sm${id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8b1ff"/><stop offset="100%" stopColor="#6c5ce7"/>
        </linearGradient>
        <mask id={mId}>
          <rect width="60" height="60" fill="white"/>
          <rect x="22" y="30" width="2.2" height="6" rx="1.1" fill="black"/>
          <rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/>
          <rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/>
        </mask>
      </defs>
      <path d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z" fill={`url(#${gId})`} mask={`url(#${mId})`}/>
    </svg>
  );
}

function NavLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="navG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8b1ff"/><stop offset="100%" stopColor="#6c5ce7"/>
        </linearGradient>
        <mask id="navM">
          <rect width="60" height="60" fill="white"/>
          <rect x="22" y="30" width="2.2" height="6" rx="1.1" fill="black"/>
          <rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/>
          <rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/>
        </mask>
      </defs>
      <path d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z" fill="url(#navG)" mask="url(#navM)"/>
    </svg>
  );
}

function FootLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="footG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8b1ff"/><stop offset="100%" stopColor="#6c5ce7"/>
        </linearGradient>
        <mask id="footM">
          <rect width="60" height="60" fill="white"/>
          <rect x="22" y="30" width="2.2" height="6" rx="1.1" fill="black"/>
          <rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/>
          <rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/>
        </mask>
      </defs>
      <path d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z" fill="url(#footG)" mask="url(#footM)"/>
    </svg>
  );
}

// ─── CHAT ANIMATION ENGINE ───────────────────────────────────
const SHIELD_SVG = {
  blocked: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  forwarded: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00d68f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`,
};

const GATE_AV = `<div class="chat-gate-av"><svg width="10" height="10" viewBox="0 0 60 60"><defs><linearGradient id="cavg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#b8b1ff"/><stop offset="100%" stop-color="#6c5ce7"/></linearGradient><mask id="cavm"><rect width="60" height="60" fill="white"/><rect x="22" y="30" width="2.2" height="6" rx="1.1" fill="black"/><rect x="28.9" y="26" width="2.2" height="10" rx="1.1" fill="black"/><rect x="35.8" y="22" width="2.2" height="14" rx="1.1" fill="black"/></mask></defs><path d="M30 6 L48.5 12.5 Q49.5 12.85 49.5 13.9 L49.5 28 Q49.5 41 30.6 53.4 Q30 53.8 29.4 53.4 Q10.5 41 10.5 28 L10.5 13.9 Q10.5 12.85 11.5 12.5 Z" fill="url(#cavg)" mask="url(#cavm)"/></svg></div>`;
const CALLER_AV = `<div class="chat-caller-av"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5c6078" stroke-width="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>`;

const SCENARIOS = {
  blocked: [
    {r:'gate', t:'Thank you for calling. How can I help you today?', d:0},
    {r:'caller', t:"Hi — Jake Walsh from Atlas Freight Solutions. I'm calling manufacturing companies about moving outbound freight. We specialise in flatbed and LTL and have very competitive rates right now.", d:2800},
    {r:'gate', t:'Who specifically are you trying to reach today?', d:5200},
    {r:'caller', t:"I don't have a contact name — I was hoping to speak with whoever handles freight procurement or shipping decisions.", d:7600},
    {r:'gate', t:'Do you have an existing order number or prior arrangement with us you can reference?', d:10200},
    {r:'caller', t:"No, this would be a new relationship. We work with a lot of manufacturers in the Midwest and our rates on—", d:12600},
    {r:'gate', t:"We don't accept unsolicited calls. You're welcome to email our screening team with your details and someone will follow up if there's a fit. Have a good day.", d:15200},
    {r:'result', type:'blocked', title:'Blocked', sub:'97% confidence · unsolicited sales call', d:17500},
  ],
  forwarded: [
    {r:'gate', t:'Thank you for calling. How can I help you today?', d:0},
    {r:'caller', t:"Hi — Marcus Webb from Consolidated Freight Group. I'm calling for your logistics director Sarah Chen. Sarah and I spoke last Tuesday about your Q3 outbound on the Chicago to Memphis lane.", d:2800},
    {r:'gate', t:'Got it. Can you confirm the date and what was discussed so I can connect you?', d:5400},
    {r:'caller', t:"Sure — Tuesday the 8th. Sarah asked us to come back with a flat rate for 40 loads a month on that lane. I've got the quote ready for her.", d:8000},
    {r:'gate', t:'Perfect — connecting you to Sarah now. Please hold briefly.', d:10800},
    {r:'result', type:'forwarded', title:'Forwarded to Sarah Chen', sub:'95% confidence · verified existing business', d:13000},
  ],
};

let _chatTimers = [];
let _curTab = 'blocked';

function clearChatTimers() { _chatTimers.forEach(t => clearTimeout(t)); _chatTimers = []; }

function showChatResult(type, title, sub) {
  const msgs = document.getElementById('chat-msgs');
  const rt = document.getElementById('result-takeover');
  const sb = document.getElementById('shield-big');
  const rtitle = document.getElementById('result-title');
  const rsub = document.getElementById('result-sub');
  const rbtn = document.getElementById('replay-btn');
  if (!msgs || !rt) return;
  msgs.style.opacity = '0';
  setTimeout(() => {
    sb.className = 'shield-big ' + (type === 'blocked' ? 'shield-blocked' : 'shield-forwarded');
    sb.innerHTML = SHIELD_SVG[type];
    rtitle.className = 'result-title ' + type;
    rtitle.textContent = title;
    rsub.textContent = sub;
    rt.style.pointerEvents = 'auto';
    rt.classList.add('show');
    setTimeout(() => { sb.classList.add('pop'); rtitle.classList.add('show'); rsub.classList.add('show'); }, 100);
    // Auto-switch tab and replay after 4 second pause
    setTimeout(() => {
      _curTab = _curTab === 'blocked' ? 'forwarded' : 'blocked';
      const tb = document.getElementById('tab-b');
      const tf = document.getElementById('tab-f');
      if (tb) tb.className = 'c-tab' + (_curTab === 'blocked' ? ' active' : '');
      if (tf) tf.className = 'c-tab' + (_curTab === 'forwarded' ? ' active' : '');
      const msgs = document.getElementById('chat-msgs');
      if (msgs) msgs.style.opacity = '1';
      rt.classList.remove('show'); rt.style.pointerEvents = 'none';
      sb.classList.remove('pop'); rtitle.classList.remove('show'); rsub.classList.remove('show');
      runChatScenario();
    }, 4000);
  }, 400);
}

function runChatScenario() {
  clearChatTimers();
  const el = document.getElementById('chat-msgs');
  if (!el) return;
  el.innerHTML = '';
  const sb = document.getElementById('shield-big');
  const rtitle = document.getElementById('result-title');
  const rsub = document.getElementById('result-sub');
  const rt = document.getElementById('result-takeover');
  if (sb) sb.classList.remove('pop');
  if (rtitle) rtitle.classList.remove('show');
  if (rsub) rsub.classList.remove('show');
  if (rt) { rt.classList.remove('show'); rt.style.pointerEvents = 'none'; }

  SCENARIOS[_curTab].forEach((step, i) => {
    if (step.r === 'result') {
      _chatTimers.push(setTimeout(() => showChatResult(step.type, step.title, step.sub), step.d));
      return;
    }
    if (step.r === 'gate') {
      _chatTimers.push(setTimeout(() => {
        const t = document.createElement('div'); t.className = 'chat-typing'; t.id = 'ctyp' + i;
        t.innerHTML = '<span></span><span></span><span></span>';
        el.appendChild(t); requestAnimationFrame(() => t.classList.add('show')); el.scrollTop = el.scrollHeight;
      }, step.d - 650));
    }
    _chatTimers.push(setTimeout(() => {
      const old = document.getElementById('ctyp' + i); if (old) old.remove();
      const m = document.createElement('div'); m.className = 'chat-msg ' + step.r;
      const av = step.r === 'gate' ? GATE_AV : CALLER_AV;
      const who = step.r === 'gate' ? 'Gate AI' : 'Caller';
      m.innerHTML = `<div class="chat-msg-hdr">${av}<span class="chat-msg-who">${who}</span></div><div class="chat-bubble">${step.t}</div>`;
      el.appendChild(m); requestAnimationFrame(() => m.classList.add('show')); el.scrollTop = el.scrollHeight;
    }, step.d));
  });
}

function startChatSequence(timers) {
  const ring = document.getElementById('ph-ring');
  const done = document.getElementById('ph-done');
  const chat = document.getElementById('ph-chat');
  const dc = document.getElementById('done-circle');
  const dl = document.getElementById('done-lbl');
  if (!ring) return;

  timers.push(setTimeout(() => {
    ring.style.opacity = '0'; ring.style.pointerEvents = 'none';
    done.style.opacity = '1'; dc.style.transform = 'scale(1)'; dl.style.opacity = '1';
  }, 2600));
  timers.push(setTimeout(() => {
    done.style.opacity = '0'; done.style.pointerEvents = 'none';
    chat.style.opacity = '1';
    runChatScenario();
  }, 3900));
}

// Expose to window for React onClick handlers
window.switchChatTab = (tab) => {
  _curTab = tab;
  const tb = document.getElementById('tab-b');
  const tf = document.getElementById('tab-f');
  if (tb) tb.className = 'c-tab' + (tab === 'blocked' ? ' active' : '');
  if (tf) tf.className = 'c-tab' + (tab === 'forwarded' ? ' active' : '');
  const msgs = document.getElementById('chat-msgs');
  if (msgs) msgs.style.opacity = '1';
  runChatScenario();
};

window.replayChatAnim = () => {
  const msgs = document.getElementById('chat-msgs');
  if (msgs) msgs.style.opacity = '1';
  runChatScenario();
};

// ─── CSS ─────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=Inter:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --bg:#08090d;--bg-2:#0d0e14;--bg-3:#13141b;--bg-4:#1a1c26;
  --border:#1f2130;--border-2:#2a2d40;
  --text:#f0f1f5;--text-2:#9da1b5;--text-3:#5c6078;
  --accent:#6c5ce7;--accent-2:#a29bfe;--accent-glow:rgba(108,92,231,0.35);
  --green:#00d68f;--red:#ff6b6b;--orange:#ffa94d;
  --radius:14px;--radius-lg:20px;
  --font:'DM Sans',-apple-system,system-ui,sans-serif;--mono:'JetBrains Mono',monospace;
}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:var(--font);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;line-height:1.5;overflow-x:hidden;}
::selection{background:var(--accent);color:white;}
a{color:inherit;text-decoration:none;}
button{font-family:inherit;border:none;cursor:pointer;}
.container{max-width:1240px;margin:0 auto;padding:0 32px;}
section{position:relative;padding:120px 0;}
@media(max-width:720px){section{padding:72px 0;}.container{padding:0 20px;}}

.eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--accent-2);text-transform:uppercase;letter-spacing:1.5px;padding:7px 14px;background:rgba(108,92,231,0.1);border:1px solid rgba(108,92,231,0.25);border-radius:100px;margin-bottom:24px;white-space:nowrap;}
.eyebrow-dot{width:5px;height:5px;min-width:5px;border-radius:50%;background:var(--accent-2);box-shadow:0 0 10px var(--accent-2);animation:edot 2s ease infinite;}
@keyframes edot{0%,100%{box-shadow:0 0 6px var(--accent-2);}50%{box-shadow:0 0 14px var(--accent-2),0 0 22px rgba(162,155,254,0.4);}}
h1,h2,h3{font-weight:700;letter-spacing:-0.03em;line-height:1.05;}
.h-display{font-size:clamp(40px,5.5vw,80px);font-weight:800;letter-spacing:-0.04em;line-height:0.97;}
.h-section{font-size:clamp(36px,5vw,60px);font-weight:700;letter-spacing:-0.035em;line-height:1.02;margin-bottom:20px;}
.lede{font-size:clamp(16px,1.4vw,19px);color:var(--text-2);max-width:620px;line-height:1.6;}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 26px;border-radius:100px;font-size:14px;font-weight:600;transition:all 200ms ease;white-space:nowrap;cursor:pointer;}
.btn-primary{background:var(--text);color:var(--bg);border:none;}
.btn-primary:hover{background:white;transform:translateY(-1px);box-shadow:0 10px 30px rgba(255,255,255,0.15);}
.btn-ghost{background:transparent;color:var(--text);border:1px solid var(--border-2);}
.btn-ghost:hover{background:var(--bg-3);border-color:var(--text-3);}
.nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:20px 32px;backdrop-filter:blur(16px);background:rgba(8,9,13,0.72);border-bottom:1px solid rgba(31,33,48,0.6);}
.nav-inner{max-width:1240px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;}
.logo{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:700;letter-spacing:-0.3px;}
.nav-links{display:flex;gap:36px;list-style:none;}
.nav-links a{font-size:14px;color:var(--text-2);font-weight:500;transition:color 180ms ease;}
.nav-links a:hover{color:var(--text);}
.nav-cta{display:flex;gap:10px;align-items:center;}
.nav-btn{padding:10px 20px;font-size:13px;}
@media(max-width:820px){.nav-links{display:none;}.nav{padding:16px 20px;}}

/* ── HERO two-column ── */
.hero{padding:140px 0 80px;position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;top:-30%;left:30%;transform:translateX(-50%);width:900px;height:900px;background:radial-gradient(circle,rgba(108,92,231,0.12) 0%,transparent 55%);pointer-events:none;z-index:0;}
.hero::after{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(108,92,231,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(108,92,231,0.05) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 80% 60% at 40% 30%,black,transparent);pointer-events:none;z-index:0;}
.hero-inner{position:relative;z-index:1;display:grid;grid-template-columns:1fr 400px;align-items:center;gap:60px;}
@media(max-width:1000px){.hero-inner{grid-template-columns:1fr;gap:48px;}.hero-right{max-width:480px;margin:0 auto;}}
.hero-left{}
.hero-left .h-display{margin-bottom:24px;}
.hero-left .accent{background:linear-gradient(180deg,var(--accent-2) 0%,var(--accent) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-style:italic;font-weight:700;}
.hero-lede{font-size:clamp(16px,1.3vw,18px);color:var(--text-2);max-width:520px;margin:0 0 36px;line-height:1.6;}
.hero-ctas{display:flex;gap:12px;flex-wrap:wrap;}

/* ── Phone shell ── */
.hero-right{}
.phone-shell{padding:3px;border-radius:24px;background:linear-gradient(145deg,rgba(108,92,231,0.45),rgba(162,155,254,0.1),rgba(25,25,45,0.5));box-shadow:0 0 0 1px rgba(108,92,231,0.12),0 32px 64px -16px rgba(0,0,0,0.8),0 0 80px -20px rgba(108,92,231,0.2);}
.phone-frame{background:rgba(13,14,20,0.96);border-radius:21px;overflow:hidden;border:1px solid rgba(255,255,255,0.05);}
.pf-top{display:flex;align-items:center;gap:6px;padding:10px 14px;background:rgba(19,20,27,0.95);border-bottom:1px solid rgba(255,255,255,0.04);}
.mac-dot{width:11px;height:11px;border-radius:50%;}
.mac-r{background:#ff5f57;}.mac-y{background:#febc2e;}.mac-g{background:#28c840;}
.pf-bar-right{display:flex;align-items:center;gap:6px;margin-left:auto;}
.pf-label{font-size:10px;font-family:var(--mono);color:#5c6078;}
.pf-label b{color:var(--accent-2);font-weight:500;}
.pf-body{height:400px;position:relative;overflow:hidden;}

/* phases */
.ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;transition:opacity 400ms ease;}
.ph-ring{opacity:1;}
.ph-done{opacity:0;}
.ph-chat{opacity:0;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;}

/* ring */
.ring-bg{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(108,92,231,0.08) 0%,transparent 70%);}
.ring-content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:14px;}
.ring-wrap{position:relative;width:76px;height:76px;display:flex;align-items:center;justify-content:center;}
.rp{position:absolute;width:76px;height:76px;border-radius:50%;border:1.5px solid rgba(162,155,254,0.35);animation:rout 2s ease infinite;}
.rp:nth-child(2){animation-delay:.65s;}.rp:nth-child(3){animation-delay:1.3s;}
@keyframes rout{0%{transform:scale(0.8);opacity:0.8;}100%{transform:scale(2.4);opacity:0;}}
.ring-icon{width:48px;height:48px;border-radius:50%;background:#f0f1f5;display:flex;align-items:center;justify-content:center;z-index:2;animation:rbob .45s ease infinite alternate;}
@keyframes rbob{0%{transform:rotate(-10deg);}100%{transform:rotate(10deg);}}
.ring-lbl{font-size:11px;color:rgba(240,241,245,0.45);font-weight:500;}

/* done */
.done-circle{width:56px;height:56px;border-radius:50%;background:#00d68f;display:flex;align-items:center;justify-content:center;transform:scale(0);transition:transform 450ms cubic-bezier(0.34,1.56,0.64,1);}
.done-lbl{font-size:14px;color:var(--text-2);font-weight:500;opacity:0;transition:opacity 300ms ease 200ms;margin-top:14px;}

/* chat phase */
.chat-tabs{display:flex;gap:6px;padding:9px 10px 0;}
.c-tab{flex:1;padding:7px 8px;border-radius:9px;font-size:11.5px;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,0.07);background:transparent;color:#5c6078;font-family:var(--font);transition:all 180ms ease;text-align:center;}
.c-tab.active{background:rgba(108,92,231,0.14);border-color:rgba(108,92,231,0.4);color:var(--accent-2);}
.chat-hdr{display:flex;align-items:center;padding:7px 12px;border-bottom:1px solid rgba(255,255,255,0.04);}
.hdr-pill{display:flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:100px;font-size:10.5px;color:var(--text-2);font-weight:500;}
.hdr-live{width:6px;height:6px;border-radius:50%;background:#00d68f;animation:livep 1.5s ease infinite;}
@keyframes livep{0%,100%{opacity:1;box-shadow:0 0 5px #00d68f;}50%{opacity:0.4;box-shadow:none;}}
.msgs-wrap{flex:1;position:relative;overflow:hidden;}
.msgs{padding:10px 12px;display:flex;flex-direction:column;gap:8px;position:absolute;inset:0;overflow-y:auto;transition:opacity 500ms ease;}
.msgs::-webkit-scrollbar{display:none;}

/* messages */
.chat-msg{display:flex;flex-direction:column;gap:3px;opacity:0;transform:translateY(7px);transition:opacity 350ms ease,transform 350ms ease;}
.chat-msg.show{opacity:1;transform:translateY(0);}
.chat-msg.gate{align-self:flex-start;max-width:86%;}
.chat-msg.caller{align-self:flex-end;max-width:86%;}
.chat-msg-hdr{display:flex;align-items:center;gap:5px;margin-bottom:2px;}
.chat-msg.caller .chat-msg-hdr{flex-direction:row-reverse;}
.chat-gate-av{width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#6c5ce7,#a29bfe);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.chat-caller-av{width:20px;height:20px;border-radius:50%;background:#1a1c26;border:1px solid #252736;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.chat-msg-who{font-size:9.5px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;}
.chat-msg.gate .chat-msg-who{color:var(--accent-2);}.chat-msg.caller .chat-msg-who{color:#5c6078;}
.chat-bubble{padding:8px 12px;border-radius:13px;font-size:12px;line-height:1.5;}
.chat-msg.gate .chat-bubble{background:rgba(19,20,27,0.9);border:1px solid rgba(255,255,255,0.07);color:var(--text);border-bottom-left-radius:3px;}
.chat-msg.caller .chat-bubble{background:rgba(26,28,38,0.9);border:1px solid rgba(255,255,255,0.06);color:#c8cad8;border-bottom-right-radius:3px;}
.chat-typing{display:flex;align-items:center;gap:3px;padding:8px 12px;background:rgba(19,20,27,0.9);border:1px solid rgba(255,255,255,0.07);border-radius:13px;border-bottom-left-radius:3px;width:fit-content;opacity:0;transition:opacity 220ms ease;}
.chat-typing.show{opacity:1;}
.chat-typing span{width:4px;height:4px;border-radius:50%;background:#5c6078;animation:td 1.2s ease infinite;}
.chat-typing span:nth-child(2){animation-delay:.15s;}.chat-typing span:nth-child(3){animation-delay:.3s;}
@keyframes td{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-5px);background:var(--accent-2);}}

/* result takeover */
.result-takeover{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;opacity:0;pointer-events:none;z-index:10;transition:opacity 500ms ease;padding:20px;}
.result-takeover.show{opacity:1;}
.shield-big{width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;transform:scale(0);transition:transform 500ms cubic-bezier(0.34,1.56,0.64,1);}
.shield-big.pop{transform:scale(1);}
.shield-blocked{background:rgba(255,107,107,0.12);border:2px solid rgba(255,107,107,0.35);}
.shield-forwarded{background:rgba(0,214,143,0.12);border:2px solid rgba(0,214,143,0.35);}
.shield-blocked.pop{animation:spb 2s ease infinite 500ms;}
.shield-forwarded.pop{animation:spf 2s ease infinite 500ms;}
@keyframes spb{0%,100%{box-shadow:0 0 0 0 rgba(255,107,107,0.4);}50%{box-shadow:0 0 0 18px rgba(255,107,107,0);}}
@keyframes spf{0%,100%{box-shadow:0 0 0 0 rgba(0,214,143,0.4);}50%{box-shadow:0 0 0 18px rgba(0,214,143,0);}}
.result-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;opacity:0;transition:opacity 350ms ease 250ms;text-align:center;}
.result-title.show{opacity:1;}
.result-title.blocked{color:#ff6b6b;}.result-title.forwarded{color:#00d68f;}
.result-sub{font-size:11.5px;color:#5c6078;opacity:0;transition:opacity 350ms ease 400ms;text-align:center;}
.result-sub.show{opacity:1;}


/* rest of landing CSS */
.industries{padding:60px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.industries-label{text-align:center;font-size:12px;color:var(--text-3);text-transform:uppercase;letter-spacing:2px;margin-bottom:32px;font-weight:500;}
.industries-grid{display:flex;justify-content:center;flex-wrap:wrap;gap:14px 18px;}
.industry-chip{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:var(--bg-3);border:1px solid var(--border);border-radius:100px;font-size:13.5px;color:var(--text-2);font-weight:500;transition:all 200ms ease;}
.industry-chip:hover{border-color:var(--accent);color:var(--text);transform:translateY(-2px);}
.industry-chip svg{width:14px;height:14px;color:var(--accent-2);}
.stats{padding:120px 0;}
.stats-head{text-align:center;margin-bottom:72px;}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;}
@media(max-width:820px){.stats-grid{grid-template-columns:repeat(2,1fr);}}
.stat{background:var(--bg-2);padding:40px 32px;transition:background 250ms ease;}
.stat:hover{background:var(--bg-3);}
.stat-num{font-size:clamp(48px,6vw,72px);font-weight:700;letter-spacing:-0.04em;line-height:1;background:linear-gradient(180deg,var(--text) 0%,var(--text-2) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:14px;}
.stat-label{font-size:13px;color:var(--text-2);font-weight:500;line-height:1.4;}
.problem{background:var(--bg-2);border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
.problem-head{max-width:700px;margin-bottom:64px;}
.problem-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
@media(max-width:820px){.problem-grid{grid-template-columns:1fr;}}
.problem-card{background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius);padding:36px 32px;transition:all 250ms ease;}
.problem-card:hover{border-color:var(--border-2);transform:translateY(-3px);}
.problem-card .big{font-size:clamp(44px,5vw,60px);font-weight:700;letter-spacing:-0.035em;line-height:1;color:var(--text);margin-bottom:14px;}
.problem-card .big .unit{font-size:0.5em;color:var(--text-3);font-weight:500;margin-left:4px;}
.problem-card .head{font-size:15px;font-weight:600;color:var(--text);margin-bottom:10px;}
.problem-card .sub{font-size:13.5px;color:var(--text-2);line-height:1.55;}
.caps-head{max-width:760px;margin-bottom:64px;}
.caps-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;}
@media(max-width:820px){.caps-grid{grid-template-columns:1fr;}}
.cap{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:36px 36px 40px;position:relative;overflow:hidden;transition:all 250ms ease;}
.cap::before{content:'';position:absolute;top:0;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);opacity:0;transition:opacity 300ms ease;}
.cap:hover{border-color:var(--border-2);transform:translateY(-3px);}
.cap:hover::before{opacity:1;}
.cap-num{font-family:var(--mono);font-size:12px;color:var(--accent-2);letter-spacing:1px;margin-bottom:20px;display:block;font-weight:500;}
.cap h3{font-size:24px;font-weight:700;letter-spacing:-0.02em;margin-bottom:12px;}
.cap p{font-size:14.5px;color:var(--text-2);line-height:1.6;margin-bottom:24px;}
.cap-demo{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px 16px;font-family:var(--mono);font-size:12px;color:var(--text-2);line-height:1.6;}
.cap-demo .prompt{color:var(--accent-2);}.cap-demo .ok{color:var(--green);}.cap-demo .err{color:var(--red);}
.integrations{padding:80px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--bg-2);}
.integrations-label{text-align:center;font-size:12px;color:var(--text-3);text-transform:uppercase;letter-spacing:2px;margin-bottom:32px;}
.integrations-grid{display:flex;justify-content:center;flex-wrap:wrap;gap:16px;}
.int-card{display:flex;align-items:center;gap:10px;padding:14px 22px;background:var(--bg-3);border:1px solid var(--border);border-radius:12px;font-size:14px;font-weight:600;color:var(--text);transition:all 200ms ease;}
.int-card:hover{border-color:var(--accent);box-shadow:0 0 30px -10px var(--accent-glow);}
.int-dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);}
.pricing-head{text-align:center;margin-bottom:64px;}
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1100px;margin:0 auto;}
@media(max-width:900px){.pricing-grid{grid-template-columns:1fr;max-width:440px;}}
.tier{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:36px 32px;display:flex;flex-direction:column;transition:all 250ms ease;}
.tier:hover{border-color:var(--border-2);transform:translateY(-3px);}
.tier.featured{border-color:var(--accent);background:linear-gradient(180deg,rgba(108,92,231,0.08),var(--bg-2));box-shadow:0 20px 60px -20px var(--accent-glow);position:relative;}
.tier.featured::before{content:'Most Popular';position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--accent);color:white;font-size:11px;font-weight:600;padding:5px 14px;border-radius:100px;text-transform:uppercase;letter-spacing:0.8px;}
.tier-name{font-size:14px;color:var(--text-2);font-weight:500;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;}
.tier-price{display:flex;align-items:baseline;gap:6px;margin-bottom:8px;}
.tier-price .num{font-size:52px;font-weight:700;letter-spacing:-0.035em;line-height:1;}
.tier-price .per{font-size:14px;color:var(--text-3);}
.tier-desc{font-size:13.5px;color:var(--text-2);margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid var(--border);line-height:1.5;}
.tier-features{list-style:none;display:flex;flex-direction:column;gap:12px;margin-bottom:32px;flex:1;}
.tier-features li{display:flex;gap:10px;font-size:13.5px;color:var(--text-2);line-height:1.5;}
.tier-features li::before{content:'';min-width:16px;height:16px;margin-top:2px;border-radius:50%;background:rgba(0,214,143,0.14);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2300d68f' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center;}
.tier .btn{justify-content:center;width:100%;}
.faq-head{text-align:center;margin-bottom:60px;}
.faq-list{max-width:780px;margin:0 auto;display:flex;flex-direction:column;gap:12px;}
.faq-item{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;transition:all 200ms ease;}
.faq-item[open]{border-color:var(--border-2);}
.faq-item summary{padding:22px 28px;cursor:pointer;font-size:16px;font-weight:600;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:20px;}
.faq-item summary::-webkit-details-marker{display:none;}
.faq-item summary::after{content:'+';font-size:26px;color:var(--text-3);font-weight:300;transition:transform 200ms ease;line-height:1;}
.faq-item[open] summary::after{transform:rotate(45deg);color:var(--accent-2);}
.faq-item p{padding:0 28px 24px;color:var(--text-2);font-size:14.5px;line-height:1.65;}
.cta{padding:140px 0;text-align:center;position:relative;overflow:hidden;background:var(--bg-2);border-top:1px solid var(--border);}
.cta::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:800px;height:800px;background:radial-gradient(circle,var(--accent-glow) 0%,transparent 60%);pointer-events:none;}
.cta-inner{position:relative;z-index:1;max-width:720px;margin:0 auto;}
.cta h2{font-size:clamp(40px,6vw,72px);font-weight:700;letter-spacing:-0.035em;line-height:1.02;margin-bottom:24px;}
.cta p{font-size:17px;color:var(--text-2);margin-bottom:36px;}
footer{padding:48px 0 40px;border-top:1px solid var(--border);}
.footer-inner{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;}
.footer-links{display:flex;gap:28px;list-style:none;}
.footer-links a{font-size:13px;color:var(--text-3);transition:color 180ms ease;}
.footer-links a:hover{color:var(--text);}
.footer-copy{font-size:13px;color:var(--text-3);}
.reveal{opacity:0;transform:translateY(24px);transition:opacity 700ms cubic-bezier(.2,.8,.2,1),transform 700ms cubic-bezier(.2,.8,.2,1);}
.reveal.in{opacity:1;transform:translateY(0);}
`;
