import { useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdmin, useAdminStats } from '@/hooks/useAdmin';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAdminRealtimeDashboard } from '@/hooks/useAdminRealtimeDashboard';
import { ECommerceOverview } from '@/components/admin/dashboard/ECommerceOverview';
import { RecentOrdersList } from '@/components/admin/dashboard/RecentOrdersList';
import { QuickActionsCard } from '@/components/admin/dashboard/QuickActionsCard';
import { PlatformHealthCard } from '@/components/admin/dashboard/PlatformHealthCard';

const AdminDashboard = () => {
  useDocumentTitle('Dashboard - Admin');
  const { isAdmin } = useAdmin();
  const { data: stats, isLoading: statsLoading } = useAdminStats();

  useAdminRealtimeDashboard(isAdmin);

  // Memoize recent orders to prevent re-renders from sidebar toggle or quick actions
  const recentOrdersMemo = useMemo(
    () => <RecentOrdersList orders={stats?.recentOrders} isLoading={statsLoading} />,
    [stats?.recentOrders, statsLoading]
  );

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back! Here's your platform overview.">
      <ECommerceOverview stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 min-h-[320px]">
        {recentOrdersMemo}

        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          <QuickActionsCard stats={stats} />
          <PlatformHealthCard stats={stats} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
