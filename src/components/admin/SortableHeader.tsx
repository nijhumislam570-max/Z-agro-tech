import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDir = 'asc' | 'desc';

interface SortableHeaderProps<K extends string> {
  label: string;
  sortKey: K;
  activeKey: K | null;
  direction: SortDir;
  onSort: (key: K) => void;
  className?: string;
  align?: 'left' | 'right';
}

export function SortableHeader<K extends string>({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
  align = 'left',
}: SortableHeaderProps<K>) {
  const isActive = activeKey === sortKey;
  const Icon = !isActive ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        'inline-flex items-center gap-1 hover:text-foreground transition-colors group',
        align === 'right' && 'flex-row-reverse',
        isActive ? 'text-foreground font-semibold' : 'text-muted-foreground',
        className,
      )}
      aria-label={`Sort by ${label}`}
    >
      <span>{label}</span>
      <Icon
        className={cn(
          'h-3 w-3 transition-opacity',
          isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-70',
        )}
      />
    </button>
  );
}
