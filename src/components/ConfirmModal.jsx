import { useEffect } from 'react';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'primary'
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !loading) onCancel?.();
    }
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const confirmBg = variant === 'danger'
    ? 'linear-gradient(135deg, #ff6b6b, #f06595)'
    : 'linear-gradient(135deg, #6c5ce7, #a29bfe)';

  return (
    <>
      <style>{`
        .cm-backdrop {
          position: fixed; inset: 0;
          background: rgba(5,6,10,0.7);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: cm-fade 120ms ease;
        }
        @keyframes cm-fade { from { opacity: 0; } to { opacity: 1; } }
        .cm-card {
          background: #111218;
          border: 1px solid #252736;
          border-radius: 14px;
          padding: 28px;
          max-width: 460px;
          width: 100%;
          font-family: 'DM Sans', sans-serif;
          color: #e8e9ed;
          animation: cm-pop 160ms cubic-bezier(0.2, 0.9, 0.3, 1.2);
        }
        @keyframes cm-pop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .cm-title {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.2px;
          margin-bottom: 8px;
        }
        .cm-msg {
          font-size: 14px;
          color: #b0b3c5;
          line-height: 1.55;
          margin-bottom: 22px;
          white-space: pre-wrap;
        }
        .cm-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .cm-btn {
          padding: 10px 18px;
          border-radius: 8px;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 120ms ease, transform 100ms ease;
        }
        .cm-btn:active:not(:disabled) { transform: scale(0.97); }
        .cm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cm-btn-cancel {
          background: #1c1e2a;
          color: #b0b3c5;
        }
        .cm-btn-cancel:hover:not(:disabled) { background: #252736; color: #e8e9ed; }
        .cm-btn-confirm {
          color: #fff;
        }
        .cm-btn-confirm:hover:not(:disabled) { opacity: 0.88; }
      `}</style>

      <div className="cm-backdrop" onClick={() => !loading && onCancel?.()}>
        <div className="cm-card" onClick={e => e.stopPropagation()}>
          <div className="cm-title">{title}</div>
          <div className="cm-msg">{message}</div>
          <div className="cm-actions">
            <button className="cm-btn cm-btn-cancel" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </button>
            <button
              className="cm-btn cm-btn-confirm"
              style={{ background: confirmBg }}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Working…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
