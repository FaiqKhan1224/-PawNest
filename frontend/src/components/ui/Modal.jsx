import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';

export default function Modal({ open, onClose, title, children, footer, size = 'md', className = '' }) {
  const titleId = useId();
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const scrollY = window.scrollY;
    document.body.classList.add('modal-open');
    const first = dialogRef.current && dialogRef.current.querySelector('input, select, textarea, button:not(.modal-close)');
    setTimeout(() => (first || dialogRef.current)?.focus?.(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
      window.scrollTo(0, scrollY);
      if (previous && previous.focus) previous.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} className={`modal modal-${size} ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close dialog"><Icon name="x" size={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.querySelector('.admin') || document.body
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', tone = 'danger', busy, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>{busy ? 'Working...' : confirmLabel}</button>
        </>
      )}
    >
      <p className="muted">{message}</p>
    </Modal>
  );
}
