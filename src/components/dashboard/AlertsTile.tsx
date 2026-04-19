import { memo } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from './GlassCard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  warning: 'bg-warning/20 text-white border-warning/40',
  info: 'bg-info/20 text-white border-info/40',
  success: 'bg-success/20 text-white border-success/40',
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
    <GlassCard className="col-span-1 lg:col-span-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <div className="rounded-xl bg-white/10 border border-dashed border-white/30 p-5 text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-success/30 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm text-white/90 font-medium">All caught up ✨</p>
            <p className="text-xs text-white/70">No alerts right now.</p>
          </div>
        ) : (
          alerts.map((a, idx) => (
            <Link
              key={idx}
              to={a.to}
              className={`flex items-start gap-3 rounded-xl border ${toneClasses[a.tone]} px-3 py-2.5 hover:brightness-110 transition-all`}
            >
              <a.icon className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="text-xs leading-snug font-medium line-clamp-2">{a.text}</span>
            </Link>
          ))
        )}
      </CardContent>
    </GlassCard>
  );
});
