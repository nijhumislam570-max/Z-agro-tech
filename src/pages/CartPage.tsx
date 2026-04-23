import { useNavigate, Link } from 'react-router-dom';
import { memo, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useCartReconciliation } from '@/hooks/useCartReconciliation';
import { Button } from '@/components/ui/button';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  ShoppingCart,
  Truck,
  Shield,
  Tag,
  ChevronRight,
  Package,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useDeliveryCharge, FREE_DELIVERY_THRESHOLD } from '@/hooks/useDeliveryCharge';
import type { CartItem as CartItemType } from '@/contexts/CartContext';
import SEO from '@/components/SEO';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Memoized cart item component
const CartItem = memo(({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItemType;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) => {
  const productHref = `/product/${item.id}`;
  return (
    <div
      className="bg-background rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-border shadow-sm flex gap-3 sm:gap-4"
      role="listitem"
    >
      {/* Product Image — proper anchor, supports middle-click + right-click */}
      <Link
        to={productHref}
        className="h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden bg-muted block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`View ${item.name} details`}
      >
        <img
          src={item.image || '/placeholder.svg'}
          alt={item.name}
          width={112}
          height={112}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
        />
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={productHref}
              className="font-medium text-sm sm:text-base text-foreground line-clamp-2 hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline"
            >
              <h3 className="inline">{item.name}</h3>
            </Link>
            <span className="block mt-1 w-fit text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {item.category}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground hover:text-destructive transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center self-start"
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-auto pt-3">
          {/* Quantity Selector */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden" role="group" aria-label={`Quantity controls for ${item.name}`}>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={item.quantity <= 1}
              aria-label={`Decrease quantity of ${item.name}`}
            >
              <Minus className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
            </button>
            <span className="font-medium w-8 sm:w-10 text-center text-sm sm:text-base">
              <span className="sr-only">Quantity: </span>{item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-muted transition-colors"
              aria-label={`Increase quantity of ${item.name}`}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <span className="text-base sm:text-lg font-bold text-foreground">
              ৳{(item.price * item.quantity).toLocaleString()}
            </span>
            {item.quantity > 1 && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                ৳{item.price.toLocaleString()} each
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

const CartPage = () => {
  const { items, updateQuantity, removeItem, totalAmount, clearCart, totalItems } = useCart();
  const navigate = useNavigate();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Reconcile prices/stock against the server on mount + whenever items change.
  // Surfaces a single "Cart updated" toast if anything drifts. Eliminates the
  // generic "Order total mismatch" surprise at checkout.
  useCartReconciliation();

  // Single source of truth for delivery — same hook used in CheckoutPage.
  // Cart preview uses no division (subtotal-based), checkout passes division.
  const { charge: deliveryCharge } = useDeliveryCharge(totalAmount);
  const grandTotal = totalAmount + deliveryCharge;

  // updateQuantity / removeItem from useCart are already stable refs; no need
  // to wrap in useCallback. Cart-row memo invalidates on `items` reference change.
  const cartItemList = items.map((item) => (
    <CartItem
      key={item.id}
      item={item}
      onUpdateQuantity={updateQuantity}
      onRemove={removeItem}
    />
  ));

  if (items.length === 0) {
    return (
      <div className="bg-muted/30">
        <SEO title="Shopping Cart" description="Your Z Agro Tech shopping cart is currently empty." url="/cart" noIndex />
        <main id="main-content" className="container mx-auto px-4 py-12 sm:py-16 lg:py-24 animate-page-enter">
          <div className="max-w-md mx-auto text-center">
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-muted flex items-center justify-center mx-auto mb-6" aria-hidden="true">
              <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">
              Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
            </p>
            <Button asChild size="lg" className="rounded-xl bg-primary text-primary-foreground">
              <Link to="/shop">
                <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const itemsLabel = totalItems === 1 ? 'item' : 'items';
  const remainingForFreeDelivery = FREE_DELIVERY_THRESHOLD - totalAmount;

  return (
    <div className="bg-muted/30 pb-36 md:pb-8">
      <SEO title="Shopping Cart" description="Review items in your Z Agro Tech cart." url="/cart" noIndex />

      {/* Breadcrumb */}
      <nav className="bg-background border-b border-border" aria-label="Breadcrumb">
        <div className="container mx-auto px-4 py-3">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            </li>
            <li aria-hidden="true"><ChevronRight className="h-4 w-4" /></li>
            <li><span className="text-foreground font-medium" aria-current="page">Shopping Cart</span></li>
          </ol>
        </div>
      </nav>

      <main id="main-content" className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 animate-page-enter">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground" id="cart-heading">Shopping Cart</h1>
            <p className="text-muted-foreground text-sm mt-1">{totalItems} {itemsLabel} in your cart</p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="text-sm text-destructive hover:underline flex items-center gap-1 self-start sm:self-auto min-h-[44px]"
            aria-label="Clear all items from cart"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Cart Items */}
          <section className="lg:col-span-8 space-y-3 sm:space-y-4" aria-labelledby="cart-heading" role="list">
            {cartItemList}

            {/* Continue Shopping */}
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-4"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Continue Shopping
            </Link>
          </section>

          {/* Order Summary */}
          <aside className="lg:col-span-4" aria-label="Order summary">
            <div className="bg-background rounded-xl sm:rounded-2xl border border-border shadow-card sticky top-24">
              <div className="p-4 sm:p-5 lg:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">Order Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({totalItems} {itemsLabel})</span>
                    <span>৳{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Truck className="h-4 w-4" aria-hidden="true" />
                      <span>Delivery <span className="text-[10px]">(est.)</span></span>
                    </div>
                    {deliveryCharge === 0 ? (
                      <span className="text-success font-medium">FREE</span>
                    ) : (
                      <span>৳{deliveryCharge}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground -mt-1">
                    Final delivery rate calculated at checkout based on your division.
                  </p>

                  {remainingForFreeDelivery > 0 && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-xs text-primary">
                        <Tag className="h-3 w-3 inline mr-1" aria-hidden="true" />
                        Add ৳{remainingForFreeDelivery.toLocaleString()} more for FREE delivery!
                      </p>
                    </div>
                  )}

                  <Link
                    to="/checkout#coupon"
                    className="text-xs text-primary hover:underline flex items-center gap-1.5"
                  >
                    <Tag className="h-3 w-3" aria-hidden="true" />
                    Have a coupon? Apply it at checkout.
                  </Link>

                  <Separator />

                  <div className="flex justify-between text-base sm:text-lg font-bold text-foreground pt-1">
                    <span>Total</span>
                    <span>৳{grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  asChild
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl mt-5 hidden md:flex"
                >
                  <Link to="/checkout">
                    Proceed to Checkout
                    <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
                  </Link>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="border-t border-border p-4 sm:p-5">
                <ul className="grid grid-cols-2 gap-3 text-xs" aria-label="Shopping benefits">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>Express Delivery</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>Secure Payment</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>Track Your Order</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>Quality Guaranteed</span>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-14 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-3 sm:p-4 md:hidden z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Total ({totalItems} {itemsLabel})</span>
          <span className="text-base font-bold text-foreground">৳{grandTotal.toLocaleString()}</span>
        </div>
        <Button asChild className="w-full h-11 text-sm font-semibold rounded-xl">
          <Link to="/checkout">Proceed to Checkout</Link>
        </Button>
      </div>

      {/* Clear Cart confirmation */}
      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {totalItems} {itemsLabel} from your cart. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Cart</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { clearCart(); setConfirmClearOpen(false); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Clear Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CartPage;
