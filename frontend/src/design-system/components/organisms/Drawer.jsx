import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const POSITIONS = {
  right: 'right-0 top-0 bottom-0 h-full animate-slide-right',
  left:  'left-0 top-0 bottom-0 h-full',
  bottom:'bottom-0 left-0 right-0 w-full animate-slide-up',
};

const WIDTHS = {
  sm: 'w-80',
  md: 'w-96',
  lg: 'w-[480px]',
  xl: 'w-[600px]',
};

export default function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  position = 'right',
  size = 'md',
  className,
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open, onClose]);

  if (!open) return null;

  const isVertical = position === 'right' || position === 'left';

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-neutral-900/40 dark:bg-neutral-950/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          'absolute flex flex-col shadow-2xl',
          'bg-white dark:bg-neutral-800',
          'border border-neutral-200 dark:border-neutral-700',
          POSITIONS[position],
          isVertical && WIDTHS[size],
          position === 'bottom' && 'max-h-[80vh] rounded-t-2xl',
          position === 'right' && 'rounded-l-2xl',
          position === 'left' && 'rounded-r-2xl',
          className
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-700 shrink-0">
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Close"
          >
            <X size={15} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-thin">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-700 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
