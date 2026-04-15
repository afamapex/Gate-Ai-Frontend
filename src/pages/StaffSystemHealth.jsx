import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffSystem } from '../services/staffApi.js';
import { useStaffAuth } from '../context/StaffAuthContext.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

function StatusDot({ status }) {
  const colors = { ok: '#51cf66', warning: '#ffb347', error: '#ff6b6b' };
  return <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: colors[status] || '#8b8fa3', boxShadow: `0 0 6px ${colors[status] || '#8b8fa3'}40`, flexShrink: 0 }} />;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function StaffSystemHealth() {
  const navigate = useNavigate();
  const { user: staffUser } = useStaffAuth();
  const canRetry = staffUser?.role === 'superadmin' || staffUser?.role === 'admin';

  const [health, setHealth]   = useState(null);
  const [failed, setFailed]   = useState(null);
  const [errors, setErrors]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, f, e] = await Promise.all([
        staffSystem.health(),
        staffSystem.failedOnboardings(),
        staffSystem.errors({ limit: 20 }),
      ]);
      setHealth(h);
      setFailed(f);
      setErrors(e);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500); }

  async function doRetry(companyId) {
    setRetrying(companyId);
    try {
      const token = localStorage.getItem('gateai_staff_token');
      const r = await fetch(`${import.meta.env.VITE_API_URL || 'https://gate-ai-backend-production.up.railway.app'}/api/staff/system/retry-onboarding/${companyId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      if (data.errors?.length) {
        showToast(`Retry completed with errors: ${data.errors.map(e => e.step).join(', ')}`);
      } else {
        showToast('Retry successful — company is now provisioned');
      }
      setConfirm(null);
      load();
    } catch (err) {
      showToast(`Retry failed: ${err.message}`);
    } finally { setRetrying(null); }
  }

  const services = health ? Object.entries(health.services) : [];

  return (
    <>
      <style>{`
        .ssh-title { font-size: 22px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px; margin-bottom: 22px; }
        .ssh-section { font-size: 15px; font-weight: 700; color: #e8e9ed; margin: 28px 0 12px; }
        .ssh-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
        .ssh-card { background: #111218; border: 1px solid #252736; border-radius: 12px; padding: 18px; }
        .ssh-svc { display: flex; align-items: center; gap: 10px; }
        .ssh-svc-name { font-size: 14px; font-weight: 600; color: #e8e9ed; text-transform: capitalize; }
        .ssh-svc-meta { font-size: 12px; color: #8b8fa3; margin-top: 4px; }
        .ssh-table-wrap { background: #111218; border: 1px solid #252736; border-radius: 12px; overflow: hidden; }
        .ssh-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .ssh-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1c1e2a; background: #0d0e14; }
        .ssh-table td { padding: 14px 16px; color: #e8e9ed; border-bottom: 1px solid #1c1e2a; vertical-align: middle; }
        .ssh-table tr:last-child td { border-bottom: none; }
        .ssh-empty { padding: 40px 16px; text-align: center; color: #8b8fa3; }
        .ssh-btn { padding: 7px 14px; border: none; border-radius: 7px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 600; transition: opacity 120ms ease; }
        .ssh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ssh-btn-primary { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff; }
        .ssh-btn-primary:hover:not(:disabled) { opacity: 0.88; }
        .ssh-btn-ghost { background: #1c1e2a; color: #e8e9ed; }
        .ssh-btn-ghost:hover:not(:disabled) { background: #252736; }
        .ssh-state { padding: 60px 20px; text-align: center; color: #8b8fa3; font-size: 14px; }
        .ssh-sev { display: inline-block; padding: 2px 8px; borderRadius: 999; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; border-radius: 999px; }
        .ssh-toast { position: fixed; bottom: 30px; right: 30px; background: #111218; border: 1px solid #252736; border-left: 3px solid #6c5ce7; padding: 14px 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; color: #e8e9ed; font-size: 13.5px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 500; max-width: 360px; }
        @media (max-width: 900px) { .ssh-hide-mobile { display: none; } }
      `}</style>

      <h1 className="ssh-title">System Health</h1>

      {loading && <div className="ssh-state">Checking services…</div>}

      {!loading && health && (
        <>
          <div className="ssh-grid">
            {services.map(([name, svc]) => (
              <div className="ssh-card" key={name}>
                <div className="ssh-svc">
                  <StatusDot status={svc.status} />
                  <div>
                    <div className="ssh-svc-name">{name}</div>
                    <div className="ssh-svc-meta">
                      {svc.status === 'ok' && svc.latency_ms != null ? `${svc.latency_ms}ms` : svc.message || svc.status}
                      {svc.account_status && ` · ${svc.account_status}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#6b6e82', marginTop: 8 }}>
            Last checked: {fmtDate(health.checked_at)}
            <button className="ssh-btn ssh-btn-ghost" style={{ marginLeft: 10 }} onClick={load}>Refresh</button>
          </div>
        </>
      )}

      {!loading && failed && (
        <>
          <div className="ssh-section">
            Failed / pending onboardings ({failed.companies.length})
          </div>
          <div className="ssh-table-wrap">
            <table className="ssh-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Status</th>
                  <th className="ssh-hide-mobile">Twilio</th>
                  <th className="ssh-hide-mobile">Vapi</th>
                  <th className="ssh-hide-mobile">Error</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {failed.companies.length === 0 && <tr><td colSpan={6} className="ssh-empty">All companies are provisioned.</td></tr>}
                {failed.companies.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, cursor: 'pointer', color: '#a29bfe' }} onClick={() => navigate(`/staff/companies/${c.id}`)}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#8b8fa3', marginTop: 2 }}>{c.owner_email || '—'}</div>
                    </td>
                    <td>
                      <span style={{ color: c.provisioning_status === 'failed' ? '#ff6b6b' : '#ffb347', fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>
                        {c.provisioning_status}
                      </span>
                    </td>
                    <td className="ssh-hide-mobile" style={{ fontSize: 12.5 }}>{c.twilio_number || <span style={{ color: '#ff6b6b' }}>missing</span>}</td>
                    <td className="ssh-hide-mobile" style={{ fontSize: 12.5 }}>{c.vapi_assistant_id ? '✓' : <span style={{ color: '#ff6b6b' }}>missing</span>}</td>
                    <td className="ssh-hide-mobile" style={{ fontSize: 12, color: '#ff6b6b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.provisioning_error || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {canRetry && (
                        <button className="ssh-btn ssh-btn-primary" disabled={retrying === c.id} onClick={() => setConfirm(c)}>
                          {retrying === c.id ? 'Retrying…' : 'Retry'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && errors && (
        <>
          <div className="ssh-section">Recent system errors ({errors.total})</div>
          <div className="ssh-table-wrap">
            <table className="ssh-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Severity</th>
                  <th>Message</th>
                  <th className="ssh-hide-mobile">Company</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {errors.errors.length === 0 && <tr><td colSpan={5} className="ssh-empty">No system errors recorded.</td></tr>}
                {errors.errors.map(e => {
                  const sevColors = { info: '#5bc0de', warning: '#ffb347', error: '#ff6b6b', critical: '#ff6b6b' };
                  return (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.source}</td>
                      <td>
                        <span className="ssh-sev" style={{ background: `${sevColors[e.severity]}18`, color: sevColors[e.severity], border: `1px solid ${sevColors[e.severity]}40` }}>
                          {e.severity}
                        </span>
                      </td>
                      <td style={{ fontSize: 12.5, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.message}</td>
                      <td className="ssh-hide-mobile">
                        {e.company_name ? (
                          <span style={{ color: '#a29bfe', cursor: 'pointer' }} onClick={() => navigate(`/staff/companies/${e.company_id}`)}>{e.company_name}</span>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: 12.5, color: '#b0b3c5', whiteSpace: 'nowrap' }}>{fmtDate(e.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmModal
        open={!!confirm}
        title={`Retry onboarding for ${confirm?.name}?`}
        message={`This will attempt to provision any missing infrastructure (Twilio number and/or Vapi assistant) for this company.\n\n${!confirm?.twilio_number ? '• Will buy a Twilio number ($1/month)\n' : ''}${!confirm?.vapi_assistant_id ? '• Will create a Vapi assistant\n' : ''}`}
        confirmLabel="Retry"
        variant="primary"
        loading={retrying === confirm?.id}
        onConfirm={() => doRetry(confirm.id)}
        onCancel={() => setConfirm(null)}
      />

      {toast && <div className="ssh-toast">{toast}</div>}
    </>
  );
}
