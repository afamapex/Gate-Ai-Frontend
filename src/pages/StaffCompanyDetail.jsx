import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { staffCompanies } from '../services/staffApi.js';
import { useStaffAuth } from '../context/StaffAuthContext.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

const TABS = ['overview', 'users', 'calls', 'billing', 'actions'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}
function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDuration(seconds) {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function Badge({ bg, border, fg, children }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 999,
      background: bg,
      border: `1px solid ${border}`,
      color: fg,
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function StatusBadge({ kind, value }) {
  const palettes = {
    plan: {
      starter:  ['rgba(91,192,222,0.12)', 'rgba(91,192,222,0.35)', '#5bc0de'],
      pro:      ['rgba(108,92,231,0.15)', 'rgba(108,92,231,0.4)',  '#a29bfe'],
      business: ['rgba(255,165,0,0.12)',  'rgba(255,165,0,0.35)',  '#ffb347'],
    },
    subscription: {
      trialing: ['rgba(91,192,222,0.12)', 'rgba(91,192,222,0.35)', '#5bc0de'],
      active:   ['rgba(81,207,102,0.12)', 'rgba(81,207,102,0.35)', '#51cf66'],
      past_due: ['rgba(255,165,0,0.12)',  'rgba(255,165,0,0.35)',  '#ffb347'],
      canceled: ['rgba(139,143,163,0.12)','rgba(139,143,163,0.35)','#8b8fa3'],
      unpaid:   ['rgba(255,107,107,0.12)','rgba(255,107,107,0.35)','#ff6b6b'],
    },
    provisioning: {
      pending:      ['rgba(139,143,163,0.12)', 'rgba(139,143,163,0.35)', '#8b8fa3'],
      provisioning: ['rgba(91,192,222,0.12)',  'rgba(91,192,222,0.35)',  '#5bc0de'],
      ready:        ['rgba(81,207,102,0.12)',  'rgba(81,207,102,0.35)',  '#51cf66'],
      failed:       ['rgba(255,107,107,0.12)', 'rgba(255,107,107,0.35)', '#ff6b6b'],
    },
    active: {
      true:  ['rgba(81,207,102,0.12)',  'rgba(81,207,102,0.35)',  '#51cf66'],
      false: ['rgba(255,107,107,0.12)', 'rgba(255,107,107,0.35)', '#ff6b6b'],
    },
    call: {
      blocked:   ['rgba(255,107,107,0.12)','rgba(255,107,107,0.35)','#ff6b6b'],
      forwarded: ['rgba(81,207,102,0.12)', 'rgba(81,207,102,0.35)', '#51cf66'],
      flagged:   ['rgba(255,165,0,0.12)',  'rgba(255,165,0,0.35)',  '#ffb347'],
    },
    role: {
      owner:    ['rgba(108,92,231,0.15)', 'rgba(108,92,231,0.4)',  '#a29bfe'],
      admin:    ['rgba(91,192,222,0.12)', 'rgba(91,192,222,0.35)', '#5bc0de'],
      employee: ['rgba(139,143,163,0.12)','rgba(139,143,163,0.35)','#8b8fa3'],
    },
  };
  const p = palettes[kind]?.[String(value)] || ['rgba(139,143,163,0.12)','rgba(139,143,163,0.35)','#8b8fa3'];
  const label = kind === 'active'
    ? (String(value) === 'true' ? 'Active' : 'Inactive')
    : String(value || '—').replace('_', ' ');
  return <Badge bg={p[0]} border={p[1]} fg={p[2]}>{label}</Badge>;
}

// ═══════════════════════════════════════════════════════════════
// Main shell
// ═══════════════════════════════════════════════════════════════
export default function StaffCompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tab,     setTab]     = useState('overview');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [toast,   setToast]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await staffCompanies.get(id);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  return (
    <>
      <style>{sharedStyles}</style>

      <div className="scd-back">
        <Link to="/staff/companies" className="scd-back-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          All companies
        </Link>
      </div>

      {loading && <div className="scd-state">Loading company…</div>}
      {error && !loading && <div className="scd-error">{error}</div>}

      {!loading && data && (
        <>
          <div className="scd-header">
            <div>
              <h1 className="scd-title">{data.company.name}</h1>
              <div className="scd-badges">
                <StatusBadge kind="plan"          value={data.company.plan} />
                <StatusBadge kind="subscription"  value={data.company.subscription_status} />
                <StatusBadge kind="provisioning"  value={data.company.provisioning_status} />
                <StatusBadge kind="active"        value={data.company.is_active} />
              </div>
            </div>
          </div>

          <div className="scd-tabs">
            {TABS.map(t => (
              <button
                key={t}
                className={`scd-tab ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'overview' && <OverviewTab data={data} />}
          {tab === 'users'    && <UsersTab   data={data} companyId={id} onToast={showToast} onRefresh={load} />}
          {tab === 'calls'    && <CallsTab   companyId={id} />}
          {tab === 'billing'  && <BillingTab companyId={id} />}
          {tab === 'actions'  && <ActionsTab data={data} companyId={id} onToast={showToast} onRefresh={load} onDeleted={() => navigate('/staff/companies')} />}
        </>
      )}

      {toast && (
        <div className="scd-toast">{toast}</div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Overview tab
// ═══════════════════════════════════════════════════════════════
function OverviewTab({ data }) {
  const { company, stats, invite } = data;
  const owner = data.users.find(u => u.role === 'owner');

  return (
    <div className="scd-grid">
      <div className="scd-card">
        <div className="scd-card-title">Company</div>
        <Row label="Name" value={company.name} />
        <Row label="Industry" value={company.industry || '—'} />
        <Row label="Timezone" value={company.timezone || '—'} />
        <Row label="Main phone" value={company.phone_main || '—'} />
        <Row label="Screening email" value={company.screening_email || '—'} />
        <Row label="Created" value={fmtDate(company.created_at)} />
      </div>

      <div className="scd-card">
        <div className="scd-card-title">Owner</div>
        {owner ? (
          <>
            <Row label="Name" value={`${owner.first_name} ${owner.last_name}`} />
            <Row label="Email" value={owner.email} />
            <Row label="Phone" value={owner.phone || '—'} />
            <Row label="Department" value={owner.department || '—'} />
          </>
        ) : <div className="scd-muted">No owner found.</div>}
      </div>

      <div className="scd-card">
        <div className="scd-card-title">Telephony &amp; AI</div>
        <Row label="Twilio number"  value={company.twilio_number || '—'} mono />
        <Row label="Vapi assistant" value={company.vapi_assistant_id || '—'} mono />
        <Row label="Provisioning"   value={<StatusBadge kind="provisioning" value={company.provisioning_status} />} />
        {company.provisioning_error && (
          <Row label="Last error" value={<span style={{ color: '#ff6b6b' }}>{company.provisioning_error}</span>} />
        )}
      </div>

      <div className="scd-card">
        <div className="scd-card-title">Subscription</div>
        <Row label="Plan"              value={<StatusBadge kind="plan" value={company.plan} />} />
        <Row label="Status"            value={<StatusBadge kind="subscription" value={company.subscription_status} />} />
        <Row label="Trial ends"        value={fmtDateShort(company.trial_ends_at)} />
        <Row label="Stripe customer"   value={company.stripe_customer_id || '—'} mono />
        <Row label="Stripe subscription" value={company.stripe_subscription_id || '—'} mono />
      </div>

      <div className="scd-card">
        <div className="scd-card-title">Call volume</div>
        <Row label="Total calls"     value={stats.total} num />
        <Row label="Forwarded"       value={stats.forwarded} num />
        <Row label="Blocked"         value={stats.blocked} num />
        <Row label="Flagged"         value={stats.flagged} num />
        <Row label="Last 30 days"    value={stats.last_30_days} num />
      </div>

      {invite && (
        <div className="scd-card">
          <div className="scd-card-title">Invite origin</div>
          <Row label="Invited email" value={invite.email} />
          <Row label="Plan sent"     value={invite.plan} />
          <Row label="Status"        value={invite.status} />
          <Row label="Activated"     value={fmtDate(invite.activated_at)} />
          <Row label="Sent by"       value={invite.invited_by_email || '—'} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono, num }) {
  return (
    <div className="scd-row">
      <div className="scd-row-label">{label}</div>
      <div className="scd-row-value" style={{
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined,
        fontSize: mono ? 12.5 : undefined,
        fontVariantNumeric: num ? 'tabular-nums' : undefined,
      }}>{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Users tab
// ═══════════════════════════════════════════════════════════════
function UsersTab({ data, companyId, onToast, onRefresh }) {
  const { user: staffUser } = useStaffAuth();
  const canImpersonate = staffUser?.role === 'superadmin' || staffUser?.role === 'admin';

  const [busyUserId, setBusyUserId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type, userId, userLabel }

  async function doImpersonate(userId) {
    setBusyUserId(userId);
    try {
      const res = await staffCompanies.list; // just to reuse something; we use fetch below actually
      const token = localStorage.getItem('gateai_staff_token');
      const r = await fetch(`${import.meta.env.VITE_API_URL || 'https://gate-ai-backend-production.up.railway.app'}/api/staff/companies/${companyId}/impersonate/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `Failed (${r.status})`);
      }
      const data = await r.json();
      // Pre-seed the customer session for this tab only — use sessionStorage so it
      // doesn't collide with the customer's own login in another tab.
      const impersonationData = {
        token: data.token,
        user: data.user,
        company: data.company,
      };
      // Open the customer dashboard in a new tab with the impersonation token.
      // We pass it via URL hash so the customer app can pick it up on load.
      const hash = encodeURIComponent(JSON.stringify(impersonationData));
      const url = `${window.location.origin}/dashboard?impersonate=${hash}`;
      window.open(url, '_blank', 'noopener');
      onToast(`Opened impersonation session for ${data.user.email} (30 min)`);
    } catch (err) {
      onToast(`Impersonate failed: ${err.message}`);
    } finally {
      setBusyUserId(null);
    }
  }

  async function doForceReset(userId) {
    setBusyUserId(userId);
    try {
      const token = localStorage.getItem('gateai_staff_token');
      const r = await fetch(`${import.meta.env.VITE_API_URL || 'https://gate-ai-backend-production.up.railway.app'}/api/staff/companies/${companyId}/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `Failed (${r.status})`);
      }
      const res = await r.json();
      if (res.emailed) {
        onToast(`Password reset email sent.`);
      } else if (res.reset_url) {
        await navigator.clipboard.writeText(res.reset_url).catch(() => {});
        onToast(`Email send failed. Reset link copied to clipboard.`);
      } else {
        onToast(`Reset token generated.`);
      }
    } catch (err) {
      onToast(`Force reset failed: ${err.message}`);
    } finally {
      setBusyUserId(null);
      setConfirm(null);
    }
  }

  return (
    <>
      <div className="scd-table-wrap">
        <table className="scd-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th className="scd-hide-mobile">Department</th>
              <th className="scd-hide-mobile">Ext.</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.users.length === 0 && (
              <tr><td colSpan={7} className="scd-empty">No users in this company.</td></tr>
            )}
            {data.users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</td>
                <td>{u.email}</td>
                <td><StatusBadge kind="role" value={u.role} /></td>
                <td className="scd-hide-mobile">{u.department || '—'}</td>
                <td className="scd-hide-mobile">{u.extension || '—'}</td>
                <td><StatusBadge kind="active" value={u.is_active} /></td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    {canImpersonate && u.is_active && (
                      <button
                        className="scd-btn scd-btn-ghost"
                        disabled={busyUserId === u.id}
                        onClick={() => setConfirm({ type: 'impersonate', userId: u.id, userLabel: u.email })}
                        title="Open a 30-minute impersonation session"
                      >Impersonate</button>
                    )}
                    <button
                      className="scd-btn scd-btn-ghost"
                      disabled={busyUserId === u.id}
                      onClick={() => setConfirm({ type: 'reset', userId: u.id, userLabel: u.email })}
                    >Reset password</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={confirm?.type === 'impersonate'}
        title="Start impersonation session?"
        message={`You are about to log in AS ${confirm?.userLabel}.\n\n• A new tab will open with their dashboard\n• The session lasts 30 minutes\n• Every action you take is recorded in the audit log`}
        confirmLabel="Impersonate"
        variant="primary"
        loading={busyUserId === confirm?.userId}
        onConfirm={() => { doImpersonate(confirm.userId); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm?.type === 'reset'}
        title="Force password reset?"
        message={`An email with a reset link will be sent to ${confirm?.userLabel}.\n\nThe link expires in 24 hours.`}
        confirmLabel="Send reset link"
        variant="primary"
        loading={busyUserId === confirm?.userId}
        onConfirm={() => doForceReset(confirm.userId)}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Calls tab
// ═══════════════════════════════════════════════════════════════
function CallsTab({ companyId }) {
  const [data,    setData]    = useState({ calls: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [page,    setPage]    = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput,  setSearchInput]  = useState('');
  const [search,       setSearch]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search)       params.search = search;
      const res = await staffCompanies.calls(companyId, params);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load calls');
    } finally {
      setLoading(false);
    }
  }, [companyId, page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="scd-subtoolbar">
        <form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput.trim()); }} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
          <input
            className="scd-input"
            placeholder="Search caller name, company, or phone…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button type="submit" className="scd-btn scd-btn-primary">Search</button>
        </form>
        <select className="scd-input" style={{ maxWidth: 200 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="forwarded">Forwarded</option>
          <option value="blocked">Blocked</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      {error && <div className="scd-error">{error}</div>}

      <div className="scd-table-wrap">
        <table className="scd-table">
          <thead>
            <tr>
              <th>Caller</th>
              <th className="scd-hide-mobile">Phone</th>
              <th>Status</th>
              <th className="scd-hide-mobile">Intent</th>
              <th className="scd-hide-mobile">Forwarded to</th>
              <th className="scd-hide-mobile">Duration</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="scd-empty">Loading calls…</td></tr>}
            {!loading && data.calls.length === 0 && <tr><td colSpan={7} className="scd-empty">No calls yet.</td></tr>}
            {!loading && data.calls.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.caller_name || 'Unknown'}</div>
                  {c.caller_company && <div style={{ fontSize: 12, color: '#8b8fa3', marginTop: 2 }}>{c.caller_company}</div>}
                </td>
                <td className="scd-hide-mobile" style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12.5 }}>{c.caller_phone}</td>
                <td><StatusBadge kind="call" value={c.call_status} /></td>
                <td className="scd-hide-mobile">{c.intent || '—'}</td>
                <td className="scd-hide-mobile">{c.forwarded_to_name || '—'}</td>
                <td className="scd-hide-mobile scd-num">{fmtDuration(c.duration_seconds)}</td>
                <td style={{ fontSize: 12.5, color: '#b0b3c5', whiteSpace: 'nowrap' }}>{fmtDate(c.started_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && data.pages > 1 && (
          <div className="scd-pagination">
            <span>Page {data.page} of {data.pages} · {data.total} total</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="scd-btn scd-btn-ghost" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
              <button className="scd-btn scd-btn-ghost" disabled={page >= data.pages} onClick={() => setPage(p => Math.min(data.pages, p + 1))}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Billing tab
// ═══════════════════════════════════════════════════════════════
function BillingTab({ companyId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    setLoading(true);
    staffCompanies.billing(companyId)
      .then(setData)
      .catch(err => setError(err.message || 'Failed to load billing'))
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading) return <div className="scd-state">Loading billing…</div>;
  if (error) return <div className="scd-error">{error}</div>;
  if (!data) return null;

  return (
    <>
      <div className="scd-grid" style={{ marginBottom: 16 }}>
        <div className="scd-card">
          <div className="scd-card-title">Stripe snapshot</div>
          <Row label="Plan"              value={<StatusBadge kind="plan" value={data.company.plan} />} />
          <Row label="Status"            value={<StatusBadge kind="subscription" value={data.company.subscription_status} />} />
          <Row label="Trial ends"        value={fmtDateShort(data.company.trial_ends_at)} />
          <Row label="Customer ID"       value={data.company.stripe_customer_id || '—'} mono />
          <Row label="Subscription ID"   value={data.company.stripe_subscription_id || '—'} mono />
        </div>
      </div>

      <div className="scd-section-title">Billing events</div>

      <div className="scd-table-wrap">
        <table className="scd-table">
          <thead>
            <tr>
              <th>Event</th>
              <th className="scd-hide-mobile">Stripe ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {data.events.length === 0 && <tr><td colSpan={5} className="scd-empty">No billing events yet.</td></tr>}
            {data.events.map(e => (
              <tr key={e.id}>
                <td style={{ fontWeight: 600 }}>{e.event_type}</td>
                <td className="scd-hide-mobile" style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}>{e.stripe_event_id || '—'}</td>
                <td className="scd-num">{e.amount_cents != null ? `$${(e.amount_cents / 100).toFixed(2)} ${(e.currency || 'usd').toUpperCase()}` : '—'}</td>
                <td>{e.status || '—'}</td>
                <td style={{ fontSize: 12.5, color: '#b0b3c5', whiteSpace: 'nowrap' }}>{fmtDate(e.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Actions tab
// ═══════════════════════════════════════════════════════════════
function ActionsTab({ data, companyId, onToast, onRefresh }) {
  const { user: staffUser } = useStaffAuth();
  const canEdit = staffUser?.role === 'superadmin' || staffUser?.role === 'admin';

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: data.company.name || '',
    industry: data.company.industry || '',
    timezone: data.company.timezone || '',
    phone_main: data.company.phone_main || '',
    plan: data.company.plan || 'starter',
    screening_email: data.company.screening_email || '',
  });
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState(null); // 'deactivate' | 'reactivate' | 'reprovision'
  const [busy, setBusy] = useState(false);

  async function saveEdit() {
    setSaving(true);
    try {
      await staffCompanies.update(companyId, form);
      onToast('Company updated.');
      setEditing(false);
      onRefresh();
    } catch (err) {
      onToast(`Update failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function doDeactivate() {
    setBusy(true);
    try {
      await staffCompanies.deactivate(companyId);
      onToast('Company deactivated.');
      setConfirm(null);
      onRefresh();
    } catch (err) {
      onToast(`Failed: ${err.message}`);
    } finally { setBusy(false); }
  }

  async function doReactivate() {
    setBusy(true);
    try {
      await staffCompanies.reactivate(companyId);
      onToast('Company reactivated.');
      setConfirm(null);
      onRefresh();
    } catch (err) {
      onToast(`Failed: ${err.message}`);
    } finally { setBusy(false); }
  }

  async function doReprovision() {
    setBusy(true);
    try {
      const res = await staffCompanies.reprovision(companyId);
      if (res.skipped) {
        onToast('Nothing to reprovision — Twilio + Vapi already set up.');
      } else if (res.errors?.length) {
        onToast(`Reprovision completed with errors: ${res.errors.map(e => e.step).join(', ')}`);
      } else {
        onToast(`Reprovision complete. Twilio: ${res.twilio_number || 'skipped'} · Vapi: ${res.vapi_assistant_id || 'skipped'}`);
      }
      setConfirm(null);
      onRefresh();
    } catch (err) {
      onToast(`Reprovision failed: ${err.message}`);
    } finally { setBusy(false); }
  }

  if (!canEdit) {
    return (
      <div className="scd-card">
        <div className="scd-card-title">Actions</div>
        <div className="scd-muted">You don't have permission to edit this company. Ask a superadmin or admin.</div>
      </div>
    );
  }

  return (
    <>
      {/* EDIT CARD */}
      <div className="scd-card" style={{ marginBottom: 16 }}>
        <div className="scd-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Edit company details</span>
          {!editing && <button className="scd-btn scd-btn-ghost" onClick={() => setEditing(true)}>Edit</button>}
        </div>

        {!editing && (
          <>
            <Row label="Name" value={data.company.name} />
            <Row label="Industry" value={data.company.industry || '—'} />
            <Row label="Timezone" value={data.company.timezone || '—'} />
            <Row label="Main phone" value={data.company.phone_main || '—'} />
            <Row label="Plan" value={<StatusBadge kind="plan" value={data.company.plan} />} />
            <Row label="Screening email" value={data.company.screening_email || '—'} />
          </>
        )}

        {editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} />
            <Field label="Industry" value={form.industry} onChange={v => setForm({ ...form, industry: v })} />
            <Field label="Timezone" value={form.timezone} onChange={v => setForm({ ...form, timezone: v })} placeholder="America/Chicago" />
            <Field label="Main phone" value={form.phone_main} onChange={v => setForm({ ...form, phone_main: v })} />
            <div>
              <div className="scd-label">Plan</div>
              <select className="scd-input" value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
              </select>
            </div>
            <Field label="Screening email" value={form.screening_email} onChange={v => setForm({ ...form, screening_email: v })} />

            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button className="scd-btn scd-btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button className="scd-btn scd-btn-ghost" onClick={() => {
                setEditing(false);
                setForm({
                  name: data.company.name || '',
                  industry: data.company.industry || '',
                  timezone: data.company.timezone || '',
                  phone_main: data.company.phone_main || '',
                  plan: data.company.plan || 'starter',
                  screening_email: data.company.screening_email || '',
                });
              }} disabled={saving}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* PROVISIONING CARD */}
      <div className="scd-card" style={{ marginBottom: 16 }}>
        <div className="scd-card-title">Provisioning</div>
        <Row label="Current status" value={<StatusBadge kind="provisioning" value={data.company.provisioning_status} />} />
        <Row label="Twilio number"  value={data.company.twilio_number || <span style={{ color: '#ff6b6b' }}>Not provisioned</span>} mono />
        <Row label="Vapi assistant" value={data.company.vapi_assistant_id || <span style={{ color: '#ff6b6b' }}>Not provisioned</span>} mono />
        {data.company.provisioning_error && (
          <Row label="Last error" value={<span style={{ color: '#ff6b6b' }}>{data.company.provisioning_error}</span>} />
        )}
        <div style={{ marginTop: 12 }}>
          <button
            className="scd-btn scd-btn-primary"
            onClick={() => setConfirm('reprovision')}
            disabled={busy || (data.company.twilio_number && data.company.vapi_assistant_id)}
          >
            Reprovision missing pieces
          </button>
          {data.company.twilio_number && data.company.vapi_assistant_id && (
            <div className="scd-muted" style={{ marginTop: 8, fontSize: 12 }}>Both Twilio and Vapi are already provisioned.</div>
          )}
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="scd-card" style={{ borderColor: 'rgba(255,107,107,0.2)' }}>
        <div className="scd-card-title" style={{ color: '#ff6b6b' }}>Danger zone</div>

        {data.company.is_active ? (
          <>
            <div className="scd-muted" style={{ marginBottom: 10 }}>
              Deactivating this company will prevent all of its users from logging in and stop their dashboard access.
              Calls will continue to route on existing Twilio/Vapi setup — the account is reversible.
              The Twilio number is kept so reactivation works cleanly.
            </div>
            <button className="scd-btn scd-btn-danger" onClick={() => setConfirm('deactivate')} disabled={busy}>
              Deactivate company
            </button>
          </>
        ) : (
          <>
            <div className="scd-muted" style={{ marginBottom: 10 }}>
              This company is currently deactivated. Reactivating will re-enable all users for login.
            </div>
            <button className="scd-btn scd-btn-primary" onClick={() => setConfirm('reactivate')} disabled={busy}>
              Reactivate company
            </button>
          </>
        )}
      </div>

      <ConfirmModal
        open={confirm === 'deactivate'}
        title="Deactivate this company?"
        message={`All users at ${data.company.name} will be unable to log in.\n\nThis is reversible — you can reactivate anytime. The Twilio number is kept.`}
        confirmLabel="Deactivate"
        variant="danger"
        loading={busy}
        onConfirm={doDeactivate}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'reactivate'}
        title="Reactivate this company?"
        message={`Users at ${data.company.name} will regain access to their dashboard.`}
        confirmLabel="Reactivate"
        variant="primary"
        loading={busy}
        onConfirm={doReactivate}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'reprovision'}
        title="Reprovision missing infrastructure?"
        message={`This will only fill in missing pieces:\n\n${!data.company.twilio_number ? '• Buy a new Twilio number ($1/month)\n' : ''}${!data.company.vapi_assistant_id ? '• Create a Vapi assistant\n' : ''}\nExisting numbers and assistants are left alone — nothing will be duplicated.`}
        confirmLabel="Reprovision"
        variant="primary"
        loading={busy}
        onConfirm={doReprovision}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div className="scd-label">{label}</div>
      <input
        className="scd-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Shared styles
// ═══════════════════════════════════════════════════════════════
const sharedStyles = `
  .scd-back { margin-bottom: 14px; }
  .scd-back-link {
    display: inline-flex; align-items: center; gap: 6px;
    color: #8b8fa3; font-size: 13px; text-decoration: none;
    padding: 4px 0;
  }
  .scd-back-link:hover { color: #e8e9ed; }

  .scd-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 18px; gap: 16px; flex-wrap: wrap;
  }
  .scd-title {
    font-size: 26px; font-weight: 700; color: #e8e9ed;
    letter-spacing: -0.4px; margin-bottom: 10px;
  }
  .scd-badges { display: flex; gap: 6px; flex-wrap: wrap; }

  .scd-tabs {
    display: flex; gap: 2px;
    border-bottom: 1px solid #1c1e2a;
    margin-bottom: 22px;
    overflow-x: auto;
  }
  .scd-tab {
    background: transparent;
    border: none;
    color: #8b8fa3;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    padding: 12px 18px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    white-space: nowrap;
    transition: color 120ms ease, border-color 120ms ease;
  }
  .scd-tab:hover { color: #e8e9ed; }
  .scd-tab.active {
    color: #e8e9ed;
    border-bottom-color: #6c5ce7;
  }

  .scd-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 14px;
  }

  .scd-card {
    background: #111218;
    border: 1px solid #252736;
    border-radius: 12px;
    padding: 20px;
  }
  .scd-card-title {
    font-size: 13px;
    font-weight: 700;
    color: #8b8fa3;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid #1c1e2a;
  }

  .scd-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 0;
    font-size: 13.5px;
    border-bottom: 1px solid rgba(28,30,42,0.5);
  }
  .scd-row:last-child { border-bottom: none; }
  .scd-row-label {
    color: #8b8fa3;
    flex-shrink: 0;
  }
  .scd-row-value {
    color: #e8e9ed;
    text-align: right;
    word-break: break-word;
    max-width: 65%;
  }

  .scd-muted { color: #8b8fa3; font-size: 13.5px; line-height: 1.5; }

  .scd-state {
    padding: 60px 20px;
    text-align: center;
    color: #8b8fa3;
    font-size: 14px;
  }
  .scd-error {
    background: rgba(255,107,107,0.08);
    border: 1px solid rgba(255,107,107,0.25);
    color: #ff6b6b;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13.5px;
    margin-bottom: 14px;
  }

  .scd-subtoolbar {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 14px;
    align-items: center;
  }

  .scd-table-wrap {
    background: #111218;
    border: 1px solid #252736;
    border-radius: 12px;
    overflow: hidden;
  }
  .scd-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
  }
  .scd-table th {
    text-align: left;
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 700;
    color: #8b8fa3;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #1c1e2a;
    background: #0d0e14;
    white-space: nowrap;
  }
  .scd-table td {
    padding: 14px 16px;
    color: #e8e9ed;
    border-bottom: 1px solid #1c1e2a;
    vertical-align: middle;
  }
  .scd-table tr:last-child td { border-bottom: none; }
  .scd-empty {
    padding: 40px 16px;
    text-align: center;
    color: #8b8fa3;
  }
  .scd-num { font-variant-numeric: tabular-nums; }

  .scd-section-title {
    font-size: 13px;
    font-weight: 700;
    color: #8b8fa3;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin: 22px 0 10px;
  }

  .scd-label {
    font-size: 11.5px;
    font-weight: 600;
    color: #8b8fa3;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .scd-input {
    width: 100%;
    padding: 9px 13px;
    background: #13141b;
    border: 1px solid #252736;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    color: #e8e9ed;
    outline: none;
  }
  .scd-input:focus { border-color: #6c5ce7; }

  .scd-btn {
    padding: 8px 14px;
    border-radius: 7px;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 120ms ease, transform 100ms ease, background 120ms ease;
    white-space: nowrap;
  }
  .scd-btn:active:not(:disabled) { transform: scale(0.97); }
  .scd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .scd-btn-primary {
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    color: #fff;
  }
  .scd-btn-primary:hover:not(:disabled) { opacity: 0.88; }
  .scd-btn-danger {
    background: linear-gradient(135deg, #ff6b6b, #f06595);
    color: #fff;
  }
  .scd-btn-danger:hover:not(:disabled) { opacity: 0.88; }
  .scd-btn-ghost {
    background: #1c1e2a;
    color: #e8e9ed;
  }
  .scd-btn-ghost:hover:not(:disabled) { background: #252736; }

  .scd-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    background: #0d0e14;
    border-top: 1px solid #1c1e2a;
    font-size: 13px;
    color: #8b8fa3;
  }

  .scd-toast {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: #111218;
    border: 1px solid #252736;
    border-left: 3px solid #6c5ce7;
    padding: 14px 18px;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    color: #e8e9ed;
    font-size: 13.5px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    z-index: 500;
    max-width: 360px;
    animation: scd-toast-in 200ms ease;
  }
  @keyframes scd-toast-in { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  @media (max-width: 900px) {
    .scd-table { font-size: 12.5px; }
    .scd-table th, .scd-table td { padding: 10px 12px; }
    .scd-hide-mobile { display: none; }
    .scd-toast { right: 14px; left: 14px; bottom: 14px; max-width: none; }
  }
`;
