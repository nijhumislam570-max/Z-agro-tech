import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ShoppingBag, ChevronRight, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useMyOrders } from '@/hooks/useMyOrders';
import { statusBadgeClass } from '@/lib/statusColors';

interface OrderItemSummary {
  image?: string;
  name?: string;
}

const isItemArray = (value: unknown): value is OrderItemSummary[] => Array.isArray(value);

export const OrdersTab = () => {
  const { data: orders, isLoading } = useMyOrders();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="When you place orders, they'll appear here for tracking."
        action={
          <Link to="/shop">
            <Button className="gap-2">
              <ShoppingBag className="h-4 w-4" /> Browse the shop
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const items = isItemArray(order.items) ? order.items : [];
        const firstItem = items[0];
        const thumb = firstItem?.image;
        return (
          <Link
            key={order.id}
            to={`/track-order?id=${order.id}`}
            aria-label={`Track order ${order.id.slice(0, 8)}`}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
          >
            <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-hover hover:border-primary/40 cursor-pointer">
              <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {thumb ? (
                    <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/60">
                      <img
                        src={thumb}
                        alt={firstItem?.name ?? 'Order item'}
                        loading="lazy"
                        decoding="async"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">
                        Order <span className="font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
                      </p>
                      <Badge variant="outline" className={`${statusBadgeClass(order.status)} capitalize`}>
                        {order.status ?? 'pending'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleDateString()} · {items.length} {items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 sm:text-right">
                    <p className="font-bold text-primary">৳{order.total_amount}</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                </div>
                {(order.status === 'rejected' || order.status === 'cancelled') && order.rejection_reason && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-destructive">Reason</p>
                      <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">{order.rejection_reason}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default OrdersTab;
