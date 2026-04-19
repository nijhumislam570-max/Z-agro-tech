import { memo } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from './GlassCard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { useDashboardSummary } from '@/hooks/useDashboardData';
import { usePrefetch } from '@/hooks/usePrefetch';

function statusTone(status: string | null) {
  const s = (status ?? 'pending').toLowerCase();
  if (s === 'delivered' || s === 'completed') return 'bg-success/90 text-white hover:bg-success/90 border-transparent';
  if (s === 'cancelled' || s === 'rejected') return 'bg-danger/90 text-white hover:bg-danger/90 border-transparent';
  if (s === 'shipped' || s === 'processing') return 'bg-info/90 text-white hover:bg-info/90 border-transparent';
  return 'bg-warning/90 text-white hover:bg-warning/90 border-transparent';
}

export const RecentOrdersList = memo(function RecentOrdersList() {
  const { isLoading, recentOrders } = useDashboardSummary();
  const prefetchShop = usePrefetch('/shop');
  const prefetchTrack = usePrefetch('/track-order');

  return (
    <GlassCard className="col-span-1 lg:col-span-8">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <Package className="h-4 w-4" />
          Recent Orders
        </CardTitle>
        {recentOrders.length > 0 && (
          <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/15 hover:text-white">
            <Link to="/dashboard?tab=orders">View all</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2.5">
        {isLoading ? (
          <>
            <Skeleton className="h-20 rounded-xl bg-white/20" />
            <Skeleton className="h-20 rounded-xl bg-white/20" />
            <Skeleton className="h-20 rounded-xl bg-white/20" />
          </>
        ) : recentOrders.length === 0 ? (
          <div className="rounded-xl bg-white/10 border border-dashed border-white/30 p-6 text-center space-y-3">
            <div className="mx-auto w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm text-white/85">
              No orders yet. Discover premium agri-inputs for your farm.
            </p>
            <Button asChild variant="secondary" size="sm">
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
                className="block rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 hover:border-white/30 p-3.5 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${statusTone(order.status)} capitalize text-[10px]`}>
                        {order.status ?? 'pending'}
                      </Badge>
                      <span className="text-[11px] text-white/65 font-mono">
                        #{order.id?.slice(0, 8).toUpperCase()}
                      </span>
                      {date && <span className="text-[11px] text-white/65">· {date}</span>}
                    </div>
                    <p className="text-xs text-white/85 line-clamp-1">
                      {items.length > 0
                        ? items.map((i) => `${i.name ?? 'Item'} ×${i.quantity ?? 1}`).join(' · ')
                        : 'Order details'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-bold text-white">
                      ৳{Number(order.total_amount ?? 0).toFixed(0)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-white/70 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </GlassCard>
  );
});
