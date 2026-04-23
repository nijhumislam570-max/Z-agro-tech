import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';

/**
 * On mount (and whenever the set of cart-item IDs changes), reconciles the
 * client-side cart with the latest product data from the database:
 *   - Updates prices that have drifted since add-time
 *   - Clamps quantities to current stock
 *   - Removes items that are no longer active or out of stock
 *
 * Surfaces a single toast summarizing what changed so the user is never
 * surprised by a "total mismatch" rejection at checkout.
 */
export function useCartReconciliation() {
  const { items, removeItem, reconcileItem } = useCart();
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
        .select('id, price, stock, is_active')
        .in('id', ids);

      if (cancelled || error || !data) return;

      const byId = new Map(data.map((p) => [p.id, p]));
      let priceChanges = 0;
      let stockClamps = 0;
      let removed = 0;

      // Iterate over a snapshot — store mutations during the loop are fine
      // because each action only mutates one item.
      for (const item of [...items]) {
        const live = byId.get(item.id);
        if (!live || !live.is_active || (live.stock ?? 0) <= 0) {
          removeItem(item.id);
          removed += 1;
          continue;
        }
        const liveStock = live.stock ?? 0;
        const livePrice = Number(live.price);
        const willClamp = item.quantity > liveStock;
        const willRepriced = livePrice !== item.price;
        if (willClamp || willRepriced) {
          reconcileItem(item.id, livePrice, liveStock);
          if (willClamp) stockClamps += 1;
          if (willRepriced) priceChanges += 1;
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
