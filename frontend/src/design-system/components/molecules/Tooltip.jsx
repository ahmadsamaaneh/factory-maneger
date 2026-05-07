import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '../../utils/cn';

export function TooltipProvider({ children }) {
  return <RadixTooltip.Provider delayDuration={300}>{children}</RadixTooltip.Provider>;
}

export default function Tooltip({ children, content, side = 'top', align = 'center', className }) {
  if (!content) return children;

  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            'z-50 max-w-xs px-2.5 py-1.5 rounded-lg text-xs font-medium',
            'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900',
            'shadow-lg animate-fade-in',
            className
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-neutral-900 dark:fill-neutral-100" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
