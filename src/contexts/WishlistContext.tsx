import { useSyncExternalStore, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { authSubscribe, getAuthUser } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ─── Module-level wishlist store ─────────────────────────────────────

let wishlistIds = new Set<string>();
let loading = false;
const listeners = new Set<() => void>();
let currentUserId: string | null = null;

interface WishlistSnapshot {
  wishlistIds: Set<string>;
  loading: boolean;
}

let snapshot: WishlistSnapshot = { wishlistIds, loading };

function emitChange() {
  snapshot = { wishlistIds: new Set(wishlistIds), loading };
  listeners.forEach(fn => fn());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot(): WishlistSnapshot {
  return snapshot;
}

async function fetchWishlist(userId: string) {
  loading = true;
  emitChange();
  try {
    const { data } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', userId);
    if (data) {
      wishlistIds = new Set(data.map(w => w.product_id));
    }
  } catch {
    toast.error('Failed to load wishlist');
  } finally {
    loading = false;
    emitChange();
  }
}

async function toggleWishlistAction(productId: string): Promise<boolean> {
  const user = getAuthUser();
  if (!user) return false;

  const isCurrently = wishlistIds.has(productId);

  // Optimistic update
  if (isCurrently) wishlistIds.delete(productId);
  else wishlistIds.add(productId);
  emitChange();

  try {
    if (isCurrently) {
      await supabase.from('wishlists').delete()
        .eq('user_id', user.id).eq('product_id', productId);
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
    }
    return true;
  } catch {
    // Revert
    if (isCurrently) wishlistIds.add(productId);
    else wishlistIds.delete(productId);
    emitChange();
    toast.error('Failed to update wishlist');
    return false;
  }
}

// Subscribe to auth changes at module level
authSubscribe(() => {
  const user = getAuthUser();
  const newUserId = user?.id ?? null;
  if (newUserId !== currentUserId) {
    currentUserId = newUserId;
    if (newUserId) {
      fetchWishlist(newUserId);
    } else {
      wishlistIds = new Set();
      emitChange();
    }
  }
});

// ─── No-op Provider ──────────────────────────────────────────────────

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// ─── Hook ────────────────────────────────────────────────────────────

export const useWishlist = () => {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const isWishlisted = useCallback((productId: string) => {
    return state.wishlistIds.has(productId);
  }, [state.wishlistIds]);

  const toggleWishlist = useCallback(toggleWishlistAction, []);

  const refetch = useCallback(async () => {
    const user = getAuthUser();
    if (user) await fetchWishlist(user.id);
  }, []);

  return {
    wishlistIds: state.wishlistIds,
    isWishlisted,
    toggleWishlist,
    loading: state.loading,
    refetch,
  };
};
