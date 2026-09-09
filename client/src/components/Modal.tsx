import React from 'react';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  footer?: React.ReactNode;
}

export default function Modal({ title, children, onClose, footer }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
          {title}
        </h2>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {children}
        </div>
        {footer && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
