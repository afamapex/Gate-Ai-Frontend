import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { staffInvites } from '../services/staffApi.js';
import { useStaffAuth } from '../context/StaffAuthContext.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function StatusBadge({ value }) {
  const palettes = {
    pending:   ['rgba(91,192,222,0.12)', 'rgba(91,192,222,0.35)', '#5bc0de'],
    activated: ['rgba(81,207,102,0.12)', 'rgba(81,207,102,0.35)', '#51cf66'],
    expired:   ['rgba(139,143,163,0.12)','rgba(139,143,163,0.35)','#8b8fa3'],
    revoked:   ['rgba(255,107,107,0.12)','rgba(255,107,107,0.35)','#ff6b6b'],
  };
  const [bg, border, fg] = palettes[value] || palettes.pending;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      background: bg, border: `1px solid ${border}`, color: fg,
      fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap',
    }}>{value}</span>
  );
}

function Row({ label, value }) {
  return (
    <div className="sid-row">
      <div className="sid-row-label">{label}</div>
      <div className="sid-row-value">{value}</div>
    </div>
  );
}

export default function StaffInviteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: staffUser } = useStaffAuth();

  const [invite,  setInvite]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [busy,    setBusy]    = useState(false);
  const [confirm, setConfirm] = useState(null); // 'resend' | 'revoke' | 'regenerate'
  const [toast,   setToast]   = useState('');
  const [lastActivationUrl, setLastActivationUrl] = useState('');

  const canRevoke = staffUser?.role === 'superadmin' || staffUser?.role === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await staffInvites.get(id);
      setInvite(res.invite);
    } catch (err) {
      setError(err.message || 'Failed to load invite');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function doResend() {
    setBusy(true);
    try {
      const res = await staffInvites.resend(id);
      if (res.emailed) {
        showToast(`Invite email re-sent to ${invite.email}`);
      } else if (res.activation_url) {
        setLastActivationUrl(res.activation_url);
        showToast(`Email send failed — activation link shown below`);
      }
      setConfirm(null);
      load();
    } catch (err) {
      showToast(`Resend failed: ${err.message}`);
    } finally { setBusy(false); }
  }

  async function doRevoke() {
    setBusy(true);
    try {
      await staffInvites.revoke(id);
      showToast(`Invite revoked`);
      setConfirm(null);
      load();
    } catch (err) {
      showToast(`Revoke failed: ${err.message}`);
    } finally { setBusy(false); }
  }

  async function doRegenerate() {
    setBusy(true);
    try {
      const res = await staffInvites.regenerate(id);
      if (res.emailed) {
        showToast(`New invite generated and email sent`);
      } else if (res.activation_url) {
        setLastActivationUrl(res.activation_url);
        showToast(`New invite generated. Email send failed — activation link shown below`);
      }
      setConfirm(null);
      load();
    } catch (err) {
      showToast(`Regenerate failed: ${err.message}`);
    } finally { setBusy(false); }
  }

  if (loading) {
    return (
      <>
        <style>{pageCss}</style>
        <div className="sid-state">Loading invite…</div>
      </>
    );
  }
  if (error || !invite) {
    return (
      <>
        <style>{pageCss}</style>
        <Link to="/staff/invites" className="sid-back-link">← All invites</Link>
        <div className="sid-error">{error || 'Invite not found'}</div>
      </>
    );
  }

  const expired = new Date(invite.expires_at) < new Date();

  return (
    <>
      <style>{pageCss}</style>

      <div className="sid-back">
        <Link to="/staff/invites" className="sid-back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          All invites
        </Link>
      </div>

      <div className="sid-header">
        <div>
          <h1 className="sid-title">{invite.email}</h1>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <StatusBadge value={invite.status} />
            <span style={{ color: '#8b8fa3', fontSize: 13.5 }}>· {invite.company_name}</span>
          </div>
        </div>
      </div>

      <div className="sid-grid">
        <div className="sid-card">
          <div className="sid-card-title">Invite details</div>
          <Row label="Status"        value={<StatusBadge value={invite.status} />} />
          <Row label="Recipient"     value={invite.email} />
          <Row label="First name"    value={invite.first_name || '—'} />
          <Row label="Company"       value={invite.company_name} />
          <Row label="Plan"          value={<span style={{ textTransform: 'capitalize' }}>{invite.plan}</span>} />
          <Row label="Sent by"       value={invite.invited_by_email || '—'} />
          <Row label="Send count"    value={invite.send_count} />
          <Row label="Created"       value={fmtDate(invite.created_at)} />
          <Row label="Last sent"     value={fmtDate(invite.last_sent_at)} />
          <Row label="Expires"       value={<span style={{ color: expired && invite.status === 'pending' ? '#ff6b6b' : undefined }}>{fmtDate(invite.expires_at)}</span>} />
          {invite.activated_at && (
            <Row label="Activated"   value={fmtDate(invite.activated_at)} />
          )}
          {invite.revoked_at && (
            <Row label="Revoked"     value={fmtDate(invite.revoked_at)} />
          )}
          {invite.activated_company_name && (
            <Row label="Activated as" value={
              <Link to={`/staff/companies/${invite.activated_company_id}`} style={{ color: '#a29bfe', textDecoration: 'none' }}>
                {invite.activated_company_name} →
              </Link>
            } />
          )}
        </div>

        {invite.notes && (
          <div className="sid-card">
            <div className="sid-card-title">Internal notes</div>
            <div style={{ color: '#b0b3c5', fontSize: 13.5, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {invite.notes}
            </div>
          </div>
        )}

        <div className="sid-card">
          <div className="sid-card-title">Actions</div>

          {invite.status === 'pending' && !expired && (
            <>
              <div className="sid-action-group">
                <button className="sid-btn sid-btn-primary" onClick={() => setConfirm('resend')} disabled={busy}>
                  Resend email
                </button>
                <div className="sid-action-hint">Sends the same activation link again. Send count will increment.</div>
              </div>

              <div className="sid-action-group">
                <button className="sid-btn sid-btn-ghost" onClick={() => setConfirm('regenerate')} disabled={busy}>
                  Regenerate link
                </button>
                <div className="sid-action-hint">Invalidates the old link and creates a fresh 30-day one.</div>
              </div>

              {canRevoke && (
                <div className="sid-action-group">
                  <button className="sid-btn sid-btn-danger" onClick={() => setConfirm('revoke')} disabled={busy}>
                    Revoke invite
                  </button>
                  <div className="sid-action-hint">Makes the link permanently invalid. Can't be undone — you'd need to regenerate.</div>
                </div>
              )}
            </>
          )}

          {invite.status === 'pending' && expired && (
            <>
              <div className="sid-muted" style={{ marginBottom: 10 }}>
                This invite has expired. Regenerate a fresh 30-day link for the same prospect.
              </div>
              <button className="sid-btn sid-btn-primary" onClick={() => setConfirm('regenerate')} disabled={busy}>
                Regenerate link
              </button>
            </>
          )}

          {invite.status === 'activated' && (
            <div className="sid-muted">
              This invite has been activated. The new account is viewable on the <Link to={`/staff/companies/${invite.activated_company_id}`} style={{ color: '#a29bfe' }}>companies page</Link>.
            </div>
          )}

          {invite.status === 'expired' && (
            <>
              <div className="sid-muted" style={{ marginBottom: 10 }}>
                This invite expired before being activated. Regenerate to send a fresh link.
              </div>
              <button className="sid-btn sid-btn-primary" onClick={() => setConfirm('regenerate')} disabled={busy}>
                Regenerate link
              </button>
            </>
          )}

          {invite.status === 'revoked' && (
            <>
              <div className="sid-muted" style={{ marginBottom: 10 }}>
                This invite was revoked. If you've changed your mind, you can regenerate a fresh link.
              </div>
              <button className="sid-btn sid-btn-primary" onClick={() => setConfirm('regenerate')} disabled={busy}>
                Regenerate link
              </button>
            </>
          )}

          {lastActivationUrl && (
            <div className="sid-link-box" style={{ marginTop: 14 }}>
              <div className="sid-label">Activation link (copy this)</div>
              <div className="sid-link">{lastActivationUrl}</div>
              <button className="sid-btn sid-btn-ghost" style={{ marginTop: 10 }}
                onClick={() => navigator.clipboard.writeText(lastActivationUrl).then(() => showToast('Link copied'))}>
                Copy link
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirm === 'resend'}
        title="Resend invite email?"
        message={`The same activation link will be emailed to ${invite.email} again.`}
        confirmLabel="Send again"
        variant="primary"
        loading={busy}
        onConfirm={doResend}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'regenerate'}
        title="Regenerate activation link?"
        message={`This invalidates the old link and creates a fresh 30-day one for ${invite.email}. The new email will be sent immediately.`}
        confirmLabel="Regenerate"
        variant="primary"
        loading={busy}
        onConfirm={doRegenerate}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'revoke'}
        title="Revoke this invite?"
        message={`The activation link for ${invite.email} will be permanently invalidated.\n\nYou can regenerate a new link later if needed, but this action itself can't be undone.`}
        confirmLabel="Revoke invite"
        variant="danger"
        loading={busy}
        onConfirm={doRevoke}
        onCancel={() => setConfirm(null)}
      />

      {toast && <div className="sid-toast">{toast}</div>}
    </>
  );
}

const pageCss = `
  .sid-back { margin-bottom: 14px; }
  .sid-back-link {
    display: inline-flex; align-items: center; gap: 6px;
    color: #8b8fa3; font-size: 13px; text-decoration: none;
    padding: 4px 0;
  }
  .sid-back-link:hover { color: #e8e9ed; }

  .sid-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; gap: 16px; flex-wrap: wrap; }
  .sid-title { font-size: 22px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px; margin-bottom: 8px; word-break: break-all; }

  .sid-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 14px;
  }

  .sid-card { background: #111218; border: 1px solid #252736; border-radius: 12px; padding: 20px; }
  .sid-card-title {
    font-size: 12px; font-weight: 700; color: #8b8fa3;
    text-transform: uppercase; letter-spacing: 0.6px;
    margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #1c1e2a;
  }

  .sid-row {
    display: flex; justify-content: space-between; gap: 16px;
    padding: 8px 0; font-size: 13.5px;
    border-bottom: 1px solid rgba(28,30,42,0.5);
  }
  .sid-row:last-child { border-bottom: none; }
  .sid-row-label { color: #8b8fa3; flex-shrink: 0; }
  .sid-row-value { color: #e8e9ed; text-align: right; word-break: break-word; max-width: 65%; }

  .sid-action-group { margin-bottom: 18px; }
  .sid-action-group:last-child { margin-bottom: 0; }
  .sid-action-hint { margin-top: 6px; font-size: 12px; color: #6b6e82; line-height: 1.5; }

  .sid-muted { color: #8b8fa3; font-size: 13.5px; line-height: 1.55; }

  .sid-state { padding: 60px 20px; text-align: center; color: #8b8fa3; font-size: 14px; }
  .sid-error {
    background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.25);
    color: #ff6b6b; padding: 12px 16px; border-radius: 8px; font-size: 13.5px; margin-top: 14px;
  }

  .sid-btn {
    padding: 9px 16px; border: none; border-radius: 8px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    transition: opacity 120ms ease, background 120ms ease, transform 100ms ease;
  }
  .sid-btn:active:not(:disabled) { transform: scale(0.97); }
  .sid-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .sid-btn-primary { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff; }
  .sid-btn-primary:hover:not(:disabled) { opacity: 0.88; }
  .sid-btn-danger { background: linear-gradient(135deg, #ff6b6b, #f06595); color: #fff; }
  .sid-btn-danger:hover:not(:disabled) { opacity: 0.88; }
  .sid-btn-ghost { background: #1c1e2a; color: #e8e9ed; }
  .sid-btn-ghost:hover:not(:disabled) { background: #252736; }

  .sid-label {
    font-size: 11.5px; font-weight: 600; color: #8b8fa3;
    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;
  }
  .sid-link-box { background: #13141b; border: 1px solid #252736; border-radius: 8px; padding: 14px; }
  .sid-link { font-family: ui-monospace, Menlo, monospace; font-size: 12px; color: #a29bfe; word-break: break-all; }

  .sid-toast {
    position: fixed; bottom: 30px; right: 30px;
    background: #111218; border: 1px solid #252736; border-left: 3px solid #6c5ce7;
    padding: 14px 18px; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; color: #e8e9ed; font-size: 13.5px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 500;
    max-width: 360px; animation: sid-toast-in 200ms ease;
  }
  @keyframes sid-toast-in { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  @media (max-width: 900px) {
    .sid-toast { right: 14px; left: 14px; bottom: 14px; max-width: none; }
  }
`;
