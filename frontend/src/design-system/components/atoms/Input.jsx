import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  [
    'ds-input',
    'transition-all duration-150',
  ],
  {
    variants: {
      state: {
        default: '',
        error:   'error',
        success: '!border-success-500 focus:!ring-success-500/20',
      },
      inputSize: {
        sm: 'h-8  text-xs px-2.5',
        md: 'h-9  text-sm px-3',
        lg: 'h-10 text-sm px-3.5',
      },
    },
    defaultVariants: { state: 'default', inputSize: 'md' },
  }
);

function Input({
  label,
  helperText,
  error,
  success,
  inputSize,
  prefix,
  suffix,
  className,
  id,
  required,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const state   = error ? 'error' : success ? 'success' : 'default';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 flex items-center pointer-events-none" style={{ color: 'var(--text-tertiary)' }}>
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            inputVariants({ state, inputSize }),
            prefix && 'pl-9',
            suffix && 'pr-9',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 flex items-center pointer-events-none" style={{ color: 'var(--text-tertiary)' }}>
            {suffix}
          </span>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger-600 dark:text-danger-400 flex items-center gap-1">
          {error}
        </p>
      )}
      {success && !error && (
        <p className="text-xs text-success-600 dark:text-success-400">{success}</p>
      )}
      {helperText && !error && !success && (
        <p id={`${inputId}-helper`} className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {helperText}
        </p>
      )}
    </div>
  );
}

function Select({ label, error, helperText, children, className, id, required, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'ds-input h-9 text-sm cursor-pointer appearance-none',
          error && 'error',
          className
        )}
        aria-invalid={!!error}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>}
      {helperText && !error && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{helperText}</p>}
    </div>
  );
}

function Textarea({ label, error, helperText, className, id, required, rows = 3, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
          {required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={cn(
          'ds-input resize-none py-2.5 text-sm',
          error && 'error',
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>}
      {helperText && !error && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{helperText}</p>}
    </div>
  );
}

function Checkbox({ label, description, error, className, id, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <input
        id={inputId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer dark:border-neutral-600"
        {...props}
      />
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label htmlFor={inputId} className="text-sm font-medium cursor-pointer" style={{ color: 'var(--text-primary)' }}>
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
          )}
        </div>
      )}
    </div>
  );
}

export { Input as default, Input, Select, Textarea, Checkbox };
