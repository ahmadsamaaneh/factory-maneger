import { cva } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const alertVariants = cva(
  'flex items-start gap-3 rounded-xl p-4 text-sm border',
  {
    variants: {
      variant: {
        info:    'bg-info-50    border-info-200    text-info-800    dark:bg-info-950/40    dark:border-info-800    dark:text-info-200',
        success: 'bg-success-50 border-success-200 text-success-800 dark:bg-success-950/40 dark:border-success-800 dark:text-success-200',
        warning: 'bg-warning-50 border-warning-200 text-warning-800 dark:bg-warning-950/40 dark:border-warning-800 dark:text-warning-200',
        danger:  'bg-danger-50  border-danger-200  text-danger-800  dark:bg-danger-950/40  dark:border-danger-800  dark:text-danger-200',
        neutral: 'bg-neutral-50 border-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300',
      },
    },
    defaultVariants: { variant: 'info' },
  }
);

const ICONS = {
  info:    Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger:  AlertCircle,
  neutral: Info,
};

export default function Alert({ variant = 'info', title, children, onClose, className }) {
  const Icon = ICONS[variant];
  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert">
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        {children && <p className="text-sm opacity-90">{children}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
