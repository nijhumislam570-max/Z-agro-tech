import { memo } from 'react';
import { 
  Clock, 
  Loader2 as Processing, 
  Truck, 
  CheckCircle, 
  XCircle, 
  ShoppingCart,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderStats {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  flagged: number;
  trashed: number;
  total: number;
  revenue: number;
}

interface OrderStatsBarProps {
  stats: OrderStats;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const statCards = [
  { 
    key: 'all', label: 'All Orders', icon: ShoppingCart,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    bgClass: 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10 dark:from-primary/10 dark:to-accent/10 dark:border-primary/20',
  },
  { 
    key: 'pending', label: 'Pending', icon: Clock,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10',
    bgClass: 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-900/50',
  },
  { 
    key: 'processing', label: 'Processing', icon: Processing,
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-500/10',
    bgClass: 'bg-gradient-to-br from-blue-50 to-cyan-50/50 border-blue-100 dark:from-blue-950/30 dark:to-cyan-950/20 dark:border-blue-900/50',
  },
  { 
    key: 'shipped', label: 'Shipped', icon: Truck,
    iconColor: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-500/10',
    bgClass: 'bg-gradient-to-br from-purple-50 to-indigo-50/50 border-purple-100 dark:from-purple-950/30 dark:to-indigo-950/20 dark:border-purple-900/50',
  },
  { 
    key: 'delivered', label: 'Delivered', icon: CheckCircle,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    bgClass: 'bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-100 dark:from-emerald-950/30 dark:to-green-950/20 dark:border-emerald-900/50',
  },
  { 
    key: 'cancelled', label: 'Cancelled', icon: XCircle,
    iconColor: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-500/10',
    bgClass: 'bg-gradient-to-br from-red-50 to-rose-50/50 border-red-100 dark:from-red-950/30 dark:to-rose-950/20 dark:border-red-900/50',
  },
] as const;

function getStatValue(key: string, stats: OrderStats): number {
  switch (key) {
    case 'all': return stats.total;
    case 'pending': return stats.pending;
    case 'processing': return stats.processing;
    case 'shipped': return stats.shipped;
    case 'delivered': return stats.delivered;
    case 'cancelled': return stats.cancelled;
    default: return 0;
  }
}

export const OrderStatsBar = memo(function OrderStatsBar({ stats, activeFilter, onFilterChange }: OrderStatsBarProps) {
  return (
    <div className="mb-4 sm:mb-6 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3">
        {statCards.map(({ key, label, icon: Icon, iconColor, iconBg, bgClass }) => {
          const value = getStatValue(key, stats);
          const isActive = activeFilter === key;
          
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => onFilterChange(isActive && key !== 'all' ? 'all' : key)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onFilterChange(isActive && key !== 'all' ? 'all' : key); }}
              className={cn(
                'rounded-xl sm:rounded-2xl p-3 sm:p-4 border shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]',
                bgClass,
                isActive && 'ring-2 ring-primary/50'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight mb-0.5 sm:mb-1">
                    {label}
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                    {value}
                  </p>
                </div>
                <div className={cn('h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
                  <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', iconColor)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Extra cards for flagged/trashed + revenue */}
      <div className="flex items-center gap-3 flex-wrap">
        {stats.flagged > 0 && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => onFilterChange(activeFilter === 'flagged' ? 'all' : 'flagged')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onFilterChange(activeFilter === 'flagged' ? 'all' : 'flagged'); }}
            className={cn(
              'rounded-xl px-3 py-2 border shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] flex items-center gap-2',
              'bg-gradient-to-br from-red-50 to-rose-50/50 border-red-100 dark:from-red-950/30 dark:to-rose-950/20 dark:border-red-900/50',
              activeFilter === 'flagged' && 'ring-2 ring-destructive/50'
            )}
          >
            <ShieldAlert className="h-4 w-4 text-destructive" />
            <span className="text-sm font-bold text-destructive">{stats.flagged}</span>
            <span className="text-xs text-muted-foreground">Flagged</span>
          </div>
        )}

        {stats.trashed > 0 && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => onFilterChange(activeFilter === 'trashed' ? 'all' : 'trashed')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onFilterChange(activeFilter === 'trashed' ? 'all' : 'trashed'); }}
            className={cn(
              'rounded-xl px-3 py-2 border shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] flex items-center gap-2',
              'bg-muted/50 border-border',
              activeFilter === 'trashed' && 'ring-2 ring-muted-foreground/50'
            )}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold text-muted-foreground">{stats.trashed}</span>
            <span className="text-xs text-muted-foreground">Trashed</span>
          </div>
        )}

        <div className="flex items-center gap-2 px-1 ml-auto">
          <span className="text-xs text-muted-foreground">Active Revenue:</span>
          <span className="text-sm font-bold text-primary">
            ৳{stats.revenue.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
});
