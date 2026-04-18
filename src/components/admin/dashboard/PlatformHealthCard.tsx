import { memo, forwardRef } from 'react';
import { Star, MessageSquare, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PlatformHealthCardProps {
  stats: {
    totalClinics?: number;
    verifiedClinics?: number;
    totalOrders?: number;
    pendingOrders?: number;
    activeOrders?: number;
    cancelledOrders?: number;
    postsToday?: number;
    appointmentsToday?: number;
  } | undefined;
}

export const PlatformHealthCard = memo(forwardRef<HTMLDivElement, PlatformHealthCardProps>(({ stats }, ref) => {
  const clinicVerificationPct = stats?.totalClinics
    ? Math.round((stats.verifiedClinics || 0) / stats.totalClinics * 100)
    : 0;

  // Fulfillment = orders that are NOT pending and NOT cancelled/rejected, out of active (non-cancelled) orders
  const activeOrders = stats?.activeOrders || 0;
  const pendingOrders = stats?.pendingOrders || 0;
  const fulfilledOrders = activeOrders - pendingOrders;
  const orderFulfillmentPct = activeOrders > 0
    ? Math.round((fulfilledOrders / activeOrders) * 100)
    : 0;

  return (
    <Card ref={ref} className="shadow-sm border-border/50">
      <CardHeader className="p-3 sm:p-4 lg:p-5 pb-2 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
          Platform Health
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-5 pt-0 space-y-3 sm:space-y-4">
        <div>
          <div className="flex justify-between text-xs sm:text-sm mb-1 sm:mb-1.5">
            <span className="text-muted-foreground">Clinic Verification</span>
            <span className="font-medium">{clinicVerificationPct}%</span>
          </div>
          <Progress value={clinicVerificationPct} className="h-1.5 sm:h-2" />
        </div>

        <div>
          <div className="flex justify-between text-xs sm:text-sm mb-1 sm:mb-1.5">
            <span className="text-muted-foreground">Order Fulfillment</span>
            <span className="font-medium">{orderFulfillmentPct}%</span>
          </div>
          <Progress value={orderFulfillmentPct} className="h-1.5 sm:h-2" />
        </div>

        <div className="pt-2 sm:pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Today's Activity</span>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-1 text-[10px] sm:text-xs">
                <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-500" />
                {stats?.postsToday || 0}
              </span>
              <span className="flex items-center gap-1 text-[10px] sm:text-xs">
                <CalendarDays className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-rose-500" />
                {stats?.appointmentsToday || 0}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}));

PlatformHealthCard.displayName = 'PlatformHealthCard';
