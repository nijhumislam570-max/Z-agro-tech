import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Loader2,
  ArrowLeft,
  Search,
  LogIn,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import Footer from '@/components/Footer';
import { OrderTrackingTimeline } from '@/components/admin/OrderTrackingTimeline';
import { getStatusColor } from '@/lib/statusColors';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { format } from 'date-fns';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { MapPin } from 'lucide-react';

interface OrderDetails {
  id: string;
  status: string;
  tracking_id: string | null;
  consignment_id: string | null;
  rejection_reason: string | null;
  created_at: string;
  total_amount: number;
  shipping_address: string | null;
  items: any[];
}

const TrackOrderPage = () => {
  useDocumentTitle('Track Order');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { user, loading: authLoading } = useAuth();
  
  const orderId = searchParams.get('id');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Auto-load order from URL param
  useEffect(() => {
    if (orderId && user) {
      setSearchInput(orderId);
      fetchOrder(orderId);
    }
  }, [orderId, user]);

  // Real-time order status updates
  useEffect(() => {
    const activeId = order?.id;
    if (!activeId || !user) return;

    const channel = supabase
      .channel(`track-order-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${activeId}`,
        },
        (payload) => {
          const updated = payload.new as unknown as OrderDetails;
          setOrder((prev) => (prev ? { ...prev, ...updated } : prev));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id, user]);

  const fetchOrder = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setIsLoading(true);
    setSearchAttempted(true);
    try {
      // Try by order ID first
      let { data, error } = await supabase
        .from('orders')
        .select('id, status, tracking_id, consignment_id, rejection_reason, created_at, total_amount, shipping_address, items')
        .eq('id', id.trim())
        .maybeSingle();

      // If not found by ID, try by tracking_id
      if (!data && !error) {
        const result = await supabase
          .from('orders')
          .select('id, status, tracking_id, consignment_id, rejection_reason, created_at, total_amount, shipping_address, items')
          .eq('tracking_id', id.trim())
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      if (error) {
        logger.error('Error fetching order:', error);
        toast.error('Could not fetch order details');
        setOrder(null);
        return;
      }
      
      setOrder(data as unknown as OrderDetails | null);
    } catch (error) {
      logger.error('Error fetching order:', error);
      toast.error('Could not fetch order details');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    if (!searchInput.trim()) {
      toast.error('Please enter an Order ID or Tracking ID');
      return;
    }
    fetchOrder(searchInput.trim());
  }, [searchInput, fetchOrder]);

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />
        <main id="main-content" className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <LogIn className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Login Required</CardTitle>
                <CardDescription>
                  Please log in to track your orders. You can only view tracking information for orders placed with your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button onClick={() => navigate('/auth')}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Log In to Track Orders
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      
      <main id="main-content" className="container mx-auto px-4 py-6 sm:py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Search Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                Track Your Order
              </CardTitle>
              <CardDescription>
                Enter your Order ID or Tracking ID to view status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Order ID or Tracking ID"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={!user}
                  className="min-h-[44px] text-base"
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading || !user || !searchInput.trim()}
                  className="min-h-[44px]"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <Card>
              <CardContent className="py-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : order ? (
            <>
              {/* Order Status Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                      <CardDescription>
                        Placed on {format(new Date(order.created_at), 'PPP')}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Tracking Timeline */}
                  <OrderTrackingTimeline
                    orderId={order.id}
                    trackingId={order.tracking_id}
                    consignmentId={order.consignment_id}
                    orderStatus={order.status}
                  />

                  {order.rejection_reason && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Order Rejected</p>
                        <p className="text-sm text-destructive/80">{order.rejection_reason}</p>
                      </div>
                    </div>
                  )}

                  {order.tracking_id && (
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Tracking Code</p>
                      <p className="font-mono font-bold text-lg">{order.tracking_id}</p>
                      {order.consignment_id && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Consignment ID: {order.consignment_id}
                        </p>
                      )}
                    </div>
                  )}

                  {order.shipping_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Shipping Address</p>
                        <p className="text-sm">{order.shipping_address}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Items Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="h-12 w-12 rounded-lg object-cover" 
                              loading="lazy"
                              decoding="async"
                              width={48}
                              height={48}
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bold">৳{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-bold text-primary">৳{order.total_amount}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : searchAttempted ? (
            /* Order not found empty state */
            <Card>
              <CardContent className="py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Order not found</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Please check your Order ID or Tracking ID and try again.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Enter an Order ID or Tracking ID above to track your order
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default TrackOrderPage;
