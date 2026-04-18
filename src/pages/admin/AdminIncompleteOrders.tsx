import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { useIncompleteOrders, IncompleteOrder } from '@/hooks/useIncompleteOrders';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  ShoppingCart, TrendingUp, DollarSign, AlertTriangle,
  Search, Trash2, ArrowUpRight, Phone, Mail, MapPin, Clock, Package, Undo2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const IncompleteStatCard = ({ icon: Icon, label, value, iconColor, iconBg, bgClass, active, onClick }: { icon: React.ElementType; label: string; value: string | number; iconColor: string; iconBg: string; bgClass: string; active?: boolean; onClick?: () => void }) => (
  <div
    className={cn(
      'rounded-xl sm:rounded-2xl p-3 sm:p-4 border shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]',
      bgClass,
      active && 'ring-2 ring-primary/50'
    )}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight mb-0.5 sm:mb-1">{label}</p>
        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{value}</p>
      </div>
      <div className={cn('h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
        <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', iconColor)} />
      </div>
    </div>
  </div>
);

const CompletenessBadge = ({ value }: { value: number }) => {
  const color = value >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : value >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{value}%</span>;
};

const AdminIncompleteOrders = () => {
  useDocumentTitle('Incomplete Orders');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const {
    orders, trashedOrders, isLoading, totalIncomplete, totalRecovered, totalTrashed,
    recoveryRate, lostRevenue, trashOrder, restoreOrder, permanentlyDelete,
    convertOrder, isConverting
  } = useIncompleteOrders();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'incomplete' | 'recovered' | 'trashed'>('all');
  const [convertDialog, setConvertDialog] = useState<IncompleteOrder | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [permanentDeleteDialog, setPermanentDeleteDialog] = useState<string | null>(null);

  // Fetch delivery zones for fee calculation
  const { data: deliveryZones = [] } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Editable form state for convert dialog
  const [convertFormData, setConvertFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    shipping_address: '',
    division: '',
  });

  useEffect(() => {
    if (convertDialog) {
      setConvertFormData({
        customer_name: convertDialog.customer_name || '',
        customer_phone: convertDialog.customer_phone || '',
        customer_email: convertDialog.customer_email || '',
        shipping_address: convertDialog.shipping_address || '',
        division: convertDialog.division || '',
      });
    }
  }, [convertDialog]);

  const matchedZone = useMemo(() => {
    if (!convertFormData.division) return null;
    const normalizedDiv = convertFormData.division.trim();
    return deliveryZones.find(z =>
      (z.divisions as string[])?.some(d => d.toLowerCase() === normalizedDiv.toLowerCase())
    ) || null;
  }, [convertFormData.division, deliveryZones]);

  const deliveryCharge = matchedZone ? Number(matchedZone.charge) : (convertFormData.division ? 120 : 60);
  const convertGrandTotal = (convertDialog?.cart_total || 0) + deliveryCharge;

  const allDivisions = useMemo(() => {
    const divs = new Set<string>();
    deliveryZones.forEach(z => {
      (z.divisions as string[])?.forEach(d => divs.add(d));
    });
    return Array.from(divs).sort();
  }, [deliveryZones]);

  const isFormValid = convertFormData.customer_name.trim() && convertFormData.customer_phone.trim() && convertFormData.shipping_address.trim();

  // Use trashed orders when filter is "trashed", otherwise use active orders
  const displayOrders = statusFilter === 'trashed' ? trashedOrders : orders;

  const filtered = displayOrders.filter(o => {
    if (statusFilter === 'trashed') {
      // Show all trashed
    } else if (statusFilter === 'recovered') {
      if (o.status !== 'recovered') return false;
    } else if (statusFilter === 'incomplete') {
      if (o.status !== 'incomplete') return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (o.customer_name?.toLowerCase().includes(q)) ||
      (o.customer_phone?.toLowerCase().includes(q)) ||
      (o.customer_email?.toLowerCase().includes(q));
  });

  const handleConvert = async () => {
    if (!convertDialog || !isFormValid) return;
    try {
      await convertOrder({ order: convertDialog, editedData: convertFormData, deliveryCharge, grandTotal: convertGrandTotal });
      toast.success('Order converted successfully!');
      setConvertDialog(null);
    } catch {
      toast.error('Failed to convert order');
    }
  };

  const handleTrash = async () => {
    if (!deleteDialog) return;
    try {
      await trashOrder(deleteDialog);
      toast.success('Moved to trash');
      setDeleteDialog(null);
    } catch {
      toast.error('Failed to move to trash');
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteDialog) return;
    try {
      await permanentlyDelete(permanentDeleteDialog);
      toast.success('Permanently deleted');
      setPermanentDeleteDialog(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreOrder(id);
      toast.success('Restored from trash');
    } catch {
      toast.error('Failed to restore');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Incomplete Orders">
        <div className="p-4 sm:p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Incomplete Orders">
      <div className="p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Incomplete Orders</h1>
          <p className="text-sm text-muted-foreground">Track and recover abandoned checkouts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <IncompleteStatCard icon={ShoppingCart} label="Incomplete" value={totalIncomplete} iconColor="text-amber-600 dark:text-amber-400" iconBg="bg-amber-500/10" bgClass="bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-900/50" active={statusFilter === 'incomplete'} onClick={() => setStatusFilter(f => f === 'incomplete' ? 'all' : 'incomplete')} />
          <IncompleteStatCard icon={TrendingUp} label="Recovered" value={totalRecovered} iconColor="text-emerald-600 dark:text-emerald-400" iconBg="bg-emerald-500/10" bgClass="bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-100 dark:from-emerald-950/30 dark:to-green-950/20 dark:border-emerald-900/50" active={statusFilter === 'recovered'} onClick={() => setStatusFilter(f => f === 'recovered' ? 'all' : 'recovered')} />
          <IncompleteStatCard icon={AlertTriangle} label="Recovery Rate" value={`${recoveryRate}%`} iconColor="text-blue-600 dark:text-blue-400" iconBg="bg-blue-500/10" bgClass="bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100 dark:from-blue-950/30 dark:to-indigo-950/20 dark:border-blue-900/50" onClick={() => navigate('/admin/recovery-analytics')} />
          <IncompleteStatCard icon={DollarSign} label="Lost Revenue" value={`৳${lostRevenue.toLocaleString()}`} iconColor="text-red-600 dark:text-red-400" iconBg="bg-red-500/10" bgClass="bg-gradient-to-br from-red-50 to-rose-50/50 border-red-100 dark:from-red-950/30 dark:to-rose-950/20 dark:border-red-900/50" active={statusFilter === 'incomplete'} onClick={() => setStatusFilter(f => f === 'incomplete' ? 'all' : 'incomplete')} />
          <IncompleteStatCard icon={Trash2} label="Trashed" value={totalTrashed} iconColor="text-muted-foreground" iconBg="bg-muted" bgClass="bg-muted/30 border-border" active={statusFilter === 'trashed'} onClick={() => setStatusFilter(f => f === 'trashed' ? 'all' : 'trashed')} />
        </div>

        {/* Revenue Banner */}
        {lostRevenue > 0 && statusFilter !== 'trashed' && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/20">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="font-semibold text-red-700 dark:text-red-300">৳{lostRevenue.toLocaleString()}</span>
              <span className="text-sm text-red-600/80 dark:text-red-400/80">potential revenue from {totalIncomplete} incomplete orders</span>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>

        {/* Table / Cards */}
        {isMobile ? (
          <div className="space-y-3">
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">{statusFilter === 'trashed' ? 'Trash is empty' : 'No incomplete orders'}</p>}
            {filtered.map(order => (
              <Card key={order.id} className={`border-border/50 ${statusFilter === 'trashed' ? 'opacity-70' : ''}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{order.customer_name || 'Unknown'}</p>
                      {order.customer_phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{order.customer_phone}</p>}
                      {order.customer_email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{order.customer_email}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <CompletenessBadge value={order.completeness} />
                      {order.status === 'recovered' && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Recovered</Badge>}
                    </div>
                  </div>
                  {order.shipping_address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{order.shipping_address}</p>}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">৳{(order.cart_total || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p>
                    </div>
                    <div className="flex gap-2">
                      {statusFilter === 'trashed' ? (
                        <>
                          <Button size="sm" variant="outline" className="h-9 text-xs gap-1" onClick={() => handleRestore(order.id)}>
                            <Undo2 className="h-3 w-3" />Restore
                          </Button>
                          <Button size="sm" variant="destructive" className="h-9 text-xs gap-1" onClick={() => setPermanentDeleteDialog(order.id)}>
                            <Trash2 className="h-3 w-3" />Delete
                          </Button>
                        </>
                      ) : (
                        <>
                          {order.status === 'incomplete' && (
                            <Button size="sm" variant="default" className="h-9 text-xs" onClick={() => setConvertDialog(order)}>
                              <ArrowUpRight className="h-3 w-3 mr-1" />Convert
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-9 text-xs text-destructive" onClick={() => setDeleteDialog(order.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Cart Value</TableHead>
                  <TableHead>Completeness</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{statusFilter === 'trashed' ? 'Trash is empty' : 'No incomplete orders'}</TableCell></TableRow>
                )}
                {filtered.map(order => (
                  <TableRow key={order.id} className={statusFilter === 'trashed' ? 'opacity-70' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{order.customer_name || 'Unknown'}</p>
                        {order.customer_email && <p className="text-xs text-muted-foreground">{order.customer_email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{order.customer_phone || '—'}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{order.shipping_address || '—'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">৳{(order.cart_total || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{Array.isArray(order.items) ? order.items.length : 0} items</p>
                      </div>
                    </TableCell>
                    <TableCell><CompletenessBadge value={order.completeness} /></TableCell>
                    <TableCell>
                      {order.status === 'recovered'
                        ? <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Recovered</Badge>
                        : <Badge variant="outline">Incomplete</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {statusFilter === 'trashed' ? (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleRestore(order.id)}>
                              <Undo2 className="h-3 w-3" />Restore
                            </Button>
                            <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => setPermanentDeleteDialog(order.id)}>
                              <Trash2 className="h-3 w-3" />Delete
                            </Button>
                          </>
                        ) : (
                          <>
                            {order.status === 'incomplete' && (
                              <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => setConvertDialog(order)}>
                                <ArrowUpRight className="h-3 w-3 mr-1" />Convert
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => setDeleteDialog(order.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Convert Dialog */}
        <Dialog open={!!convertDialog} onOpenChange={() => setConvertDialog(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Convert to Order</DialogTitle>
              <DialogDescription>Fill in or update the customer details, then convert this into a real order.</DialogDescription>
            </DialogHeader>
            {convertDialog && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="conv-name" className="text-xs">Customer Name <span className="text-destructive">*</span></Label>
                    <Input id="conv-name" placeholder="Enter customer name" value={convertFormData.customer_name} onChange={e => setConvertFormData(p => ({ ...p, customer_name: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="conv-phone" className="text-xs">Phone Number <span className="text-destructive">*</span></Label>
                    <Input id="conv-phone" placeholder="Enter phone number" value={convertFormData.customer_phone} onChange={e => setConvertFormData(p => ({ ...p, customer_phone: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="conv-email" className="text-xs">Email</Label>
                    <Input id="conv-email" type="email" placeholder="Enter email (optional)" value={convertFormData.customer_email} onChange={e => setConvertFormData(p => ({ ...p, customer_email: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="conv-address" className="text-xs">Shipping Address <span className="text-destructive">*</span></Label>
                    <Input id="conv-address" placeholder="Enter full shipping address" value={convertFormData.shipping_address} onChange={e => setConvertFormData(p => ({ ...p, shipping_address: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="conv-division" className="text-xs">Division <span className="text-destructive">*</span></Label>
                    {allDivisions.length > 0 ? (
                      <Select value={convertFormData.division} onValueChange={v => setConvertFormData(p => ({ ...p, division: v }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                        <SelectContent>
                          {allDivisions.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input id="conv-division" placeholder="Enter division" value={convertFormData.division} onChange={e => setConvertFormData(p => ({ ...p, division: e.target.value }))} className="mt-1" />
                    )}
                  </div>
                </div>

                {/* Order summary with delivery fee */}
                <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({Array.isArray(convertDialog.items) ? convertDialog.items.length : 0} items)</span>
                    <span>৳{(convertDialog.cart_total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee {matchedZone ? `(${matchedZone.zone_name})` : ''}</span>
                    <span>৳{deliveryCharge.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-bold">
                    <span>Grand Total</span>
                    <span className="text-primary">৳{convertGrandTotal.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Payment: Cash on Delivery</p>
                </div>

                {!isFormValid && (
                  <p className="text-xs text-destructive">* Name, Phone, and Address are required to convert.</p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConvertDialog(null)}>Cancel</Button>
              <Button onClick={handleConvert} disabled={isConverting || !isFormValid}>
                {isConverting ? 'Converting...' : 'Convert to Order'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Move to Trash Confirmation Dialog */}
        <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-destructive" />Move to Trash</DialogTitle>
              <DialogDescription>This order will be moved to trash. You can restore it later or permanently delete it.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleTrash}>Move to Trash</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Permanent Delete Confirmation Dialog */}
        <Dialog open={!!permanentDeleteDialog} onOpenChange={() => setPermanentDeleteDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-destructive" />Delete Forever</DialogTitle>
              <DialogDescription>This will permanently delete this order. This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPermanentDeleteDialog(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handlePermanentDelete}>Delete Forever</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminIncompleteOrders;
