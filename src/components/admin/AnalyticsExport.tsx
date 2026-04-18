import { useState } from 'react';
import { Download, FileText, ShoppingCart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { downloadCSV } from '@/lib/csvParser';
import { toast } from 'sonner';
import type { AnalyticsData } from '@/hooks/useAdminAnalytics';

interface AnalyticsExportProps {
  analytics: AnalyticsData | undefined;
}

export const AnalyticsExport = ({ analytics }: AnalyticsExportProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportRevenueReport = () => {
    if (!analytics) return;
    setIsExporting(true);
    try {
      const headers = ['Date', 'Orders', 'Revenue (৳)'];
      const rows = analytics.dailyTrends.map(t => [t.date, t.orders.toString(), t.revenue.toString()]);
      
      const summary = [
        '',
        ['Summary'],
        ['Total Active Revenue', analytics.totalRevenue.toString()],
        ['Cancelled Revenue', analytics.cancelledRevenue.toString()],
        ['Average Order Value', Math.round(analytics.averageOrderValue).toString()],
        ['Total Orders', analytics.totalOrders.toString()],
        ['Active Orders', analytics.activeOrders.toString()],
        ['Cancelled Orders', analytics.cancelledOrders.toString()],
      ];

      const csv = [headers.join(','), ...rows.map(r => r.join(',')), ...summary.map(r => Array.isArray(r) ? r.join(',') : r)].join('\n');
      downloadCSV(csv, `revenue-report-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Revenue report exported');
    } catch {
      toast.error('Failed to export');
    } finally {
      setIsExporting(false);
    }
  };

  const exportOrderSummary = () => {
    if (!analytics) return;
    setIsExporting(true);
    try {
      const headers = ['Status', 'Count'];
      const rows = analytics.orderStatusDistribution.map(s => [s.name, s.value.toString()]);
      
      const categoryHeaders = ['', '', 'Category', 'Units Sold', 'Revenue (৳)'];
      const categoryRows = analytics.categorySales.map(c => ['', '', c.name, c.sales.toString(), c.revenue.toString()]);

      const csv = [headers.join(','), ...rows.map(r => r.join(',')), '', categoryHeaders.join(','), ...categoryRows.map(r => r.join(','))].join('\n');
      downloadCSV(csv, `order-summary-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Order summary exported');
    } catch {
      toast.error('Failed to export');
    } finally {
      setIsExporting(false);
    }
  };

  const exportPlatformData = () => {
    if (!analytics) return;
    setIsExporting(true);
    try {
      const rows = [
        ['Metric', 'Value'],
        ['Total Users', analytics.totalUsers.toString()],
        ['New Users This Month', analytics.newUsersThisMonth.toString()],
        ['Total Doctors', analytics.totalDoctors.toString()],
        ['Verified Doctors', analytics.verifiedDoctors.toString()],
        ['Total Clinics', analytics.clinicStats.total.toString()],
        ['Verified Clinics', analytics.clinicStats.verified.toString()],
        ['Pending Clinics', analytics.clinicStats.pending.toString()],
        ['Blocked Clinics', analytics.clinicStats.blocked.toString()],
        ['Total Appointments', analytics.appointmentStats.total.toString()],
        ['Completed Appointments', analytics.appointmentStats.completed.toString()],
        ['Total Products', analytics.totalProducts.toString()],
        ['Low Stock Products', analytics.lowStockProducts.length.toString()],
        ['Total Posts', analytics.totalPosts.toString()],
        ['Total Pets', analytics.totalPets.toString()],
        ['Unread Messages', analytics.unreadMessages.toString()],
      ];

      const csv = rows.map(r => r.join(',')).join('\n');
      downloadCSV(csv, `platform-data-${new Date().toISOString().split('T')[0]}.csv`);
      toast.success('Platform data exported');
    } catch {
      toast.error('Failed to export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 sm:h-9 gap-1.5 text-xs sm:text-sm" disabled={isExporting || !analytics}>
          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportRevenueReport} className="gap-2">
          <FileText className="h-4 w-4" />
          Revenue Report
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportOrderSummary} className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          Order Summary
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPlatformData} className="gap-2">
          <Users className="h-4 w-4" />
          Platform Data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
