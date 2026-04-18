import { Link } from 'react-router-dom';
import { GlassCard } from '../GlassCard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ArrowRight } from 'lucide-react';
import { useMyOrders } from '@/hooks/useMyOrders';

export default function RecentOrderTile() {
  const { data, isLoading } = useMyOrders();
  const latest = data?.[0];
  const items = (latest?.items as Array<{ name?: string; quantity?: number }> | undefined) ?? [];

  return (
    <GlassCard className="col-span-1 lg:col-span-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <Package className="h-4 w-4" />
          Latest AgroShop order
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl bg-white/20" />
        ) : !latest ? (
          <div className="rounded-xl bg-white/10 border border-dashed border-white/30 p-6 text-center space-y-3">
            <p className="text-sm text-white/85">
              No orders yet. Discover premium agri-inputs for your farm.
            </p>
            <Button asChild variant="secondary" size="sm">
              <Link to="/shop">Shop AgroInputs</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-xl bg-white/10 border border-white/15 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-white/90 text-foreground capitalize hover:bg-white/90">
                  {latest.status ?? 'pending'}
                </Badge>
                <span className="text-xs text-white/70">
                  #{latest.id?.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-white/90 line-clamp-1">
                {items.length > 0
                  ? items.map((i) => `${i.name ?? 'Item'} ×${i.quantity ?? 1}`).join(' · ')
                  : 'Order details'}
              </p>
              <p className="text-lg font-bold text-white">
                ৳{Number(latest.total_amount ?? 0).toFixed(0)}
              </p>
            </div>
            <Button asChild variant="secondary" className="shrink-0">
              <Link to={`/track-order?id=${latest.id}`}>
                Track Order <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
}
