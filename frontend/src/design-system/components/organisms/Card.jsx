import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const cardVariants = cva('card transition-shadow duration-200', {
  variants: {
    hover:   { true: 'hover:shadow-md cursor-pointer' },
    padding: {
      none: '',
      sm:   'p-4',
      md:   'p-5',
      lg:   'p-6',
    },
  },
  defaultVariants: { padding: 'none' },
});

export default function Card({ children, hover, padding, className, onClick }) {
  return (
    <div className={cn(cardVariants({ hover, padding }), className)} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('card-header', className)}>
      <div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className }) {
  return <div className={cn('card-body', className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return (
    <div
      className={cn('px-5 py-3 border-t flex items-center justify-end gap-3', className)}
      style={{ borderColor: 'var(--border-default)' }}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, colorClass, trend, trendUp, className }) {
  return (
    <div className={cn('card p-5 flex items-start gap-4', className)}>
      <div className={cn('p-2.5 rounded-xl shrink-0', colorClass || 'bg-primary-100 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400')}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
        <p className="text-2xl font-bold mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {trend && (
          <p className={cn('text-xs mt-1', trendUp ? 'text-success-600' : 'text-danger-600')}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
    </div>
  );
}
