import { memo } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

export type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'all';

export const getTimeCutoff = (filter: TimeFilter): Date | null => {
  const now = new Date();
  switch (filter) {
    case 'today': return startOfDay(now);
    case 'week': return startOfWeek(now, { weekStartsOn: 0 });
    case 'month': return startOfMonth(now);
    case 'year': return startOfYear(now);
    default: return null;
  }
};

const presets: { value: TimeFilter; label: string; short: string }[] = [
  { value: 'today', label: 'Today', short: 'Today' },
  { value: 'week', label: 'This Week', short: 'Week' },
  { value: 'month', label: 'This Month', short: 'Month' },
  { value: 'year', label: 'This Year', short: 'Year' },
  { value: 'all', label: 'All Time', short: 'All' },
];

export const TimeFilterBar = memo(({ value, onChange }: { value: TimeFilter; onChange: (v: TimeFilter) => void }) => (
  <div className="flex items-center gap-1 sm:gap-1.5">
    <Calendar className="h-3.5 w-3.5 text-muted-foreground mr-1 hidden sm:block" />
    {presets.map((p) => (
      <button
        key={p.value}
        onClick={() => onChange(p.value)}
        className={cn(
          'px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all',
          value === p.value
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <span className="sm:hidden">{p.short}</span>
        <span className="hidden sm:inline">{p.label}</span>
      </button>
    ))}
  </div>
));

TimeFilterBar.displayName = 'TimeFilterBar';
