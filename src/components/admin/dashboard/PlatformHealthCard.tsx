import { memo, forwardRef } from 'react';
import { Activity, ShoppingCart, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PlatformHealthCardProps {
  stats: {
    totalOrders?: number;
    pendingOrders?: number;
    activeOrders?: number;
    cancelledOrders?: number;
    totalProducts?: number;
  } | undefined;
}

export const PlatformHealthCard = memo(
  forwardRef<HTMLDivElement, PlatformHealthCardProps>(({ stats }, ref) => {
    const activeOrders = stats?.activeOrders || 0;
    const pendingOrders = stats?.pendingOrders || 0;
    const fulfilledOrders = activeOrders - pendingOrders;
    const orderFulfillmentPct =
      activeOrders > 0 ? Math.round((fulfilledOrders / activeOrders) * 100) : 0;

    const totalOrders = stats?.totalOrders || 0;
    const cancelledOrders = stats?.cancelledOrders || 0;
    const successRate =
      totalOrders > 0 ? Math.round(((totalOrders - cancelledOrders) / totalOrders) * 100) : 0;

    return (
      <Card ref={ref} className="shadow-sm border-border/50">
        <CardHeader className="p-3 sm:p-4 lg:p-5 pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
            Store Health
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-5 pt-0 space-y-3 sm:space-y-4">
          <div>
            <div className="flex justify-between text-xs sm:text-sm mb-1 sm:mb-1.5">
              <span className="text-muted-foreground">Order Fulfillment</span>
              <span className="font-medium">{orderFulfillmentPct}%</span>
            </div>
            <Progress value={orderFulfillmentPct} className="h-1.5 sm:h-2" />
          </div>

          <div>
            <div className="flex justify-between text-xs sm:text-sm mb-1 sm:mb-1.5">
              <span className="text-muted-foreground">Order Success Rate</span>
              <span className="font-medium">{successRate}%</span>
            </div>
            <Progress value={successRate} className="h-1.5 sm:h-2" />
          </div>

          <div className="pt-2 sm:pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Catalog</span>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="flex items-center gap-1 text-[10px] sm:text-xs">
                  <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                  {stats?.totalProducts || 0} products
                </span>
                <span className="flex items-center gap-1 text-[10px] sm:text-xs">
                  <ShoppingCart className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500" />
                  {pendingOrders} pending
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }),
);

PlatformHealthCard.displayName = 'PlatformHealthCard';
