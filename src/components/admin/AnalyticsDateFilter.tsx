import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';
import type { DateRangePreset } from '@/hooks/useAdminAnalytics';

interface AnalyticsDateFilterProps {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset) => void;
}

const presets: { value: DateRangePreset; label: string; shortLabel: string }[] = [
  { value: 'today', label: 'Today', shortLabel: 'Today' },
  { value: '7days', label: '7 Days', shortLabel: '7D' },
  { value: '30days', label: '30 Days', shortLabel: '30D' },
  { value: '90days', label: '90 Days', shortLabel: '90D' },
  { value: 'all', label: 'All Time', shortLabel: 'All' },
];

export const AnalyticsDateFilter = ({ value, onChange }: AnalyticsDateFilterProps) => {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <Calendar className="h-3.5 w-3.5 text-muted-foreground mr-1 hidden sm:block" />
      {presets.map((preset) => (
        <button
          key={preset.value}
          onClick={() => onChange(preset.value)}
          className={cn(
            'px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all',
            value === preset.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <span className="sm:hidden">{preset.shortLabel}</span>
          <span className="hidden sm:inline">{preset.label}</span>
        </button>
      ))}
    </div>
  );
};
