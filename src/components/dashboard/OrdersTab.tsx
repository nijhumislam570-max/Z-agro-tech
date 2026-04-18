import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ShoppingBag, ChevronRight, AlertCircle } from 'lucide-react';
import { useMyOrders } from '@/hooks/useMyOrders';

const statusVariants: Record<string, string> = {
  pending: 'bg-warning/15 text-warning-foreground border-warning/30',
  accepted: 'bg-primary/15 text-primary border-primary/30',
  shipped: 'bg-accent/15 text-accent border-accent/30',
  delivered: 'bg-success/15 text-success border-success/30',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
  rejected: 'bg-destructive/10 text-destructive border-destructive/30',
};

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
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">No orders yet</h3>
            <p className="text-sm text-muted-foreground mt-1">When you order products, they'll appear here.</p>
          </div>
          <Link to="/shop">
            <Button className="gap-2"><ShoppingBag className="h-4 w-4" /> Browse shop</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          to={`/track-order?id=${order.id}`}
          aria-label={`Track order ${order.id.slice(0, 8)}`}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        >
          <Card className="overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-hover hover:border-primary/40 cursor-pointer">
            <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                {(() => {
                  const firstItem = Array.isArray(order.items) ? (order.items[0] as { image?: string; name?: string } | undefined) : undefined;
                  const thumb = firstItem?.image;
                  return thumb ? (
                    <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/60">
                      <img
                        src={thumb}
                        alt={firstItem?.name ?? 'Order item'}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">Order #{order.id.slice(0, 8)}</p>
                    <Badge variant="outline" className={statusVariants[order.status] ?? ''}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(order.created_at).toLocaleDateString()} · {Array.isArray(order.items) ? order.items.length : 0} items
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
      ))}
    </div>
  );
};

export default OrdersTab;
