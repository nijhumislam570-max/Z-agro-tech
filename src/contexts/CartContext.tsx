import { useSyncExternalStore, useCallback, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  /**
   * Live max-stock cap captured when the item was added or last reconciled.
   * Optional for backward compatibility with carts saved before this field
   * existed; treat `undefined` as "unknown — don't clamp on `+`".
   */
  stock?: number;
}

// ─── Module-level store (singleton, no React context needed) ─────────

const CART_STORAGE_KEY = 'zagrotech-cart';
const LEGACY_CART_STORAGE_KEY = 'vetmedix-cart';

function readStoredCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) return JSON.parse(stored);

    // One-time migration from the legacy Vetmedix-era storage key.
    // Any returning user with an old cart in localStorage will keep their
    // items on first load, then we delete the legacy entry.
    // TODO: Remove after 2026-Q3
    const legacy = localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
      if (Array.isArray(parsed)) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
    return [];
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    return [];
  }
}

let cartItems: CartItem[] = readStoredCart();
const listeners = new Set<() => void>();

function emitChange() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot(): CartItem[] {
  return cartItems;
}

// ─── Store actions (pure functions, no hooks) ────────────────────────

function addItemToStore(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
  const addQty = Math.max(1, item.quantity ?? 1);
  const cap = item.stock ?? Infinity;
  const existing = cartItems.find(i => i.id === item.id);
  if (existing) {
    // Refresh the stock cap on re-add so the cart always knows the latest
    // ceiling — and clamp the resulting quantity to it.
    const nextStock = item.stock ?? existing.stock;
    const nextCap = nextStock ?? Infinity;
    const nextQty = Math.min(existing.quantity + addQty, nextCap);
    cartItems = cartItems.map(i =>
      i.id === item.id ? { ...i, quantity: nextQty, stock: nextStock } : i
    );
  } else {
    const { quantity: _omit, ...rest } = item;
    cartItems = [...cartItems, { ...rest, quantity: Math.min(addQty, cap) }];
  }
  emitChange();
}

function updateItemStockInStore(id: string, stock: number) {
  let changed = false;
  cartItems = cartItems.map((i) => {
    if (i.id !== id) return i;
    if (i.stock === stock) return i;
    changed = true;
    return { ...i, stock };
  });
  if (changed) emitChange();
}

function removeItemFromStore(id: string) {
  cartItems = cartItems.filter(item => item.id !== id);
  emitChange();
}

function updateQuantityInStore(id: string, quantity: number) {
  if (quantity <= 0) {
    cartItems = cartItems.filter(item => item.id !== id);
  } else {
    cartItems = cartItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    );
  }
  emitChange();
}

function clearStore() {
  cartItems = [];
  emitChange();
}

/**
 * Updates an existing item's price and clamps quantity to a new max stock.
 * Used by `useCartReconciliation` to sync cart with the latest server data.
 * Returns true when something actually changed.
 */
function reconcileItemInStore(id: string, newPrice: number, maxStock: number) {
  let changed = false;
  cartItems = cartItems.map((i) => {
    if (i.id !== id) return i;
    const nextQty = Math.min(i.quantity, maxStock);
    if (i.price === newPrice && i.quantity === nextQty && i.stock === maxStock) return i;
    changed = true;
    return { ...i, price: newPrice, quantity: nextQty, stock: maxStock };
  });
  if (changed) emitChange();
  return changed;
}

// ─── No-op Provider (backward compatible, renders children only) ────

export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ─── Hook (uses useSyncExternalStore — no context, no provider) ─────

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    addItemToStore(item);
  }, []);

  const removeItem = useCallback((id: string) => {
    removeItemFromStore(id);
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    updateQuantityInStore(id, quantity);
  }, []);

  const clearCart = useCallback(() => {
    clearStore();
  }, []);

  const reconcileItem = useCallback((id: string, newPrice: number, maxStock: number) => {
    return reconcileItemInStore(id, newPrice, maxStock);
  }, []);

  const updateItemStock = useCallback((id: string, stock: number) => {
    updateItemStockInStore(id, stock);
  }, []);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + (item.price * item.quantity), 0), [items]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    reconcileItem,
    updateItemStock,
    totalItems,
    totalAmount,
  };
}
