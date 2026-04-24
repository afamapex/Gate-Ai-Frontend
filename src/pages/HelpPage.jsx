import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const FAQ_ITEMS = [
  {
    category: "Call Screening",
    questions: [
      {
        q: "How does Gate AI decide to block or transfer a call?",
        a: "Gate AI listens to what the caller says and checks three things: (1) Do they name a specific person or give an operational reason? (2) Does their reason sound like a real business need or a sales pitch? (3) If they claim a prior relationship, can they back it up with a name or reference number? Based on your Screening Intensity setting, the AI decides whether to transfer or block.",
      },
      {
        q: "What is Screening Intensity and which one should I use?",
        a: "Screening Intensity controls how strict the AI is. Relaxed passes through anyone who names a person or gives any business reason — good for high-trust environments. Moderate (recommended) requires both a name and a real reason. Aggressive also requires a verifiable detail like a reference number or address — best if you receive very high cold call volumes.",
      },
      {
        q: "Why did a legitimate caller get blocked?",
        a: "This usually happens when a real caller can't provide a name or any verifiable details. Ask your contacts to mention the employee's name and the reason for calling when they ring — that will always get them through. You can also add them to your Whitelist / VIP list so they bypass screening entirely.",
      },
      {
        q: "Can I add certain numbers so they never get screened?",
        a: "Yes — go to Screening Rules → Whitelist / VIP and add the caller's name and phone number. Once added, calls from that number go straight through without any AI screening.",
      },
      {
        q: "What happens when a call is blocked?",
        a: "The AI delivers your rejection script (configurable in Screening Rules → AI Behavior → Screening Email section). The script tells the caller to email your screening address if they have a genuine business reason. The call is logged in your Call Log with a full transcript and summary.",
      },
    ],
  },
  {
    category: "Call Log & Dashboard",
    questions: [
      {
        q: "Why does the intent column show a short label instead of the full description?",
        a: "The intent label is shortened to keep the table readable. Hover over it to see the full intent description in a tooltip.",
      },
      {
        q: "Why does Routed To show a dash for some calls?",
        a: "Routed To only shows a name for forwarded calls where the AI successfully matched a caller to an employee. Blocked or screened calls will show a dash since no transfer was made.",
      },
      {
        q: "Can I export my call log?",
        a: "Yes — click the Export CSV button in the top right of the Call Log page to download all call records as a CSV file.",
      },
      {
        q: "What does 'Screened' status mean vs 'Blocked'?",
        a: "Blocked means the AI confirmed it was an unwanted call and delivered the rejection script. Screened means the call ended before the AI could reach a definitive decision — for example, the caller hung up mid-conversation.",
      },
    ],
  },
  {
    category: "Team & Routing",
    questions: [
      {
        q: "How do I add a team member?",
        a: "Go to Team & Routing → click Add Team Member. Enter their name, role, department, and most importantly their direct phone number. The phone number is what Gate AI dials when transferring a call to them.",
      },
      {
        q: "What does Call Routing Rules do?",
        a: "Routing Rules tell the AI which employee to connect a caller to based on the type of call. For example, a 'Logistics Coordination' rule pointing to Dave Morton means that when a caller asks about logistics, the AI will try to transfer to Dave.",
      },
      {
        q: "What is Call Priority?",
        a: "Priority (High / Medium / Low) tells the AI the relative importance of each routing rule. High priority rules are checked first. This is useful if multiple rules could match the same call.",
      },
    ],
  },
  {
    category: "Settings",
    questions: [
      {
        q: "How do I change the AI assistant's name?",
        a: "Go to Settings → AI Assistant → change the Assistant Name field and click Save. The name takes effect on the next call. It is also what shows in your dashboard and is how the AI introduces itself on calls.",
      },
      {
        q: "Why is my screening email not being said on calls?",
        a: "Make sure you have saved your Screening Email in Screening Rules → AI Behavior → Screening Email. Also check your custom rejection script in the same section — if you have a custom script, make sure it includes your email address.",
      },
      {
        q: "How do I set up Slack notifications?",
        a: "Go to Integrations → Slack → enter your Slack webhook URL and save. Once connected, you will receive real-time notifications for blocked and forwarded calls directly in your Slack workspace.",
      },
      {
        q: "Can I customise what the AI says when it rejects a call?",
        a: "Yes — go to Screening Rules → AI Behavior. You can set a custom rejection script. Make sure it ends with 'Have a good day' or a similar closing phrase so the call ends cleanly after the script is delivered.",
      },
    ],
  },
  {
    category: "Billing & Account",
    questions: [
      {
        q: "How do I upgrade my plan?",
        a: "Click Manage Billing in the dashboard (found in the billing banner if you're on a trial, or in Settings). You will be taken to your Stripe billing portal where you can upgrade, downgrade, or manage your payment details.",
      },
      {
        q: "What happens when my trial ends?",
        a: "Your Gate AI number stays active but call screening will pause until you subscribe. You won't lose any data or settings. Simply subscribe from the billing banner on your dashboard to resume.",
      },
    ],
  },
];

export default function HelpPage() {
  const [openItems, setOpenItems] = useState({});
  const [search, setSearch] = useState("");

  const toggle = (key) => setOpenItems(p => ({ ...p, [key]: !p[key] }));

  const filtered = search.trim()
    ? FAQ_ITEMS.map(cat => ({
        ...cat,
        questions: cat.questions.filter(
          item => item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(cat => cat.questions.length > 0)
    : FAQ_ITEMS;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base, #0a0b0f)", color: "var(--text-primary, #f0f0f0)", fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,0.08))", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-nav, #111218)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="28" height="28" viewBox="0 0 60 60" fill="none">
            <defs>
              <linearGradient id="hpg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#b8b1ff"/>
                <stop offset="100%" stopColor="#6c5ce7"/>
              </linearGradient>
            </defs>
            <path d="M30 4 L52 12 Q53 12.5 53 14 L53 30 Q53 46 30.7 57.5 Q30 58 29.3 57.5 Q7 46 7 30 L7 14 Q7 12.5 8 12 Z" fill="url(#hpg)"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 17 }}>Gate AI Help & FAQ</span>
        </div>
        <button
          onClick={() => window.close()}
          style={{ background: "var(--accent, #6c5ce7)", border: "none", color: "#fff", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          ← Back to dashboard
        </button>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Help & FAQ</h1>
        <p style={{ fontSize: 15, color: "var(--text-tertiary, #888)", marginBottom: 32 }}>Find answers to common questions about Gate AI. Can't find what you're looking for? Chat with our support assistant below.</p>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 40 }}>
          <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for an answer…"
            style={{ width: "100%", padding: "12px 14px 12px 42px", background: "var(--bg-card, #16171e)", border: "1px solid var(--border, rgba(255,255,255,0.08))", borderRadius: 10, fontSize: 14, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* FAQ Categories */}
        {filtered.map((cat, ci) => (
          <div key={ci} style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent, #6c5ce7)", marginBottom: 14 }}>{cat.category}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {cat.questions.map((item, qi) => {
                const key = `${ci}-${qi}`;
                const open = !!openItems[key];
                return (
                  <div key={qi} style={{ border: "1px solid var(--border, rgba(255,255,255,0.08))", borderRadius: 10, overflow: "hidden", background: open ? "var(--bg-card, #16171e)" : "transparent", transition: "background 0.15s" }}>
                    <div
                      onClick={() => toggle(key)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer", userSelect: "none" }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", paddingRight: 16 }}>{item.q}</span>
                      <span style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", color: "var(--text-tertiary)" }}>▾</span>
                    </div>
                    {open && (
                      <div style={{ padding: "0 18px 16px", fontSize: 14, color: "var(--text-secondary, #a0a0b0)", lineHeight: 1.7 }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-tertiary)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 15 }}>No results for "{search}"</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Try a different search term or chat with our support assistant below.</div>
          </div>
        )}

        {/* Chat prompt */}
        <div style={{ marginTop: 48, padding: "20px 24px", background: "rgba(108,92,231,0.08)", border: "1px solid rgba(108,92,231,0.2)", borderRadius: 14, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #b8b1ff, #6c5ce7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Still have a question?</div>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Chat with our support assistant in the bottom-right corner of your dashboard. It can answer questions about your account, calls, and settings in real time.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
