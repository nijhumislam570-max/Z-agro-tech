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

const CART_STORAGE_KEY = 'vetmedix-cart';

function readStoredCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
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

function addItemToStore(item: Omit<CartItem, 'quantity'>) {
  const existing = cartItems.find(i => i.id === item.id);
  if (existing) {
    cartItems = cartItems.map(i =>
      i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
    );
  } else {
    cartItems = [...cartItems, { ...item, quantity: 1 }];
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

// ─── No-op Provider (backward compatible, renders children only) ────

export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ─── Hook (uses useSyncExternalStore — no context, no provider) ─────

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
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

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + (item.price * item.quantity), 0), [items]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalAmount,
  };
}
