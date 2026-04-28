import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MoreHorizontal,
  AlertCircle,
  ShoppingCart,
  Eye,
  CheckCircle,
  Truck,
  XCircle,
  CreditCard,
  Ban,
  Download,
  ShieldAlert,
  Phone,
  User,
  Copy,
  MapPin,
  Zap,
  Wallet,
  Circle,
  CheckCircle2,
  Loader2,
  X,
  Trash2,
  Undo2,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdmin, useAdminOrders } from '@/hooks/useAdmin';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import type { AdminOrder, OrderItem } from '@/types/database';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
// Admin realtime is centralized in AdminShell — no per-page subscription needed.
import { format, isAfter } from 'date-fns';
import { createOrderNotification } from '@/lib/notifications';
import { SendToCourierDialog } from '@/components/admin/SendToCourierDialog';
import { RejectOrderDialog } from '@/components/admin/RejectOrderDialog';
import { FraudRiskBadge } from '@/components/admin/FraudRiskBadge';
// Lazy — fraud panel only renders when an order is opened in the side sheet
const FraudAnalysisPanel = lazy(() =>
  import('@/components/admin/FraudAnalysisPanel').then((m) => ({ default: m.FraudAnalysisPanel })),
);
import { OrderStatsBar } from '@/components/admin/OrderStatsBar';
import { OrderTrackingTimeline } from '@/components/admin/OrderTrackingTimeline';
import { OrderCardsSkeleton, OrderTableSkeleton, OrderStatsBarSkeleton } from '@/components/admin/OrdersSkeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/csvParser';
import { analyzeFraudRisk, parseShippingAddress, type FraudAnalysis } from '@/lib/fraudDetection';
import { getStatusColor } from '@/lib/statusColors';
import { TimeFilterBar, getTimeCutoff, type TimeFilter } from '@/components/admin/TimeFilterBar';
import { SortableHeader, type SortDir } from '@/components/admin/SortableHeader';

type OrderSortKey = 'created_at' | 'total_amount';

const AdminOrders = () => {
  useDocumentTitle('Orders Management - Admin');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdmin();
  void isAdmin;
  const [adminOrderPage, setAdminOrderPage] = useState(0);
  const { data: ordersData, isLoading, isError, error: ordersError, refetch } = useAdminOrders(adminOrderPage);
  const orders = useMemo(() => ordersData?.orders ?? [], [ordersData?.orders]);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // Sync URL ?status= → filter (for cross-page deep links from QuickActions)
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus && urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Keep URL in sync when filter changes (so back-button works)
  useEffect(() => {
    const urlStatus = searchParams.get('status') || 'all';
    if (statusFilter !== urlStatus) {
      const next = new URLSearchParams(searchParams);
      if (statusFilter === 'all') next.delete('status');
      else next.set('status', statusFilter);
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [orderForAction, setOrderForAction] = useState<AdminOrder | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkShipping, setIsBulkShipping] = useState(false);
  const [trashDialog, setTrashDialog] = useState<string | null>(null);
  const [permanentDeleteDialog, setPermanentDeleteDialog] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<OrderSortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: OrderSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  // Split active vs trashed
  const activeOrders = useMemo(() => orders.filter(o => !o.trashed_at), [orders]);
  const trashedOrders = useMemo(() => orders.filter(o => !!o.trashed_at), [orders]);

  // Time-filtered orders (only from active)
  const timeFilteredOrders = useMemo(() => {
    if (statusFilter === 'trashed') return trashedOrders;
    const cutoff = getTimeCutoff(timeFilter);
    if (!cutoff) return activeOrders;
    return activeOrders.filter(o => isAfter(new Date(o.created_at), cutoff));
  }, [activeOrders, trashedOrders, timeFilter, statusFilter]);


  // Parse every shipping address ONCE per orders dataset.
  // Used by getCustomerName, getCustomerPhone, fraud analysis, CSV export.
  const parsedByOrder = useMemo(() => {
    const map = new Map<string, ReturnType<typeof parseShippingAddress>>();
    for (const o of orders) {
      map.set(o.id, parseShippingAddress(o.shipping_address));
    }
    return map;
  }, [orders]);

  // Compute fraud analysis for all orders (memoized)
  const fraudAnalysisMap = useMemo(() => {
    if (!orders) return new Map<string, FraudAnalysis>();
    const map = new Map<string, FraudAnalysis>();
    const ordersByUser = new Map<string, typeof orders>();
    for (const order of orders) {
      const userId = order.user_id;
      if (!ordersByUser.has(userId)) ordersByUser.set(userId, []);
      ordersByUser.get(userId)!.push(order);
    }
    for (const order of orders) {
      const profile = order.profile || null;
      const userOrders = ordersByUser.get(order.user_id) || [];
      map.set(order.id, analyzeFraudRisk(order, profile, userOrders));
    }
    return map;
  }, [orders]);

  const orderStats = useMemo(() => {
    const base = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, flagged: 0, trashed: trashedOrders.length, total: 0, revenue: 0 };
    // Use activeOrders filtered by time for stats (not trashed view)
    const cutoff = getTimeCutoff(timeFilter);
    const statsOrders = cutoff ? activeOrders.filter(o => isAfter(new Date(o.created_at), cutoff)) : activeOrders;
    if (!statsOrders.length) return base;
    const excludedStatuses = ['cancelled', 'rejected'];
    let pending = 0, processing = 0, shipped = 0, delivered = 0, cancelled = 0, flagged = 0, revenue = 0;
    for (const order of statsOrders) {
      switch (order.status) {
        case 'pending': pending++; break;
        case 'processing': processing++; break;
        case 'shipped': shipped++; break;
        case 'delivered': delivered++; break;
        case 'cancelled':
        case 'rejected': cancelled++; break;
      }
      if (!excludedStatuses.includes(order.status || '')) revenue += order.total_amount || 0;
      const analysis = fraudAnalysisMap.get(order.id);
      if (analysis && (analysis.level === 'medium' || analysis.level === 'high')) flagged++;
    }
    return { pending, processing, shipped, delivered, cancelled, flagged, trashed: trashedOrders.length, total: statsOrders.length, revenue };
  }, [activeOrders, trashedOrders, timeFilter, fraudAnalysisMap]);

  const highRiskPendingCount = useMemo(() => {
    if (!timeFilteredOrders.length) return 0;
    return timeFilteredOrders.filter(o => {
      const analysis = fraudAnalysisMap.get(o.id);
      return o.status === 'pending' && analysis?.level === 'high';
    }).length;
  }, [timeFilteredOrders, fraudAnalysisMap]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBulkShip = async () => {
    if (!selectedPendingOrders.length) return;
    setIsBulkShipping(true);
    let successCount = 0;
    let failCount = 0;

    for (const order of selectedPendingOrders) {
      try {
        const parsed = parsedByOrder.get(order.id) ?? null;
        const customerName = order.profile?.full_name || parsed?.name || 'Unknown';
        const customerPhone = order.profile?.phone || parsed?.phone || '';
        const customerAddress = parsed?.addressParts?.join(', ') || order.shipping_address || '';
        const codAmount = order.payment_method === 'cod' ? order.total_amount : 0;

        if (!customerPhone) {
          failCount++;
          continue;
        }

        const response = await supabase.functions.invoke('steadfast', {
          body: {
            action: 'create_order',
            invoice: order.id,
            recipient_name: customerName,
            recipient_phone: customerPhone,
            recipient_address: customerAddress,
            cod_amount: codAmount,
            note: `Order #${order.id.slice(0, 8)}`,
          },
        });

        if (response.error) { failCount++; continue; }

        const result = response.data;
        if (result?.consignment?.tracking_code || result?.consignment?.consignment_id) {
          await supabase.from('orders').update({
            status: 'processing',
            tracking_id: result.consignment.tracking_code || null,
            consignment_id: String(result.consignment.consignment_id) || null,
          }).eq('id', order.id);

          await createOrderNotification({
            userId: order.user_id, orderId: order.id, status: 'processing', orderTotal: order.total_amount,
          });
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsBulkShipping(false);
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    if (failCount > 0) {
      toast.error(`${successCount} shipped, ${failCount} failed`);
    } else {
      toast.success(`${successCount} shipped successfully`);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { data: order, error: fetchError } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (fetchError) throw fetchError;
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
      if (order && ['processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        await createOrderNotification({ userId: order.user_id, orderId, status: status as 'processing' | 'shipped' | 'delivered' | 'cancelled', orderTotal: order.total_amount });
      }
      toast.success(`Order status updated to ${status}`);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order';
      toast.error(errorMessage);
    }
  };

  const trashOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from('orders').update({ trashed_at: new Date().toISOString() }).eq('id', orderId);
      if (error) throw error;
      toast.success('Moved to trash');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
      setTrashDialog(null);
    } catch {
      toast.error('Failed to move to trash');
    }
  };

  const restoreOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from('orders').update({ trashed_at: null }).eq('id', orderId);
      if (error) throw error;
      toast.success('Restored from trash');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
    } catch {
      toast.error('Failed to restore');
    }
  };

  const permanentlyDeleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      toast.success('Permanently deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
      setPermanentDeleteDialog(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  // getStatusColor imported from '@/lib/statusColors'

  const getPaymentMethodBadge = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cod':
        return <Badge variant="outline" className="gap-1 text-xs"><CreditCard className="h-3 w-3" />COD</Badge>;
      case 'bkash':
        return <Badge variant="outline" className="text-xs border-danger-border"><Wallet className="h-3 w-3 mr-1" />bKash</Badge>;
      case 'nagad':
        return <Badge variant="outline" className="text-xs border-warning-border dark:border-warning-border"><Wallet className="h-3 w-3 mr-1" />Nagad</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Cash</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string | null) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge className="bg-success-light text-success dark:bg-success-light/30 dark:text-success text-[10px]">Paid</Badge>;
      case 'refunded':
        return <Badge className="bg-warning-light text-warning-foreground dark:bg-warning/15 dark:text-warning-foreground text-[10px]">Refunded</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">Unpaid</Badge>;
    }
  };

  const getCustomerName = useCallback((order: AdminOrder): string => {
    if (order.profile?.full_name) return order.profile.full_name;
    return parsedByOrder.get(order.id)?.name || 'Unknown';
  }, [parsedByOrder]);

  const getCustomerPhone = useCallback((order: AdminOrder): string => {
    if (order.profile?.phone) return order.profile.phone;
    return parsedByOrder.get(order.id)?.phone || '';
  }, [parsedByOrder]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const filteredOrders = useMemo(() => {
    const list = timeFilteredOrders.filter(order => {
      const customerName = getCustomerName(order).toLowerCase();
      const lowerQuery = debouncedSearch.toLowerCase();
      const matchesSearch = !debouncedSearch || 
        order.id.toLowerCase().includes(lowerQuery) ||
        order.shipping_address?.toLowerCase().includes(lowerQuery) ||
        customerName.includes(lowerQuery) ||
        (order.tracking_id)?.toLowerCase().includes(lowerQuery);
      
      if (statusFilter === 'trashed') return matchesSearch;
      if (statusFilter === 'flagged') {
        const analysis = fraudAnalysisMap.get(order.id);
        return matchesSearch && analysis && (analysis.level === 'medium' || analysis.level === 'high');
      }
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortKey === 'total_amount') {
        return ((a.total_amount ?? 0) - (b.total_amount ?? 0)) * dir;
      }
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    });
  }, [timeFilteredOrders, debouncedSearch, statusFilter, fraudAnalysisMap, sortKey, sortDir, getCustomerName]);

  // Bulk selection helpers (depend on filteredOrders)
  const pendingFilteredIds = useMemo(() => 
    filteredOrders.filter(o => o.status === 'pending').map(o => o.id),
    [filteredOrders]
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (pendingFilteredIds.every(id => prev.has(id)) && pendingFilteredIds.length > 0) {
        return new Set<string>();
      }
      return new Set(pendingFilteredIds);
    });
  }, [pendingFilteredIds]);

  const selectedPendingOrders = useMemo(() =>
    filteredOrders.filter(o => selectedIds.has(o.id) && o.status === 'pending'),
    [filteredOrders, selectedIds]
  );

  const handleExportCSV = () => {
    if (!filteredOrders.length) return;
    const headers = ['Order ID', 'Date', 'Customer', 'Phone', 'Items', 'Payment Method', 'Payment Status', 'Tracking ID', 'Total', 'Status', 'Risk Level', 'Risk Score'];
    const rows = filteredOrders.map(order => {
      const analysis = fraudAnalysisMap.get(order.id);
      return [
        order.id.slice(0, 8),
        format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
        `"${getCustomerName(order)}"`,
        getCustomerPhone(order),
        Array.isArray(order.items) ? order.items.length : 0,
        order.payment_method || 'COD',
        order.payment_status || 'unpaid',
        order.tracking_id || '',
        order.total_amount,
        order.status,
        analysis?.level || 'unknown',
        analysis?.score || 0,
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    downloadCSV(csvContent, `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success('Orders exported to CSV');
  };

  if (isError) {
    return (
      <AdminLayout title="Orders" subtitle="Manage customer orders">
        <div className="rounded-2xl border border-danger-border bg-danger-soft/30 p-6 sm:p-8 text-center">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-danger" aria-hidden="true" />
          <h2 className="text-base sm:text-lg font-semibold mb-1">Couldn't load orders</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {ordersError instanceof Error ? ordersError.message : 'Something went wrong fetching orders.'}
          </p>
          <Button onClick={() => refetch()} className="gap-2">
            <Loader2 className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Orders" subtitle="Manage customer orders">
      {/* High-Risk Pending Alert Banner */}
      {highRiskPendingCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 sm:p-4">
          <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">
              {highRiskPendingCount} high-risk pending order{highRiskPendingCount > 1 ? 's' : ''} detected
            </p>
            <p className="text-xs text-muted-foreground">Review flagged orders before processing</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => setStatusFilter('flagged')}
          >
            View Flagged
          </Button>
        </div>
      )}

      {/* Time Filter */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <TimeFilterBar value={timeFilter} onChange={setTimeFilter} />
      </div>

      {/* Order Stats Bar */}
      {isLoading ? <OrderStatsBarSkeleton /> : (
        <OrderStatsBar stats={orderStats} activeFilter={statusFilter} onFilterChange={setStatusFilter} />
      )}

      {/* Search + Export */}
      <div className="flex gap-2 sm:gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, tracking IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 sm:h-11 rounded-xl text-sm"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={handleExportCSV}
          disabled={!filteredOrders.length}
          className="h-10 sm:h-11 rounded-xl text-sm gap-2 shrink-0"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 sm:gap-3 mb-3 p-2.5 sm:p-3 bg-primary/5 border border-primary/20 rounded-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium truncate">
              {selectedPendingOrders.length} pending order{selectedPendingOrders.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="h-9 rounded-lg gap-1.5 text-xs sm:text-sm active:scale-95 transition-transform"
              onClick={handleBulkShip}
              disabled={isBulkShipping || !selectedPendingOrders.length}
            >
              {isBulkShipping ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Shipping...</>
              ) : (
                <><Truck className="h-3.5 w-3.5" /> Ship All</>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Result count */}
      {(statusFilter !== 'all' || searchQuery) && selectedIds.size === 0 && (
        <p className="text-xs text-muted-foreground mb-2">
          Showing {filteredOrders.length} {statusFilter === 'flagged' ? 'flagged' : statusFilter !== 'all' ? statusFilter : ''} order{filteredOrders.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      )}

      {/* Orders Container */}
      <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <>
            <OrderCardsSkeleton />
            <OrderTableSkeleton />
          </>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders found</p>
            {statusFilter !== 'all' && (
              <Button variant="link" size="sm" onClick={() => setStatusFilter('all')} className="mt-2">Clear filter</Button>
            )}
          </div>
        ) : (
          <>
            {/* ========== MOBILE CARD VIEW ========== */}
            <div className="sm:hidden divide-y divide-border">
              {filteredOrders.map((order) => {
                const analysis = fraudAnalysisMap.get(order.id);
                const customerName = getCustomerName(order);
                const customerPhone = getCustomerPhone(order);
                return (
                  <div 
                    key={order.id} 
                    className="p-3 space-y-2.5 active:bg-muted/30 transition-colors"
                    onClick={() => { setSelectedOrder(order); setIsViewOpen(true); }}
                  >
                    {/* Row 1: Select Circle + ID + Risk + Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          className="shrink-0 active:scale-90 transition-transform"
                          onClick={(e) => { e.stopPropagation(); toggleSelect(order.id); }}
                          aria-label={selectedIds.has(order.id) ? 'Deselect order' : 'Select order'}
                        >
                          {selectedIds.has(order.id) ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </button>
                        <span className="font-mono text-xs font-medium text-muted-foreground">#{order.id.slice(0, 8)}</span>
                        {analysis && analysis.level !== 'low' && <FraudRiskBadge analysis={analysis} compact />}
                      </div>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>

                    {/* Row 2: Customer + Amount */}
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate">{customerName}</span>
                        </div>
                        {customerPhone && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground">{customerPhone}</span>
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-primary text-lg shrink-0 ml-2">৳{order.total_amount}</span>
                    </div>

                    {/* Row 3: Date + Payment + Payment Status */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                        <span>·</span>
                        <span>{Array.isArray(order.items) ? order.items.length : 0} items</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getPaymentMethodBadge(order.payment_method || 'cod')}
                        {getPaymentStatusBadge(order.payment_status)}
                      </div>
                    </div>

                    {/* Courier / Tracking row */}
                    {(order.tracking_id || order.consignment_id) && (
                      <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <code className="text-xs bg-secondary px-2 py-1 rounded truncate max-w-[60%]">
                          🚚 {order.tracking_id || order.consignment_id}
                        </code>
                        <OrderTrackingTimeline
                          orderId={order.id}
                          trackingId={order.tracking_id}
                          consignmentId={order.consignment_id}
                          orderStatus={order.status || 'pending'}
                          compact
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      {statusFilter === 'trashed' ? (
                        <>
                          <Button size="sm" variant="outline" className="flex-1 h-11 rounded-xl text-sm gap-1.5 active:scale-95 transition-transform" onClick={() => restoreOrder(order.id)}>
                            <Undo2 className="h-4 w-4" /> Restore
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1 h-11 rounded-xl text-sm gap-1.5 active:scale-95 transition-transform" onClick={() => setPermanentDeleteDialog(order.id)}>
                            <Trash2 className="h-4 w-4" /> Delete Forever
                          </Button>
                        </>
                      ) : (
                        <>
                          {order.status === 'pending' && (
                            <>
                              <Button size="sm" className="flex-1 h-11 rounded-xl text-sm gap-1.5 active:scale-95 transition-transform" onClick={() => { setOrderForAction(order); setIsAcceptOpen(true); }}>
                                <Zap className="h-4 w-4" /> Accept & Ship
                              </Button>
                              <Button size="sm" variant="destructive" className="flex-1 h-11 rounded-xl text-sm gap-1.5 active:scale-95 transition-transform" onClick={() => { setOrderForAction(order); setIsRejectOpen(true); }}>
                                <Ban className="h-4 w-4" /> Reject
                              </Button>
                            </>
                          )}
                          {order.status !== 'pending' && order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'rejected' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="flex-1 h-11 rounded-xl text-sm">
                                  <MoreHorizontal className="h-4 w-4 mr-1" /> Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'shipped')}>
                                  <Truck className="h-4 w-4 mr-2" /> Mark Shipped
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'delivered')}>
                                  <CheckCircle className="h-4 w-4 mr-2" /> Mark Delivered
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <Button size="sm" variant="ghost" className="h-11 w-11 rounded-xl text-muted-foreground active:scale-95 transition-transform" onClick={() => setTrashDialog(order.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ========== DESKTOP TABLE VIEW ========== */}
            <ScrollArea className="hidden sm:block w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <button
                        className="active:scale-90 transition-transform"
                        onClick={(e) => { e.stopPropagation(); toggleSelectAll(); }}
                        aria-label="Select all pending orders"
                      >
                        {pendingFilteredIds.length > 0 && pendingFilteredIds.every(id => selectedIds.has(id)) ? (
                          <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
                        ) : (
                          <Circle className="h-4.5 w-4.5 text-muted-foreground/40" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-[90px]">Order</TableHead>
                    <TableHead className="w-[80px]">
                      <SortableHeader label="Date" sortKey="created_at" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="w-[60px]">Items</TableHead>
                    <TableHead className="w-[100px]">Payment</TableHead>
                    <TableHead className="w-[140px]">Courier</TableHead>
                    <TableHead className="w-[80px]">
                      <SortableHeader label="Total" sortKey="total_amount" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
                    </TableHead>
                    <TableHead className="w-[90px]">Status</TableHead>
                    <TableHead className="w-[60px]">Risk</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const analysis = fraudAnalysisMap.get(order.id);
                    const customerName = getCustomerName(order);
                    const phone = getCustomerPhone(order);
                    return (
                      <TableRow key={order.id} className={cn("cursor-pointer hover:bg-muted/50", selectedIds.has(order.id) && "bg-primary/5")} onClick={() => { setSelectedOrder(order); setIsViewOpen(true); }}>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <button
                            className="active:scale-90 transition-transform"
                            onClick={() => toggleSelect(order.id)}
                            aria-label={selectedIds.has(order.id) ? 'Deselect' : 'Select'}
                          >
                            {selectedIds.has(order.id) ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-primary" />
                            ) : (
                              <Circle className="h-4.5 w-4.5 text-muted-foreground/40" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="font-mono text-xs">#{order.id.slice(0, 8)}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{format(new Date(order.created_at), 'MMM d')}</TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <span className="font-medium text-sm block truncate max-w-[160px]">{customerName}</span>
                            {phone && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3" />{phone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{Array.isArray(order.items) ? order.items.length : 0}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getPaymentMethodBadge(order.payment_method || 'cod')}
                            {getPaymentStatusBadge(order.payment_status)}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {order.tracking_id ? (
                            <div className="space-y-1">
                              <code className="text-[11px] bg-secondary px-1.5 py-0.5 rounded block truncate max-w-[120px]">
                                {order.tracking_id}
                              </code>
                              <OrderTrackingTimeline
                                orderId={order.id}
                                trackingId={order.tracking_id}
                                consignmentId={order.consignment_id}
                                orderStatus={order.status || 'pending'}
                                compact
                              />
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-primary text-sm">৳{order.total_amount}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {analysis && <FraudRiskBadge analysis={analysis} />}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {statusFilter === 'trashed' ? (
                                <>
                                  <DropdownMenuItem onClick={() => restoreOrder(order.id)}>
                                    <Undo2 className="h-4 w-4 mr-2" /> Restore
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => setPermanentDeleteDialog(order.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Forever
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => { setSelectedOrder(order); setIsViewOpen(true); }}>
                                    <Eye className="h-4 w-4 mr-2" /> View Details
                                  </DropdownMenuItem>
                                  
                                  {order.status === 'pending' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => { setOrderForAction(order); setIsAcceptOpen(true); }}>
                                        <Zap className="h-4 w-4 mr-2" /> Accept & Ship
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive" onClick={() => { setOrderForAction(order); setIsRejectOpen(true); }}>
                                        <Ban className="h-4 w-4 mr-2" /> Reject Order
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  
                                  {order.status !== 'pending' && order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'rejected' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'shipped')}>
                                        <Truck className="h-4 w-4 mr-2" /> Mark Shipped
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'delivered')}>
                                        <CheckCircle className="h-4 w-4 mr-2" /> Mark Delivered
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive" onClick={() => { setOrderForAction(order); setIsRejectOpen(true); }}>
                                        <XCircle className="h-4 w-4 mr-2" /> Cancel Order
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-muted-foreground" onClick={() => setTrashDialog(order.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Move to Trash
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </>
        )}
      </div>

      {/* ========== ORDER DETAILS DIALOG ========== */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Order #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription className="text-sm">
              Placed on {selectedOrder && format(new Date(selectedOrder.created_at), 'PPP p')}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Status & Payment row */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Badge className={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
                <div className="flex items-center gap-2">
                  {getPaymentMethodBadge(selectedOrder.payment_method || 'cod')}
                  {getPaymentStatusBadge(selectedOrder.payment_status)}
                </div>
              </div>

              {/* Customer Info Card */}
              <div className="p-3 bg-muted/50 rounded-xl space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{getCustomerName(selectedOrder)}</span>
                  </div>
                </div>
                {getCustomerPhone(selectedOrder) && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${getCustomerPhone(selectedOrder)}`} className="text-sm text-primary hover:underline">
                        {getCustomerPhone(selectedOrder)}
                      </a>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7" onClick={() => copyToClipboard(getCustomerPhone(selectedOrder))}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Tracking Timeline */}
              {(selectedOrder.tracking_id || selectedOrder.consignment_id) && (
                <div className="p-3 bg-secondary/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tracking ID</p>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-sm">{selectedOrder.tracking_id}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(selectedOrder.tracking_id)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {selectedOrder.consignment_id && (
                        <p className="text-xs text-muted-foreground mt-0.5">CID: {selectedOrder.consignment_id}</p>
                      )}
                    </div>
                  </div>
                  <OrderTrackingTimeline
                    orderId={selectedOrder.id}
                    trackingId={selectedOrder.tracking_id}
                    consignmentId={selectedOrder.consignment_id}
                    orderStatus={selectedOrder.status || 'pending'}
                  />
                </div>
              )}

              {selectedOrder.rejection_reason && (
                <div className="p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                  <p className="text-xs text-muted-foreground mb-1">Rejection Reason</p>
                  <p className="text-sm text-destructive">{selectedOrder.rejection_reason}</p>
                </div>
              )}

              {/* Fraud Risk Analysis Panel — lazy-loaded chunk */}
              {fraudAnalysisMap.get(selectedOrder.id) && (
                <Suspense fallback={null}>
                  <FraudAnalysisPanel analysis={fraudAnalysisMap.get(selectedOrder.id)!} />
                </Suspense>
              )}
              
              {/* Shipping Address */}
              <div>
                <h4 className="font-medium text-sm mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Shipping Address
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedOrder.shipping_address || 'No address provided'}
                </p>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium text-sm mb-2">Order Items</h4>
                <div className="space-y-2">
                  {Array.isArray(selectedOrder.items) && (selectedOrder.items as OrderItem[]).map((item, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover shrink-0" loading="lazy" decoding="async" width={40} height={40} />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-medium shrink-0 ml-2">৳{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="font-bold">Total</span>
                <span className="text-xl font-bold text-primary">৳{selectedOrder.total_amount}</span>
              </div>

              {/* Action buttons */}
              {selectedOrder.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1 h-11 gap-2 active:scale-95 transition-transform"
                    onClick={() => {
                      setOrderForAction(selectedOrder);
                      setIsViewOpen(false);
                      setIsAcceptOpen(true);
                    }}
                  >
                    <Zap className="h-4 w-4" /> Accept & Ship
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1 h-11 gap-2 active:scale-95 transition-transform"
                    onClick={() => {
                      setOrderForAction(selectedOrder);
                      setIsViewOpen(false);
                      setIsRejectOpen(true);
                    }}
                  >
                    <Ban className="h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
              {selectedOrder.status !== 'pending' && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'rejected' && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline"
                    className="flex-1 h-11 gap-2"
                    onClick={() => { updateOrderStatus(selectedOrder.id, 'shipped'); setIsViewOpen(false); }}
                  >
                    <Truck className="h-4 w-4" /> Mark Shipped
                  </Button>
                  <Button 
                    className="flex-1 h-11 gap-2"
                    onClick={() => { updateOrderStatus(selectedOrder.id, 'delivered'); setIsViewOpen(false); }}
                  >
                    <CheckCircle className="h-4 w-4" /> Mark Delivered
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send to Courier Dialog (replaces AcceptOrderDialog) */}
      <SendToCourierDialog
        isOpen={isAcceptOpen}
        onClose={() => { setIsAcceptOpen(false); setOrderForAction(null); }}
        order={orderForAction}
      />

      {/* Reject Order Dialog */}
      <RejectOrderDialog
        isOpen={isRejectOpen}
        onClose={() => { setIsRejectOpen(false); setOrderForAction(null); }}
        order={orderForAction}
      />

      {/* Trash Confirmation Dialog */}
      <Dialog open={!!trashDialog} onOpenChange={() => setTrashDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-muted-foreground" />Move to Trash</DialogTitle>
            <DialogDescription>This order will be moved to trash. You can restore it later or permanently delete it.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setTrashDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => trashDialog && trashOrder(trashDialog)}>Move to Trash</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation Dialog */}
      <Dialog open={!!permanentDeleteDialog} onOpenChange={() => setPermanentDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-destructive" />Delete Forever</DialogTitle>
            <DialogDescription>This will permanently delete this order. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPermanentDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => permanentDeleteDialog && permanentlyDeleteOrder(permanentDeleteDialog)}>Delete Forever</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Server-side pagination for fetched orders */}
      {(ordersData?.totalCount ?? 0) > 50 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Page {adminOrderPage + 1} · Showing orders {adminOrderPage * 50 + 1}–{Math.min((adminOrderPage + 1) * 50, ordersData?.totalCount ?? 0)} of {ordersData?.totalCount ?? 0}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdminOrderPage(p => Math.max(0, p - 1))}
              disabled={adminOrderPage === 0}
              className="rounded-lg"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdminOrderPage(p => p + 1)}
              disabled={(adminOrderPage + 1) * 50 >= (ordersData?.totalCount ?? 0)}
              className="rounded-lg"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrders;
