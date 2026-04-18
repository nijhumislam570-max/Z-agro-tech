import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnalyticsStatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  subtitle?: string;
  className?: string;
  iconClassName?: string;
  href?: string;
  onClick?: () => void;
}

export const AnalyticsStatCard = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  className,
  iconClassName,
  href,
  onClick,
}: AnalyticsStatCardProps) => {
  const navigate = useNavigate();

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />;
    return <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (trend.value < 0) return 'text-red-500 dark:text-red-400';
    return 'text-muted-foreground';
  };

  const isClickable = !!(href || onClick);

  const handleClick = () => {
    if (onClick) onClick();
    else if (href) navigate(href);
  };

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
      className={cn(
        'bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-border shadow-sm transition-all hover:shadow-md',
        isClickable && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5 sm:mb-1 uppercase tracking-wider leading-tight line-clamp-2">
            {title}
          </p>
          <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground truncate">
            {value}
          </p>

          {trend && (
            <div className={cn('flex items-center gap-1 mt-1 sm:mt-1.5 text-[10px] sm:text-xs font-medium', getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(trend.value).toFixed(1)}%</span>
              {trend.label && (
                <span className="text-muted-foreground font-normal hidden sm:inline">{trend.label}</span>
              )}
            </div>
          )}

          {subtitle && (
            <p className={cn('text-[10px] sm:text-xs text-muted-foreground', trend ? 'mt-0.5' : 'mt-1')}>{subtitle}</p>
          )}
        </div>

        <div
          className={cn(
            'h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0',
            iconClassName || 'bg-primary/10'
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};
