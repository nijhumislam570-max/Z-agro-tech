import { ReactNode, Suspense, useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminPageSkeleton } from './AdminPageSkeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useAdminRealtimeDashboard } from '@/hooks/useAdminRealtimeDashboard';
import { warmAllAdminChunks } from '@/lib/adminPrefetch';

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

interface AdminPageMeta {
  title: string;
  subtitle?: string;
}

interface AdminPageMetaContextValue {
  meta: AdminPageMeta;
  setMeta: (meta: AdminPageMeta) => void;
}

const AdminPageMetaContext = createContext<AdminPageMetaContextValue | null>(null);

/**
 * Set the admin page header (title + optional subtitle) from any page
 * rendered inside the shared AdminLayout shell.
 *
 * Replaces the legacy `<AdminLayout title=... subtitle=...>` wrapper.
 */
export const useAdminPageMeta = (title: string, subtitle?: string) => {
  const ctx = useContext(AdminPageMetaContext);
  useEffect(() => {
    ctx?.setMeta({ title, subtitle });
  }, [ctx, title, subtitle]);
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
  useAdminPageMeta(title, subtitle);
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
  const [meta, setMeta] = useState<AdminPageMeta>({ title: 'Admin' });
  const { isAdmin } = useAdmin();
  const location = useLocation();

  // Centralized admin realtime — mounted once for the whole /admin tree.
  // Page-level useAdminRealtimeDashboard() calls have been removed.
  useAdminRealtimeDashboard(isAdmin);

  // Eagerly warm every admin chunk during browser idle once we know the
  // user is an admin. Makes every sidebar click an instant cache hit.
  useEffect(() => {
    if (isAdmin) warmAllAdminChunks();
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

  const ctxValue = useMemo<AdminPageMetaContextValue>(
    () => ({ meta, setMeta }),
    [meta]
  );

  return (
    <AdminPageMetaContext.Provider value={ctxValue}>
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
    </AdminPageMetaContext.Provider>
  );
};
