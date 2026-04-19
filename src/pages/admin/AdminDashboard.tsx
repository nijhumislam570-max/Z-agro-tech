import { useEffect, useMemo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStats } from '@/hooks/useAdmin';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// Admin realtime is centralized in AdminShell — no per-page subscription needed.
import { ECommerceOverview } from '@/components/admin/dashboard/ECommerceOverview';
import { AcademyOverview } from '@/components/admin/dashboard/AcademyOverview';
import { RecentOrdersList } from '@/components/admin/dashboard/RecentOrdersList';
import { QuickActionsCard } from '@/components/admin/dashboard/QuickActionsCard';
import { PlatformHealthCard } from '@/components/admin/dashboard/PlatformHealthCard';

const AdminDashboard = () => {
  useDocumentTitle('Dashboard - Admin');
  const { data: stats, isLoading: statsLoading, isError, error, refetch } = useAdminStats();

  // Enforce noindex on admin pages (defence-in-depth alongside robots.txt)
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  // Memoize tiles to prevent re-renders from sidebar toggle / realtime invalidations
  const ecommerceTile = useMemo(() => <ECommerceOverview stats={stats} />, [stats]);
  const academyTile = useMemo(() => <AcademyOverview stats={stats} />, [stats]);
  const recentOrdersTile = useMemo(
    () => <RecentOrdersList orders={stats?.recentOrders} isLoading={statsLoading} />,
    [stats?.recentOrders, statsLoading]
  );
  const quickActionsTile = useMemo(() => <QuickActionsCard stats={stats} />, [stats]);
  const healthTile = useMemo(() => <PlatformHealthCard stats={stats} />, [stats]);

  if (isError) {
    return (
      <AdminLayout title="Dashboard" subtitle="Welcome back! Here's your platform overview.">
        <Card className="border-danger-border bg-danger-soft/30">
          <CardContent className="p-6 sm:p-8 text-center">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-danger" aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-semibold mb-1">
              Couldn't load dashboard
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Something went wrong fetching your stats.'}
            </p>
            <Button onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back! Here's your platform overview.">
      {ecommerceTile}
      {academyTile}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 min-h-[320px]">
        {recentOrdersTile}

        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {quickActionsTile}
          {healthTile}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
