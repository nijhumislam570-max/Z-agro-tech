import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'light' | 'strong';
}

/**
 * Glassmorphism preset built on top of shadcn Card.
 * Use over a vibrant gradient background (e.g. .bg-agri-gradient).
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, tone = 'light', children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          'rounded-2xl text-white border-white/20 shadow-xl',
          'transition-all duration-300 hover:border-white/40 hover:shadow-2xl',
          tone === 'light'
            ? 'backdrop-blur-md bg-white/10'
            : 'backdrop-blur-xl bg-white/20',
          className,
        )}
        {...props}
      >
        {children}
      </Card>
    );
  },
);
GlassCard.displayName = 'GlassCard';
