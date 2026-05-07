import { Loader2 } from 'lucide-react';

const sizes = { sm: 14, md: 20, lg: 32 };

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <Loader2
      size={sizes[size]}
      className={`animate-spin text-indigo-500 ${className}`}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );
}
