import { useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from '../atoms/Button';

const SIZES = {
  xs: 'max-w-sm',
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  closeOnOverlay = true,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      panelRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative w-full flex flex-col max-h-[92vh] rounded-2xl shadow-2xl outline-none',
          'bg-white dark:bg-neutral-800',
          'border border-neutral-100 dark:border-neutral-700',
          'animate-scale-in',
          SIZES[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0 border-b border-neutral-100 dark:border-neutral-700">
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700 ml-4"
            aria-label="Close modal"
          >
            <X size={15} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading,
}) {
  return (
    <Modal open={open} onClose={onClose} size="xs" title={title}>
      <div className="flex flex-col items-center gap-4 text-center py-2">
        <div className={cn(
          'p-3 rounded-full',
          variant === 'danger'  ? 'bg-danger-50  dark:bg-danger-900/30'  : '',
          variant === 'warning' ? 'bg-warning-50 dark:bg-warning-900/30' : '',
        )}>
          <AlertTriangle size={22} className={cn(
            variant === 'danger'  ? 'text-danger-600'  : '',
            variant === 'warning' ? 'text-warning-600' : '',
          )} />
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {message || 'This action cannot be undone. Are you sure?'}
        </p>
        <div className="flex gap-3 w-full pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            className="flex-1"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
