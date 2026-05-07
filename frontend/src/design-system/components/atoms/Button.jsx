import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
    'transition-all duration-150 cursor-pointer select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-600 text-white shadow-sm',
          'hover:bg-primary-700',
          'focus-visible:ring-primary-500',
          'dark:bg-primary-500 dark:hover:bg-primary-600',
        ],
        secondary: [
          'bg-white text-neutral-700 border border-neutral-200 shadow-xs',
          'hover:bg-neutral-50 hover:border-neutral-300',
          'focus-visible:ring-primary-500',
          'dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700',
          'dark:hover:bg-neutral-700',
        ],
        outline: [
          'bg-transparent text-primary-600 border border-primary-300',
          'hover:bg-primary-50 hover:border-primary-400',
          'focus-visible:ring-primary-500',
          'dark:text-primary-400 dark:border-primary-700 dark:hover:bg-primary-950',
        ],
        ghost: [
          'bg-transparent text-neutral-600',
          'hover:bg-neutral-100 hover:text-neutral-900',
          'focus-visible:ring-primary-500',
          'dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
        ],
        danger: [
          'bg-danger-600 text-white shadow-sm',
          'hover:bg-danger-700',
          'focus-visible:ring-danger-500',
          'dark:bg-danger-500 dark:hover:bg-danger-600',
        ],
        success: [
          'bg-success-600 text-white shadow-sm',
          'hover:bg-success-700',
          'focus-visible:ring-success-500',
        ],
        link: [
          'bg-transparent text-primary-600 underline-offset-4',
          'hover:underline hover:text-primary-700',
          'focus-visible:ring-primary-500',
          'dark:text-primary-400',
        ],
      },
      size: {
        xs: 'h-7  px-2.5 text-xs gap-1.5',
        sm: 'h-8  px-3   text-xs',
        md: 'h-9  px-4   text-sm',
        lg: 'h-10 px-5   text-sm',
        xl: 'h-12 px-6   text-base',
      },
      fullWidth: { true: 'w-full' },
      iconOnly:  { true: 'px-0 aspect-square' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export default function Button({
  children,
  variant,
  size,
  fullWidth,
  iconOnly,
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  disabled,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={cn(buttonVariants({ variant, size, fullWidth, iconOnly }), className)}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin shrink-0" />
      ) : Icon ? (
        <Icon size={14} className="shrink-0" />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight size={14} className="shrink-0" />}
    </button>
  );
}

export { buttonVariants };
