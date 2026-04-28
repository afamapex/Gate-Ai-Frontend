import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const BASE = import.meta.env.VITE_API_URL || "https://gate-ai-backend-production.up.railway.app";

const FAQ_ITEMS = [
  { category: "Call Screening", questions: [
    { q: "How does Gate AI decide to block or transfer a call?", a: "Gate AI listens to what the caller says and checks three things: (1) Do they name a specific person or give an operational reason? (2) Does their reason sound like a real business need or a sales pitch? (3) If they claim a prior relationship, can they back it up with a name or reference number? Based on your Screening Intensity setting, the AI decides whether to transfer or block." },
    { q: "What is Screening Intensity and which one should I use?", a: "Screening Intensity controls how strict the AI is. Relaxed passes through anyone who names a person or gives any business reason — good for high-trust environments. Moderate (recommended) requires both a name and a real reason. Aggressive also requires a verifiable detail like a reference number or address — best if you receive very high cold call volumes." },
    { q: "Why did a legitimate caller get blocked?", a: "This usually happens when a real caller can't provide a name or any verifiable details. Ask your contacts to mention the employee's name and the reason for calling when they ring — that will always get them through. You can also add them to your Whitelist / VIP list so they bypass screening entirely." },
    { q: "Can I add certain numbers so they never get screened?", a: "Yes — go to Screening Rules → Whitelist / VIP and add the caller's name and phone number. Once added, calls from that number go straight through without any AI screening." },
    { q: "What happens when a call is blocked?", a: "The AI delivers your rejection script (configurable in Screening Rules → AI Behavior). The script tells the caller to email your screening address if they have a genuine business reason. The call is logged in your Call Log with a full transcript and summary." },
  ]},
  { category: "Call Log & Dashboard", questions: [
    { q: "Why does the intent column show a short label instead of the full description?", a: "The intent label is shortened to keep the table readable. Hover over it to see the full intent description in a tooltip." },
    { q: "Why does Routed To show a dash for some calls?", a: "Routed To only shows a name for forwarded calls where the AI successfully matched a caller to an employee. Blocked or screened calls will show a dash since no transfer was made." },
    { q: "Can I export my call log?", a: "Yes — click the Export CSV button in the top right of the Call Log page to download all call records as a CSV file." },
    { q: "What does 'Screened' status mean vs 'Blocked'?", a: "Blocked means the AI confirmed it was an unwanted call and delivered the rejection script. Screened means the call ended before the AI could reach a definitive decision — for example, the caller hung up mid-conversation." },
  ]},
  { category: "Team & Routing", questions: [
    { q: "How do I add a team member?", a: "Go to Team & Routing → click Add Team Member. Enter their name, role, department, and most importantly their direct phone number. The phone number is what Gate AI dials when transferring a call to them." },
    { q: "What does Call Routing Rules do?", a: "Routing Rules tell the AI which employee to connect a caller to based on the type of call. For example, a 'Logistics Coordination' rule pointing to Dave Morton means that when a caller asks about logistics, the AI will try to transfer to Dave." },
    { q: "What is Call Priority?", a: "Priority (High / Medium / Low) tells the AI the relative importance of each routing rule. High priority rules are checked first. This is useful if multiple rules could match the same call." },
  ]},
  { category: "Settings", questions: [
    { q: "How do I change the AI assistant's name?", a: "Go to Settings → AI Assistant → change the Assistant Name field and click Save. The name takes effect on the next call." },
    { q: "Why is my screening email not being said on calls?", a: "Make sure you have saved your Screening Email in Screening Rules → AI Behavior → Screening Email. Also check your custom rejection script — if you have one, make sure it includes your email address." },
    { q: "How do I set up Slack notifications?", a: "Go to Integrations → Slack → enter your Slack webhook URL and save. Once connected you will receive real-time notifications for blocked and forwarded calls." },
    { q: "Can I customise what the AI says when it rejects a call?", a: "Yes — go to Screening Rules → AI Behavior. You can set a custom rejection script. Make sure it ends with 'Have a good day' or a similar closing phrase so the call ends cleanly." },
  ]},
  { category: "Billing & Account", questions: [
    { q: "How do I upgrade my plan?", a: "Click Manage Billing in the dashboard. You will be taken to your Stripe billing portal where you can upgrade, downgrade, or manage your payment details." },
    { q: "What happens when my trial ends?", a: "Your Gate AI number stays active but call screening will pause until you subscribe. You won't lose any data or settings. Simply subscribe from the billing banner on your dashboard to resume." },
  ]},
];

// ─── Exact same chat widget as Dashboard ────────────────────
function HelpChatWidget({ assistantName = "GATE-AI" }) {
  const [open,        setOpen]        = useState(false);
  const [messages,    setMessages]    = useState([
    { role: "assistant", content: `Hi! I'm ${assistantName}, your Gate AI support assistant. How can I help you today?` }
  ]);
  const [input,       setInput]       = useState("");
  const [sending,     setSending]     = useState(false);
  const [escalating,  setEscalating]  = useState(false);
  const [escalated,   setEscalated]   = useState(false);
  const [showEscForm, setShowEscForm] = useState(false);
  const [escForm,     setEscForm]     = useState({ name: "", email: "", issue: "" });
  const [pendingImage, setPendingImage] = useState(null);
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    setMessages([{ role: "assistant", content: `Hi! I'm ${assistantName}, your Gate AI support assistant. How can I help you today?` }]);
  }, [assistantName]);

  async function sendMessage() {
    const text = input.trim();
    if (!text && !pendingImage) return;
    setSending(true);
    const userMsg = { role: "user", content: text || "What do you see in this image?", ...(pendingImage ? { image: pendingImage.data, imageType: pendingImage.type } : {}) };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setPendingImage(null);
    try {
      const token = localStorage.getItem("gateai_token");
      const res = await fetch(`${BASE}/api/help/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ messages: updated, assistantName }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, I couldn't process that." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." }]);
    } finally { setSending(false); }
  }

  async function handleEscalate() {
    if (!escForm.issue.trim()) return;
    setEscalating(true);
    const transcript = messages.map(m => `${m.role === "assistant" ? assistantName : "You"}: ${m.content}`).join("\n");
    try {
      const token = localStorage.getItem("gateai_token");
      await fetch(`${BASE}/api/help/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...escForm, transcript, assistantName }),
      });
      setEscalated(true);
      setShowEscForm(false);
      setMessages(prev => [...prev, { role: "assistant", content: "✓ Your request has been sent to the Gate AI support team at hello@gate-ai.io. We'll get back to you as soon as possible!" }]);
    } catch { alert("Failed to send. Please email hello@gate-ai.io directly."); }
    finally { setEscalating(false); }
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPendingImage({ data: reader.result.split(",")[1], type: file.type });
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const bubbleStyle = (role) => ({
    maxWidth: "82%", padding: "10px 14px",
    borderRadius: role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
    fontSize: 13.5, lineHeight: 1.55,
    background: role === "user" ? "#6c5ce7" : "#f0f0f5",
    color: role === "user" ? "white" : "#1a1a2e",
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    wordBreak: "break-word",
  });

  return (
    <>
      <div onClick={() => setOpen(v => !v)} style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #6c5ce7, #a29bfe)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 20px rgba(108,92,231,0.45)", transition: "transform 200ms ease, box-shadow 200ms ease" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(108,92,231,0.6)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(108,92,231,0.45)"; }}
        title="Help & Support"
      >
        {open
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        }
      </div>

      {open && (
        <div style={{ position: "fixed", bottom: 88, right: 24, zIndex: 998, width: 360, maxWidth: "calc(100vw - 32px)", maxHeight: 520, background: "white", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header — exact match to dashboard */}
          <div style={{ padding: "14px 16px", background: "linear-gradient(135deg, #6c5ce7, #a29bfe)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{assistantName}</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d68f", display: "inline-block" }} />
                Gate AI Support
              </div>
            </div>
            {!escalated && (
              <button onClick={() => setShowEscForm(v => !v)} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11.5, color: "white", cursor: "pointer", fontFamily: "inherit" }} title="Talk to a human">
                👤 Agent
              </button>
            )}
          </div>

          {/* Escalation form */}
          {showEscForm && (
            <div style={{ padding: "12px 14px", background: "#f8f7ff", borderBottom: "1px solid #e8e5ff" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#4a4a6a", marginBottom: 8 }}>Connect with a Gate AI agent</div>
              <input style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #d0cdf0", fontSize: 13, marginBottom: 6, color: "#1a1a2e", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} placeholder="Your name" value={escForm.name} onChange={e => setEscForm(f => ({ ...f, name: e.target.value }))} />
              <input style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #d0cdf0", fontSize: 13, marginBottom: 6, color: "#1a1a2e", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} placeholder="Your email" value={escForm.email} onChange={e => setEscForm(f => ({ ...f, email: e.target.value }))} />
              <textarea style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #d0cdf0", fontSize: 13, color: "#1a1a2e", fontFamily: "inherit", resize: "none", outline: "none", minHeight: 60, boxSizing: "border-box" }} placeholder="Briefly describe your issue..." value={escForm.issue} onChange={e => setEscForm(f => ({ ...f, issue: e.target.value }))} />
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button onClick={() => setShowEscForm(false)} style={{ flex: 1, padding: "7px", borderRadius: 8, border: "1px solid #d0cdf0", background: "white", fontSize: 12.5, cursor: "pointer", color: "#6c6c8a" }}>Cancel</button>
                <button onClick={handleEscalate} disabled={escalating} style={{ flex: 2, padding: "7px", borderRadius: 8, border: "none", background: "#6c5ce7", color: "white", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{escalating ? "Sending..." : "Send to Agent"}</button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 10, background: "white" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.image && <img src={`data:${m.imageType};base64,${m.image}`} alt="uploaded" style={{ maxWidth: 180, borderRadius: 10, marginBottom: 4, alignSelf: m.role === "user" ? "flex-end" : "flex-start" }} />}
                <div style={bubbleStyle(m.role)}>{m.content}</div>
              </div>
            ))}
            {sending && (
              <div style={{ alignSelf: "flex-start", display: "flex", gap: 4, padding: "10px 14px", background: "#f0f0f5", borderRadius: "16px 16px 16px 4px" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#a29bfe", animation: `bounce 1s ease ${i * 0.2}s infinite` }} />)}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Image preview */}
          {pendingImage && (
            <div style={{ padding: "6px 12px", background: "#f8f7ff", borderTop: "1px solid #e8e5ff", display: "flex", alignItems: "center", gap: 8 }}>
              <img src={`data:${pendingImage.type};base64,${pendingImage.data}`} alt="preview" style={{ height: 36, borderRadius: 6 }} />
              <span style={{ fontSize: 12, color: "#6c6c8a", flex: 1 }}>Image ready to send</span>
              <button onClick={() => setPendingImage(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ff6b6b", fontSize: 16 }}>×</button>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #f0f0f5", display: "flex", gap: 8, alignItems: "flex-end", background: "white" }}>
            <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
            <button onClick={() => fileRef.current?.click()} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e0ddf0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#a29bfe" }} title="Attach image">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
            <input style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid #e0ddf0", fontSize: 13.5, outline: "none", fontFamily: "inherit", color: "#1a1a2e", background: "white" }} placeholder="Ask a question..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} onFocus={e => e.target.style.borderColor = "#6c5ce7"} onBlur={e => e.target.style.borderColor = "#e0ddf0"} />
            <button onClick={sendMessage} disabled={sending || (!input.trim() && !pendingImage)} style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: (sending || (!input.trim() && !pendingImage)) ? "#e0ddf0" : "#6c5ce7", cursor: (sending || (!input.trim() && !pendingImage)) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 150ms ease" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
        </div>
      )}
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function HelpPage() {
  const navigate                   = useNavigate();
  const [openItems,  setOpenItems] = useState({});
  const [search,     setSearch]    = useState("");
  const [assistantName, setAssistantName] = useState("GATE-AI");

  useEffect(() => {
    // ── 1. Inject CSS variables — this page runs in its own tab
    //       so Dashboard's CSS doesn't exist here. Define them here.
    const style = document.createElement("style");
    style.id = "gate-ai-help-vars";
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      :root {
        --bg-primary: #0a0b0f; --bg-secondary: #111218; --bg-tertiary: #181a23;
        --bg-card: #13141b; --bg-hover: #1a1c26;
        --border: #252736; --border-light: #2a2d40;
        --text-primary: #e8e9ed; --text-secondary: #8b8fa3; --text-tertiary: #5c6078;
        --accent: #6c5ce7; --accent-light: #a29bfe;
        --accent-dim: rgba(108,92,231,0.15); --accent-glow: rgba(108,92,231,0.3);
        --font-sans: 'DM Sans', -apple-system, sans-serif;
      }
      [data-theme="light"] {
        --bg-primary: #f4f5f9; --bg-secondary: #ffffff; --bg-tertiary: #eef0f6;
        --bg-card: #ffffff; --bg-hover: #eef0f6;
        --border: #e2e5f0; --border-light: #d0d4e8;
        --text-primary: #1a1d2e; --text-secondary: #4a5068; --text-tertiary: #8b8fa3;
        --accent: #6c5ce7; --accent-light: #6c5ce7;
        --accent-dim: rgba(108,92,231,0.10); --accent-glow: rgba(108,92,231,0.20);
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: var(--font-sans); background: var(--bg-primary); color: var(--text-primary); }
      #root { background: var(--bg-primary); min-height: 100vh; }
    `;
    if (!document.getElementById("gate-ai-help-vars")) {
      document.head.appendChild(style);
    }

    // ── 2. Sync theme from localStorage (same key as dashboard) ──
    const saved = localStorage.getItem("gateai_theme");
    const theme = saved || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);

    // ── 3. Load assistant name ──
    try {
      const stored = localStorage.getItem("gateai_company");
      if (stored) {
        const co = JSON.parse(stored);
        if (co?.assistant_name) setAssistantName(co.assistant_name);
      }
    } catch {}
  }, []);

  function goBack() {
    // If this tab was opened by window.open (from the dashboard), close it
    // which returns focus to the original dashboard tab.
    // If the user navigated here directly, fall back to navigating to /dashboard.
    if (window.opener) {
      window.close();
    } else {
      try { navigate("/dashboard"); } catch { window.location.href = "/dashboard"; }
    }
  }

  const toggle   = (key) => setOpenItems(p => ({ ...p, [key]: !p[key] }));
  const filtered = search.trim()
    ? FAQ_ITEMS.map(cat => ({ ...cat, questions: cat.questions.filter(i => i.q.toLowerCase().includes(search.toLowerCase()) || i.a.toLowerCase().includes(search.toLowerCase())) })).filter(cat => cat.questions.length > 0)
    : FAQ_ITEMS;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "var(--font-sans, 'DM Sans', system-ui, sans-serif)" }}>

      {/* Sticky header */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="26" height="26" viewBox="0 0 60 60" fill="none">
            <defs><linearGradient id="hpg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#b8b1ff"/><stop offset="100%" stopColor="#6c5ce7"/></linearGradient></defs>
            <path d="M30 4 L52 12 Q53 12.5 53 14 L53 30 Q53 46 30.7 57.5 Q30 58 29.3 57.5 Q7 46 7 30 L7 14 Q7 12.5 8 12 Z" fill="url(#hpg)"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Gate AI Help & FAQ</span>
        </div>
        <button onClick={goBack} style={{ background: "#6c5ce7", border: "none", color: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          ← Back to dashboard
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px 100px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Help & FAQ</h1>
        <p style={{ fontSize: 14, color: "var(--text-tertiary)", marginBottom: 28 }}>Find answers to common questions about Gate AI. Can't find what you're looking for? Use the chat button in the bottom-right corner.</p>

        <div style={{ position: "relative", marginBottom: 36 }}>
          <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for an answer…" style={{ width: "100%", padding: "11px 14px 11px 42px", background: "var(--bg-card, var(--bg-tertiary))", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} />
        </div>

        {filtered.map((cat, ci) => (
          <div key={ci} style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6c5ce7", marginBottom: 12 }}>{cat.category}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {cat.questions.map((item, qi) => {
                const key = `${ci}-${qi}`;
                const open = !!openItems[key];
                return (
                  <div key={qi} style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", background: open ? "var(--bg-card)" : "var(--bg-secondary)", transition: "background 0.15s", boxShadow: open ? "0 2px 8px rgba(0,0,0,0.06)" : "none" }}>
                    <div onClick={() => toggle(key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", cursor: "pointer", userSelect: "none" }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", paddingRight: 12 }}>{item.q}</span>
                      <span style={{ flexShrink: 0, fontSize: 12, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", color: "var(--text-tertiary)" }}>▾</span>
                    </div>
                    {open && <div style={{ padding: "0 16px 14px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{item.a}</div>}
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
            <div style={{ fontSize: 13, marginTop: 6 }}>Try a different search term or use the chat button below.</div>
          </div>
        )}

        <div style={{ marginTop: 48, padding: "18px 20px", background: "rgba(108,92,231,0.08)", border: "1px solid rgba(108,92,231,0.2)", borderRadius: 14, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #b8b1ff, #6c5ce7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Still have a question?</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Use the chat button in the bottom-right corner — our support assistant can answer questions about your account, calls, and settings in real time.</div>
          </div>
        </div>
      </div>

      <HelpChatWidget assistantName={assistantName} />
    </div>
  );
}
