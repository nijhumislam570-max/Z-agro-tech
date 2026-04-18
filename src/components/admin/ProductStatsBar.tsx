import { memo } from 'react';
import { Package, PackageCheck, PackageX, AlertTriangle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductStats {
  total: number;
  inStock: number;
  outOfStock: number;
  lowStock: number;
  featured?: number;
}

interface ProductStatsBarProps {
  stats: ProductStats;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const statCards = [
  { 
    key: 'all', label: 'Total', icon: Package,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    bgClass: 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10 dark:from-primary/10 dark:to-accent/10 dark:border-primary/20',
  },
  { 
    key: 'in-stock', label: 'In Stock', icon: PackageCheck,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    bgClass: 'bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-100 dark:from-emerald-950/30 dark:to-green-950/20 dark:border-emerald-900/50',
  },
  { 
    key: 'out-of-stock', label: 'Out of Stock', icon: PackageX,
    iconColor: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-500/10',
    bgClass: 'bg-gradient-to-br from-red-50 to-rose-50/50 border-red-100 dark:from-red-950/30 dark:to-rose-950/20 dark:border-red-900/50',
  },
  { 
    key: 'low-stock', label: 'Low Stock', icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10',
    bgClass: 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-900/50',
  },
  { 
    key: 'featured', label: 'Featured', icon: Star,
    iconColor: 'text-amber-500 dark:text-amber-300',
    iconBg: 'bg-amber-400/10',
    bgClass: 'bg-gradient-to-br from-amber-50 to-yellow-50/50 border-amber-100 dark:from-amber-950/30 dark:to-yellow-950/20 dark:border-amber-900/50',
  },
] as const;

function getStatValue(key: string, stats: ProductStats): number {
  switch (key) {
    case 'all': return stats.total;
    case 'in-stock': return stats.inStock;
    case 'out-of-stock': return stats.outOfStock;
    case 'low-stock': return stats.lowStock;
    case 'featured': return stats.featured ?? 0;
    default: return 0;
  }
}

export const ProductStatsBar = memo(function ProductStatsBar({ stats, activeFilter, onFilterChange }: ProductStatsBarProps) {
  return (
    <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {statCards.map(({ key, label, icon: Icon, iconColor, iconBg, bgClass }) => {
        const value = getStatValue(key, stats);
        const isActive = activeFilter === key;
        
        return (
          <div
            key={key}
            role="button"
            tabIndex={0}
            onClick={() => onFilterChange(isActive ? 'all' : key)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onFilterChange(isActive ? 'all' : key); }}
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
  );
});
