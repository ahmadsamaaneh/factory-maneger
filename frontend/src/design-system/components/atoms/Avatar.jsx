import { cva } from 'class-variance-authority';
import { User } from 'lucide-react';
import { cn } from '../../utils/cn';

const avatarVariants = cva(
  'inline-flex items-center justify-center rounded-full font-semibold shrink-0 overflow-hidden select-none',
  {
    variants: {
      size: {
        xs: 'w-6  h-6  text-2xs',
        sm: 'w-8  h-8  text-xs',
        md: 'w-9  h-9  text-sm',
        lg: 'w-11 h-11 text-base',
        xl: 'w-14 h-14 text-lg',
      },
      color: {
        indigo: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
        green:  'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
        amber:  'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
        red:    'bg-danger-100  text-danger-700  dark:bg-danger-900/40  dark:text-danger-300',
        blue:   'bg-info-100    text-info-700    dark:bg-info-900/40    dark:text-info-300',
        slate:  'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
      },
    },
    defaultVariants: { size: 'md', color: 'indigo' },
  }
);

const COLOR_MAP = ['indigo', 'green', 'amber', 'red', 'blue', 'slate'];

function getColorFromName(name = '') {
  const idx = name.charCodeAt(0) % COLOR_MAP.length;
  return COLOR_MAP[idx];
}

export default function Avatar({ name, src, size, color, className }) {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '';

  const autoColor = color || getColorFromName(name);

  return (
    <div className={cn(avatarVariants({ size, color: autoColor }), className)}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <User size={14} />
      )}
    </div>
  );
}
