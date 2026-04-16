// ═══════════════════════════════════════════════════════════════
// Gate AI — Getting Started Checklist
// Shown on the main Dashboard page for new companies until
// all steps are complete or the user dismisses it.
// Completion checks run against live API data, not localStorage,
// except for "Send test notification" which is localStorage-tracked.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  auth as authApi,
  users as usersApi,
  routing as routingApi,
  whitelist as whitelistApi,
  settings as settingsApi,
  notifications as notificationsApi,
} from '../services/api.js';

export default function GettingStartedChecklist({ setActivePage }) {
  const { token, user, company, login } = useAuth();

  const [steps,        setSteps]        = useState(null);   // null = loading
  const [dismissing,   setDismissing]   = useState(false);
  const [testingB,     setTestingB]     = useState(false);
  const [testingF,     setTestingF]     = useState(false);
  const [testBSent,    setTestBSent]    = useState(false);
  const [testFSent,    setTestFSent]    = useState(false);

  // ── Don't render if already dismissed ─────────────────────
  const dismissed = !!company?.checklist_dismissed_at;

  // ── Load completion status ─────────────────────────────────
  const loadSteps = useCallback(async () => {
    if (dismissed) return;
    try {
      const [usersRes, routingRes, whitelistRes, settingsRes, notifsRes] = await Promise.all([
        usersApi.list().catch(() => null),
        routingApi.list().catch(() => null),
        whitelistApi.list().catch(() => null),
        settingsApi.get().catch(() => null),
        notificationsApi.get().catch(() => null),
      ]);

      const userList      = usersRes?.users     || usersRes     || [];
      const routingList   = routingRes?.rules   || routingRes   || [];
      const wlList        = whitelistRes?.contacts || whitelistRes || [];
      const aiSettings    = settingsRes?.ai_settings || settingsRes || {};
      const notifs        = notifsRes?.settings  || notifsRes   || {};

      // Slack is considered connected if a webhook URL is configured
      const slackConnected = !!(
        notifs?.slack_webhook_url ||
        notifs?.slack_enabled && notifs?.slack_webhook_url
      );

      // Rejection script is customized if it has a non-empty value
      const scriptCustomized = !!(aiSettings?.rejection_script);

      // Test notification — tracked in localStorage
      const testSent = !!localStorage.getItem(`gateai_test_notif_${company?.id}`);

      setSteps([
        {
          id:       'team',
          done:     userList.length > 1,
          label:    'Add your first team member',
          desc:     'Gate AI needs to know who to route calls to.',
          page:     'team',
          cta:      'Go to Team',
        },
        {
          id:       'routing',
          done:     routingList.length > 0,
          label:    'Set up a call routing rule',
          desc:     'Define which types of calls go to which team members.',
          page:     'team',
          cta:      'Go to Team',
        },
        {
          id:       'whitelist',
          done:     wlList.length > 0,
          label:    'Add a whitelist contact',
          desc:     'Known contacts skip screening and ring through directly.',
          page:     'screening',
          cta:      'Go to Screening',
        },
        {
          id:       'slack',
          done:     slackConnected,
          label:    'Connect Slack notifications',
          desc:     'Get instant alerts for blocked and forwarded calls.',
          page:     'integrations',
          cta:      'Go to Integrations',
        },
        {
          id:       'script',
          done:     scriptCustomized,
          label:    'Customize your rejection script',
          desc:     'Tailor the message cold callers hear when blocked.',
          page:     'screening',
          cta:      'Go to AI Behavior',
        },
        {
          id:       'test',
          done:     testSent,
          label:    'Send a test notification',
          desc:     'Confirm your email and Slack notifications are working.',
          page:     null, // inline action, no navigation
          cta:      null,
        },
      ]);
    } catch {
      setSteps([]); // fail silently — don't block the dashboard
    }
  }, [dismissed, company?.id]);

  useEffect(() => { loadSteps(); }, [loadSteps]);

  // ── Dismiss checklist ──────────────────────────────────────
  async function handleDismiss() {
    setDismissing(true);
    try {
      await authApi.dismissChecklist();
      // Update auth context so checklist_dismissed_at is set and component
      // won't re-render on the next /me refresh.
      login({
        token,
        user,
        company: { ...company, checklist_dismissed_at: new Date().toISOString() },
      });
    } catch {
      // If the API call fails, just hide it locally — don't block the user
      login({
        token,
        user,
        company: { ...company, checklist_dismissed_at: new Date().toISOString() },
      });
    } finally {
      setDismissing(false);
    }
  }

  // ── Test notification handlers ─────────────────────────────
  async function handleTestBlocked() {
    setTestingB(true);
    try {
      await notificationsApi.testBlocked();
      localStorage.setItem(`gateai_test_notif_${company?.id}`, '1');
      setTestBSent(true);
      setTimeout(() => setTestBSent(false), 5000);
      // Refresh steps so the test step marks as done
      loadSteps();
    } catch (err) {
      alert('Test failed: ' + (err.message || 'Unknown error'));
    } finally {
      setTestingB(false);
    }
  }

  async function handleTestForwarded() {
    setTestingF(true);
    try {
      await notificationsApi.testForwarded();
      localStorage.setItem(`gateai_test_notif_${company?.id}`, '1');
      setTestFSent(true);
      setTimeout(() => setTestFSent(false), 5000);
      loadSteps();
    } catch (err) {
      alert('Test failed: ' + (err.message || 'Unknown error'));
    } finally {
      setTestingF(false);
    }
  }

  // ── Don't render if dismissed or still loading ─────────────
  if (dismissed) return null;
  if (!steps) return null; // loading — no flash of content

  const doneCount  = steps.filter(s => s.done).length;
  const allDone    = doneCount === steps.length;
  const progressPct = Math.round((doneCount / steps.length) * 100);

  // Once all steps are complete, auto-show a "dismiss" prompt
  // but don't auto-dismiss — let the user do it explicitly.

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        background: allDone
          ? 'rgba(0,214,143,0.04)'
          : 'rgba(108,92,231,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: allDone ? 'rgba(0,214,143,0.12)' : 'rgba(108,92,231,0.12)',
            border: `1px solid ${allDone ? 'rgba(0,214,143,0.25)' : 'rgba(108,92,231,0.25)'}`,
          }}>
            {allDone ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a29bfe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.1px' }}>
              {allDone ? '🎉 Setup complete!' : 'Getting Started'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {allDone
                ? 'Your Gate AI call screener is fully configured.'
                : `${doneCount} of ${steps.length} steps complete`}
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '5px 12px',
            fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            transition: 'all 180ms ease',
          }}
          onMouseEnter={e => { e.target.style.background = 'var(--bg-hover)'; e.target.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = 'var(--text-secondary)'; }}
        >
          {dismissing ? 'Saving…' : 'Dismiss'}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--bg-hover)', position: 'relative' }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          background: allDone
            ? 'linear-gradient(90deg, #00d68f, #0abf76)'
            : 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
          borderRadius: '0 2px 2px 0',
          transition: 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>

      {/* Steps */}
      <div style={{ padding: '4px 0' }}>
        {steps.map((step, i) => (
          <div
            key={step.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 20px',
              borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none',
              opacity: step.done ? 0.55 : 1,
              transition: 'opacity 300ms ease',
            }}
          >
            {/* Completion indicator */}
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step.done ? 'rgba(0,214,143,0.12)' : 'var(--bg-hover)',
              border: `1.5px solid ${step.done ? 'rgba(0,214,143,0.4)' : 'var(--border-light)'}`,
              transition: 'all 300ms ease',
            }}>
              {step.done ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--border-light)' }} />
              )}
            </div>

            {/* Label + desc */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13.5, fontWeight: 500,
                color: step.done ? 'var(--text-secondary)' : 'var(--text-primary)',
                textDecoration: step.done ? 'line-through' : 'none',
                textDecorationColor: 'var(--text-tertiary)',
              }}>
                {step.label}
              </div>
              {!step.done && (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {step.desc}
                </div>
              )}
            </div>

            {/* Action — either navigation button or inline test buttons */}
            {!step.done && step.id === 'test' && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  className="btn btn-sm"
                  onClick={handleTestBlocked}
                  disabled={testingB}
                  style={{ fontSize: 11.5 }}
                >
                  {testBSent ? '✓ Sent' : testingB ? 'Sending…' : '🚫 Test blocked'}
                </button>
                <button
                  className="btn btn-sm"
                  onClick={handleTestForwarded}
                  disabled={testingF}
                  style={{ fontSize: 11.5 }}
                >
                  {testFSent ? '✓ Sent' : testingF ? 'Sending…' : '📞 Test forwarded'}
                </button>
              </div>
            )}

            {!step.done && step.page && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setActivePage(step.page)}
                style={{ flexShrink: 0, fontSize: 11.5 }}
              >
                {step.cta}
              </button>
            )}

            {step.done && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#00d68f',
                padding: '2px 8px', borderRadius: 20,
                background: 'rgba(0,214,143,0.08)',
                flexShrink: 0,
              }}>
                Done
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
