import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/zagrotech-logo.jpeg';
import { cn } from '@/lib/utils';

interface LogoProps {
  to?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  variant?: 'default' | 'footer' | 'admin';
}

const sizeClasses = {
  sm: 'h-8 w-8 sm:h-9 sm:w-9',
  md: 'h-10 w-10 sm:h-11 sm:w-11',
  lg: 'h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14',
  xl: 'h-14 w-14 sm:h-16 sm:w-16',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base sm:text-lg',
  lg: 'text-lg sm:text-xl',
  xl: 'text-xl sm:text-2xl',
};

export const Logo = forwardRef<HTMLDivElement, LogoProps>(({
  to = '/',
  size = 'md',
  showText = true,
  showSubtitle = false,
  className,
  variant = 'default',
}, ref) => {
  const content = (
    <div ref={ref} className={cn('flex items-center gap-2 sm:gap-3 group', className)}>
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <img
          src={logo}
          alt="Z Agro Tech logo"
          width={44}
          height={44}
          fetchPriority="high"
          decoding="async"
          className={cn(
            'relative rounded-xl object-contain bg-white shadow-soft transition-all duration-300',
            'border-2 border-primary/20 group-hover:border-primary/40 group-hover:scale-105',
            sizeClasses[size],
            variant === 'footer' && 'rounded-full',
          )}
        />
      </div>
      {showText && (
        <div className={cn(variant === 'footer' && 'text-card')}>
          <h1 className={cn(
            'font-display font-bold leading-tight tracking-tight',
            textSizeClasses[size],
            variant === 'default' && 'text-foreground',
            variant === 'footer' && 'text-card',
            variant === 'admin' && 'bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent',
          )}>
            Z Agro Tech
          </h1>
          {showSubtitle && (
            <p className={cn(
              'text-xs',
              variant === 'footer' ? 'text-card/70' : 'text-muted-foreground',
            )}>
              Cultivating Innovation
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return <Link to={to} aria-label="Z Agro Tech — Go to homepage">{content}</Link>;
  }

  return content;
});

Logo.displayName = 'Logo';

export default Logo;
