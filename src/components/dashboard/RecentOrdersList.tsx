import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { useDashboardSummary } from '@/hooks/useDashboardData';
import { usePrefetch } from '@/hooks/usePrefetch';

function statusTone(status: string | null) {
  const s = (status ?? 'pending').toLowerCase();
  if (s === 'delivered' || s === 'completed')
    return 'bg-success-soft text-success-foreground border-success-border hover:bg-success-soft';
  if (s === 'cancelled' || s === 'rejected')
    return 'bg-danger-soft text-danger border-danger-border hover:bg-danger-soft';
  if (s === 'shipped' || s === 'processing')
    return 'bg-info-soft text-info border-info-border hover:bg-info-soft';
  return 'bg-warning-soft text-warning-foreground border-warning-border hover:bg-warning-soft';
}

export const RecentOrdersList = memo(function RecentOrdersList() {
  const { isLoading, recentOrders } = useDashboardSummary();
  const prefetchShop = usePrefetch('/shop');
  const prefetchTrack = usePrefetch('/track-order');

  return (
    <Card className="col-span-1 lg:col-span-8 h-full flex flex-col rounded-2xl border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Package className="h-4 w-4" />
          </span>
          Recent Orders
        </CardTitle>
        {recentOrders.length > 0 && (
          <Button asChild variant="ghost" size="sm" className="text-primary hover:bg-primary/10 hover:text-primary">
            <Link to="/dashboard?tab=orders">View all</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2.5 flex-1">
        {isLoading ? (
          <>
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </>
        ) : recentOrders.length === 0 ? (
          <div className="rounded-xl bg-secondary/40 border border-dashed border-border p-6 text-center space-y-3">
            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              No orders yet. Discover premium agri-inputs for your farm.
            </p>
            <Button asChild size="sm">
              <Link to="/shop" {...prefetchShop}>Browse the shop</Link>
            </Button>
          </div>
        ) : (
          recentOrders.map((order) => {
            const items = (order.items as Array<{ name?: string; quantity?: number }> | undefined) ?? [];
            const date = order.created_at ? new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';
            return (
              <Link
                key={order.id}
                to={`/track-order?id=${order.id}`}
                {...prefetchTrack}
                className="block rounded-xl bg-secondary/40 hover:bg-secondary/70 border border-border/60 hover:border-border p-3.5 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`${statusTone(order.status)} capitalize text-[10px]`}>
                        {order.status ?? 'pending'}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        #{order.id?.slice(0, 8).toUpperCase()}
                      </span>
                      {date && <span className="text-[11px] text-muted-foreground">· {date}</span>}
                    </div>
                    <p className="text-xs text-foreground/80 line-clamp-1">
                      {items.length > 0
                        ? items.map((i) => `${i.name ?? 'Item'} ×${i.quantity ?? 1}`).join(' · ')
                        : 'Order details'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-bold text-foreground">
                      ৳{Number(order.total_amount ?? 0).toFixed(0)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
});
