import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

const contentStyles = cn(
  'z-50 min-w-[160px] overflow-hidden rounded-xl border shadow-lg py-1',
  'bg-white dark:bg-neutral-800',
  'border-neutral-200 dark:border-neutral-700',
  'animate-scale-in'
);

const itemStyles = cn(
  'relative flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none',
  'outline-none transition-colors duration-100',
  'text-neutral-700 dark:text-neutral-300',
  'hover:bg-neutral-50 dark:hover:bg-neutral-700',
  'data-[disabled]:opacity-40 data-[disabled]:pointer-events-none'
);

export function Dropdown({ children, trigger, align = 'end', sideOffset = 6 }) {
  return (
    <RadixDropdown.Root>
      <RadixDropdown.Trigger asChild>{trigger}</RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content
          align={align}
          sideOffset={sideOffset}
          className={contentStyles}
        >
          {children}
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}

export function DropdownItem({ children, icon: Icon, onSelect, disabled, destructive, className }) {
  return (
    <RadixDropdown.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        itemStyles,
        destructive && 'text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30',
        className
      )}
    >
      {Icon && <Icon size={14} className="shrink-0 opacity-70" />}
      {children}
    </RadixDropdown.Item>
  );
}

export function DropdownSeparator() {
  return <RadixDropdown.Separator className="h-px bg-neutral-100 dark:bg-neutral-700 my-1" />;
}

export function DropdownLabel({ children }) {
  return (
    <RadixDropdown.Label className="px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
      {children}
    </RadixDropdown.Label>
  );
}

export function DropdownCheckItem({ children, checked, onCheckedChange }) {
  return (
    <RadixDropdown.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={itemStyles}
    >
      <RadixDropdown.ItemIndicator>
        <Check size={12} className="text-primary-600" />
      </RadixDropdown.ItemIndicator>
      {children}
    </RadixDropdown.CheckboxItem>
  );
}
