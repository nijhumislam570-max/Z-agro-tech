import { ReactNode, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

export const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return stored === 'true';
  });
  const { isAdmin } = useAdmin();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  // Fetch pending counts for badges (no polling — realtime handles updates)
  const { data: pendingCounts } = useQuery({
    queryKey: ['admin-pending-counts'],
    queryFn: async () => {
      const [
        { count: pendingOrders },
        { count: pendingVerifications },
        { count: pendingDoctors },
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      ]);

      return {
        pendingOrders: pendingOrders || 0,
        pendingVerifications: pendingVerifications || 0,
        pendingDoctors: pendingDoctors || 0,
      };
    },
    enabled: isAdmin,
  });

  const toggleSidebar = () => setCollapsed(prev => !prev);

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20">
      {/* Fixed Sidebar - Desktop Only */}
      <AdminSidebar 
        collapsed={collapsed} 
        onToggle={toggleSidebar}
        pendingOrders={pendingCounts?.pendingOrders}
        pendingVerifications={pendingCounts?.pendingVerifications}
        pendingDoctors={pendingCounts?.pendingDoctors}
      />
      
      {/* Main Content Area - Offset by sidebar width on desktop */}
      <div className={cn(
        "min-h-screen flex flex-col transition-[margin] duration-300 ease-in-out",
        collapsed ? "md:ml-[72px]" : "md:ml-[260px]"
      )}>
        <AdminHeader 
          title={title} 
          subtitle={subtitle} 
          onToggleSidebar={toggleSidebar} 
          collapsed={collapsed}
          pendingOrders={pendingCounts?.pendingOrders}
          pendingVerifications={pendingCounts?.pendingVerifications}
          pendingDoctors={pendingCounts?.pendingDoctors}
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
