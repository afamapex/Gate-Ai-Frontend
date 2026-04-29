import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BG_BASE = '/images/gate-ai-light-bg';

const industryInfo = {
  'Manufacturing': {
    headline: 'Built for the factory floor.',
    body: `Procurement, suppliers, logistics — your lines get real calls all day, plus dozens of cold pitches for energy contracts, warranty services, and equipment financing.\n\nGate AI answers instantly, detects cold pitches in seconds, and routes real callers to the right person with a short AI brief.\n\nNo more interrupting your floor manager for a solar panel pitch.`,
    stats: [{ val: '70%', label: 'of inbound calls are cold pitches' }, { val: '<10s', label: 'cold call detection' }, { val: '24/7', label: 'AI coverage' }],
  },
  'Warehousing': {
    headline: 'Keep your team moving, not answering.',
    body: `Your team is coordinating shipments, picks, and carriers — not fielding cold calls.\n\nGate AI greets every caller, blocks pitches instantly, and routes logistics queries and vendor calls to the right person with a one-line summary.\n\nYou only pick up when it matters.`,
    stats: [{ val: '94%', label: 'cold call block rate' }, { val: '12hrs', label: 'saved per team per week' }, { val: '$0', label: 'upfront cost' }],
  },
  'Logistics & Freight': {
    headline: 'Route calls as efficiently as you route freight.',
    body: `Dispatch, ops, finance, customer service — one number, four teams, plus endless cold pitches for fuel cards and freight software.\n\nGate AI classifies intent and routes automatically. A carrier calling about Tuesday's pickup goes to dispatch. A quote request goes to sales. Cold pitches get declined.\n\nEvery forwarded call arrives with a brief: who, what, and why.`,
    stats: [{ val: '25', label: 'cold calls blocked daily' }, { val: '3min', label: 'saved per blocked call' }, { val: '100%', label: 'calls answered' }],
  },
  'Construction': {
    headline: 'Your site runs on communication. Protect it.',
    body: `Subs, suppliers, inspectors, clients — plus cold callers who pose as vendors to get through.\n\nGate AI screens every caller, blocks unsolicited pitches on the spot, and routes legitimate calls to the right person.\n\nYour PMs stay focused. Your clients always get through.`,
    stats: [{ val: '80%', label: 'reduction in unwanted calls' }, { val: 'Auto', label: 'routing by intent' }, { val: '10min', label: 'setup time' }],
  },
  'Fleet Services': {
    headline: 'Keep your drivers on the road, not on hold.',
    body: `Your business line should be clear for dispatchers, drivers, and clients — not clogged with pitches for tracking software and fuel cards.\n\nGate AI screens every call live, lets legitimate traffic through, and politely declines cold callers before they reach your team.`,
    stats: [{ val: '24/7', label: 'AI receptionist' }, { val: 'Zero', label: 'missed legitimate calls' }, { val: 'Flat', label: 'monthly subscription' }],
  },
  'Distribution': {
    headline: 'Every call handled. Every order protected.',
    body: `High volume from retailers, suppliers, and carriers — plus constant cold outreach for racking, software, everything.\n\nGate AI identifies legitimate partners, routes them instantly with a one-line brief, and blocks cold pitches before they reach anyone.\n\nYour team focuses on fulfilment, not filtering.`,
    stats: [{ val: '15-40', label: 'cold calls blocked daily' }, { val: 'AI', label: 'intent classification' }, { val: '3 tiers', label: 'from $79/mo' }],
  },
  'Industrial Services': {
    headline: 'Professional. Efficient. Always available.',
    body: `HVAC, electrical, mechanical, maintenance — you need to be reachable without drowning in pitches for insurance and marketing tools.\n\nGate AI qualifies every caller, routes real service requests to the right engineer with a brief, and declines cold calls professionally.\n\nAccessible without the noise.`,
    stats: [{ val: '100%', label: 'calls answered' }, { val: 'Smart', label: 'routing by intent' }, { val: '14-day', label: 'free trial' }],
  },
};

const integrations = [
  { name: 'Twilio', short: 'T', tone: 'red' },
  { name: 'Vapi', short: 'VA', tone: 'mint' },
  { name: 'OpenPhone', short: 'OP', tone: 'purple' },
  { name: 'RingCentral', short: 'R', tone: 'orange' },
  { name: 'Avaya', short: 'A', tone: 'redText' },
  { name: 'Talkroute', short: '↗', tone: 'dark' },
  { name: 'Slack', short: '✣', tone: 'slack' },
  { name: 'Microsoft Teams', short: 'T', tone: 'teams' },
  { name: 'Email / SMTP', short: '✉', tone: 'mail' },
  { name: 'Zapier', short: '✱', tone: 'zapier' },
];

const pricing = [
  {
    plan: 'STARTER', price: '$79', per: '/ month', tone: 'purple', icon: '☎',
    desc: 'For small teams getting 5–20 calls a day. Everything you need to silence cold callers.',
    items: ['1 phone number', 'Up to 3 team members', 'AI cold-call blocking', 'Call summaries by email', 'Slack notifications'],
    cta: 'Get started', planKey: 'starter', primary: false,
  },
  {
    plan: 'PRO', price: '$149', per: '/ month', tone: 'purple', icon: '▮', badge: 'MOST POPULAR',
    desc: 'Built for logistics and manufacturing SMBs with real inbound call volume.',
    items: ['3 phone numbers', 'Unlimited team members', 'SMS + Slack + Email alerts', 'Custom AI screening scripts', 'Intent-based smart routing', 'Analytics dashboard'],
    cta: 'Get started', planKey: 'pro', primary: true,
  },
  {
    plan: 'BUSINESS', price: '$249', per: '/ month', tone: 'coral', icon: '▦',
    desc: 'For multi-location operations that need custom integrations and priority support.',
    items: ['Unlimited phone numbers', 'Priority support (4h SLA)', 'CRM integrations', 'Advanced analytics', 'Dedicated account manager', 'Custom voice cloning'],
    cta: 'Contact sales', planKey: null, primary: false,
  },
];

const faqs = [
  ['How long does setup take?', "Under 10 minutes. You sign up, we provision a phone number automatically, you configure your team and routing rules, and you're live. Most customers handle their first real call within an hour."],
  ['Will Gate AI replace my receptionist?', 'Not at all — Gate AI works alongside your team, not instead of them. Think of it as a first filter: it handles the noise so your receptionist, office manager, or team only ever picks up calls that are actually worth their time.'],
  ['What happens if the AI misclassifies a call?', 'You get the transcript, the recording, and the confidence score for every call. You can whitelist numbers instantly, adjust screening rules, and Gate AI learns from corrections.'],
  ['Does it work with my existing phone system?', 'Yes. Gate AI plugs into Twilio, OpenPhone, RingCentral, Talkroute, and Avaya. If you have a SIP-capable system, we can route calls through Gate AI as a screening layer.'],
  ['What about VIP callers — clients who should never be screened?', 'Add them to your whitelist. VIP callers skip the AI entirely and ring through directly. You can whitelist by number, company domain, or individual name.'],
  ['How much does it actually cost per call?', "There's no per-call charge. Gate AI runs on a flat monthly subscription — Starter, Pro, or Business — with no per-minute surprise billing."],
];

const chatSequences = {
  blocked: [
    ['caller', "Hi there, I'm calling about your business energy rates — we're offering a free audit that could save you up to 30%..."],
    ['gate', "Thanks for sharing that. Could I ask who specifically you're trying to reach at the company?"],
    ['caller', "Oh, I'm looking to speak with whoever handles your energy or utilities budget."],
    ['gate', "Appreciate the call, but we're not taking cold pitches on this line. I'll let you go — have a good one."],
  ],
  forwarded: [
    ['caller', "Hi, it's Daniel from AB Logistics. I'm calling about a pickup scheduled for Tuesday — need to confirm the dock time."],
    ['gate', 'Thanks Daniel. Are you calling about an existing shipment or a new pickup?'],
    ['caller', 'Existing — order number 4821, Tuesday morning at dock 3.'],
    ['gate', "Got it. I'm connecting you with Dave in Operations with a brief summary."],
  ],
};

export default function Landing() {
  const navigate = useNavigate();
  const globeCanvasRef = useRef(null);
  const [industryModal, setIndustryModal] = useState(null);
  const [tab, setTab] = useState('blocked');
  const [messages, setMessages] = useState([]);
  const [counts, setCounts] = useState({ blocked: 0, forwarded: 0 });

  const goAuth = (e, plan) => { e.preventDefault(); navigate(plan ? `/auth?plan=${plan}` : '/auth'); };
  const goDemo = (e) => { e.preventDefault(); navigate('/book-demo'); };
  const goPage = (e, path) => { e.preventDefault(); navigate(path); };

  useEffect(() => {
    const sequence = chatSequences[tab];
    const timers = [];
    setMessages([]);
    sequence.forEach((msg, i) => timers.push(setTimeout(() => setMessages(prev => [...prev, msg]), 420 + i * 1450)));
    const swap = setTimeout(() => setTab(prev => prev === 'blocked' ? 'forwarded' : 'blocked'), 9400);
    timers.push(swap);
    return () => timers.forEach(clearTimeout);
  }, [tab]);

  useEffect(() => {
    const t = setInterval(() => {
      setCounts(prev => {
        const isBlocked = Math.random() > 0.32;
        return isBlocked ? { ...prev, blocked: Math.min(prev.blocked + 1, 122) } : { ...prev, forwarded: Math.min(prev.forwarded + 1, 57) };
      });
    }, 1450);
    return () => clearInterval(t);
  }, []);

  useLightGlobe(globeCanvasRef, counts, setCounts);

  return (
    <>
      <style>{CSS}</style>
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="brand" onClick={e => goPage(e, '/') }><LogoMark size={38}/><span>Gate <b>AI</b></span></a>
          <div className="nav-links">
            <a href="/capabilities" onClick={e => goPage(e, '/capabilities')}>Capabilities</a>
            <a href="/pricing" onClick={e => goPage(e, '/pricing')}>Pricing</a>
            <a href="/integrations" onClick={e => goPage(e, '/integrations')}>Integrations</a>
            <a href="/faq" onClick={e => goPage(e, '/faq')}>FAQ</a>
            <a href="/contact" onClick={e => goPage(e, '/contact')}>Contact</a>
          </div>
          <div className="nav-actions"><a className="btn btn-ghost" href="/auth" onClick={goAuth}>Sign In</a><a className="btn btn-primary" href="/book-demo" onClick={goDemo}>Book Demo</a></div>
        </div>
      </nav>

      <main>
        <section className="hero" id="top">
          <div className="hero-haze" />
          <div className="hero-stars" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow"><span/>AI CALL SCREENING · BUILT FOR BUSINESS</div>
              <h1>Block the noise.<br/>Forward what<br/><em>matters.</em></h1>
              <p>Gate AI answers every incoming call,<br/>detects cold sales pitches in seconds,<br/>and routes legitimate calls to the right person —<br/>with a brief AI summary sent as the call is forwarded.</p>
              <div className="hero-actions"><a href="/book-demo" onClick={goDemo} className="btn btn-primary big">Book a Demo →</a><a href="#capabilities" className="btn btn-play"><i>▶</i>See how it works</a></div>
            </div>
            <div className="globe-zone">
              <canvas ref={globeCanvasRef} />
              <div className="orbit-dot orbit-green" />
              <div className="orbit-dot orbit-red" />
              <div className="status-chip"><span className="dot red"/>Blocked <b>{counts.blocked || 122}</b><span className="sep"/><span className="dot green"/>Forwarded <b>{counts.forwarded || 57}</b></div>
            </div>
            <PhoneWidget tab={tab} setTab={setTab} messages={messages}/>
          </div>
        </section>

        <Industries setIndustryModal={setIndustryModal} />
        <Stats />
        <Problem />
        <Capabilities />
        <Integrations goPage={goPage} />
        <Pricing goAuth={goAuth} goPage={goPage} />
        <FAQ goPage={goPage} />
        <CTA goDemo={goDemo} />
      </main>

      <footer className="footer">
        <div className="container footer-inner"><a href="/" className="brand" onClick={e => goPage(e, '/') }><LogoMark size={28}/><span>Gate <b>AI</b></span></a><span>© 2026 Gate AI, Inc. All rights reserved.</span></div>
      </footer>

      {industryModal && <IndustryModal name={industryModal} onClose={() => setIndustryModal(null)} goDemo={goDemo}/>}      
    </>
  );
}

function useLightGlobe(canvasRef, counts, setCounts) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let renderer; let scene; let camera; let earth; let atmosphere; let raf; let resizeObserver; let disposed = false;
    let particles; let orbitLines = [];
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;

    function init() {
      if (disposed || !window.THREE) return;
      const THREE = window.THREE;
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
      renderer.outputEncoding = THREE.sRGBEncoding;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0, 5.2);

      scene.add(new THREE.AmbientLight(0xffffff, 1.25));
      const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(4, 3, 5); scene.add(key);
      const cyan = new THREE.PointLight(0x36d7ff, 2.0, 10); cyan.position.set(2.4, 1.6, 2.2); scene.add(cyan);
      const violet = new THREE.PointLight(0x6c5ce7, 1.6, 10); violet.position.set(-2.2, -1.2, 2.8); scene.add(violet);

      const group = new THREE.Group(); scene.add(group);
      const loader = new THREE.TextureLoader();
      const tex = loader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
      earth = new THREE.Mesh(new THREE.SphereGeometry(1.26, 96, 96), new THREE.MeshPhongMaterial({ map: tex, shininess: 22, specular: new THREE.Color(0x9edfff), color: 0xffffff }));
      earth.rotation.y = -1.9; group.add(earth);
      atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.52, 96, 96), new THREE.ShaderMaterial({
        transparent: true, side: THREE.BackSide, depthWrite: false,
        uniforms: { c: { value: 0.72 }, p: { value: 3.2 }, glowColor: { value: new THREE.Color(0x61ddff) } },
        vertexShader: 'varying vec3 vNormal;void main(){vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader: 'uniform vec3 glowColor;uniform float c;uniform float p;varying vec3 vNormal;void main(){float intensity=pow(c-dot(vNormal,vec3(0.0,0.0,1.0)),p);gl_FragColor=vec4(glowColor,intensity*.55);}'
      })); group.add(atmosphere);

      const starGeo = new THREE.BufferGeometry();
      const starCount = 420;
      const arr = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i += 1) {
        arr[i * 3] = (Math.random() - 0.5) * 8;
        arr[i * 3 + 1] = (Math.random() - 0.5) * 5;
        arr[i * 3 + 2] = -1.4 - Math.random() * 4;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      particles = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x7ea7ff, size: 0.015, transparent: true, opacity: 0.55 }));
      scene.add(particles);

      function makeOrbit(color, tilt, phase) {
        const pts = [];
        for (let i = 0; i <= 140; i += 1) {
          const t = (i / 140) * Math.PI * 2;
          const x = Math.cos(t) * 1.72;
          const y = Math.sin(t) * 0.34;
          const z = Math.sin(t) * 0.2;
          pts.push(new THREE.Vector3(x, y, z));
        }
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.34 }));
        line.rotation.x = tilt; line.rotation.z = phase; group.add(line); orbitLines.push(line);
      }
      makeOrbit(0x6c5ce7, 0.24, -0.24); makeOrbit(0x16c7d9, -0.16, 0.38); makeOrbit(0xff6b6b, 0.52, 0.92);

      function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        const w = Math.max(300, rect.width); const h = Math.max(300, rect.height);
        camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false);
      }
      resize(); resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas.parentElement);

      let frame = 0;
      function animate() {
        if (disposed) return;
        frame += 1;
        earth.rotation.y += 0.0022; atmosphere.rotation.y -= 0.0013;
        orbitLines.forEach((l, i) => { l.rotation.y += 0.0012 + i * 0.0004; });
        if (particles) particles.rotation.z += 0.0006;
        renderer.render(scene, camera); raf = requestAnimationFrame(animate);
      }
      animate();
    }
    script.onload = init;
    document.head.appendChild(script);
    return () => { disposed = true; cancelAnimationFrame(raf); if (resizeObserver) resizeObserver.disconnect(); if (renderer) renderer.dispose(); if (script.parentNode) script.parentNode.removeChild(script); };
  }, [canvasRef]);
}

function PhoneWidget({ tab, setTab, messages }) {
  return (
    <div className="phone-widget">
      <div className="window-top"><span className="mac r"/><span className="mac y"/><span className="mac g"/><div><LogoMark size={13}/> <b>Gate AI</b><em>· screening call</em></div></div>
      <div className="widget-tabs"><button className={tab === 'blocked' ? 'active' : ''} onClick={() => setTab('blocked')}>Blocked call</button><button className={tab === 'forwarded' ? 'active' : ''} onClick={() => setTab('forwarded')}>Forwarded call</button></div>
      <div className="call-started"><span/>Call started <small>10:42:17 AM &nbsp; • &nbsp; +1 (555) 123-4567</small></div>
      <div className="message-area">
        {messages.map(([role, text], i) => <div className={`msg ${role}`} key={i}><label>{role === 'gate' ? 'GATE AI' : 'CALLER'}</label><p>{text}</p></div>)}
      </div>
    </div>
  );
}

function Industries({ setIndustryModal }) {
  const items = ['Manufacturing','Warehousing','Logistics & Freight','Construction','Fleet Services','Distribution','Industrial Services'];
  const icons = ['⌂','▭','▱','⌂','＋','◎','⌘'];
  return <section className="art-section industries-art"><Stage bg="industries-bg.png"><div className="industry-content"><p className="micro-title">BUILT FOR THE INDUSTRIES THAT PICK UP EVERY CALL</p><div className="industry-pills">{items.map((item, i) => <button key={item} onClick={() => setIndustryModal(item)} className={item === 'Industrial Services' ? 'industry-pill wide' : 'industry-pill'}><span>{icons[i]}</span>{item}</button>)}</div></div></Stage></section>;
}

function Stats() {
  return <section className="art-section stats-art"><Stage bg="stats-bg.png"><div className="stats-copy"><div className="eyebrow"><span/>THE NUMBERS AFTER 30 DAYS</div><h2>Real results from <em>real</em> call logs.</h2></div><div className="stats-panel overlay-grid"><Metric value="94%" text={<>of cold calls<br/>blocked automatically</>} tone="purple"/><Metric value={<><span>12</span><small>hrs/wk</small></>} text={<>saved per team on<br/>unwanted calls</>} tone="blue"/><Metric value="24/7" text={<>coverage,<br/>no shifts, no sick days</>} tone="purple"/><Metric value="$0" text={<>upfront cost —<br/>14 day free trial</>} tone="teal"/></div></Stage></section>;
}

function Problem() {
  return <section className="art-section problem-art"><Stage bg="problem-bg.png"><div className="problem-copy"><div className="eyebrow"><span/>THE PROBLEM</div><h2>Cold calls are eating your day.</h2><p>The average SMB fields 15–40 cold sales calls every single day. Every one interrupts an operations manager, a finance team member, or a receptionist who should be focused on real work.</p></div><div className="problem-cards"><ProblemCard metric="25" suffix="calls/day" title="Unwanted sales calls" body="The median SMB logs 25 cold pitches per day — solar, insurance, SEO, warranties, the works."/><ProblemCard metric="3" suffix="min each" title="Stolen from real work" body="Every cold call costs 2–5 minutes between answering, declining, and refocusing. That's over an hour a day, per employee." tone="blue"/><ProblemCard metric="$14k" suffix="/year" title="Wasted payroll" body="At $25/hour loaded cost, a 5-person ops team loses roughly $14,000 a year to calls that should never have been picked up." tone="teal"/></div></Stage></section>;
}

function Capabilities() {
  const cards = [
    ['01 · DETECT','Cold-call detection in under 10 seconds','Our AI listens to the opening line and classifies intent before the caller finishes their pitch. Solar, SEO, warranties, robocalls — gone.', <><b>caller:</b> "Hi, I'm calling about your commercial solar..."<br/><b className="green">gate-ai:</b> → <span className="coral">blocked (98% confidence)</span></>],
    ['02 · SCREEN','Polite rejection in your voice','Cold callers hear a professional, branded decline message — not dead air. Your brand stays intact, your team stays focused.', <><b>gate-ai:</b> "Thanks for calling. We're not taking unsolicited calls right now. Have a good day."</>],
    ['03 · ROUTE','Smart routing by intent',"Legitimate callers get matched to the right person based on what they're calling about — ops queries go to the operations manager, vendor calls go to purchasing, finance queries go to the finance team.", <><b>intent:</b> Logistics Coordination<br/><b className="green">route</b> → Dave M. (Ops Manager, ext. 201)</>],
    ['04 · SUMMARIZE','Brief AI summary on every forward',"The moment a call is forwarded, the employee receives a concise AI summary — who's calling, which company, and exactly why. No more scrambling to catch up mid-conversation.", <><b>summary:</b> Daniel at AB Logistics re:<br/>Tuesday pickup – needs dock #3 confirmation.</>],
  ];
  return <section id="capabilities" className="art-section capabilities-art"><Stage bg="capabilities-bg.png"><div className="cap-copy"><div className="eyebrow"><span/>CAPABILITIES</div><h2>Four things. All at once.<br/>Every single call.</h2><p>Gate AI is not a voicemail menu. It's a real conversational agent that screens, classifies, routes, and summarizes in real time — powered by our Gate AI.</p></div><div className="cap-grid">{cards.map((c) => <div className="cap-card" key={c[0]}><small>{c[0]}</small><h3>{c[1]}</h3><p>{c[2]}</p><div className="codebox">{c[3]}</div></div>)}</div></Stage></section>;
}

function Integrations({ goPage }) {
  return <section id="integrations" className="art-section integrations-art"><Stage bg="integrations-bg.png"><div className="integration-title">WORKS WITH THE STACK YOU ALREADY HAVE</div><div className="integration-grid">{integrations.map((i) => <a key={i.name} href="/integrations" onClick={e => goPage(e, '/integrations')} className="integration-tile"><span className={`logo-dot ${i.tone}`}>{i.short}</span>{i.name}</a>)}</div><a className="section-link integrations-link" href="/integrations" onClick={e => goPage(e, '/integrations')}>View all integrations →</a></Stage></section>;
}

function Pricing({ goAuth, goPage }) {
  return <section id="pricing" className="art-section pricing-art"><Stage bg="pricing-bg.png"><div className="pricing-copy"><div className="eyebrow"><span/>PRICING</div><h2>One flat price.<br/>No per-minute surprises.</h2><p>Start with a 14-day free trial. Cancel anytime.</p></div><div className="pricing-cards">{pricing.map((tier) => <div key={tier.plan} className={`price-card ${tier.primary ? 'featured' : ''} ${tier.tone}`}>{tier.badge && <div className="badge">★ {tier.badge}</div>}<div className="price-icon">{tier.icon}</div><h3>{tier.plan}</h3><div className="price"><b>{tier.price}</b><span>{tier.per}</span></div><p>{tier.desc}</p><ul>{tier.items.map(item => <li key={item}>✓ {item}</li>)}</ul><a href={tier.planKey ? `/auth?plan=${tier.planKey}` : '/contact'} onClick={e => tier.planKey ? goAuth(e, tier.planKey) : goPage(e, '/contact')} className={tier.primary ? 'btn btn-primary' : 'btn btn-ghost'}>{tier.cta}</a></div>)}</div><a href="/pricing" onClick={e => goPage(e, '/pricing')} className="section-link pricing-link">View full pricing details →</a></Stage></section>;
}

function FAQ({ goPage }) {
  return <section id="faq" className="art-section faq-art"><Stage bg="faq-bg.png"><div className="faq-copy"><div className="eyebrow"><span/>FAQ</div><h2>Questions? We've got <em>answers.</em></h2></div><div className="faq-list">{faqs.map(([q, a]) => <details key={q} className="faq-item"><summary>{q}</summary><p>{a}</p></details>)}</div><a href="/faq" onClick={e => goPage(e, '/faq')} className="section-link faq-link">See all frequently asked questions →</a></Stage></section>;
}

function CTA({ goDemo }) {
  return <section className="art-section cta-art"><Stage bg="cta-bg.png"><div className="cta-copy"><h2>Stop answering<br/>calls that waste your time.</h2><p>Gate AI takes 10 minutes to set up and starts saving your team time on day one.</p><a href="/book-demo" onClick={goDemo} className="btn btn-primary big">Book a Demo →</a></div></Stage></section>;
}

function Stage({ bg, children }) { return <div className="art-stage" style={{ backgroundImage: `url(${BG_BASE}/${bg})` }}>{children}</div>; }
function Metric({ value, text, tone }) { return <div className={`metric ${tone}`}><strong>{value}</strong><p>{text}</p></div>; }
function ProblemCard({ metric, suffix, title, body, tone = 'purple' }) { return <div className={`problem-card ${tone}`}><div className="problem-metric"><b>{metric}</b><span>{suffix}</span></div><h3>{title}</h3><p>{body}</p></div>; }

function IndustryModal({ name, onClose, goDemo }) {
  const info = industryInfo[name];
  return <div className="modal-backdrop" onClick={onClose}><div className="industry-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={onClose}>×</button><div className="eyebrow"><span/>Gate AI for {name}</div><h2>{info.headline}</h2><div className="modal-stats">{info.stats.map(s => <div key={s.label}><b>{s.val}</b><span>{s.label}</span></div>)}</div><p>{info.body}</p><a className="btn btn-primary" href="/book-demo" onClick={goDemo}>Book a Demo →</a></div></div>;
}

function LogoMark({ size = 34 }) {
  return <svg width={size} height={size} viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gateLogoG" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#b8b1ff"/><stop offset="1" stopColor="#6c5ce7"/></linearGradient></defs><path d="M30 6 49 13v15c0 13-19 25-19 25S11 41 11 28V13L30 6Z" fill="url(#gateLogoG)"/><rect x="22" y="31" width="3" height="8" rx="1.5" fill="#fff" opacity=".88"/><rect x="29" y="27" width="3" height="12" rx="1.5" fill="#fff" opacity=".88"/><rect x="36" y="23" width="3" height="16" rx="1.5" fill="#fff" opacity=".88"/></svg>;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
:root{--ink:#08112b;--ink2:#24304d;--muted:#6c748f;--line:#dbe3f3;--purple:#6C5CE7;--purple2:#8a7cff;--blue:#2587ff;--cyan:#26c8e8;--teal:#00b8ad;--coral:#ff6b5e;--shadow:0 24px 70px rgba(39,55,100,.13);--soft:0 12px 36px rgba(37,58,120,.12);}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#fff;color:var(--ink);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}button{font:inherit}.container{width:min(1540px,calc(100% - 56px));margin-inline:auto}.nav{position:fixed;top:18px;left:0;right:0;z-index:50;pointer-events:none}.nav-inner{pointer-events:auto;width:min(1710px,calc(100% - 64px));height:92px;margin:auto;padding:0 46px;display:flex;align-items:center;justify-content:space-between;border-radius:28px;background:rgba(255,255,255,.80);backdrop-filter:blur(22px);border:1px solid rgba(179,190,225,.62);box-shadow:0 20px 60px rgba(38,52,98,.12)}.brand{display:flex;align-items:center;gap:14px;font-weight:760;font-size:24px;letter-spacing:-.04em}.brand b{background:linear-gradient(120deg,#6c5ce7,#39a7ff);-webkit-background-clip:text;background-clip:text;color:transparent}.nav-links{display:flex;gap:38px;font-weight:650;font-size:15px;color:#17213e}.nav-links a{transition:.2s}.nav-links a:hover{color:var(--purple)}.nav-actions{display:flex;gap:14px}.btn{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:14px 25px;font-weight:780;letter-spacing:-.02em;border:1px solid transparent;transition:.2s;white-space:nowrap;cursor:pointer}.btn-primary{background:linear-gradient(135deg,#7b5cff,#3c7bff);color:white;box-shadow:0 14px 32px rgba(108,92,231,.28)}.btn-primary:hover{transform:translateY(-2px);box-shadow:0 22px 42px rgba(108,92,231,.34)}.btn-ghost{background:rgba(255,255,255,.78);border-color:#cad4ea;color:#0f1835;box-shadow:0 10px 25px rgba(25,38,78,.06)}.btn-play{gap:10px;background:white;border:1px solid #b7b3ff;color:#5b48db;box-shadow:var(--soft)}.btn-play i{width:21px;height:21px;border-radius:50%;border:2px solid currentColor;display:grid;place-items:center;font-size:10px;font-style:normal}.big{padding:17px 32px;font-size:16px}.eyebrow{display:inline-flex;align-items:center;gap:9px;height:34px;padding:0 16px;border-radius:999px;border:1px solid rgba(108,92,231,.35);background:rgba(255,255,255,.72);box-shadow:0 12px 30px rgba(108,92,231,.08);color:#5e4bff;font-size:12px;font-weight:850;letter-spacing:.14em;text-transform:uppercase}.eyebrow span{width:7px;height:7px;border-radius:50%;background:var(--purple);box-shadow:0 0 18px var(--purple)}
.hero{position:relative;min-height:880px;padding:138px 0 82px;overflow:hidden;background:linear-gradient(110deg,#f6fbff 0%,#fff 38%,#f1edff 100%)}.hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 52% 42%,rgba(44,209,236,.22),transparent 27%),radial-gradient(circle at 88% 23%,rgba(108,92,231,.18),transparent 28%),radial-gradient(circle at 8% 88%,rgba(77,154,255,.14),transparent 30%);pointer-events:none}.hero-stars{position:absolute;inset:0;opacity:.55;background-image:radial-gradient(circle,#85a6ff 1px,transparent 1.4px),radial-gradient(circle,#fff 1px,transparent 1.3px);background-size:38px 38px,77px 77px;background-position:0 0,20px 24px;mask-image:linear-gradient(#000,transparent 78%)}.hero-haze{position:absolute;inset:0;background:radial-gradient(ellipse at 45% 52%,rgba(255,255,255,.65),transparent 45%),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='500'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.006' numOctaves='3' seed='3'/%3E%3CfeColorMatrix values='0 0 0 0 .65 0 0 0 0 .78 0 0 0 0 1 0 0 0 .18 0'/%3E%3C/filter%3E%3Crect width='900' height='500' filter='url(%23n)'/%3E%3C/svg%3E") center/cover;mix-blend-mode:multiply;opacity:.5}.hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:1.05fr 1fr .95fr;align-items:center;gap:26px}.hero-copy{padding-left:10px}.hero-copy h1{margin:30px 0 22px;font-size:clamp(58px,5.4vw,94px);line-height:.98;letter-spacing:-.07em;font-weight:900}.hero-copy h1 em{font-style:italic;background:linear-gradient(135deg,#8b62ff,#1d91ff);-webkit-background-clip:text;background-clip:text;color:transparent}.hero-copy p{font-size:20px;line-height:1.56;color:#26324d;margin:0 0 34px;font-weight:500}.hero-actions{display:flex;gap:20px;align-items:center}.globe-zone{height:560px;position:relative}.globe-zone canvas{position:absolute;inset:0;width:100%;height:100%}.globe-zone:before{content:"";position:absolute;inset:12% 7%;border-radius:50%;background:radial-gradient(circle,rgba(46,200,255,.12),transparent 66%);filter:blur(2px)}.orbit-dot{position:absolute;width:18px;height:18px;border-radius:50%;box-shadow:0 0 0 8px rgba(255,255,255,.8),0 0 28px currentColor}.orbit-green{left:18%;top:20%;background:#18e0a2;color:#18e0a2}.orbit-red{right:8%;bottom:28%;background:#ff4d7d;color:#ff4d7d}.status-chip{position:absolute;left:50%;bottom:46px;transform:translateX(-50%);height:52px;display:flex;align-items:center;gap:12px;padding:0 24px;border-radius:18px;background:rgba(255,255,255,.88);border:1px solid #dce4f4;box-shadow:var(--soft);font-size:15px;color:#29344d}.status-chip .dot{width:10px;height:10px;border-radius:50%;display:inline-block}.status-chip .red{background:#ff466c;box-shadow:0 0 14px #ff466c}.status-chip .green{background:#00d39b;box-shadow:0 0 14px #00d39b}.status-chip .sep{width:1px;height:22px;background:#dce3f3}.phone-widget{height:590px;border-radius:28px;background:rgba(255,255,255,.86);border:1px solid rgba(182,190,225,.9);box-shadow:0 32px 80px rgba(56,66,110,.16);backdrop-filter:blur(14px);overflow:hidden}.window-top{height:58px;display:flex;align-items:center;gap:8px;padding:0 20px;border-bottom:1px solid #e5e9f5;color:#8a90a6;font-family:'JetBrains Mono',monospace;font-size:12px}.window-top>div{margin-left:auto;display:flex;align-items:center;gap:8px}.window-top b{color:#6c5ce7}.window-top em{font-style:normal;color:#9aa1b7}.mac{width:12px;height:12px;border-radius:50%}.mac.r{background:#ff625b}.mac.y{background:#ffbd2e}.mac.g{background:#28c840}.widget-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:14px 18px}.widget-tabs button{height:44px;border-radius:11px;border:1px solid #dce2f2;background:#fff;color:#7b8097;font-weight:800;cursor:pointer}.widget-tabs button.active{color:#684ff0;border-color:#9b8dff;background:linear-gradient(180deg,#fff,#f6f2ff)}.call-started{margin:0 18px 14px;border:1px solid #e3e8f4;border-radius:14px;padding:12px 16px;font-weight:800;color:#26324d}.call-started span{display:inline-block;width:9px;height:9px;border-radius:50%;background:#ff49a2;box-shadow:0 0 14px #ff49a2;margin-right:9px}.call-started small{display:block;font-size:12px;font-weight:600;color:#5f6882;margin:8px 0 0 20px}.message-area{height:420px;padding:6px 18px 18px;overflow:hidden}.msg{margin:12px 0;animation:msgIn .32s ease both}.msg label{display:block;font-size:11px;font-weight:900;color:#737b96;text-align:right}.msg.gate label{text-align:left;color:#6c5ce7}.msg p{margin:6px 0 0;max-width:80%;padding:16px 18px;border-radius:15px;background:#f0f2fb;color:#1e2a45;font-weight:600;line-height:1.45;font-size:14px}.msg.caller p{margin-left:auto;background:#f4f1ff}.msg.gate p{background:#eef9ff}@keyframes msgIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.art-section{position:relative;background:#fff;overflow:hidden}.art-stage{width:100%;max-width:1916px;margin:0 auto;aspect-ratio:1916/821;position:relative;background-size:100% 100%;background-repeat:no-repeat;background-position:center}.micro-title{font-size:15px;letter-spacing:.18em;color:#6c5ce7;font-weight:800;text-align:center}.industry-content{position:absolute;left:14%;right:14%;top:30%;text-align:center}.industry-pills{margin-top:34px;display:flex;justify-content:center;gap:20px;flex-wrap:wrap}.industry-pill{border:1px solid #dde4f3;background:rgba(255,255,255,.82);height:55px;padding:0 24px;border-radius:999px;display:flex;gap:11px;align-items:center;font-weight:700;color:#29324d;box-shadow:0 12px 30px rgba(45,65,120,.08);cursor:pointer}.industry-pill span{color:#6c5ce7;font-weight:900}.industry-pill.wide{flex-basis:240px;justify-content:center}.stats-copy{position:absolute;top:10%;left:15%;right:15%;text-align:center}.stats-copy h2{margin:34px 0 0;font-size:clamp(42px,4.6vw,78px);line-height:1.08;letter-spacing:-.06em;font-weight:900}.stats-copy h2 em{font-style:normal;color:#6c5ce7}.stats-panel{position:absolute;left:10%;right:10%;bottom:12%;height:29%;display:grid;grid-template-columns:repeat(4,1fr)}.metric{padding:3% 6%}.metric strong{font-size:clamp(40px,5.2vw,90px);line-height:1;font-weight:900;letter-spacing:-.06em;background:linear-gradient(135deg,#7653ff,#376cff);-webkit-background-clip:text;background-clip:text;color:transparent}.metric strong small{font-size:.42em;color:#0b1634;-webkit-text-fill-color:#0b1634;background:none}.metric.teal strong{background:linear-gradient(135deg,#00b8ad,#42cfe5);-webkit-background-clip:text;background-clip:text;color:transparent}.metric p{margin:16px 0 0;font-size:clamp(14px,1.24vw,20px);line-height:1.35;color:#08132e;font-weight:650}.problem-copy{position:absolute;left:16.8%;top:7%;width:37%}.problem-copy h2,.cap-copy h2,.pricing-copy h2,.faq-copy h2,.cta-copy h2{font-weight:900;letter-spacing:-.065em;color:#07122d}.problem-copy h2{font-size:clamp(44px,4vw,72px);line-height:1.06;margin:24px 0 22px}.problem-copy p,.cap-copy p,.pricing-copy p,.cta-copy p{font-size:clamp(15px,1.25vw,20px);line-height:1.55;color:#4a5672;font-weight:500}.problem-cards{position:absolute;left:16%;right:15%;bottom:6%;height:38%;display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.problem-card{padding:6.8% 6.5%}.problem-metric b{font-size:clamp(42px,4.2vw,72px);letter-spacing:-.06em;background:linear-gradient(135deg,#7b4fff,#4a7cff);-webkit-background-clip:text;background-clip:text;color:transparent}.problem-metric span{font-size:clamp(18px,1.7vw,28px);color:#5d40f0;font-weight:700}.problem-card.blue .problem-metric b,.problem-card.blue .problem-metric span{background:linear-gradient(135deg,#246eff,#25b9ff);-webkit-background-clip:text;background-clip:text;color:transparent}.problem-card.teal .problem-metric b,.problem-card.teal .problem-metric span{background:linear-gradient(135deg,#00a99e,#24c3d8);-webkit-background-clip:text;background-clip:text;color:transparent}.problem-card h3{margin:22px 0 12px;font-size:clamp(18px,1.4vw,24px)}.problem-card p{font-size:clamp(12px,1vw,16px);line-height:1.6;color:#4a5672;font-weight:500}.cap-copy{position:absolute;left:14%;top:5.6%;width:43%}.cap-copy h2{font-size:clamp(42px,4.2vw,78px);line-height:1.05;margin:20px 0 18px}.cap-grid{position:absolute;left:14%;right:14%;bottom:6%;height:53%;display:grid;grid-template-columns:repeat(2,1fr);gap:18px 28px}.cap-card{padding:3.7% 5%}.cap-card small{color:#6c5ce7;letter-spacing:.14em;font-weight:900}.cap-card h3{font-size:clamp(18px,1.55vw,27px);letter-spacing:-.03em;margin:12px 0 8px}.cap-card p{font-size:clamp(12px,.95vw,15.5px);line-height:1.45;color:#46516b;margin:0}.codebox{margin-top:16px;border:1px solid #dbe3f4;background:rgba(255,255,255,.78);border-radius:10px;padding:12px 14px;font-family:'JetBrains Mono',monospace;font-size:clamp(10px,.78vw,13px);line-height:1.55;color:#1b243a}.codebox b{color:#6c5ce7}.codebox .green{color:#00aa9a}.codebox .coral{color:#ff5d52}.integration-title{position:absolute;top:19%;left:0;right:0;text-align:center;letter-spacing:.18em;color:#6c5ce7;font-weight:900}.integration-grid{position:absolute;left:6%;right:6%;top:31%;display:grid;grid-template-columns:repeat(7,1fr);gap:18px 22px}.integration-tile{height:74px;border-radius:16px;background:rgba(255,255,255,.86);border:1px solid #e1e6f4;box-shadow:0 14px 32px rgba(54,72,120,.09);display:flex;align-items:center;justify-content:center;gap:14px;font-weight:850;color:#0e1833}.integration-tile:nth-child(n+8){transform:translateX(170px)}.logo-dot{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;font-size:14px;color:white;font-weight:900}.logo-dot.red{background:#ef244b}.logo-dot.mint{background:#13e2b4;color:#092d2e}.logo-dot.purple,.logo-dot.teams{background:#6c5ce7}.logo-dot.orange,.logo-dot.zapier{background:#ff6b19}.logo-dot.redText{background:white;color:#e71934}.logo-dot.dark{background:#334155}.logo-dot.slack{background:linear-gradient(135deg,#27c7df,#f04473,#ffc447,#37c773)}.logo-dot.mail{background:#8b2d91}.integrations-link{position:absolute;left:0;right:0;bottom:14%;text-align:center}.section-link{color:#6c5ce7;font-weight:800}.pricing-copy{position:absolute;top:4.8%;left:0;right:0;text-align:center}.pricing-copy h2{font-size:clamp(42px,4.1vw,74px);line-height:1.02;margin:18px 0 8px}.pricing-copy p{margin:0}.pricing-cards{position:absolute;left:22%;right:22%;bottom:11%;height:56%;display:grid;grid-template-columns:repeat(3,1fr);gap:26px}.price-card{position:relative;padding:42px 30px 28px;border-radius:24px;background:rgba(255,255,255,.72);display:flex;flex-direction:column}.price-card.featured{border:2px solid rgba(108,92,231,.7);box-shadow:0 26px 70px rgba(108,92,231,.16);transform:translateY(-3px)}.price-card .badge{position:absolute;top:-18px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#7b5cff,#4a72ff);color:white;height:34px;border-radius:999px;padding:0 20px;display:flex;align-items:center;font-size:12px;font-weight:900}.price-icon{width:50px;height:50px;border-radius:50%;background:#f0edff;color:#6c5ce7;display:grid;place-items:center;font-weight:900}.price-card.coral .price-icon{background:#fff0ed;color:#ff6658}.price-card h3{margin:18px 0 8px;color:#6c5ce7;font-size:18px}.price-card.coral h3{color:#ff6658}.price{display:flex;align-items:flex-end;gap:8px}.price b{font-size:clamp(36px,3vw,54px);line-height:1;letter-spacing:-.05em}.price span{color:#536079;margin-bottom:8px}.price-card p{font-size:13px;line-height:1.55;color:#4d5972}.price-card ul{list-style:none;margin:12px 0 22px;padding:0;display:grid;gap:10px;font-size:13px;color:#17213d;font-weight:600}.price-card li{color:#13203a}.price-card li::first-letter{color:#00a998}.price-card .btn{margin-top:auto;width:100%;height:50px}.pricing-link{position:absolute;left:0;right:0;bottom:4.4%;text-align:center}.faq-copy{position:absolute;top:5%;left:0;right:0;text-align:center}.faq-copy h2{font-size:clamp(42px,4.3vw,78px);margin:18px 0 0}.faq-copy h2 em{font-style:normal;color:#6c5ce7}.faq-list{position:absolute;left:22.5%;right:22.5%;top:26.5%;display:grid;gap:12px}.faq-item{border:1px solid #dfe6f3;background:rgba(255,255,255,.85);border-radius:12px;box-shadow:0 10px 28px rgba(50,68,120,.05);overflow:hidden}.faq-item summary{height:64px;padding:0 34px;display:flex;align-items:center;justify-content:space-between;font-size:18px;font-weight:820;cursor:pointer;list-style:none}.faq-item summary::-webkit-details-marker{display:none}.faq-item summary:after{content:'+';font-size:28px;color:#6c5ce7;font-weight:500}.faq-item[open] summary:after{content:'–'}.faq-item p{margin:0;padding:0 34px 24px;color:#4a5672;line-height:1.55;font-size:15px}.faq-link{position:absolute;left:0;right:0;bottom:5.5%;text-align:center}.cta-copy{position:absolute;left:32%;right:32%;top:24%;text-align:center}.cta-copy h2{font-size:clamp(46px,5vw,88px);line-height:1.06;margin:0 0 24px}.cta-copy p{margin:0 0 38px}.footer{padding:34px 0;border-top:1px solid #e7ebf4;background:#fff}.footer-inner{display:flex;align-items:center;justify-content:space-between;color:#66708a}.modal-backdrop{position:fixed;inset:0;z-index:100;background:rgba(5,12,30,.35);backdrop-filter:blur(8px);display:grid;place-items:center;padding:24px}.industry-modal{position:relative;width:min(760px,100%);border-radius:30px;background:rgba(255,255,255,.94);box-shadow:0 40px 120px rgba(17,30,70,.25);border:1px solid #dbe3f4;padding:42px}.industry-modal h2{font-size:42px;line-height:1.05;letter-spacing:-.04em;margin:22px 0}.industry-modal p{white-space:pre-line;color:#41506d;line-height:1.65}.modal-close{position:absolute;right:20px;top:18px;width:38px;height:38px;border-radius:50%;border:1px solid #d8e0ef;background:white;color:#0b1430;cursor:pointer}.modal-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0}.modal-stats div{background:#f7f9ff;border:1px solid #e2e8f6;border-radius:18px;padding:18px}.modal-stats b{display:block;color:#6c5ce7;font-size:28px}.modal-stats span{font-size:12px;color:#60708d;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
@media(max-width:1100px){.nav-inner{height:74px;padding:0 20px}.nav-links{display:none}.hero{padding-top:115px}.hero-grid{grid-template-columns:1fr;gap:20px}.globe-zone{height:420px}.phone-widget{height:520px}.art-stage{aspect-ratio:auto;min-height:760px;background-size:cover}.stats-panel,.problem-cards,.cap-grid,.pricing-cards,.faq-list{position:relative;left:auto;right:auto;bottom:auto;top:auto;height:auto;margin:260px auto 60px;width:min(92%,980px)}.stats-panel{grid-template-columns:repeat(2,1fr);background:rgba(255,255,255,.78);border-radius:26px;border:1px solid #dbe3f3;box-shadow:var(--soft)}.problem-cards,.pricing-cards{grid-template-columns:1fr}.cap-grid{grid-template-columns:1fr}.integration-grid{grid-template-columns:repeat(2,1fr);left:8%;right:8%;top:34%}.integration-tile:nth-child(n+8){transform:none}.problem-copy,.cap-copy,.pricing-copy,.faq-copy,.stats-copy,.cta-copy{position:relative;left:auto;right:auto;top:auto;width:min(92%,720px);padding-top:70px;margin:auto;text-align:left}.pricing-copy,.faq-copy,.stats-copy,.cta-copy{text-align:center}.industry-content{left:5%;right:5%}.industry-pills{gap:10px}.cta-copy{width:min(92%,740px)}}
@media(max-width:640px){.container{width:min(100% - 28px,1540px)}.hero-copy h1{font-size:54px}.hero-copy p{font-size:17px}.hero-actions{flex-direction:column;align-items:flex-start}.phone-widget{display:none}.stats-panel{grid-template-columns:1fr}.industry-pill{height:48px;font-size:13px}.integration-grid{grid-template-columns:1fr}.faq-list{width:92%;}.pricing-cards{width:92%}.nav-actions .btn-ghost{display:none}}
`;
