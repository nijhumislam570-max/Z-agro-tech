import { ReactNode, Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminPageSkeleton } from './AdminPageSkeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useAdminRealtimeDashboard } from '@/hooks/useAdminRealtimeDashboard';
import { warmRouteGroup } from '@/lib/routeWarmup';

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

interface AdminPageMeta {
  title: string;
  subtitle?: string;
}

const ADMIN_PAGE_META: Record<string, AdminPageMeta> = {
  '/admin': {
    title: 'Dashboard',
    subtitle: "Welcome back! Here's your platform overview.",
  },
  '/admin/analytics': {
    title: 'Analytics',
    subtitle: 'Track your business performance',
  },
  '/admin/products': {
    title: 'Products',
    subtitle: 'Manage your product catalog',
  },
  '/admin/orders': {
    title: 'Orders',
    subtitle: 'Manage customer orders',
  },
  '/admin/ecommerce-customers': {
    title: 'E-Commerce Customers',
    subtitle: 'Payments, buyers & revenue overview',
  },
  '/admin/coupons': {
    title: 'Coupons',
    subtitle: 'Create and manage discount coupons',
  },
  '/admin/delivery-zones': {
    title: 'Delivery Zones',
    subtitle: 'Manage shipping availability and pricing',
  },
  '/admin/incomplete-orders': {
    title: 'Incomplete Orders',
    subtitle: 'Recover abandoned carts and unfinished checkouts',
  },
  '/admin/recovery-analytics': {
    title: 'Recovery Analytics',
    subtitle: 'Monitor recovery funnels and conversion lift',
  },
  '/admin/courses': {
    title: 'Courses',
    subtitle: 'Manage academy content and batches',
  },
  '/admin/enrollments': {
    title: 'Enrollments',
    subtitle: 'Manage course enrollments and student progress',
  },
  '/admin/customers': {
    title: 'User Management',
    subtitle: 'Manage platform users, roles & permissions',
  },
  '/admin/messages': {
    title: 'Contact Messages',
    subtitle: 'Review customer questions and inbox activity',
  },
  '/admin/settings': {
    title: 'Settings',
    subtitle: 'Configure your platform settings',
  },
};

/**
 * Backwards-compatible page wrapper. Pages still write
 *   <AdminLayout title="X" subtitle="Y">...</AdminLayout>
 * but it now just registers the page meta against the persistent
 * shell (rendered once at the route level) and renders children.
 *
 * No DOM, no remount cost.
 */
interface AdminLayoutCompatProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const AdminLayout = ({ title, subtitle, children }: AdminLayoutCompatProps) => {
  void title;
  void subtitle;
  return <>{children}</>;
};

/**
 * Persistent admin shell — sidebar, header, pending-count query.
 * Mounted ONCE for the `/admin` route tree; each child page renders
 * via <Outlet /> without remounting the shell.
 */
export const AdminShell = () => {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return stored === 'true';
  });
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const meta = useMemo(
    () => ADMIN_PAGE_META[location.pathname] ?? { title: 'Admin' },
    [location.pathname]
  );

  // Centralized admin realtime — mounted once for the whole /admin tree.
  // Page-level useAdminRealtimeDashboard() calls have been removed.
  useAdminRealtimeDashboard(isAdmin);

  // Eagerly warm every admin chunk during browser idle once we know the
  // user is an admin. Makes every sidebar click an instant cache hit.
  useEffect(() => {
    if (!isAdmin) return;

    warmRouteGroup('admin-shell-core', Object.keys(ADMIN_PAGE_META));
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  // Fetch pending counts for badges (no polling — realtime handles updates)
  const { data: pendingCounts } = useQuery({
    queryKey: ['admin-pending-counts'],
    queryFn: async () => {
      const [
        { count: pendingOrders },
        { count: incompleteOrders },
        { count: unreadMessages },
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending').is('trashed_at', null),
        supabase.from('incomplete_orders').select('*', { count: 'exact', head: true }).eq('status', 'incomplete').is('trashed_at', null),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'unread'),
      ]);

      return {
        pendingOrders: pendingOrders || 0,
        incompleteOrders: incompleteOrders || 0,
        unreadMessages: unreadMessages || 0,
      };
    },
    enabled: isAdmin,
  });

  const toggleSidebar = useCallback(() => setCollapsed(prev => !prev), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
        pendingOrders={pendingCounts?.pendingOrders}
        incompleteOrders={pendingCounts?.incompleteOrders}
        unreadMessages={pendingCounts?.unreadMessages}
      />

      <div className={cn(
        "min-h-screen flex flex-col transition-[margin] duration-300 ease-in-out",
        collapsed ? "md:ml-[72px]" : "md:ml-[260px]"
      )}>
        <AdminHeader
          title={meta.title}
          subtitle={meta.subtitle}
          onToggleSidebar={toggleSidebar}
          collapsed={collapsed}
          pendingOrders={pendingCounts?.pendingOrders}
          incompleteOrders={pendingCounts?.incompleteOrders}
          unreadMessages={pendingCounts?.unreadMessages}
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
          <div className="animate-page-enter" key={location.pathname}>
            <Suspense fallback={<AdminPageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};
