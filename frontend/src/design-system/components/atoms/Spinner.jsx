import { cn } from '../../utils/cn';

const sizes = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7', xl: 'w-10 h-10' };

export default function Spinner({ size = 'md', className }) {
  return (
    <svg
      className={cn('animate-spin text-primary-500', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function PageSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20" role="status">
      <Spinner size="lg" />
      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
    </div>
  );
}
