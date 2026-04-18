import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  CheckCircle, 
  Banknote, 
  CreditCard, 
  Smartphone, 
  MapPin, 
  Truck, 
  ChevronRight,
  Shield,
  Package,
  Lock,
  User,
  Phone,
  Home,
  FileText,
  Ticket,
  Loader2,
  X,
  Tag
} from 'lucide-react';
import { checkoutSchema, type CheckoutFormData } from '@/lib/validations';
import { notifyAdminsOfNewOrder } from '@/lib/notifications';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCheckoutTracking } from '@/hooks/useCheckoutTracking';

const paymentMethods = [
  {
    id: 'cod',
    name: 'Cash on Delivery',
    description: 'Pay when you receive your order',
    icon: Banknote,
    available: true,
  },
  {
    id: 'bkash',
    name: 'bKash',
    description: 'Pay with bKash mobile banking',
    icon: Smartphone,
    available: false,
  },
  {
    id: 'nagad',
    name: 'Nagad',
    description: 'Pay with Nagad mobile banking',
    icon: Smartphone,
    available: false,
  },
  {
    id: 'online',
    name: 'Card Payment',
    description: 'Pay with credit/debit card',
    icon: CreditCard,
    available: false,
  },
];

const CheckoutPage = () => {
  useDocumentTitle('Checkout');
  const { items, totalAmount, clearCart, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Note: Auth is enforced by RequireAuth wrapper in App.tsx

  // Redirect to cart if empty (must be before conditional returns)
  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      navigate('/cart');
    }
  }, [items.length, orderPlaced, navigate]);

  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placedItems, setPlacedItems] = useState<typeof items>([]);
  const [placedTotal, setPlacedTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_type: string;
    discount_value: number;
    max_discount_amount: number | null;
    id: string;
  } | null>(null);

  // react-hook-form with Zod resolver
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      address: '',
      division: '',
      district: '',
      thana: '',
      notes: '',
    },
  });

  // Watch all form values for checkout tracking & delivery zone matching
  const watchedValues = watch();

  // Track incomplete checkout — cast watched values since react-hook-form returns DeepPartial
  const trackingData = {
    fullName: watchedValues.fullName || '',
    phone: watchedValues.phone || '',
    address: watchedValues.address || '',
    division: watchedValues.division || '',
    district: watchedValues.district || '',
    thana: watchedValues.thana || '',
  };
  const { markRecovered } = useCheckoutTracking(trackingData, items, totalAmount, paymentMethod);

  // Fetch delivery zones
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

  const watchedDivision = watchedValues.division;

  const matchedZone = useMemo(() => {
    if (!watchedDivision) return null;
    const normalizedDiv = watchedDivision.trim();
    return deliveryZones.find(z => 
      (z.divisions as string[])?.some(d => d.toLowerCase() === normalizedDiv.toLowerCase())
    ) || null;
  }, [watchedDivision, deliveryZones]);

  const deliveryCharge = matchedZone ? Number(matchedZone.charge) : (watchedDivision ? 120 : 60);
  
  // Calculate coupon discount
  const couponDiscount = (() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'free_delivery') return deliveryCharge;
    if (appliedCoupon.discount_type === 'percentage') {
      const raw = Math.round(totalAmount * appliedCoupon.discount_value / 100);
      return appliedCoupon.max_discount_amount ? Math.min(raw, appliedCoupon.max_discount_amount) : raw;
    }
    return Math.min(appliedCoupon.discount_value, totalAmount);
  })();
  
  const effectiveDelivery = appliedCoupon?.discount_type === 'free_delivery' ? 0 : deliveryCharge;
  const grandTotal = totalAmount + effectiveDelivery - (appliedCoupon?.discount_type !== 'free_delivery' ? couponDiscount : 0);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) {
        toast.error('This coupon code is not valid.');
        return;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error('This coupon has expired.');
        return;
      }
      if (data.usage_limit && data.used_count >= data.usage_limit) {
        toast.error('This coupon has reached its usage limit.');
        return;
      }
      if (data.min_order_amount && totalAmount < data.min_order_amount) {
        toast.error(`Minimum order amount is ৳${data.min_order_amount}`);
        return;
      }
      
      setAppliedCoupon({
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        max_discount_amount: data.max_discount_amount,
        id: data.id,
      });
      toast.success(`${data.code} applied successfully.`);
    } catch {
      toast.error('Failed to validate coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const onSubmit = async (validatedData: CheckoutFormData) => {
    if (!user) {
      toast.error('Please login to place an order.');
      navigate('/auth');
      return;
    }

    try {
      const shippingAddress = `${validatedData.fullName}, ${validatedData.phone}, ${validatedData.address}, ${validatedData.thana}, ${validatedData.district}, ${validatedData.division}`;
      
      // Atomic order creation + stock decrement via DB function
      const { data: orderId, error } = await supabase.rpc('create_order_with_stock', {
        p_user_id: user.id,
        p_items: JSON.parse(JSON.stringify(items)),
        p_total_amount: grandTotal,
        p_shipping_address: shippingAddress,
        p_payment_method: paymentMethod,
        p_coupon_id: appliedCoupon?.id || null,
      });

      if (error) {
        // Surface stock-related errors clearly
        if (error.message.includes('Insufficient stock')) {
          toast.error(error.message, { description: 'Some items may have sold out. Please review your cart.' });
          return;
        }
        if (error.message.includes('Product not found')) {
          toast.error('A product in your cart is no longer available.', { description: 'Please remove it and try again.' });
          return;
        }
        toast.error('Failed to place order. Please try again.', { description: error.message });
        return;
      }

      const orderData = { id: orderId };

      // Notify admins of new order
      if (orderData) {
        await notifyAdminsOfNewOrder({
          orderId: orderData.id,
          orderTotal: grandTotal,
          itemCount: totalItems,
        });
      }

      // Mark incomplete order as recovered
      if (orderData?.id) {
        await markRecovered(orderData.id);
      }

      // Store order details before clearing cart
      setPlacedOrderId(orderData?.id || null);
      setPlacedItems([...items]);
      setPlacedTotal(grandTotal);
      
      clearCart();
      setOrderPlaced(true);
      toast.success('Your order has been placed successfully!');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to place order.', { description: msg });
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navbar />
        <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
          <div className="max-w-xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
              {placedOrderId && (
                <p className="text-sm text-muted-foreground">
                  Order ID: <span className="font-mono font-medium text-foreground">{placedOrderId.slice(0, 8).toUpperCase()}</span>
                </p>
              )}
            </div>

            {/* Order Summary Card */}
            <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden mb-6">
              <div className="p-4 sm:p-5 border-b border-border bg-muted/30">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Order Summary
                </h2>
              </div>
              <div className="p-4 sm:p-5 space-y-3">
                {placedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover border border-border" loading="lazy" decoding="async" width={48} height={48} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">৳{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground">৳{placedTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Delivery & Payment Info */}
            <div className="bg-background rounded-2xl border border-border shadow-sm p-4 sm:p-5 space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Estimated Delivery</p>
                  <p className="text-xs text-muted-foreground">Within 2-5 business days</p>
                </div>
              </div>
              {paymentMethod === 'cod' && (
                <div className="flex items-start gap-3">
                  <Banknote className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">
                      Please keep ৳{placedTotal.toLocaleString()} ready
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/shop')} size="lg" className="rounded-xl">
                Continue Shopping
              </Button>
              <Button onClick={() => navigate('/profile')} variant="outline" size="lg" className="rounded-xl">
                View Orders
              </Button>
            </div>
          </div>
        </div>
        <MobileNav />
      </div>
    );
  }

  // Empty cart redirect moved to top-level useEffect below

  if (items.length === 0 && !orderPlaced) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-36 md:pb-8">
      <Navbar />
      
      {/* Breadcrumb */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">
              Home
            </button>
            <ChevronRight className="h-4 w-4" />
            <button onClick={() => navigate('/cart')} className="hover:text-primary transition-colors">
              Cart
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Checkout</span>
          </nav>
        </div>
      </div>

      {/* Checkout Progress */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold">
                ✓
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground hidden sm:inline">Cart</span>
            </div>
            <div className="flex-1 h-0.5 bg-primary" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-semibold">
                2
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground hidden sm:inline">Checkout</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs sm:text-sm font-semibold">
                3
              </div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground hidden sm:inline">Done</span>
            </div>
          </div>
        </div>
      </div>

      <main id="main-content" className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Form Section */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-6">
            <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              {/* Shipping Information */}
              <div className="bg-background rounded-xl sm:rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground">Shipping Information</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">Where should we deliver your order?</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="flex items-center gap-2 text-sm">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        {...register('fullName')}
                        placeholder="Your full name"
                        className="h-11 rounded-lg"
                        maxLength={100}
                      />
                      {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...register('phone')}
                        placeholder="+880 1XXX-XXXXXX"
                        className="h-11 rounded-lg"
                        maxLength={20}
                      />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2 text-sm">
                      <Home className="h-3.5 w-3.5 text-muted-foreground" />
                      Street Address
                    </Label>
                    <Textarea
                      id="address"
                      {...register('address')}
                      placeholder="House #, Road #, Area"
                      className="min-h-[80px] rounded-lg resize-none"
                      maxLength={500}
                    />
                    {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="division" className="text-sm">Division</Label>
                      <Input
                        id="division"
                        {...register('division')}
                        placeholder="Dhaka"
                        className="h-11 rounded-lg"
                        maxLength={50}
                      />
                      {errors.division && <p className="text-xs text-destructive">{errors.division.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district" className="text-sm">District</Label>
                      <Input
                        id="district"
                        {...register('district')}
                        placeholder="Dhaka"
                        className="h-11 rounded-lg"
                        maxLength={50}
                      />
                      {errors.district && <p className="text-xs text-destructive">{errors.district.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thana" className="text-sm">Thana</Label>
                      <Input
                        id="thana"
                        {...register('thana')}
                        placeholder="Dhanmondi"
                        className="h-11 rounded-lg"
                        maxLength={50}
                      />
                      {errors.thana && <p className="text-xs text-destructive">{errors.thana.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center gap-2 text-sm">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      Order Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Any special instructions for delivery..."
                      className="min-h-[60px] rounded-lg resize-none"
                      maxLength={1000}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-background rounded-xl sm:rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground">Payment Method</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">Select how you want to pay</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 sm:p-5">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <div
                          key={method.id}
                          className={`relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                            method.available 
                              ? paymentMethod === method.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50 cursor-pointer'
                              : 'border-border/50 bg-muted/30 opacity-60 cursor-not-allowed'
                          }`}
                          onClick={() => method.available && setPaymentMethod(method.id)}
                        >
                          <RadioGroupItem 
                            value={method.id} 
                            id={method.id} 
                            disabled={!method.available}
                            className="sr-only"
                          />
                          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            paymentMethod === method.id && method.available
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}>
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm sm:text-base">{method.name}</span>
                              {!method.available && (
                                <span className="text-[10px] sm:text-xs bg-muted px-2 py-0.5 rounded">Coming Soon</span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground">{method.description}</p>
                          </div>
                          {paymentMethod === method.id && method.available && (
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>

                  {paymentMethod === 'cod' && (
                    <div className="mt-4 p-3 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
                        💵 <strong>Cash on Delivery:</strong> Please keep the exact amount ready. 
                        Our delivery partner will collect <strong>৳{grandTotal.toLocaleString()}</strong> at your doorstep.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Place Order Button */}
              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold rounded-xl hidden md:flex" 
                disabled={isSubmitting}
              >
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                {isSubmitting ? 'Placing Order...' : `Place Order - ৳${grandTotal.toLocaleString()}`}
              </Button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-background rounded-xl sm:rounded-2xl border border-border shadow-sm sticky top-24">
              <div className="p-4 sm:p-5 border-b border-border">
                <h2 className="font-bold text-foreground">Order Summary</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">{totalItems} item{totalItems > 1 ? 's' : ''}</p>
              </div>
              
              {/* Order Items */}
              <div className="max-h-[280px] overflow-y-auto">
                <div className="p-4 sm:p-5 space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          width={64}
                          height={64}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-2">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground flex-shrink-0">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon Code Input */}
              <div className="p-4 sm:p-5 border-t border-border">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <div>
                        <span className="font-mono font-bold text-sm text-green-700 dark:text-green-400">{appliedCoupon.code}</span>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {appliedCoupon.discount_type === 'free_delivery' ? 'Free delivery' : 
                           appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% off` : 
                           `৳${appliedCoupon.discount_value} off`}
                          {couponDiscount > 0 && ` (-৳${couponDiscount})`}
                        </p>
                      </div>
                    </div>
                    <button onClick={removeCoupon} className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded-full">
                      <X className="h-4 w-4 text-green-600" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        className="h-10 pl-9 font-mono uppercase text-sm"
                        maxLength={20}
                        onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} className="h-10 px-4">
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="p-4 sm:p-5 border-t border-border space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>৳{totalAmount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    <span>Delivery</span>
                  </div>
                  {appliedCoupon?.discount_type === 'free_delivery' ? (
                    <span className="line-through">৳{deliveryCharge}</span>
                  ) : (
                    <span>৳{deliveryCharge}</span>
                  )}
                </div>

                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span>Coupon ({appliedCoupon.code})</span>
                    </div>
                    <span>-৳{couponDiscount}</span>
                  </div>
                )}

                {appliedCoupon?.discount_type === 'free_delivery' && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span>Free Delivery</span>
                    </div>
                    <span>-৳{deliveryCharge}</span>
                  </div>
                )}
                
                {/* Delivery Zone Info */}
                <div className="flex items-center gap-2 text-xs p-2 sm:p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {watchedDivision ? (
                      matchedZone ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {matchedZone.zone_name} — ৳{Number(matchedZone.charge)} • {matchedZone.estimated_days}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Default rate — ৳120</span>
                      )
                    ) : (
                      'Enter division for delivery rate'
                    )}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold text-foreground">
                  <span>Total</span>
                  <span>৳{grandTotal.toLocaleString()}</span>
                </div>

                {paymentMethod === 'cod' && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10">
                    <Banknote className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-primary">Cash on Delivery</span>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="p-4 sm:p-5 border-t border-border">
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4 text-primary" />
                    <span>Fast Delivery</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="h-4 w-4 text-primary" />
                    <span>Protected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-14 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-3 sm:p-4 md:hidden z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-[10px] text-muted-foreground">Total</span>
            <p className="text-base font-bold text-foreground">৳{grandTotal.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Secure Checkout</span>
          </div>
        </div>
        <Button 
          type="submit"
          form="checkout-form"
          className="w-full h-11 text-sm font-semibold rounded-xl"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>
      
      <MobileNav />
    </div>
  );
};

export default CheckoutPage;
