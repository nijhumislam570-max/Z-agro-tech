import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, ShoppingCart, AlertTriangle, ExternalLink, Minus, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const CMSMarketplaceTab = () => {
  
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['cms-marketplace-stats'],
    queryFn: async () => {
      const [
        { count: totalProducts },
        { count: outOfStock },
        { count: pendingOrders },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('stock', 0),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending').is('trashed_at', null),
      ]);
      return { totalProducts: totalProducts || 0, outOfStock: outOfStock || 0, pendingOrders: pendingOrders || 0 };
    },
    staleTime: 30000,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['cms-products-quick'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock, price, is_active, image_url')
        .order('stock', { ascending: true })
        .limit(15);
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['cms-recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .is('trashed_at', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });

  const handleStockUpdate = async (productId: string, newStock: number) => {
    if (newStock < 0) return;
    try {
      const updateData: { stock: number; badge?: string | null } = { stock: newStock };
      if (newStock === 0) updateData.badge = 'Stock Out';
      const { error } = await supabase.from('products').update(updateData).eq('id', productId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['cms-products-quick'] });
      queryClient.invalidateQueries({ queryKey: ['cms-marketplace-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(`Stock set to ${newStock}`);
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const handleToggleActive = async (productId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', productId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['cms-products-quick'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch {
      toast.error('Failed to update product');
    }
  };

  const getStockBadge = (stock: number | null) => {
    const s = stock ?? 0;
    if (s === 0) return <Badge variant="destructive" className="text-[10px]">Out</Badge>;
    if (s <= 10) return <Badge className="bg-warning/15 text-warning-foreground border-warning/30 text-[10px]">Low: {s}</Badge>;
    return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]">{s}</Badge>;
  };

  const orderStatusColor = (status: string | null) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
      case 'confirmed': return 'bg-blue-500/15 text-blue-600 border-blue-500/30';
      case 'delivered': return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statsLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard title="Total Products" value={stats?.totalProducts || 0} icon={<Package className="h-5 w-5 text-primary" />} iconClassName="bg-primary/10" href="/admin/products" />
            <StatCard title="Out of Stock" value={stats?.outOfStock || 0} icon={<AlertTriangle className="h-5 w-5 text-destructive" />} iconClassName="bg-destructive/10" />
            <StatCard title="Pending Orders" value={stats?.pendingOrders || 0} icon={<ShoppingCart className="h-5 w-5 text-amber-500" />} iconClassName="bg-amber-500/10" href="/admin/orders" />
          </>
        )}
      </div>

      {/* Products Quick List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base">Product Inventory</CardTitle>
            <Link to="/admin/products">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="h-3.5 w-3.5" /> Manage
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : isMobile ? (
            /* Mobile Card Layout */
            <div className="space-y-2.5">
              {products?.map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStockBadge(product.stock)}
                      <span className="text-xs text-muted-foreground">৳{product.price}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={product.is_active ?? true}
                      onCheckedChange={(v) => handleToggleActive(product.id, v)}
                      className="scale-90"
                    />
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleStockUpdate(product.id, (product.stock ?? 0) - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{product.stock ?? 0}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleStockUpdate(product.id, (product.stock ?? 0) + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop Table */
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Stock</TableHead>
                    <TableHead className="text-xs">Price</TableHead>
                    <TableHead className="text-xs text-right">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="text-sm font-medium max-w-[200px] truncate">{product.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStockUpdate(product.id, (product.stock ?? 0) - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          {getStockBadge(product.stock)}
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStockUpdate(product.id, (product.stock ?? 0) + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">৳{product.price}</TableCell>
                      <TableCell className="text-right">
                        <Switch checked={product.is_active ?? true} onCheckedChange={(v) => handleToggleActive(product.id, v)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base">Pending Orders</CardTitle>
            <Link to="/admin/orders">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="h-3.5 w-3.5" /> View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : !recentOrders?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No pending orders</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">#{order.id.slice(0, 8)}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(order.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn('text-[10px]', orderStatusColor(order.status))}>{order.status}</Badge>
                    <span className="text-sm font-semibold">৳{order.total_amount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CMSMarketplaceTab;
