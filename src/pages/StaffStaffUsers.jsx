import { useState, useEffect, useCallback } from 'react';
import { staffUsers } from '../services/staffApi.js';
import { useStaffAuth } from '../context/StaffAuthContext.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

function RoleBadge({ value }) {
  const palettes = {
    superadmin: ['rgba(255,165,0,0.12)', 'rgba(255,165,0,0.35)', '#ffb347'],
    admin:      ['rgba(108,92,231,0.15)', 'rgba(108,92,231,0.4)',  '#a29bfe'],
    support:    ['rgba(91,192,222,0.12)', 'rgba(91,192,222,0.35)', '#5bc0de'],
  };
  const [bg, border, fg] = palettes[value] || palettes.support;
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: bg, border: `1px solid ${border}`, color: fg, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {value}
    </span>
  );
}

function ActiveBadge({ value }) {
  return value
    ? <span style={{ color: '#51cf66', fontSize: 11, fontWeight: 700 }}>ACTIVE</span>
    : <span style={{ color: '#ff6b6b', fontSize: 11, fontWeight: 700 }}>INACTIVE</span>;
}

export default function StaffStaffUsers() {
  const { user: me } = useStaffAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState('');

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', password: '', role: 'support' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit
  const [editing, setEditing] = useState(null); // user id being edited
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Actions
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await staffUsers.list();
      setUsers(res.staff_users);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500); }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    if (!form.email || !form.first_name || !form.password) {
      setCreateError('Email, first name, and password are required');
      return;
    }
    if (form.password.length < 8) { setCreateError('Password must be at least 8 characters'); return; }
    setCreating(true);
    try {
      await staffUsers.create(form);
      showToast('Staff user created');
      setShowCreate(false);
      setForm({ email: '', first_name: '', last_name: '', password: '', role: 'support' });
      load();
    } catch (err) { setCreateError(err.message); }
    finally { setCreating(false); }
  }

  function startEdit(user) {
    setEditing(user.id);
    setEditForm({ first_name: user.first_name, last_name: user.last_name, role: user.role });
  }

  async function saveEdit(userId) {
    setSaving(true);
    try {
      await staffUsers.update(userId, editForm);
      showToast('Updated');
      setEditing(null);
      load();
    } catch (err) { showToast(`Failed: ${err.message}`); }
    finally { setSaving(false); }
  }

  async function doDeactivate(userId) {
    setBusy(true);
    try {
      await staffUsers.deactivate(userId);
      showToast('Staff user deactivated');
      setConfirm(null);
      load();
    } catch (err) { showToast(`Failed: ${err.message}`); }
    finally { setBusy(false); }
  }

  async function doResetPassword(userId) {
    setBusy(true);
    try {
      const res = await staffUsers.resetPassword(userId);
      if (res.emailed) showToast('Reset email sent');
      else if (res.reset_url) { await navigator.clipboard.writeText(res.reset_url).catch(() => {}); showToast('Email failed — link copied to clipboard'); }
      setConfirm(null);
    } catch (err) { showToast(`Failed: ${err.message}`); }
    finally { setBusy(false); }
  }

  return (
    <>
      <style>{`
        .su-title { font-size: 22px; font-weight: 700; color: #e8e9ed; letter-spacing: -0.3px; margin-bottom: 6px; }
        .su-sub { font-size: 13.5px; color: #8b8fa3; margin-bottom: 18px; }
        .su-card { background: #111218; border: 1px solid #252736; border-radius: 12px; padding: 22px; margin-bottom: 16px; }
        .su-card-title { font-size: 12px; font-weight: 700; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #1c1e2a; }
        .su-table-wrap { background: #111218; border: 1px solid #252736; border-radius: 12px; overflow: hidden; }
        .su-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .su-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1c1e2a; background: #0d0e14; }
        .su-table td { padding: 14px 16px; color: #e8e9ed; border-bottom: 1px solid #1c1e2a; vertical-align: middle; }
        .su-table tr:last-child td { border-bottom: none; }
        .su-empty { padding: 40px 16px; text-align: center; color: #8b8fa3; }
        .su-input { width: 100%; padding: 9px 13px; background: #13141b; border: 1px solid #252736; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #e8e9ed; outline: none; }
        .su-input:focus { border-color: #6c5ce7; }
        .su-select { padding: 9px 13px; background: #13141b; border: 1px solid #252736; border-radius: 8px; color: #e8e9ed; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; }
        .su-label { font-size: 11.5px; font-weight: 600; color: #8b8fa3; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .su-field { margin-bottom: 14px; }
        .su-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .su-btn { padding: 8px 14px; border: none; border-radius: 7px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; transition: opacity 120ms ease, transform 100ms ease; white-space: nowrap; }
        .su-btn:active:not(:disabled) { transform: scale(0.97); }
        .su-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .su-btn-primary { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff; }
        .su-btn-primary:hover:not(:disabled) { opacity: 0.88; }
        .su-btn-danger { background: linear-gradient(135deg, #ff6b6b, #f06595); color: #fff; }
        .su-btn-danger:hover:not(:disabled) { opacity: 0.88; }
        .su-btn-ghost { background: #1c1e2a; color: #e8e9ed; }
        .su-btn-ghost:hover:not(:disabled) { background: #252736; }
        .su-error { background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.25); color: #ff6b6b; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 14px; }
        .su-toast { position: fixed; bottom: 30px; right: 30px; background: #111218; border: 1px solid #252736; border-left: 3px solid #6c5ce7; padding: 14px 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; color: #e8e9ed; font-size: 13.5px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 500; max-width: 360px; }
        @media (max-width: 900px) { .su-hide-mobile { display: none; } .su-row { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="su-title">Staff Users</h1>
          <div className="su-sub">{users.length} team {users.length === 1 ? 'member' : 'members'}</div>
        </div>
        <button className="su-btn su-btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ Add staff user'}
        </button>
      </div>

      {showCreate && (
        <form className="su-card" onSubmit={handleCreate}>
          <div className="su-card-title">New staff user</div>
          {createError && <div className="su-error">{createError}</div>}
          <div className="su-row">
            <div className="su-field"><div className="su-label">First name *</div><input className="su-input" required value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
            <div className="su-field"><div className="su-label">Last name</div><input className="su-input" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
          </div>
          <div className="su-field"><div className="su-label">Email *</div><input className="su-input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div className="su-field"><div className="su-label">Password *</div><input className="su-input" type="password" required minLength={8} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
          <div className="su-field">
            <div className="su-label">Role</div>
            <select className="su-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
          <button type="submit" className="su-btn su-btn-primary" disabled={creating}>{creating ? 'Creating…' : 'Create staff user'}</button>
        </form>
      )}

      <div className="su-table-wrap">
        <table className="su-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="su-empty">Loading…</td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan={5} className="su-empty">No staff users.</td></tr>}
            {!loading && users.map(u => (
              <tr key={u.id}>
                <td>
                  {editing === u.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input className="su-input" style={{ width: 100 }} value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} />
                      <input className="su-input" style={{ width: 100 }} value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} />
                    </div>
                  ) : (
                    <span style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</span>
                  )}
                </td>
                <td>{u.email}</td>
                <td>
                  {editing === u.id ? (
                    <select className="su-select" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                      <option value="support">Support</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  ) : <RoleBadge value={u.role} />}
                </td>
                <td><ActiveBadge value={u.is_active} /></td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {editing === u.id ? (
                      <>
                        <button className="su-btn su-btn-primary" disabled={saving} onClick={() => saveEdit(u.id)}>{saving ? '…' : 'Save'}</button>
                        <button className="su-btn su-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="su-btn su-btn-ghost" onClick={() => startEdit(u)}>Edit</button>
                        <button className="su-btn su-btn-ghost" onClick={() => setConfirm({ type: 'reset', user: u })}>Reset pw</button>
                        {u.is_active && u.id !== me?.id && (
                          <button className="su-btn su-btn-danger" onClick={() => setConfirm({ type: 'deactivate', user: u })}>Deactivate</button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={confirm?.type === 'deactivate'}
        title={`Deactivate ${confirm?.user?.email}?`}
        message={`This staff user will no longer be able to log in to the admin console.`}
        confirmLabel="Deactivate"
        variant="danger"
        loading={busy}
        onConfirm={() => doDeactivate(confirm.user.id)}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm?.type === 'reset'}
        title={`Reset password for ${confirm?.user?.email}?`}
        message={`A password reset email will be sent to their address.`}
        confirmLabel="Send reset"
        variant="primary"
        loading={busy}
        onConfirm={() => doResetPassword(confirm.user.id)}
        onCancel={() => setConfirm(null)}
      />

      {toast && <div className="su-toast">{toast}</div>}
    </>
  );
}
