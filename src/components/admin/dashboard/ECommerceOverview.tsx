import { memo } from 'react';
import { Package, Truck, CalendarClock, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';

interface ECommerceOverviewProps {
  stats: {
    activeRevenue?: number;
    cancelledRevenue?: number;
    totalOrders?: number;
    activeOrders?: number;
    cancelledOrders?: number;
    totalProducts?: number;
    pendingOrders?: number;
  } | undefined;
}

export const ECommerceOverview = memo(({ stats }: ECommerceOverviewProps) => (
  <div className="mb-4 sm:mb-6">
    <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">
      E-Commerce Overview
    </h2>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 min-h-[88px] sm:min-h-[100px] lg:min-h-[112px]">
      <StatCard
        title="Active Revenue"
        value={`৳${stats?.activeRevenue?.toLocaleString() || 0}`}
        icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-success" />}
        description={stats?.cancelledRevenue ? `৳${stats.cancelledRevenue.toLocaleString()} cancelled` : undefined}
        href="/admin/analytics"
        className="bg-gradient-to-br from-success-soft to-success-soft/50 border-success-border dark:from-success-soft/30 dark:to-success-soft/20 dark:border-success-border/50"
      />
      <StatCard
        title="Total Orders"
        value={stats?.totalOrders || 0}
        icon={<Truck className="h-4 w-4 sm:h-5 sm:w-5 text-info" />}
        description={`${stats?.activeOrders || 0} active · ${stats?.cancelledOrders || 0} cancelled`}
        href="/admin/orders"
        className="bg-gradient-to-br from-info-soft to-info-soft/50 border-info-border dark:from-info-soft/30 dark:to-info-soft/20 dark:border-info-border/50"
      />
      <StatCard
        title="Products"
        value={stats?.totalProducts || 0}
        icon={<Package className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />}
        href="/admin/products"
        className="bg-gradient-to-br from-accent/10 to-accent/10/50 border-accent/30 dark:from-accent/10/30 dark:to-accent/10/20 dark:border-accent/30/50"
      />
      <StatCard
        title="Pending"
        value={stats?.pendingOrders || 0}
        icon={<CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 text-warning-foreground" />}
        href="/admin/orders?status=pending"
        className="bg-gradient-to-br from-warning-soft to-warning-soft/50 border-warning-border dark:from-warning-soft/30 dark:to-warning-soft/20 dark:border-warning-border/50"
      />
    </div>
  </div>
));

ECommerceOverview.displayName = 'ECommerceOverview';
