import { useSyncExternalStore, useCallback, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
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
  const existing = cartItems.find(i => i.id === item.id);
  if (existing) {
    cartItems = cartItems.map(i =>
      i.id === item.id ? { ...i, quantity: i.quantity + addQty } : i
    );
  } else {
    const { quantity: _omit, ...rest } = item;
    cartItems = [...cartItems, { ...rest, quantity: addQty }];
  }
  emitChange();
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
    if (i.price === newPrice && i.quantity === nextQty) return i;
    changed = true;
    return { ...i, price: newPrice, quantity: nextQty };
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

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + (item.price * item.quantity), 0), [items]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    reconcileItem,
    totalItems,
    totalAmount,
  };
}
