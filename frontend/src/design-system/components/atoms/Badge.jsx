import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap',
  {
    variants: {
      variant: {
        primary:  'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300',
        success:  'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
        warning:  'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
        danger:   'bg-danger-100  text-danger-700  dark:bg-danger-900/30  dark:text-danger-400',
        info:     'bg-info-100    text-info-700    dark:bg-info-900/30    dark:text-info-400',
        neutral:  'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
        outline:  'bg-transparent border border-current text-neutral-600 dark:text-neutral-300',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-2xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3   py-1   text-sm',
      },
      dot: { true: '' },
    },
    defaultVariants: { variant: 'neutral', size: 'md' },
  }
);

export default function Badge({ label, variant, size, dot, icon: Icon, className, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant, size, dot }), className)} {...props}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block shrink-0" />
      )}
      {Icon && <Icon size={10} className="shrink-0" />}
      {label}
    </span>
  );
}

export { badgeVariants };
