import { cn } from '../../utils/cn';

export function Tabs({ tabs, active, onChange, variant = 'pill', className }) {
  return (
    <div
      className={cn(
        variant === 'pill'  ? 'flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit' :
        variant === 'line'  ? 'flex border-b border-default gap-0' :
        'flex gap-2',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={active === tab.id}
          onClick={() => !tab.disabled && onChange(tab.id)}
          variant={variant}
        />
      ))}
    </div>
  );
}

function TabItem({ tab, isActive, onClick, variant }) {
  const isLine = variant === 'line';
  const isPill = variant === 'pill';

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={tab.disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        isPill && [
          'px-4 py-2 rounded-lg',
          isActive
            ? 'bg-white dark:bg-neutral-700 shadow-xs text-neutral-900 dark:text-white'
            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
        ],
        isLine && [
          'px-4 py-2.5 border-b-2 -mb-px',
          isActive
            ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
            : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400',
        ],
        !isPill && !isLine && [
          'px-3 py-1.5 rounded-lg',
          isActive
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
            : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800',
        ]
      )}
    >
      {tab.icon && <tab.icon size={14} />}
      {tab.label}
      {tab.badge !== undefined && (
        <span className={cn(
          'text-2xs font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
          isActive
            ? 'bg-primary-600 text-white dark:bg-primary-400'
            : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'
        )}>
          {tab.badge}
        </span>
      )}
    </button>
  );
}

export function TabPanel({ children, className }) {
  return <div className={cn('animate-fade-in', className)}>{children}</div>;
}
