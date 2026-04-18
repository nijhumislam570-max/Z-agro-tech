import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface AdminStatCardProps {
  icon: LucideIcon | React.ElementType;
  value: string | number;
  label: string;
  iconColor: string;
  iconBg: string;
  bgClass: string;
  active?: boolean;
  onClick?: () => void;
}

export const AdminStatCard = memo(({
  icon: Icon,
  value,
  label,
  iconColor,
  iconBg,
  bgClass,
  active,
  onClick,
}: AdminStatCardProps) => (
  <div
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    className={cn(
      'rounded-xl sm:rounded-2xl p-3 sm:p-4 border shadow-sm hover:shadow-md transition-all',
      bgClass,
      onClick && 'cursor-pointer active:scale-[0.98]',
      active && 'ring-2 ring-primary/50'
    )}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight mb-0.5 sm:mb-1">
          {label}
        </p>
        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{value}</p>
      </div>
      <div className={cn('h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
        <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', iconColor)} />
      </div>
    </div>
  </div>
));

AdminStatCard.displayName = 'AdminStatCard';
