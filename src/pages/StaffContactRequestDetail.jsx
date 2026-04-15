import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { staffContactRequests } from '../services/staffApi.js';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const STATUSES = ['new', 'in_progress', 'resolved', 'spam'];
const STATUS_LABELS = { new: 'New', in_progress: 'In Progress', resolved: 'Resolved', spam: 'Spam' };

function StatusBadge({ value }) {
  const palettes = {
    new:         ['rgba(91,192,222,0.12)', 'rgba(91,192,222,0.35)', '#5bc0de'],
    in_progress: ['rgba(255,165,0,0.12)',  'rgba(255,165,0,0.35)',  '#ffb347'],
    resolved:    ['rgba(81,207,102,0.12)', 'rgba(81,207,102,0.35)', '#51cf66'],
    spam:        ['rgba(139,143,163,0.12)','rgba(139,143,163,0.35)','#8b8fa3'],
  };
  const [bg, border, fg] = palettes[value] || palettes.new;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      background: bg, border: `1px solid ${border}`, color: fg,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4,
    }}>{(value || '').replace('_', ' ')}</span>
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

export default function StaffContactRequestDetail() {
  const { id } = useParams();
  const [cr, setCr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await staffContactRequests.get(id);
      setCr(res.contact_request);
      setNotes(res.contact_request.internal_notes || '');
      setStatus(res.contact_request.status);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500); }

  async function saveChanges() {
    setSaving(true);
    try {
      const updates = {};
      if (status !== cr.status) updates.status = status;
      if (notes !== (cr.internal_notes || '')) updates.internal_notes = notes;
      if (Object.keys(updates).length === 0) { showToast('No changes to save'); setSaving(false); return; }
      await staffContactRequests.update(id, updates);
      showToast('Saved');
      load();
    } catch (err) { showToast(`Save failed: ${err.message}`); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: '60px 20px', textAlign: 'center', color: '#8b8fa3' }}>Loading…</div>;
  if (error || !cr) return (
    <>
      <Link to="/staff/contact-requests" style={{ color: '#8b8fa3', fontSize: 13, textDecoration: 'none' }}>← Contact inbox</Link>
      <div style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', color: '#ff6b6b', padding: '12px 16px', borderRadius: 8, fontSize: 13.5, marginTop: 14 }}>{error || 'Not found'}</div>
    </>
  );

  return (
    <>
      <style>{`
        .crd-card { background: #111218; border: 1px solid #252736; border-radius: 12px; padding: 20px; }
        .crd-card-title { font-size: 12px; font-weight: 700; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #1c1e2a; }
        .crd-input { width: 100%; padding: 9px 13px; background: #13141b; border: 1px solid #252736; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #e8e9ed; outline: none; }
        .crd-input:focus { border-color: #6c5ce7; }
        .crd-label { font-size: 11.5px; font-weight: 600; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .crd-btn { padding: 9px 16px; border: none; border-radius: 8px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; transition: opacity 120ms ease, transform 100ms ease; }
        .crd-btn:active:not(:disabled) { transform: scale(0.97); }
        .crd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .crd-btn-primary { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff; }
        .crd-btn-primary:hover:not(:disabled) { opacity: 0.88; }
        .crd-message { background: #13141b; border: 1px solid #252736; border-left: 3px solid #6c5ce7; border-radius: 8px; padding: 16px; font-size: 14px; color: #e8e9ed; line-height: 1.65; white-space: pre-wrap; }
        .crd-toast { position: fixed; bottom: 30px; right: 30px; background: #111218; border: 1px solid #252736; border-left: 3px solid #6c5ce7; padding: 14px 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; color: #e8e9ed; font-size: 13.5px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 500; max-width: 360px; animation: crd-toast-in 200ms ease; }
        @keyframes crd-toast-in { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      <div style={{ marginBottom: 14 }}>
        <Link to="/staff/contact-requests" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#8b8fa3', fontSize: 13, textDecoration: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Contact inbox
        </Link>
      </div>

      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e9ed', letterSpacing: -0.3, marginBottom: 8 }}>{cr.name}</h1>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <StatusBadge value={cr.status} />
          <span style={{ color: '#8b8fa3', fontSize: 13.5 }}>· {cr.email}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <div>
          <div className="crd-card" style={{ marginBottom: 14 }}>
            <div className="crd-card-title">Contact details</div>
            <Row label="Name" value={cr.name} />
            <Row label="Email" value={<a href={`mailto:${cr.email}`} style={{ color: '#a29bfe', textDecoration: 'none' }}>{cr.email}</a>} />
            <Row label="Company" value={cr.company || '—'} />
            {cr.subject && <Row label="Subject" value={cr.subject} />}
            <Row label="Received" value={fmtDate(cr.created_at)} />
          </div>

          <div className="crd-card">
            <div className="crd-card-title">Message</div>
            <div className="crd-message">{cr.message}</div>
          </div>
        </div>

        <div className="crd-card">
          <div className="crd-card-title">Manage</div>

          <div style={{ marginBottom: 16 }}>
            <div className="crd-label">Status</div>
            <select className="crd-input" value={status} onChange={e => setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div className="crd-label">Internal notes</div>
            <textarea
              className="crd-input"
              rows={4}
              placeholder="Add internal notes…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }}
            />
          </div>

          <button className="crd-btn crd-btn-primary" onClick={saveChanges} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {toast && <div className="crd-toast">{toast}</div>}
    </>
  );
}
