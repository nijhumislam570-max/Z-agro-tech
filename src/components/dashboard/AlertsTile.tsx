import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertCircle, PackageOpen, Sparkles, CheckCircle2, type LucideIcon } from 'lucide-react';
import { useDashboardSummary, useFeaturedMasterclass } from '@/hooks/useDashboardData';
import { useWishlistProducts } from '@/hooks/useWishlistProducts';

interface AlertItem {
  icon: LucideIcon;
  text: string;
  to: string;
  tone: 'warning' | 'info' | 'success';
}

const toneClasses: Record<AlertItem['tone'], string> = {
  warning: 'bg-warning-soft text-warning-foreground border-warning-border hover:bg-warning-light',
  info: 'bg-info-soft text-info border-info-border hover:bg-info-light',
  success: 'bg-success-soft text-success-foreground border-success-border hover:bg-success-light',
};

const iconToneClasses: Record<AlertItem['tone'], string> = {
  warning: 'text-warning',
  info: 'text-info',
  success: 'text-success',
};

export const AlertsTile = memo(function AlertsTile() {
  const { pendingOrders } = useDashboardSummary();
  const { products: wishlistProducts } = useWishlistProducts();
  const { data: featuredMasterclass } = useFeaturedMasterclass();

  const lowStockCount = wishlistProducts.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 5).length;

  const alerts: AlertItem[] = [];
  if (pendingOrders > 0) {
    alerts.push({
      icon: AlertCircle,
      text: `${pendingOrders} order${pendingOrders === 1 ? '' : 's'} awaiting confirmation`,
      to: '/dashboard?tab=orders',
      tone: 'warning',
    });
  }
  if (lowStockCount > 0) {
    alerts.push({
      icon: PackageOpen,
      text: `Low stock on ${lowStockCount} saved item${lowStockCount === 1 ? '' : 's'}`,
      to: '/dashboard?tab=wishlist',
      tone: 'warning',
    });
  }
  if (featuredMasterclass) {
    alerts.push({
      icon: Sparkles,
      text: `New masterclass: ${featuredMasterclass.title}`,
      to: `/course/${featuredMasterclass.id}`,
      tone: 'info',
    });
  }

  return (
    <Card className="h-full flex flex-col rounded-2xl border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bell className="h-4 w-4" />
          </span>
          Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 flex-1">
        {alerts.length === 0 ? (
          <div className="rounded-xl bg-success-soft border border-dashed border-success-border p-5 text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-success/15 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <p className="text-sm text-foreground font-medium">All caught up ✨</p>
            <p className="text-xs text-muted-foreground">No alerts right now.</p>
          </div>
        ) : (
          alerts.map((a, idx) => (
            <Link
              key={idx}
              to={a.to}
              className={`flex items-start gap-3 rounded-xl border ${toneClasses[a.tone]} px-3 py-2.5 transition-colors`}
            >
              <a.icon className={`h-4 w-4 mt-0.5 shrink-0 ${iconToneClasses[a.tone]}`} />
              <span className="text-xs leading-snug font-medium line-clamp-2">{a.text}</span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
});
