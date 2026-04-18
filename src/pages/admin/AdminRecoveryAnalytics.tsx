import { useState, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useIncompleteOrders } from '@/hooks/useIncompleteOrders';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ShoppingCart, TrendingUp, DollarSign, Percent, Package } from 'lucide-react';
import { subDays, format, isAfter, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

// Lazy — recharts is ~95 KB gzipped; only load it for this page
const RecoveryCharts = lazy(() => import('@/components/admin/analytics/RecoveryCharts'));

const ChartsFallback = () => (
  <div className="space-y-5">
    <div className="grid lg:grid-cols-2 gap-5">
      <Skeleton className="h-[330px] rounded-xl" />
      <Skeleton className="h-[330px] rounded-xl" />
    </div>
    <Skeleton className="h-[280px] rounded-xl" />
  </div>
);

const RecoveryStatCard = ({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBg,
  bgClass,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconColor: string;
  iconBg: string;
  bgClass: string;
  onClick?: () => void;
}) => (
  <div
    className={cn(
      'rounded-xl sm:rounded-2xl p-3 sm:p-4 border shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]',
      bgClass,
    )}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onClick?.();
    }}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight mb-0.5 sm:mb-1">
          {label}
        </p>
        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{value}</p>
      </div>
      <div className={cn('h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
        <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', iconColor)} />
      </div>
    </div>
  </div>
);

const AdminRecoveryAnalytics = () => {
  useDocumentTitle('Recovery Analytics');
  const navigate = useNavigate();
  const { orders, isLoading, totalIncomplete, totalRecovered, recoveryRate, lostRevenue, recoveredRevenue } = useIncompleteOrders();
  const [dateRange, setDateRange] = useState('14');

  const filteredOrders = useMemo(() => {
    if (dateRange === 'all') return orders;
    const cutoff = subDays(new Date(), parseInt(dateRange));
    return orders.filter((o) => isAfter(new Date(o.created_at), cutoff));
  }, [orders, dateRange]);

  const dailyData = useMemo(() => {
    const days = dateRange === 'all' ? 30 : parseInt(dateRange);
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOrders = filteredOrders.filter((o) => format(new Date(o.created_at), 'yyyy-MM-dd') === dateStr);
      const total = dayOrders.length;
      const recovered = dayOrders.filter((o) => o.status === 'recovered').length;
      data.push({
        date: format(date, 'MMM dd'),
        total,
        recovered,
        rate: total > 0 ? Math.round((recovered / total) * 100) : 0,
      });
    }
    return data;
  }, [filteredOrders, dateRange]);

  const funnelData = useMemo(() => {
    const total = filteredOrders.length;
    const withPhone = filteredOrders.filter((o) => o.customer_phone).length;
    const withAddress = filteredOrders.filter((o) => o.shipping_address).length;
    const recovered = filteredOrders.filter((o) => o.status === 'recovered').length;
    return [
      { name: 'Checkout Started', value: total },
      { name: 'Phone Entered', value: withPhone },
      { name: 'Address Entered', value: withAddress },
      { name: 'Recovered', value: recovered },
    ];
  }, [filteredOrders]);

  const pieData = useMemo(() => {
    const recovered = filteredOrders.filter((o) => o.status === 'recovered').length;
    const incomplete = filteredOrders.filter((o) => o.status === 'incomplete').length;
    return [
      { name: 'Recovered', value: recovered },
      { name: 'Incomplete', value: incomplete },
    ];
  }, [filteredOrders]);

  const topRecovered = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'recovered')
      .sort((a, b) => (b.cart_total || 0) - (a.cart_total || 0))
      .slice(0, 5);
  }, [filteredOrders]);

  if (isLoading) {
    return (
      <AdminLayout title="Recovery Analytics">
        <div className="p-4 sm:p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Recovery Analytics">
      <div className="p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Recovery Analytics</h1>
            <p className="text-sm text-muted-foreground">Insights on abandoned checkout recovery</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <RecoveryStatCard icon={ShoppingCart} label="Total Incomplete" value={totalIncomplete} iconColor="text-warning-foreground" iconBg="bg-warning/10" bgClass="bg-gradient-to-br from-warning-soft to-warning-soft/50 border-warning-border dark:from-warning-soft/30 dark:to-warning-soft/20 dark:border-warning-border/50" onClick={() => navigate('/admin/incomplete-orders')} />
          <RecoveryStatCard icon={TrendingUp} label="Recovered" value={totalRecovered} iconColor="text-success" iconBg="bg-success/10" bgClass="bg-gradient-to-br from-success-soft to-success-soft/50 border-success-border dark:from-success-soft/30 dark:to-success-soft/20 dark:border-success-border/50" onClick={() => navigate('/admin/incomplete-orders')} />
          <RecoveryStatCard icon={Percent} label="Recovery Rate" value={`${recoveryRate}%`} iconColor="text-info" iconBg="bg-info/10" bgClass="bg-gradient-to-br from-info-soft to-info-soft/50 border-info-border dark:from-info-soft/30 dark:to-info-soft/20 dark:border-info-border/50" />
          <RecoveryStatCard icon={DollarSign} label="Recovered Revenue" value={`৳${recoveredRevenue.toLocaleString()}`} iconColor="text-success" iconBg="bg-success/10" bgClass="bg-gradient-to-br from-success-soft to-success-soft/50 border-success-border dark:from-success-soft/30 dark:to-success-soft/20 dark:border-success-border/50" onClick={() => navigate('/admin/incomplete-orders')} />
        </div>

        {/* Revenue Banners */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-gradient-to-r from-success/10 to-success/10 border border-success/30">
            <p className="text-xs text-success font-medium">Recovered Revenue</p>
            <p className="text-xl font-bold text-success">৳{recoveredRevenue.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-r from-warning/10 to-warning/10 border border-warning/30">
            <p className="text-xs text-warning-foreground font-medium">Lost Revenue</p>
            <p className="text-xl font-bold text-warning-foreground">৳{lostRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Recharts (lazy chunk) — wrapped in its own ErrorBoundary so a chart
            failure can't take down the whole page */}
        <ErrorBoundary
          fallback={
            <Card className="border-destructive/30">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Charts couldn't load. Refresh the page to try again.
              </CardContent>
            </Card>
          }
        >
          <Suspense fallback={<ChartsFallback />}>
            <RecoveryCharts dailyData={dailyData} pieData={pieData} />
          </Suspense>
        </ErrorBoundary>

        {/* Funnel + Top Recovered (no recharts needed) */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {funnelData.map((step) => {
                const maxVal = Math.max(...funnelData.map((s) => s.value), 1);
                const width = Math.max((step.value / maxVal) * 100, 8);
                return (
                  <div key={step.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{step.name}</span>
                      <span className="font-semibold">{step.value}</span>
                    </div>
                    <div className="h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/80 rounded-full transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">Top Recovered Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {topRecovered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No recovered orders yet</p>
              ) : (
                <div className="space-y-3">
                  {topRecovered.map((order, idx) => (
                    <div key={order.id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{order.customer_name || order.customer_phone || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {Array.isArray(order.items) ? order.items.length : 0} items
                        </p>
                      </div>
                      <span className="text-sm font-bold text-foreground">৳{(order.cart_total || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRecoveryAnalytics;
