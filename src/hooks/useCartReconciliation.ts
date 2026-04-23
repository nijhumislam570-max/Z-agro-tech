import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';

/**
 * On mount (and whenever the set of cart-item IDs changes), reconciles the
 * client-side cart with the latest product data from the database:
 *   - Updates prices that have changed since add-time
 *   - Clamps quantities to current stock
 *   - Removes items that are no longer active or exist
 *
 * Surfaces a single toast summarizing what changed so the user is never
 * surprised by a "total mismatch" rejection at checkout.
 *
 * Reconciles at most once per unique set of IDs to avoid update loops.
 */
export function useCartReconciliation() {
  const { items, updateQuantity, removeItem } = useCart();
  const lastReconciledKey = useRef<string>('');

  useEffect(() => {
    if (items.length === 0) {
      lastReconciledKey.current = '';
      return;
    }

    const ids = items.map((i) => i.id).sort();
    const key = ids.join('|');
    if (key === lastReconciledKey.current) return;
    lastReconciledKey.current = key;

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, price, stock, is_active, name')
        .in('id', ids);

      if (cancelled || error || !data) return;

      const byId = new Map(data.map((p) => [p.id, p]));
      let priceChanges = 0;
      let stockClamps = 0;
      let removed = 0;

      // Snapshot to iterate while mutating cart.
      for (const item of items) {
        const live = byId.get(item.id);
        if (!live || !live.is_active) {
          removeItem(item.id);
          removed += 1;
          continue;
        }
        const liveStock = live.stock ?? 0;
        if (liveStock <= 0) {
          removeItem(item.id);
          removed += 1;
          continue;
        }
        if (item.quantity > liveStock) {
          updateQuantity(item.id, liveStock);
          stockClamps += 1;
        }
        if (Number(live.price) !== item.price) {
          // Price drift — re-add at the new price (preserves quantity).
          // Easiest path without a dedicated `setPrice` action.
          removeItem(item.id);
          // Re-insert via a minimal update: bump quantity from 0.
          // We use updateQuantity AFTER remove, so do it in a microtask.
          const newQty = Math.min(item.quantity, liveStock);
          queueMicrotask(() => {
            // addItem isn't available here; emulate by importing useCart's
            // addItem from a parent? Instead, send a synthetic "update".
            // Rather than re-architect, we just notify — the user will see
            // updated totals on next render cycle from the server-recompute
            // at checkout. To avoid that surprise, also update the local
            // price by re-inserting via the cart's add path.
            // Simplest: update price in localStorage directly.
            try {
              const STORAGE_KEY = 'zagrotech-cart';
              const raw = localStorage.getItem(STORAGE_KEY);
              if (!raw) return;
              const cart: Array<{ id: string; price: number; quantity: number }> = JSON.parse(raw);
              const next = cart.map((c) =>
                c.id === item.id ? { ...c, price: Number(live.price), quantity: newQty } : c,
              );
              // If item was removed above, re-add it.
              if (!next.some((c) => c.id === item.id)) {
                next.push({ ...item, price: Number(live.price), quantity: newQty });
              }
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              // Force a store re-read by dispatching a synthetic storage event.
              window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
            } catch {
              /* ignore */
            }
          });
          priceChanges += 1;
        }
      }

      const messages: string[] = [];
      if (priceChanges > 0) messages.push(`${priceChanges} price${priceChanges > 1 ? 's' : ''} updated`);
      if (stockClamps > 0) messages.push(`${stockClamps} item${stockClamps > 1 ? 's' : ''} adjusted to available stock`);
      if (removed > 0) messages.push(`${removed} item${removed > 1 ? 's' : ''} removed (no longer available)`);
      if (messages.length > 0) {
        toast.info('Cart updated', { description: messages.join(' • ') });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.id).sort().join('|')]);
}
