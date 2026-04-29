import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ASSET_BASE = '/images/gate-ai-light';

const INDUSTRY_INFO = {
  Manufacturing: {
    headline: 'Built for the factory floor.',
    body: `Procurement, suppliers, logistics — your lines get real calls all day, plus dozens of cold pitches for energy contracts, warranty services, and equipment financing.\n\nGate AI answers instantly, detects cold pitches in seconds, and routes real callers to the right person with a short AI brief.\n\nNo more interrupting your floor manager for a solar panel pitch.`,
    stats: [{ val: '70%', label: 'of inbound calls are cold pitches' }, { val: '<10s', label: 'cold call detection' }, { val: '24/7', label: 'AI coverage' }],
  },
  Warehousing: {
    headline: 'Keep your team moving, not answering.',
    body: `Your team is coordinating shipments, picks, and carriers — not fielding cold calls.\n\nGate AI greets every caller, blocks pitches instantly, and routes logistics queries and vendor calls to the right person with a one-line summary.\n\nYou only pick up when it matters.`,
    stats: [{ val: '94%', label: 'cold call block rate' }, { val: '12hrs', label: 'saved per team per week' }, { val: '$0', label: 'upfront cost' }],
  },
  'Logistics & Freight': {
    headline: 'Route calls as efficiently as you route freight.',
    body: `Dispatch, ops, finance, customer service — one number, four teams, plus endless cold pitches for fuel cards and freight software.\n\nGate AI classifies intent and routes automatically. A carrier calling about Tuesday's pickup goes to dispatch. A quote request goes to sales. Cold pitches get declined.\n\nEvery forwarded call arrives with a brief: who, what, and why.`,
    stats: [{ val: '25', label: 'cold calls blocked daily' }, { val: '3min', label: 'saved per blocked call' }, { val: '100%', label: 'calls answered' }],
  },
  Construction: {
    headline: 'Your site runs on communication. Protect it.',
    body: `Subs, suppliers, inspectors, clients — plus cold callers who pose as vendors to get through.\n\nGate AI screens every caller, blocks unsolicited pitches on the spot, and routes legitimate calls to the right person.\n\nYour PMs stay focused. Your clients always get through.`,
    stats: [{ val: '80%', label: 'reduction in unwanted calls' }, { val: 'Auto', label: 'routing by intent' }, { val: '10min', label: 'setup time' }],
  },
  'Fleet Services': {
    headline: 'Answer every real call without opening the floodgates.',
    body: `Fleet teams deal with drivers, service providers, insurance, fuel vendors, and breakdown calls — while also getting cold outreach all day.\n\nGate AI screens every call live, lets legitimate traffic through, and politely declines cold callers before they reach your team.`,
    stats: [{ val: '24/7', label: 'AI receptionist' }, { val: 'Zero', label: 'missed legitimate calls' }, { val: 'Flat', label: 'monthly subscription' }],
  },
  Distribution: {
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

const FAQ_ITEMS = [
  { q: 'How long does setup take?', a: "Under 10 minutes. You sign up, we provision a phone number automatically, you configure your team and routing rules, and you're live. Most customers handle their first real call within an hour." },
  { q: 'Will Gate AI replace my receptionist?', a: 'Not at all — Gate AI works alongside your team, not instead of them. Think of it as a first filter: it handles the noise so your receptionist, office manager, or team only ever picks up calls that are actually worth their time.' },
  { q: 'What happens if the AI misclassifies a call?', a: 'You get the transcript, the recording, and the confidence score for every call. You can whitelist numbers instantly, adjust screening rules, and Gate AI learns from corrections.' },
  { q: 'Does it work with my existing phone system?', a: 'Yes. Gate AI plugs into common systems such as Twilio, OpenPhone, RingCentral, Talkroute, Avaya, SIP-capable phone systems, and workflow tools through integrations.' },
  { q: 'What about VIP callers — clients who should never be screened?', a: 'Add them to your whitelist. VIP callers skip the AI entirely and ring through directly. You can whitelist by number, company, domain, or individual name.' },
  { q: 'How much does it actually cost per call?', a: 'There is no per-call charge. Gate AI runs on a flat monthly subscription, so you know exactly what you are paying each month with no per-minute surprises.' },
];

function Hotspot({ label, className = '', onClick, href }) {
  if (href) {
    return <a className={`hotspot ${className}`} href={href} onClick={onClick} aria-label={label} title={label} />;
  }
  return <button type="button" className={`hotspot ${className}`} onClick={onClick} aria-label={label} title={label} />;
}

function MockSection({ id, className = '', image, alt, children }) {
  return (
    <section id={id} className={`mock-section ${className}`}>
      <div className="mock-frame">
        <img className="mock-img" src={`${ASSET_BASE}/${image}`} alt={alt} loading="lazy" />
        {children}
      </div>
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [industryModal, setIndustryModal] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const goAuth = (e, plan) => {
    e?.preventDefault?.();
    navigate(plan ? `/auth?plan=${plan}` : '/auth');
  };

  const goDemo = (e) => {
    e?.preventDefault?.();
    navigate('/book-demo');
  };

  const goPage = (e, path) => {
    e?.preventDefault?.();
    navigate(path);
  };

  const openIndustry = (name) => setIndustryModal(name);
  const activeIndustry = industryModal ? INDUSTRY_INFO[industryModal] : null;

  return (
    <>
      <style>{CSS}</style>

      <main className="landing-light-page">
        {/* HERO + HEADER: exact mockup image with live navigation/click zones over it */}
        <section className="mock-section hero-exact" aria-label="Gate AI hero section">
          <div className="mock-frame hero-frame">
            <img className="mock-img" src={`${ASSET_BASE}/hero-light.png`} alt="Gate AI light-mode hero with call-screening globe and product widget" fetchPriority="high" />

            {/* Header hotspots */}
            <Hotspot label="Gate AI home" className="hs-logo" href="/" />
            <Hotspot label="Capabilities" className="hs-nav-capabilities" href="/capabilities" onClick={(e) => goPage(e, '/capabilities')} />
            <Hotspot label="Pricing" className="hs-nav-pricing" href="/pricing" onClick={(e) => goPage(e, '/pricing')} />
            <Hotspot label="Integrations" className="hs-nav-integrations" href="/integrations" onClick={(e) => goPage(e, '/integrations')} />
            <Hotspot label="FAQ" className="hs-nav-faq" href="/faq" onClick={(e) => goPage(e, '/faq')} />
            <Hotspot label="Contact" className="hs-nav-contact" href="/contact" onClick={(e) => goPage(e, '/contact')} />
            <Hotspot label="Sign In" className="hs-signin" href="/auth" onClick={(e) => goAuth(e)} />
            <Hotspot label="Book Demo" className="hs-book-demo-top" href="/book-demo" onClick={goDemo} />

            {/* Hero CTA hotspots */}
            <Hotspot label="Book a Demo" className="hs-hero-demo" href="/book-demo" onClick={goDemo} />
            <Hotspot label="See how it works" className="hs-hero-how" href="#capabilities" />
          </div>
        </section>

        {/* INDUSTRIES */}
        <MockSection id="industries" className="industries-exact" image="industries-light.png" alt="Industries served by Gate AI">
          <Hotspot label="Manufacturing" className="hs-ind hs-ind-manufacturing" onClick={() => openIndustry('Manufacturing')} />
          <Hotspot label="Warehousing" className="hs-ind hs-ind-warehousing" onClick={() => openIndustry('Warehousing')} />
          <Hotspot label="Logistics & Freight" className="hs-ind hs-ind-logistics" onClick={() => openIndustry('Logistics & Freight')} />
          <Hotspot label="Construction" className="hs-ind hs-ind-construction" onClick={() => openIndustry('Construction')} />
          <Hotspot label="Fleet Services" className="hs-ind hs-ind-fleet" onClick={() => openIndustry('Fleet Services')} />
          <Hotspot label="Distribution" className="hs-ind hs-ind-distribution" onClick={() => openIndustry('Distribution')} />
          <Hotspot label="Industrial Services" className="hs-ind hs-ind-industrial" onClick={() => openIndustry('Industrial Services')} />
        </MockSection>

        {/* NUMBERS */}
        <MockSection id="numbers" image="numbers-light.png" alt="Real results from real call logs" />

        {/* PROBLEM */}
        <MockSection id="problem" image="problem-light.png" alt="Cold calls are eating your day" />

        {/* CAPABILITIES */}
        <MockSection id="capabilities" image="capabilities-light.png" alt="Gate AI capabilities" />

        {/* INTEGRATIONS */}
        <MockSection id="integrations" image="integrations-light.png" alt="Gate AI integrations">
          <Hotspot label="Twilio integration" className="hs-int hs-int-twilio" href="/integrations" onClick={(e) => goPage(e, '/integrations')} />
          <Hotspot label="Vapi integration" className="hs-int hs-int-vapi" href="/integrations" onClick={(e) => goPage(e, '/integrations')} />
          <Hotspot label="OpenPhone integration" className="hs-int hs-int-openphone" href="/integrations" onClick={(e) => goPage(e, '/integrations')} />
          <Hotspot label="RingCentral integration" className="hs-int hs-int-ringcentral" href="/integrations" onClick={(e) => goPage(e, '/integrations')} />
          <Hotspot label="Avaya integration" className="hs-int hs-int-avaya" href="/integrations" onClick={(e) => goPage(e, '/integrations')} />
          <Hotspot label="Talkroute integration" className="hs-int hs-int-talkroute" href="/integrations" onClick={(e) => goPage(e, '/integrations')} />
          <Hotspot label="Slack integration" className="hs-int hs-int-slack" href="/integrations" onClick={(e) => goPage(e, '/integrations')} />
          <Hotspot label="Microsoft Teams integration" className="hs-int hs-int-teams" href="/integrations" onClick={(e) => goPage(e, '/integrations')} />
          <Hotspot label="Email SMTP integration" className="hs-int hs-int-email" href="/integrations" onClick={(e) => goPage(e, '/integrations')} />
          <Hotspot label="Zapier integration" className="hs-int hs-int-zapier" href="/integrations" onClick={(e) => goPage(e, '/integrations')} />
          <Hotspot label="View all integrations" className="hs-view-integrations" href="/integrations" onClick={(e) => goPage(e, '/integrations')} />
        </MockSection>

        {/* PRICING */}
        <MockSection id="pricing" image="pricing-light.png" alt="Gate AI pricing">
          <Hotspot label="Start Starter plan" className="hs-price hs-price-starter" href="/auth?plan=starter" onClick={(e) => goAuth(e, 'starter')} />
          <Hotspot label="Start Pro plan" className="hs-price hs-price-pro" href="/auth?plan=pro" onClick={(e) => goAuth(e, 'pro')} />
          <Hotspot label="Contact sales" className="hs-price hs-price-business" href="/contact" onClick={(e) => goPage(e, '/contact')} />
          <Hotspot label="View full pricing details" className="hs-price-details" href="/pricing" onClick={(e) => goPage(e, '/pricing')} />
        </MockSection>

        {/* FAQ */}
        <MockSection id="faq" className="faq-exact" image="faq-light.png" alt="Frequently asked questions">
          {FAQ_ITEMS.map((item, i) => (
            <Hotspot
              key={item.q}
              label={item.q}
              className={`hs-faq hs-faq-${i + 1}`}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
          <Hotspot label="See all frequently asked questions" className="hs-faq-more" href="/faq" onClick={(e) => goPage(e, '/faq')} />
        </MockSection>

        {openFaq !== null && (
          <div className="faq-answer-band" role="region" aria-live="polite">
            <button type="button" className="faq-answer-close" onClick={() => setOpenFaq(null)} aria-label="Close FAQ answer">×</button>
            <div className="faq-answer-card">
              <h3>{FAQ_ITEMS[openFaq].q}</h3>
              <p>{FAQ_ITEMS[openFaq].a}</p>
            </div>
          </div>
        )}

        {/* CTA */}
        <MockSection id="contact" image="cta-light.png" alt="Book a demo with Gate AI">
          <Hotspot label="Book a Demo" className="hs-cta-demo" href="/book-demo" onClick={goDemo} />
        </MockSection>
      </main>

      <footer className="exact-footer">
        <span>© {new Date().getFullYear()} Gate AI</span>
        <div>
          <a href="/privacy" onClick={(e) => goPage(e, '/privacy')}>Privacy</a>
          <a href="/terms" onClick={(e) => goPage(e, '/terms')}>Terms</a>
          <a href="/contact" onClick={(e) => goPage(e, '/contact')}>Contact</a>
        </div>
      </footer>

      {industryModal && activeIndustry && (
        <div className="industry-modal-backdrop" onClick={() => setIndustryModal(null)} role="presentation">
          <div className="industry-modal" role="dialog" aria-modal="true" aria-labelledby="industry-title" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setIndustryModal(null)} aria-label="Close industry details">×</button>
            <span className="modal-kicker">Gate AI for {industryModal}</span>
            <h2 id="industry-title">{activeIndustry.headline}</h2>
            {activeIndustry.body.split('\n\n').map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <div className="modal-stats">
              {activeIndustry.stats.map((stat) => (
                <div key={`${stat.val}-${stat.label}`} className="modal-stat">
                  <strong>{stat.val}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <a href="/book-demo" onClick={goDemo} className="modal-primary">Book a Demo →</a>
              <button type="button" className="modal-secondary" onClick={() => setIndustryModal(null)}>Keep browsing</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');

:root{
  --gate-purple:#6C5CE7;
  --gate-purple-2:#8B7CFF;
  --gate-navy:#050B24;
  --gate-blue:#0EA5E9;
  --gate-cyan:#22D3EE;
  --gate-teal:#14B8A6;
  --gate-coral:#FF705C;
  --gate-amber:#F59E0B;
  --gate-line:#D8DEF7;
  --gate-muted:#5F6785;
  --gate-font:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
}

*{box-sizing:border-box;}
html{scroll-behavior:smooth;background:#fff;}
body{margin:0;font-family:var(--gate-font);background:linear-gradient(180deg,#f9fbff 0%,#ffffff 45%,#f8fbff 100%);color:var(--gate-navy);-webkit-font-smoothing:antialiased;overflow-x:hidden;}
a{text-decoration:none;color:inherit;}
button{font-family:inherit;}

.landing-light-page{background:#fff;}
.mock-section{width:100%;position:relative;margin:0;padding:0;background:#fff;overflow:hidden;}
.mock-frame{position:relative;width:100%;max-width:1916px;margin:0 auto;overflow:hidden;line-height:0;background:#fff;}
.mock-img{display:block;width:100%;height:auto;user-select:none;-webkit-user-drag:none;image-rendering:auto;}
.hero-exact .mock-frame{max-width:none;}
.hero-exact .mock-img{width:100%;min-height:720px;object-fit:cover;object-position:center top;}

.hotspot{position:absolute;display:block;background:rgba(255,255,255,0);border:0;border-radius:999px;cursor:pointer;line-height:1;padding:0;appearance:none;z-index:4;}
.hotspot:focus-visible{outline:3px solid rgba(108,92,231,.6);outline-offset:3px;background:rgba(108,92,231,.08);}

/* Header and hero hotspots based on the hero image canvas */
.hs-logo{left:5.5%;top:2.2%;width:15%;height:9%;}
.hs-nav-capabilities{left:31%;top:3.8%;width:7%;height:5.5%;}
.hs-nav-pricing{left:40%;top:3.8%;width:5%;height:5.5%;}
.hs-nav-integrations{left:46.5%;top:3.8%;width:8%;height:5.5%;}
.hs-nav-faq{left:55.5%;top:3.8%;width:4.5%;height:5.5%;}
.hs-nav-contact{left:60.5%;top:3.8%;width:5.5%;height:5.5%;}
.hs-signin{left:78.4%;top:2.2%;width:6.5%;height:8.2%;}
.hs-book-demo-top{left:85.7%;top:2.2%;width:8.6%;height:8.2%;}
.hs-hero-demo{left:8.5%;top:80.7%;width:11.3%;height:7.4%;}
.hs-hero-how{left:20.7%;top:80.7%;width:13%;height:7.4%;}

/* Industries chip hotspots */
.hs-ind{height:7%;top:47.5%;}
.hs-ind-manufacturing{left:17.8%;width:9.5%;}
.hs-ind-warehousing{left:28.3%;width:9.5%;}
.hs-ind-logistics{left:38.6%;width:12.8%;}
.hs-ind-construction{left:52%;width:9.5%;}
.hs-ind-fleet{left:62.3%;width:9.7%;}
.hs-ind-distribution{left:73.1%;width:10.1%;}
.hs-ind-industrial{left:43.5%;top:58.8%;width:13.2%;height:7%;}

/* Integrations tile hotspots */
.hs-int{height:14.5%;top:31%;}
.hs-int-twilio{left:6.2%;width:11.2%;}
.hs-int-vapi{left:18.6%;width:11.2%;}
.hs-int-openphone{left:30.9%;width:12.3%;}
.hs-int-ringcentral{left:44.9%;width:13.2%;}
.hs-int-avaya{left:60.7%;width:11.2%;}
.hs-int-talkroute{left:72.8%;width:12.5%;}
.hs-int-slack{left:86.4%;width:10.4%;}
.hs-int-teams{left:25.8%;top:51.5%;width:17.7%;}
.hs-int-email{left:44.6%;top:51.5%;width:16.3%;}
.hs-int-zapier{left:62.3%;top:51.5%;width:12.6%;}
.hs-view-integrations{left:43.5%;top:82.3%;width:13.2%;height:5%;}

/* Pricing button hotspots */
.hs-price{top:78.7%;height:6.6%;}
.hs-price-starter{left:23.5%;width:13.7%;}
.hs-price-pro{left:41.4%;width:16.1%;}
.hs-price-business{left:61.8%;width:12.7%;}
.hs-price-details{left:44.5%;top:92%;width:11.5%;height:4%;}

/* FAQ row hotspots */
.hs-faq{left:22.6%;width:54.5%;height:9.2%;border-radius:14px;}
.hs-faq-1{top:28.1%;}
.hs-faq-2{top:38.3%;}
.hs-faq-3{top:48.5%;}
.hs-faq-4{top:58.8%;}
.hs-faq-5{top:69%;}
.hs-faq-6{top:79.3%;}
.hs-faq-more{left:40.6%;top:91.5%;width:18.8%;height:5.2%;}

/* CTA */
.hs-cta-demo{left:41.4%;top:72.8%;width:17.2%;height:8.2%;}

.faq-answer-band{max-width:980px;margin:-34px auto 44px;padding:0 24px;position:relative;z-index:5;}
.faq-answer-card{background:rgba(255,255,255,.96);border:1px solid rgba(108,92,231,.18);box-shadow:0 24px 70px rgba(11,18,48,.13);border-radius:22px;padding:26px 30px;backdrop-filter:blur(20px);}
.faq-answer-card h3{margin:0 0 10px;font-size:22px;line-height:1.2;color:var(--gate-navy);letter-spacing:-.02em;}
.faq-answer-card p{margin:0;color:#3D4564;font-size:16px;line-height:1.7;}
.faq-answer-close{position:absolute;right:34px;top:10px;width:36px;height:36px;border-radius:50%;border:1px solid rgba(108,92,231,.18);background:#fff;color:var(--gate-purple);font-size:24px;line-height:1;cursor:pointer;box-shadow:0 10px 30px rgba(11,18,48,.1);z-index:6;}

.exact-footer{display:flex;align-items:center;justify-content:space-between;gap:22px;max-width:1180px;margin:0 auto;padding:34px 28px 42px;color:#5b6381;font-size:14px;}
.exact-footer div{display:flex;gap:18px;}
.exact-footer a{color:#59607B;}
.exact-footer a:hover{color:var(--gate-purple);}

.industry-modal-backdrop{position:fixed;inset:0;z-index:1000;background:rgba(8,12,30,.45);display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(16px);}
.industry-modal{position:relative;width:min(720px,100%);background:linear-gradient(180deg,#ffffff 0%,#f8fbff 100%);border:1px solid rgba(108,92,231,.18);border-radius:28px;box-shadow:0 38px 110px rgba(9,16,45,.28);padding:36px;color:var(--gate-navy);}
.modal-close{position:absolute;top:18px;right:18px;width:40px;height:40px;border-radius:50%;border:1px solid rgba(108,92,231,.18);background:#fff;color:var(--gate-purple);font-size:26px;line-height:1;cursor:pointer;box-shadow:0 12px 32px rgba(9,16,45,.1);}
.modal-kicker{display:inline-flex;padding:8px 14px;border-radius:999px;background:rgba(108,92,231,.08);border:1px solid rgba(108,92,231,.16);color:var(--gate-purple);font-weight:800;letter-spacing:.12em;text-transform:uppercase;font-size:11px;margin-bottom:16px;}
.industry-modal h2{margin:0 0 16px;font-size:clamp(30px,4vw,46px);letter-spacing:-.045em;line-height:1.03;}
.industry-modal p{margin:0 0 14px;color:#46506F;font-size:16px;line-height:1.72;}
.modal-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0;}
.modal-stat{padding:16px;border-radius:18px;background:#fff;border:1px solid rgba(108,92,231,.13);box-shadow:0 14px 34px rgba(7,14,44,.07);}
.modal-stat strong{display:block;font-size:26px;line-height:1;color:var(--gate-purple);letter-spacing:-.04em;margin-bottom:8px;}
.modal-stat span{display:block;font-size:13px;color:#65708E;line-height:1.35;}
.modal-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px;}
.modal-primary,.modal-secondary{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:13px 22px;font-weight:800;font-size:14px;cursor:pointer;}
.modal-primary{background:linear-gradient(135deg,var(--gate-purple),#3867F5);color:#fff;box-shadow:0 15px 34px rgba(108,92,231,.25);}
.modal-secondary{background:#fff;color:var(--gate-navy);border:1px solid rgba(108,92,231,.16);}

@media(max-width:900px){
  .hero-exact .mock-img{min-height:640px;object-position:47% top;}
  .mock-frame{width:140%;margin-left:-20%;}
  .mock-section:not(.hero-exact){overflow-x:auto;}
  .mock-section:not(.hero-exact) .mock-frame{min-width:1180px;width:1180px;margin:0 auto;}
  .exact-footer{flex-direction:column;text-align:center;}
  .modal-stats{grid-template-columns:1fr;}
}

@media(max-width:560px){
  .hero-exact .mock-img{min-height:620px;object-position:41% top;}
  .mock-frame{width:190%;margin-left:-45%;}
  .faq-answer-band{margin-top:10px;}
  .industry-modal{padding:26px 22px;}
}
`;
