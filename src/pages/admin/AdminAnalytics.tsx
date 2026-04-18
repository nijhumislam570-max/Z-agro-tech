import { useState, useCallback, lazy, Suspense } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  RefreshCw,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AnalyticsStatCard } from '@/components/admin/AnalyticsStatCard';
import { AnalyticsDateFilter } from '@/components/admin/AnalyticsDateFilter';
import { AnalyticsExport } from '@/components/admin/AnalyticsExport';
import { AnalyticsPageSkeleton, ChartSkeleton } from '@/components/admin/AnalyticsSkeleton';
import { LowStockAlert } from '@/components/admin/LowStockAlert';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { useAdminAnalytics, type DateRangePreset } from '@/hooks/useAdminAnalytics';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminRealtimeDashboard } from '@/hooks/useAdminRealtimeDashboard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { format } from 'date-fns';

// Lazy-load Recharts-heavy component so stat cards render immediately
const AnalyticsCharts = lazy(() =>
  import('@/components/admin/analytics/AnalyticsCharts').then(m => ({ default: m.AnalyticsCharts }))
);

const formatCurrency = (value: number) => `৳${value.toLocaleString()}`;

const ChartsFallback = () => (
  <div className="space-y-4 sm:space-y-6">
    <ChartSkeleton height="h-[200px] sm:h-[280px] lg:h-[320px]" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <ChartSkeleton height="h-[180px]" />
      <ChartSkeleton height="h-[180px]" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <ChartSkeleton height="h-[200px]" />
      <ChartSkeleton height="h-[200px]" />
    </div>
  </div>
);

const AdminAnalytics = () => {
  useDocumentTitle('Analytics - Admin');
  const { isAdmin } = useAdmin();
  useAdminRealtimeDashboard(isAdmin);
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRangePreset>('all');
  const { data: analytics, isLoading: analyticsLoading, dataUpdatedAt } = useAdminAnalytics(dateRange);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
  }, [queryClient]);

  const lastUpdatedText = dataUpdatedAt
    ? `Updated ${format(new Date(dataUpdatedAt), 'h:mm a')}`
    : '';

  return (
    <ErrorBoundary>
    <AdminLayout title="Analytics" subtitle="Track your business performance">
      {/* Header Controls: Date Filter + Export + Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <AnalyticsDateFilter value={dateRange} onChange={setDateRange} />
        <div className="flex items-center gap-2 sm:gap-3">
          {lastUpdatedText && (
            <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
              {lastUpdatedText}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 sm:h-9 gap-1.5 text-xs sm:text-sm"
            disabled={analyticsLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <AnalyticsExport analytics={analytics} />
        </div>
      </div>

      {analyticsLoading ? (
        <AnalyticsPageSkeleton />
      ) : (
        <>
          {/* Low Stock Alerts */}
          {analytics && analytics.lowStockProducts.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <LowStockAlert products={analytics.lowStockProducts} />
            </div>
          )}

          {/* Key Revenue Metrics — render immediately, no Recharts dependency */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
              <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Revenue & Sales
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              <AnalyticsStatCard
                title="Active Revenue"
                value={formatCurrency(analytics?.totalRevenue || 0)}
                icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />}
                trend={analytics?.revenueGrowth !== 0 ? { value: analytics?.revenueGrowth || 0, label: 'vs last month' } : undefined}
                subtitle={analytics?.cancelledRevenue ? `৳${analytics.cancelledRevenue.toLocaleString()} cancelled` : 'Excl. cancelled/rejected'}
                iconClassName="bg-emerald-100 dark:bg-emerald-900/30"
                className="bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-100 dark:from-emerald-950/30 dark:to-green-950/20 dark:border-emerald-900/50"
                href="/admin/orders"
              />
              <AnalyticsStatCard
                title="Total Orders"
                value={analytics?.totalOrders || 0}
                icon={<ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />}
                trend={analytics?.orderGrowth !== 0 ? { value: analytics?.orderGrowth || 0, label: 'vs last month' } : undefined}
                subtitle={`${analytics?.activeOrders || 0} active · ${analytics?.cancelledOrders || 0} cancelled`}
                iconClassName="bg-blue-100 dark:bg-blue-900/30"
                className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100 dark:from-blue-950/30 dark:to-indigo-950/20 dark:border-blue-900/50"
                href="/admin/orders"
              />
              <AnalyticsStatCard
                title="Avg. Order Value"
                value={formatCurrency(Math.round(analytics?.averageOrderValue || 0))}
                icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />}
                subtitle="Active orders avg."
                iconClassName="bg-purple-100 dark:bg-purple-900/30"
                className="bg-gradient-to-br from-purple-50 to-violet-50/50 border-purple-100 dark:from-purple-950/30 dark:to-violet-950/20 dark:border-purple-900/50"
                href="/admin/orders"
              />
              <AnalyticsStatCard
                title="New Users"
                value={analytics?.newUsersThisMonth || 0}
                icon={<Users className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />}
                trend={analytics?.userGrowth !== 0 ? { value: analytics?.userGrowth || 0, label: 'this month' } : undefined}
                subtitle={`${analytics?.totalUsers || 0} total users`}
                iconClassName="bg-orange-100 dark:bg-orange-900/30"
                className="bg-gradient-to-br from-orange-50 to-amber-50/50 border-orange-100 dark:from-orange-950/30 dark:to-amber-950/20 dark:border-orange-900/50"
                href="/admin/customers"
              />
            </div>
          </div>

          {/* Lazy-loaded Charts — Recharts loaded via Suspense */}
          {analytics && (
            <Suspense fallback={<ChartsFallback />}>
              <AnalyticsCharts analytics={analytics} dateRange={dateRange} />
            </Suspense>
          )}

          {/* Platform Stats — render immediately */}
          <div className="mb-4 sm:mb-6 mt-4 sm:mt-6">
            <h2 className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Platform Overview
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              <AnalyticsStatCard
                title="Total Users"
                value={analytics?.totalUsers || 0}
                icon={<Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />}
                subtitle={`${analytics?.newUsersThisMonth || 0} new this month`}
                iconClassName="bg-blue-100 dark:bg-blue-900/30"
                href="/admin/customers"
              />
              <AnalyticsStatCard
                title="Products"
                value={analytics?.totalProducts || 0}
                icon={<Package className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />}
                subtitle="Listed products"
                iconClassName="bg-indigo-100 dark:bg-indigo-900/30"
                href="/admin/products"
              />
              <AnalyticsStatCard
                title="Messages"
                value={analytics?.unreadMessages || 0}
                icon={<Mail className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />}
                subtitle="Unread contacts"
                iconClassName="bg-pink-100 dark:bg-pink-900/30"
                href="/admin/messages"
              />
              <AnalyticsStatCard
                title="Pending Orders"
                value={analytics?.pendingOrders || 0}
                icon={<ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />}
                subtitle="Awaiting action"
                iconClassName="bg-amber-100 dark:bg-amber-900/30"
                href="/admin/orders?status=pending"
              />
            </div>
          </div>
        </>
      )}
    </AdminLayout>
    </ErrorBoundary>
  );
};

export default AdminAnalytics;
