import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'https://gate-ai-backend-production.up.railway.app';

// Common timezones for the override dropdown
const COMMON_TZS = [
  'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
  'America/Toronto', 'America/Mexico_City', 'America/Sao_Paulo',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Madrid',
  'Africa/Lagos', 'Africa/Cairo', 'Africa/Johannesburg',
  'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Shanghai',
  'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
];

function detectTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago'; }
  catch { return 'America/Chicago'; }
}

export default function Book() {
  const { token } = useParams();
  const [validating, setValidating] = useState(true);
  const [invalid, setInvalid] = useState(null);
  const [meeting, setMeeting] = useState(null);

  const [timezone, setTimezone] = useState(detectTimezone());
  const [showTzPicker, setShowTzPicker] = useState(false);

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(null); // booked meeting

  // Validate token
  useEffect(() => {
    fetch(`${API}/api/meetings/validate/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setMeeting(data.meeting);
          if (data.meeting.status === 'scheduled') {
            // Already booked — show confirmation
            setConfirmed(data.meeting);
          }
        } else {
          setInvalid(data.reason || 'not_found');
        }
      })
      .catch(() => setInvalid('not_found'))
      .finally(() => setValidating(false));
  }, [token]);

  // Load slots whenever timezone changes
  const loadSlots = useCallback(async () => {
    if (!meeting || confirmed) return;
    setSlotsLoading(true); setError('');
    try {
      const r = await fetch(`${API}/api/meetings/slots/${token}?timezone=${encodeURIComponent(timezone)}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed to load slots');
      setSlots(data.slots || []);
    } catch (err) {
      setError(err.message);
    } finally { setSlotsLoading(false); }
  }, [meeting, confirmed, timezone, token]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  async function handleBook() {
    if (!selected) return;
    setSubmitting(true); setError('');
    try {
      const r = await fetch(`${API}/api/meetings/book/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: selected.start, end: selected.end, timezone }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Booking failed');
      setConfirmed(data.meeting);
    } catch (err) {
      setError(err.message);
    } finally { setSubmitting(false); }
  }

  // Group slots by day for display
  const slotsByDay = {};
  slots.forEach(s => {
    if (!slotsByDay[s.dayLabel]) slotsByDay[s.dayLabel] = [];
    slotsByDay[s.dayLabel].push(s);
  });
  const dayKeys = Object.keys(slotsByDay);

  return (
    <>
      <style>{css}</style>
      <div className="bk-wrap">
        <div className="bk-card">
          {/* Logo */}
          <div className="bk-logo">
            <div className="bk-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="bk-logo-text">Gate AI</span>
          </div>

          {validating && <div className="bk-state">Loading…</div>}

          {!validating && invalid && (
            <div className="bk-invalid">
              <div className="bk-invalid-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 style={{ textAlign: 'center', fontSize: 22, color: '#e8e9ed', marginBottom: 8 }}>
                {invalid === 'expired'    && 'This booking link has expired'}
                {invalid === 'cancelled'  && 'This booking has been cancelled'}
                {invalid === 'not_found'  && 'Invalid booking link'}
              </h2>
              <p style={{ color: '#8b8fa3', textAlign: 'center', fontSize: 14, lineHeight: 1.6 }}>
                Please contact <a href="mailto:hello@gate-ai.io" style={{ color: '#a29bfe' }}>hello@gate-ai.io</a> to request a new link.
              </p>
            </div>
          )}

          {!validating && confirmed && (
            <>
              <div className="bk-success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h1 className="bk-heading" style={{ textAlign: 'center' }}>You're booked!</h1>
              <p className="bk-muted" style={{ textAlign: 'center' }}>
                We've sent a calendar invite to <strong style={{ color: '#e8e9ed' }}>{meeting?.prospect_email}</strong>.
              </p>

              <div className="bk-conf-box">
                <div className="bk-conf-row">
                  <div className="bk-conf-label">When</div>
                  <div className="bk-conf-value">{formatLong(confirmed.scheduled_start_at, timezone)}</div>
                </div>
                <div className="bk-conf-row">
                  <div className="bk-conf-label">Timezone</div>
                  <div className="bk-conf-value">{confirmed.prospect_timezone || timezone}</div>
                </div>
                {confirmed.google_meet_url && (
                  <div className="bk-conf-row">
                    <div className="bk-conf-label">Meet link</div>
                    <div className="bk-conf-value">
                      <a href={confirmed.google_meet_url} target="_blank" rel="noopener noreferrer" style={{ color: '#a29bfe', textDecoration: 'none' }}>
                        Open Google Meet →
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {confirmed.google_calendar_link && (
                <a href={confirmed.google_calendar_link} target="_blank" rel="noopener noreferrer" className="bk-btn bk-btn-primary" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', marginTop: 8 }}>
                  View in Google Calendar
                </a>
              )}

              <p className="bk-tip">Check your inbox for the calendar invite. We'll see you then!</p>
            </>
          )}

          {!validating && !invalid && !confirmed && meeting && (
            <>
              <h1 className="bk-heading">Pick a time for your demo</h1>
              <p className="bk-muted">
                Hi {meeting.prospect_name?.split(' ')[0]}! Choose a 30-minute slot that works for you.
                We'll meet on <strong style={{ color: '#e8e9ed' }}>Google Meet</strong>.
              </p>

              <div className="bk-tz-bar">
                <div className="bk-tz-current">
                  <span className="bk-tz-dot"/>
                  Times shown in <strong>{timezone}</strong>
                </div>
                <button className="bk-tz-link" onClick={() => setShowTzPicker(!showTzPicker)}>
                  {showTzPicker ? 'Cancel' : 'Change timezone'}
                </button>
              </div>

              {showTzPicker && (
                <select
                  className="bk-tz-select"
                  value={timezone}
                  onChange={e => { setTimezone(e.target.value); setSelected(null); }}
                >
                  {!COMMON_TZS.includes(timezone) && <option value={timezone}>{timezone} (auto-detected)</option>}
                  {COMMON_TZS.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              )}

              {error && <div className="bk-error">{error}</div>}

              {slotsLoading && <div className="bk-state">Loading available slots…</div>}

              {!slotsLoading && slots.length === 0 && !error && (
                <div className="bk-state">No slots available in the next 5 business days. Please contact us to schedule manually.</div>
              )}

              {!slotsLoading && dayKeys.length > 0 && (
                <div className="bk-days">
                  {dayKeys.map(day => (
                    <div key={day} className="bk-day">
                      <div className="bk-day-header">{day}</div>
                      <div className="bk-day-slots">
                        {slotsByDay[day].map(s => (
                          <button
                            key={s.start}
                            className={`bk-slot ${selected?.start === s.start ? 'bk-slot-selected' : ''}`}
                            onClick={() => setSelected(s)}
                          >
                            {s.timeLabel}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selected && (
                <div className="bk-confirm-bar">
                  <div className="bk-confirm-bar-text">
                    Booking <strong>{selected.label}</strong>
                  </div>
                  <button className="bk-btn bk-btn-primary" onClick={handleBook} disabled={submitting}>
                    {submitting ? 'Booking…' : 'Confirm booking'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function formatLong(iso, tz) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short',
  }).format(new Date(iso));
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0b0f; }

  .bk-wrap {
    min-height: 100vh;
    display: flex; align-items: flex-start; justify-content: center;
    background: #0a0b0f;
    font-family: 'DM Sans', -apple-system, sans-serif;
    padding: 32px 20px;
    -webkit-font-smoothing: antialiased;
  }

  .bk-card {
    width: 100%; max-width: 560px;
    background: #111218;
    border: 1px solid #252736;
    border-radius: 16px;
    padding: 36px 32px;
  }

  .bk-logo {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 28px;
  }
  .bk-logo-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 12px rgba(108,92,231,0.35);
  }
  .bk-logo-text {
    font-size: 19px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px;
  }

  .bk-heading {
    font-size: 24px; font-weight: 700; color: #e8e9ed;
    letter-spacing: -0.4px; margin-bottom: 8px;
  }
  .bk-muted {
    font-size: 14.5px; color: #8b8fa3; line-height: 1.6; margin-bottom: 22px;
  }

  .bk-tz-bar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 14px; background: #13141b; border: 1px solid #252736;
    border-radius: 9px; margin-bottom: 12px;
  }
  .bk-tz-current { font-size: 13px; color: #b0b3c5; display: flex; align-items: center; gap: 8px; }
  .bk-tz-dot { width: 6px; height: 6px; border-radius: 50%; background: #51cf66; box-shadow: 0 0 4px #51cf66; }
  .bk-tz-link { background: none; border: none; color: #a29bfe; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .bk-tz-link:hover { text-decoration: underline; }
  .bk-tz-select {
    width: 100%; padding: 10px 13px; background: #13141b; border: 1px solid #252736;
    border-radius: 8px; color: #e8e9ed; font-family: inherit; font-size: 13.5px;
    outline: none; margin-bottom: 16px; cursor: pointer;
  }
  .bk-tz-select:focus { border-color: #6c5ce7; }

  .bk-days { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }
  .bk-day {}
  .bk-day-header {
    font-size: 12px; font-weight: 700; color: #a29bfe;
    text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px;
    padding-bottom: 6px; border-bottom: 1px solid #1c1e2a;
  }
  .bk-day-slots {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)); gap: 6px;
  }
  .bk-slot {
    padding: 9px 10px; background: #13141b; border: 1px solid #252736;
    border-radius: 7px; color: #e8e9ed; font-family: inherit;
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: all 100ms ease;
  }
  .bk-slot:hover { border-color: #6c5ce7; background: #15171f; }
  .bk-slot-selected {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    border-color: #6c5ce7; color: #fff;
  }

  .bk-confirm-bar {
    position: sticky; bottom: 16px;
    margin-top: 24px; padding: 14px 16px;
    background: #1c1e2a; border: 1px solid #6c5ce7;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap;
    box-shadow: 0 8px 24px rgba(108,92,231,0.2);
  }
  .bk-confirm-bar-text { font-size: 13.5px; color: #e8e9ed; flex: 1; min-width: 180px; }

  .bk-btn {
    padding: 11px 20px; border: none; border-radius: 8px; cursor: pointer;
    font-family: inherit; font-size: 13.5px; font-weight: 600;
    transition: opacity 120ms ease;
  }
  .bk-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .bk-btn-primary { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff; }
  .bk-btn-primary:hover:not(:disabled) { opacity: 0.88; }

  .bk-error {
    background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.25);
    border-radius: 8px; padding: 10px 14px;
    font-size: 13px; color: #ff6b6b; margin-bottom: 14px;
  }

  .bk-state { padding: 32px 0; text-align: center; color: #8b8fa3; font-size: 14px; }

  .bk-invalid, .bk-success-icon { padding: 12px 0; }
  .bk-invalid-icon, .bk-success-icon {
    width: 56px; height: 56px; margin: 0 auto 16px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
  }
  .bk-invalid-icon { background: rgba(255,107,107,0.12); border: 1px solid rgba(255,107,107,0.3); color: #ff6b6b; }
  .bk-success-icon { background: rgba(81,207,102,0.12); border: 1px solid rgba(81,207,102,0.3); color: #51cf66; }

  .bk-conf-box {
    background: #13141b; border: 1px solid #252736; border-radius: 10px;
    padding: 16px; margin: 18px 0;
  }
  .bk-conf-row {
    display: flex; justify-content: space-between; gap: 16px;
    padding: 8px 0; font-size: 13.5px;
    border-bottom: 1px solid rgba(28,30,42,0.5);
  }
  .bk-conf-row:last-child { border-bottom: none; }
  .bk-conf-label { color: #8b8fa3; flex-shrink: 0; }
  .bk-conf-value { color: #e8e9ed; text-align: right; word-break: break-word; max-width: 65%; font-weight: 600; }

  .bk-tip { margin-top: 16px; text-align: center; font-size: 12.5px; color: #6b6e82; }

  @media (max-width: 500px) {
    .bk-card { padding: 28px 22px; }
    .bk-day-slots { grid-template-columns: repeat(3, 1fr); }
  }
`;
