import * as React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface Props {
  /** The trigger button (cart icon with badge). */
  children: React.ReactNode;
}

const PREVIEW_LIMIT = 3;

/**
 * Right-side cart quick-peek drawer opened by clicking the Navbar cart icon.
 * Shows up to 3 items with quantity controls, the running subtotal, and CTAs
 * to view the full cart or jump straight to checkout. Empty state mirrors
 * the full /cart page so the UX feels consistent.
 */
export const CartQuickPeek = ({ children }: Props) => {
  const [open, setOpen] = React.useState(false);
  const { items, totalItems, totalAmount, updateQuantity, removeItem } = useCart();

  const visibleItems = items.slice(0, PREVIEW_LIMIT);
  const remaining = Math.max(0, items.length - PREVIEW_LIMIT);

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Your Cart
            {totalItems > 0 && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-foreground">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Browse fresh agri-supplies and add items to get started.
              </p>
            </div>
            <Link to="/shop" onClick={close}>
              <Button className="gap-2">
                <ShoppingBag className="h-4 w-4" /> Start shopping
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <ul className="divide-y divide-border/40">
                {visibleItems.map((item) => (
                  <li key={item.id} className="px-5 py-4 flex items-start gap-3">
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground line-clamp-2">{item.name}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{item.category}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-md border border-border/60 bg-background overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-primary tabular-nums">
                          ৳{(item.price * item.quantity).toFixed(0)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition p-1 -m-1"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              {remaining > 0 ? (
                <div className="px-5 py-3 text-center text-xs text-muted-foreground bg-muted/30 border-t border-border/40">
                  + {remaining} more {remaining === 1 ? 'item' : 'items'} —{' '}
                  <Link
                    to="/cart"
                    onClick={close}
                    className="text-primary font-semibold hover:underline"
                  >
                    view full cart
                  </Link>
                </div>
              ) : (
                <div className="px-5 py-3 text-center text-xs text-muted-foreground bg-muted/30 border-t border-border/40">
                  <Link
                    to="/cart"
                    onClick={close}
                    className="text-primary font-semibold hover:underline"
                  >
                    Open the full cart
                  </Link>{' '}
                  to apply coupons or edit shipping details.
                </div>
              )}
            </ScrollArea>

            <div className="border-t border-border/50 bg-card/60 backdrop-blur-sm px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-bold text-foreground tabular-nums">
                  ৳{totalAmount.toFixed(0)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping &amp; discounts calculated at checkout.
              </p>
              <Separator />
              <div className="flex flex-col gap-2">
                <Link to="/checkout" onClick={close}>
                  <Button size="lg" className={cn('w-full gap-2')}>
                    Checkout <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/cart" onClick={close}>
                  <Button size="sm" variant="ghost" className="w-full">
                    View full cart
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartQuickPeek;
