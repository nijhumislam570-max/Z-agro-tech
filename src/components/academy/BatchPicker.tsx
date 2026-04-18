import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calendar, Users } from 'lucide-react';
import type { CourseBatch, BatchStatus } from '@/hooks/useCourseBatches';

const statusStyle: Record<BatchStatus, string> = {
  open: 'bg-success/15 text-success border-success/30',
  filling: 'bg-accent/15 text-accent border-accent/30',
  closed: 'bg-muted text-muted-foreground border-border',
  completed: 'bg-muted text-muted-foreground border-border',
};

const statusLabel: Record<BatchStatus, string> = {
  open: 'Open',
  filling: 'Filling fast',
  closed: 'Closed',
  completed: 'Completed',
};

interface Props {
  batches: CourseBatch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function formatDate(d: string | null) {
  if (!d) return 'TBA';
  try {
    return new Date(d).toLocaleDateString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return d; }
}

export const BatchPicker = ({ batches, selectedId, onSelect }: Props) => {
  if (!batches || batches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No batches scheduled yet — contact us on WhatsApp for the next start date.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {batches.map((b) => {
        const disabled = b.status === 'closed' || b.status === 'completed';
        const active = selectedId === b.id;
        const seatsLeft = Math.max(0, b.total_seats - b.enrolled_count);
        return (
          <button
            type="button"
            key={b.id}
            disabled={disabled}
            onClick={() => onSelect(b.id)}
            className={cn(
              'w-full text-left rounded-xl border p-3 transition-all',
              'hover:border-primary/40 hover:bg-primary/5',
              active && 'border-primary bg-primary/5 ring-2 ring-primary/30',
              !active && 'border-border/60 bg-card',
              disabled && 'opacity-50 cursor-not-allowed hover:bg-card hover:border-border/60',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-foreground line-clamp-1">{b.name}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(b.start_date)}{b.end_date ? ` → ${formatDate(b.end_date)}` : ''}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {seatsLeft} of {b.total_seats} seats left
                  </span>
                </div>
              </div>
              <Badge variant="outline" className={cn('flex-shrink-0', statusStyle[b.status])}>
                {statusLabel[b.status]}
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default BatchPicker;
