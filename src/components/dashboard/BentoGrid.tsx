import * as React from 'react';
import { cn } from '@/lib/utils';

/** 12-column responsive grid that collapses to single column on mobile. */
export function BentoGrid({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5', className)}
      {...props}
    >
      {children}
    </div>
  );
}
