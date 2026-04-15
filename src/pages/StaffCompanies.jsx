import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffCompanies } from '../services/staffApi.js';

const PLAN_FILTERS = [
  { value: '',         label: 'All plans' },
  { value: 'starter',  label: 'Starter' },
  { value: 'pro',      label: 'Pro' },
  { value: 'business', label: 'Business' },
];

const SUBSCRIPTION_FILTERS = [
  { value: '',         label: 'All subscriptions' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'active',   label: 'Active' },
  { value: 'past_due', label: 'Past due' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'unpaid',   label: 'Unpaid' },
];

const PROVISIONING_FILTERS = [
  { value: '',             label: 'All provisioning' },
  { value: 'pending',      label: 'Pending' },
  { value: 'provisioning', label: 'Provisioning' },
  { value: 'ready',        label: 'Ready' },
  { value: 'failed',       label: 'Failed' },
];

const ACTIVE_FILTERS = [
  { value: '',      label: 'All accounts' },
  { value: 'true',  label: 'Active only' },
  { value: 'false', label: 'Inactive only' },
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest first' },
  { value: 'name',       label: 'Name (A–Z)' },
  { value: 'plan',       label: 'Plan' },
];

function StatusBadge({ kind, value }) {
  const palettes = {
    plan: {
      starter:  { bg: 'rgba(91,192,222,0.12)', border: 'rgba(91,192,222,0.35)', fg: '#5bc0de' },
      pro:      { bg: 'rgba(108,92,231,0.15)', border: 'rgba(108,92,231,0.4)',  fg: '#a29bfe' },
      business: { bg: 'rgba(255,165,0,0.12)',  border: 'rgba(255,165,0,0.35)',  fg: '#ffb347' },
    },
    subscription: {
      trialing: { bg: 'rgba(91,192,222,0.12)', border: 'rgba(91,192,222,0.35)', fg: '#5bc0de' },
      active:   { bg: 'rgba(81,207,102,0.12)', border: 'rgba(81,207,102,0.35)', fg: '#51cf66' },
      past_due: { bg: 'rgba(255,165,0,0.12)',  border: 'rgba(255,165,0,0.35)',  fg: '#ffb347' },
      canceled: { bg: 'rgba(139,143,163,0.12)',border: 'rgba(139,143,163,0.35)',fg: '#8b8fa3' },
      unpaid:   { bg: 'rgba(255,107,107,0.12)',border: 'rgba(255,107,107,0.35)',fg: '#ff6b6b' },
    },
    provisioning: {
      pending:      { bg: 'rgba(139,143,163,0.12)', border: 'rgba(139,143,163,0.35)', fg: '#8b8fa3' },
      provisioning: { bg: 'rgba(91,192,222,0.12)',  border: 'rgba(91,192,222,0.35)',  fg: '#5bc0de' },
      ready:        { bg: 'rgba(81,207,102,0.12)',  border: 'rgba(81,207,102,0.35)',  fg: '#51cf66' },
      failed:       { bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.35)', fg: '#ff6b6b' },
    },
    active: {
      true:  { bg: 'rgba(81,207,102,0.12)',  border: 'rgba(81,207,102,0.35)',  fg: '#51cf66', label: 'Active' },
      false: { bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.35)', fg: '#ff6b6b', label: 'Inactive' },
    },
  };
  const palette = palettes[kind]?.[String(value)] || { bg: 'rgba(139,143,163,0.12)', border: 'rgba(139,143,163,0.35)', fg: '#8b8fa3' };
  const text = palette.label || String(value || '—');
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 999,
      background: palette.bg,
      border: `1px solid ${palette.border}`,
      color: palette.fg,
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      whiteSpace: 'nowrap',
    }}>{text.replace('_', ' ')}</span>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function StaffCompanies() {
  const navigate = useNavigate();

  const [data,    setData]    = useState({ companies: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const [search,        setSearch]        = useState('');
  const [searchInput,   setSearchInput]   = useState('');
  const [planFilter,    setPlanFilter]    = useState('');
  const [subFilter,     setSubFilter]     = useState('');
  const [provFilter,    setProvFilter]    = useState('');
  const [activeFilter,  setActiveFilter]  = useState('');
  const [sort,          setSort]          = useState('created_at');
  const [page,          setPage]          = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20, sort, order: 'desc' };
      if (search)        params.search              = search;
      if (planFilter)    params.plan                = planFilter;
      if (subFilter)     params.subscription_status = subFilter;
      if (provFilter)    params.provisioning_status = provFilter;
      if (activeFilter)  params.is_active           = activeFilter;

      const res = await staffCompanies.list(params);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [page, sort, search, planFilter, subFilter, provFilter, activeFilter]);

  useEffect(() => { load(); }, [load]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  return (
    <>
      <style>{`
        .sc-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }
        .sc-title {
          font-size: 22px;
          font-weight: 700;
          color: #e8e9ed;
          letter-spacing: -0.3px;
          margin-bottom: 4px;
        }
        .sc-sub {
          font-size: 13.5px;
          color: #8b8fa3;
        }
        .sc-toolbar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 18px;
          align-items: center;
        }
        .sc-search {
          flex: 1;
          min-width: 220px;
          display: flex;
          gap: 8px;
        }
        .sc-search input {
          flex: 1;
          padding: 9px 13px;
          background: #13141b;
          border: 1px solid #252736;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          color: #e8e9ed;
          outline: none;
        }
        .sc-search input:focus { border-color: #6c5ce7; }
        .sc-search button {
          padding: 9px 16px;
          background: linear-gradient(135deg, #6c5ce7, #a29bfe);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 120ms ease;
        }
        .sc-search button:hover { opacity: 0.88; }
        .sc-select {
          padding: 9px 13px;
          background: #13141b;
          border: 1px solid #252736;
          border-radius: 8px;
          color: #e8e9ed;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          outline: none;
        }
        .sc-select:focus { border-color: #6c5ce7; }
        .sc-table-wrap {
          background: #111218;
          border: 1px solid #252736;
          border-radius: 12px;
          overflow: hidden;
        }
        .sc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }
        .sc-table th {
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
        .sc-table td {
          padding: 14px 16px;
          color: #e8e9ed;
          border-bottom: 1px solid #1c1e2a;
          vertical-align: middle;
        }
        .sc-table tr:last-child td { border-bottom: none; }
        .sc-table tbody tr {
          cursor: pointer;
          transition: background 100ms ease;
        }
        .sc-table tbody tr:hover { background: #15171f; }
        .sc-name {
          font-weight: 600;
          color: #e8e9ed;
        }
        .sc-meta {
          font-size: 12px;
          color: #8b8fa3;
          margin-top: 2px;
        }
        .sc-num {
          font-variant-numeric: tabular-nums;
          color: #b0b3c5;
        }
        .sc-empty {
          padding: 60px 20px;
          text-align: center;
          color: #8b8fa3;
          font-size: 14px;
        }
        .sc-error {
          background: rgba(255,107,107,0.08);
          border: 1px solid rgba(255,107,107,0.25);
          color: #ff6b6b;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13.5px;
          margin-bottom: 14px;
        }
        .sc-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          background: #0d0e14;
          border-top: 1px solid #1c1e2a;
          font-size: 13px;
          color: #8b8fa3;
        }
        .sc-page-btns {
          display: flex;
          gap: 6px;
        }
        .sc-page-btn {
          padding: 6px 12px;
          background: #13141b;
          border: 1px solid #252736;
          border-radius: 6px;
          color: #e8e9ed;
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          cursor: pointer;
        }
        .sc-page-btn:hover:not(:disabled) { background: #1c1e2a; border-color: #3a3d52; }
        .sc-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sc-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        @media (max-width: 900px) {
          .sc-table { font-size: 12.5px; }
          .sc-table th, .sc-table td { padding: 10px 12px; }
          .sc-hide-mobile { display: none; }
        }
      `}</style>

      <div className="sc-header">
        <div>
          <h1 className="sc-title">Companies</h1>
          <div className="sc-sub">{loading ? 'Loading…' : `${data.total} ${data.total === 1 ? 'company' : 'companies'} on Gate AI`}</div>
        </div>
      </div>

      <div className="sc-toolbar">
        <form className="sc-search" onSubmit={handleSearchSubmit}>
          <input
            placeholder="Search by company name or owner email…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <select className="sc-select" value={planFilter} onChange={e => changeFilter(setPlanFilter, e.target.value)}>
          {PLAN_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select className="sc-select" value={subFilter} onChange={e => changeFilter(setSubFilter, e.target.value)}>
          {SUBSCRIPTION_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select className="sc-select" value={provFilter} onChange={e => changeFilter(setProvFilter, e.target.value)}>
          {PROVISIONING_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select className="sc-select" value={activeFilter} onChange={e => changeFilter(setActiveFilter, e.target.value)}>
          {ACTIVE_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select className="sc-select" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
          {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {error && <div className="sc-error">{error}</div>}

      <div className="sc-table-wrap">
        <table className="sc-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Plan</th>
              <th>Subscription</th>
              <th>Provisioning</th>
              <th>Status</th>
              <th className="sc-hide-mobile">Users</th>
              <th className="sc-hide-mobile">Calls</th>
              <th className="sc-hide-mobile">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="sc-empty">Loading companies…</td></tr>
            )}
            {!loading && data.companies.length === 0 && (
              <tr><td colSpan={8} className="sc-empty">No companies match your filters.</td></tr>
            )}
            {!loading && data.companies.map(c => (
              <tr key={c.id} onClick={() => navigate(`/staff/companies/${c.id}`)}>
                <td>
                  <div className="sc-name">{c.name}</div>
                  <div className="sc-meta">{c.owner_email || '—'}{c.industry ? ` · ${c.industry}` : ''}</div>
                </td>
                <td><StatusBadge kind="plan" value={c.plan} /></td>
                <td><StatusBadge kind="subscription" value={c.subscription_status} /></td>
                <td><StatusBadge kind="provisioning" value={c.provisioning_status} /></td>
                <td><StatusBadge kind="active" value={c.is_active} /></td>
                <td className="sc-hide-mobile sc-num">{c.user_count}</td>
                <td className="sc-hide-mobile sc-num">{c.total_calls}</td>
                <td className="sc-hide-mobile sc-num">{fmtDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && data.pages > 1 && (
          <div className="sc-pagination">
            <span>Page {data.page} of {data.pages} · {data.total} total</span>
            <div className="sc-page-btns">
              <button className="sc-page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
              <button className="sc-page-btn" disabled={page >= data.pages} onClick={() => setPage(p => Math.min(data.pages, p + 1))}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
