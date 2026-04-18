import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
  iconClassName?: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

export const StatCard = ({ title, value, icon, trend, description, className, iconClassName, href, onClick, active }: StatCardProps) => {
  const navigate = useNavigate();
  
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
        "bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-border shadow-sm hover:shadow-md transition-all",
        isClickable && "cursor-pointer hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        active && "ring-2 ring-primary/50",
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
          
          {description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        
        <div className={cn(
          "h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0",
          iconClassName || "bg-primary/10"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
};