import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { staffDemoRequests, staffMeetings } from '../services/staffApi.js';
import ConfirmModal from '../components/ConfirmModal.jsx';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function fmtSlot(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
}

const STATUSES = ['new', 'meeting_invite_sent', 'scheduled', 'completed', 'no_show', 'rescheduling', 'declined', 'invited'];
const STATUS_LABELS = {
  new: 'New', meeting_invite_sent: 'Meeting invite sent', scheduled: 'Scheduled',
  completed: 'Completed', no_show: 'No-show', rescheduling: 'Rescheduling',
  declined: 'Declined', invited: 'Invited to register',
};
const STATUS_PALETTES = {
  new:                 ['rgba(91,192,222,0.12)', 'rgba(91,192,222,0.35)', '#5bc0de'],
  meeting_invite_sent: ['rgba(108,92,231,0.15)', 'rgba(108,92,231,0.4)',  '#a29bfe'],
  scheduled:           ['rgba(81,207,102,0.12)', 'rgba(81,207,102,0.35)', '#51cf66'],
  completed:           ['rgba(108,92,231,0.15)', 'rgba(108,92,231,0.4)',  '#a29bfe'],
  no_show:             ['rgba(255,107,107,0.1)', 'rgba(255,107,107,0.3)', '#ff6b6b'],
  rescheduling:        ['rgba(255,165,0,0.12)',  'rgba(255,165,0,0.35)',  '#ffb347'],
  declined:            ['rgba(139,143,163,0.12)','rgba(139,143,163,0.35)','#8b8fa3'],
  invited:             ['rgba(81,207,102,0.12)', 'rgba(81,207,102,0.35)', '#51cf66'],
};
function StatusBadge({ value }) {
  const [bg, border, fg] = STATUS_PALETTES[value] || STATUS_PALETTES.new;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      background: bg, border: `1px solid ${border}`, color: fg,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4,
    }}>{STATUS_LABELS[value] || value}</span>
  );
}
function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '8px 0', fontSize: 13.5, borderBottom: '1px solid rgba(28,30,42,0.5)' }}>
      <div style={{ color: '#8b8fa3', flexShrink: 0 }}>{label}</div>
      <div style={{ color: '#e8e9ed', textAlign: 'right', wordBreak: 'break-word', maxWidth: '65%' }}>{value}</div>
    </div>
  );
}

export default function StaffDemoRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dr, setDr] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await staffDemoRequests.get(id);
      setDr(res.demo_request);
      setNotes(res.demo_request.internal_notes || '');
      setStatus(res.demo_request.status);
      if (res.demo_request.latest_meeting_id) {
        try {
          const m = await staffMeetings.get(res.demo_request.latest_meeting_id);
          setMeeting(m.meeting);
        } catch { setMeeting(null); }
      } else {
        setMeeting(null);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500); }

  async function saveChanges() {
    setSaving(true);
    try {
      const updates = {};
      if (status !== dr.status) updates.status = status;
      if (notes !== (dr.internal_notes || '')) updates.internal_notes = notes;
      if (Object.keys(updates).length === 0) { showToast('No changes to save'); setSaving(false); return; }
      await staffDemoRequests.update(id, updates);
      showToast('Saved'); load();
    } catch (err) { showToast(`Save failed: ${err.message}`); }
    finally { setSaving(false); }
  }

  function convertToInvite() {
    if (!dr) return;
    const nameParts = (dr.name || '').split(' ');
    const params = new URLSearchParams({
      email: dr.email || '',
      first_name: nameParts[0] || '',
      company_name: dr.company || '',
      demo_request_id: dr.id,
    });
    navigate(`/staff/invites/new?${params.toString()}`);
  }

  async function sendMeetingInvite() {
    setBusy('send'); setConfirm(null);
    try {
      const res = await staffMeetings.fromDemoRequest(dr.id);
      showToast(res.reused ? 'A pending invite already exists' : 'Meeting invite sent');
      load();
    } catch (err) { showToast(`Failed: ${err.message}`); }
    finally { setBusy(null); }
  }
  async function resendInvite() {
    setBusy('resend');
    try { await staffMeetings.resend(meeting.id); showToast('Invite resent'); load(); }
    catch (err) { showToast(`Failed: ${err.message}`); }
    finally { setBusy(null); }
  }
  async function markCompleted() {
    setBusy('complete'); setConfirm(null);
    try { await staffMeetings.markCompleted(meeting.id); showToast('Marked completed'); load(); }
    catch (err) { showToast(`Failed: ${err.message}`); }
    finally { setBusy(null); }
  }
  async function markNoShow() {
    setBusy('noshow'); setConfirm(null);
    try { await staffMeetings.markNoShow(meeting.id); showToast('Marked no-show. Reschedule invite sent.'); load(); }
    catch (err) { showToast(`Failed: ${err.message}`); }
    finally { setBusy(null); }
  }
  async function markDeclined() {
    setBusy('decline'); setConfirm(null);
    try { await staffMeetings.markDeclined(meeting.id); showToast('Marked declined'); load(); }
    catch (err) { showToast(`Failed: ${err.message}`); }
    finally { setBusy(null); }
  }
  async function copyBookingLink() {
    if (!meeting?.token) return;
    const url = `${window.location.origin}/book/${meeting.token}`;
    try { await navigator.clipboard.writeText(url); showToast('Booking link copied'); }
    catch { showToast(url); }
  }

  if (loading) return <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8b8fa3' }}>Loading…</div>;
  if (error || !dr) return (
    <>
      <Link to="/staff/demo-requests" style={{ color: '#8b8fa3', fontSize: 13, textDecoration: 'none' }}>← All demo requests</Link>
      <div style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', color: '#ff6b6b', padding: '12px 16px', borderRadius: 8, fontSize: 13.5, marginTop: 14 }}>{error || 'Not found'}</div>
    </>
  );

  return (
    <>
      <style>{`
        .drd-card { background: #111218; border: 1px solid #252736; border-radius: 12px; padding: 20px; }
        .drd-card-title { font-size: 12px; font-weight: 700; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #1c1e2a; }
        .drd-input { width: 100%; padding: 9px 13px; background: #13141b; border: 1px solid #252736; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #e8e9ed; outline: none; }
        .drd-input:focus { border-color: #6c5ce7; }
        .drd-label { font-size: 11.5px; font-weight: 600; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .drd-btn { padding: 9px 16px; border: none; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; transition: opacity 120ms ease, transform 100ms ease; }
        .drd-btn:active:not(:disabled) { transform: scale(0.97); }
        .drd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .drd-btn-primary { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff; }
        .drd-btn-primary:hover:not(:disabled) { opacity: 0.88; }
        .drd-btn-ghost { background: #1c1e2a; color: #e8e9ed; }
        .drd-btn-ghost:hover:not(:disabled) { background: #252736; }
        .drd-btn-green { background: linear-gradient(135deg, #00d68f, #51cf66); color: #fff; }
        .drd-btn-green:hover:not(:disabled) { opacity: 0.88; }
        .drd-btn-orange { background: linear-gradient(135deg, #ffb347, #ff8c42); color: #fff; }
        .drd-btn-orange:hover:not(:disabled) { opacity: 0.88; }
        .drd-btn-red { background: linear-gradient(135deg, #ff6b6b, #f06595); color: #fff; }
        .drd-btn-red:hover:not(:disabled) { opacity: 0.88; }
        .drd-toast { position: fixed; bottom: 30px; right: 30px; background: #111218; border: 1px solid #252736; border-left: 3px solid #6c5ce7; padding: 14px 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; color: #e8e9ed; font-size: 13.5px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 500; max-width: 360px; }
      `}</style>

      <div style={{ marginBottom: 14 }}>
        <Link to="/staff/demo-requests" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#8b8fa3', fontSize: 13, textDecoration: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          All demo requests
        </Link>
      </div>

      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e9ed', letterSpacing: -0.3, marginBottom: 8 }}>{dr.name}</h1>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge value={dr.status} />
          <span style={{ color: '#8b8fa3', fontSize: 13.5 }}>· {dr.email}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <div className="drd-card">
          <div className="drd-card-title">Request details</div>
          <Row label="Name" value={dr.name} />
          <Row label="Email" value={dr.email} />
          <Row label="Company" value={dr.company || '—'} />
          <Row label="Industry" value={dr.industry || '—'} />
          <Row label="Calls/day" value={dr.calls_per_day || '—'} />
          <Row label="Source" value={dr.source || '—'} />
          <Row label="Submitted" value={fmtDate(dr.created_at)} />
          {dr.notes && <Row label="Prospect notes" value={dr.notes} />}
          {dr.invite_id && (
            <Row label="Invite" value={
              <Link to={`/staff/invites/${dr.invite_id}`} style={{ color: '#a29bfe', textDecoration: 'none' }}>
                View invite ({dr.invite_status || '—'}) →
              </Link>
            } />
          )}
        </div>

        <div className="drd-card">
          <div className="drd-card-title">Meeting</div>

          {!meeting && (
            <>
              <p style={{ fontSize: 13.5, color: '#8b8fa3', marginBottom: 14, lineHeight: 1.55 }}>
                No meeting invite sent yet. Click below to email the prospect a Google Meet booking link. They'll pick a time and a real Meet event will be created automatically.
              </p>
              <button className="drd-btn drd-btn-primary" onClick={() => setConfirm({ type: 'send' })} disabled={busy === 'send'}>
                {busy === 'send' ? 'Sending…' : 'Send meeting invite'}
              </button>
            </>
          )}

          {meeting && (
            <>
              <div style={{ marginBottom: 14 }}><StatusBadge value={meeting.status} /></div>
              <Row label="Sent" value={fmtDate(meeting.created_at)} />
              {meeting.scheduled_start_at && <Row label="Scheduled" value={fmtSlot(meeting.scheduled_start_at)} />}
              {meeting.prospect_timezone && <Row label="Timezone" value={meeting.prospect_timezone} />}
              {meeting.google_meet_url && (
                <Row label="Meet link" value={
                  <a href={meeting.google_meet_url} target="_blank" rel="noopener noreferrer" style={{ color: '#a29bfe', textDecoration: 'none' }}>
                    Open Google Meet →
                  </a>
                } />
              )}
              {meeting.google_calendar_link && (
                <Row label="Calendar" value={
                  <a href={meeting.google_calendar_link} target="_blank" rel="noopener noreferrer" style={{ color: '#a29bfe', textDecoration: 'none' }}>
                    Open in Google Calendar →
                  </a>
                } />
              )}
              <Row label="Reminders sent" value={meeting.reminder_count ?? 0} />

              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(meeting.status === 'pending' || meeting.status === 'rescheduling') && (
                  <>
                    <button className="drd-btn drd-btn-ghost" onClick={resendInvite} disabled={busy === 'resend'}>
                      {busy === 'resend' ? 'Resending…' : 'Resend invite'}
                    </button>
                    <button className="drd-btn drd-btn-ghost" onClick={copyBookingLink}>Copy booking link</button>
                  </>
                )}
                {meeting.status === 'scheduled' && (
                  <>
                    <button className="drd-btn drd-btn-green" onClick={() => setConfirm({ type: 'complete' })} disabled={!!busy}>Mark completed</button>
                    <button className="drd-btn drd-btn-orange" onClick={() => setConfirm({ type: 'noshow' })} disabled={!!busy}>Mark no-show</button>
                    <button className="drd-btn drd-btn-red" onClick={() => setConfirm({ type: 'decline' })} disabled={!!busy}>Mark declined</button>
                  </>
                )}
                {meeting.status === 'completed' && !dr.invite_id && (
                  <button className="drd-btn drd-btn-green" onClick={convertToInvite}>Send registration invite →</button>
                )}
                {meeting.status === 'no_show' && (
                  <span style={{ fontSize: 12.5, color: '#8b8fa3' }}>Reschedule invite already sent — tracked above.</span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="drd-card">
          <div className="drd-card-title">Manage</div>

          <div style={{ marginBottom: 16 }}>
            <div className="drd-label">Status</div>
            <select className="drd-input" value={status} onChange={e => setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div className="drd-label">Internal notes</div>
            <textarea
              className="drd-input"
              rows={4}
              placeholder="Add internal notes about this prospect…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="drd-btn drd-btn-primary" onClick={saveChanges} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>

          {dr.status === 'completed' && !dr.invite_id && !meeting && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #1c1e2a' }}>
              <div className="drd-label" style={{ marginBottom: 8 }}>Ready to convert?</div>
              <button className="drd-btn drd-btn-green" onClick={convertToInvite}>Convert to invite →</button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal open={confirm?.type === 'send'} title={`Send meeting invite to ${dr.name}?`}
        message={`This will email ${dr.email} a booking link to pick a 30-minute slot in the next 5 business days. We'll automatically send daily reminders for 5 days if they don't book.`}
        confirmLabel="Send invite" variant="primary" loading={busy === 'send'}
        onConfirm={sendMeetingInvite} onCancel={() => setConfirm(null)} />
      <ConfirmModal open={confirm?.type === 'complete'} title="Mark meeting as completed?"
        message="This confirms the demo happened. You'll then be able to send them a registration invite."
        confirmLabel="Mark completed" variant="primary" loading={busy === 'complete'}
        onConfirm={markCompleted} onCancel={() => setConfirm(null)} />
      <ConfirmModal open={confirm?.type === 'noshow'} title="Mark as no-show?"
        message="The Google Calendar event will be cancelled and a new reschedule invite will be sent to the prospect automatically. We'll send daily reschedule reminders for 5 business days if they don't rebook."
        confirmLabel="Mark no-show" variant="danger" loading={busy === 'noshow'}
        onConfirm={markNoShow} onCancel={() => setConfirm(null)} />
      <ConfirmModal open={confirm?.type === 'decline'} title="Mark as declined?"
        message="The Google Calendar event will be cancelled. The prospect won't get any further reminders."
        confirmLabel="Mark declined" variant="danger" loading={busy === 'decline'}
        onConfirm={markDeclined} onCancel={() => setConfirm(null)} />

      {toast && <div className="drd-toast">{toast}</div>}
    </>
  );
}
