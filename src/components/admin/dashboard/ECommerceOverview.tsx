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
        icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />}
        description={stats?.cancelledRevenue ? `৳${stats.cancelledRevenue.toLocaleString()} cancelled` : undefined}
        href="/admin/analytics"
        className="bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-100 dark:from-emerald-950/30 dark:to-green-950/20 dark:border-emerald-900/50"
      />
      <StatCard
        title="Total Orders"
        value={stats?.totalOrders || 0}
        icon={<Truck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />}
        description={`${stats?.activeOrders || 0} active · ${stats?.cancelledOrders || 0} cancelled`}
        href="/admin/orders"
        className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100 dark:from-blue-950/30 dark:to-indigo-950/20 dark:border-blue-900/50"
      />
      <StatCard
        title="Products"
        value={stats?.totalProducts || 0}
        icon={<Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />}
        href="/admin/products"
        className="bg-gradient-to-br from-purple-50 to-violet-50/50 border-purple-100 dark:from-purple-950/30 dark:to-violet-950/20 dark:border-purple-900/50"
      />
      <StatCard
        title="Pending"
        value={stats?.pendingOrders || 0}
        icon={<CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />}
        href="/admin/orders?status=pending"
        className="bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-900/50"
      />
    </div>
  </div>
));

ECommerceOverview.displayName = 'ECommerceOverview';
