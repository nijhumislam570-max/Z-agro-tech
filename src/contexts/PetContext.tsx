import { useSyncExternalStore, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { authSubscribe, getAuthUser } from '@/contexts/AuthContext';
import type { Pet } from '@/types/social';

// ─── Module-level pet store ──────────────────────────────────────────

let pets: Pet[] = [];
let activePet: Pet | null = null;
let loading = true;
let currentUserId: string | null = null;
const listeners = new Set<() => void>();

interface PetSnapshot {
  pets: Pet[];
  activePet: Pet | null;
  loading: boolean;
}

let snapshot: PetSnapshot = { pets, activePet, loading };

function emitChange() {
  snapshot = { pets: [...pets], activePet, loading };
  listeners.forEach(fn => fn());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot(): PetSnapshot {
  return snapshot;
}

async function fetchPets(userId: string) {
  try {
    const { data, error } = await supabase
      .from('pets')
      .select('id, user_id, name, species, breed, age, bio, avatar_url, cover_photo_url, location, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    pets = (data || []) as Pet[];
    if (pets.length > 0 && !activePet) {
      activePet = pets[0];
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error fetching pets:', error);
    }
  } finally {
    loading = false;
    emitChange();
  }
}

function setActivePetAction(pet: Pet | null) {
  activePet = pet;
  emitChange();
}

async function refreshPetsAction() {
  const user = getAuthUser();
  if (!user) {
    pets = [];
    activePet = null;
    loading = false;
    emitChange();
    return;
  }
  await fetchPets(user.id);
}

// Subscribe to auth changes at module level
authSubscribe(() => {
  const user = getAuthUser();
  const newUserId = user?.id ?? null;
  if (newUserId !== currentUserId) {
    currentUserId = newUserId;
    if (newUserId) {
      fetchPets(newUserId);
    } else {
      pets = [];
      activePet = null;
      loading = false;
      emitChange();
    }
  }
});

// ─── No-op Provider ──────────────────────────────────────────────────

export const PetProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// ─── Hook ────────────────────────────────────────────────────────────

export const usePets = () => {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setActivePet = useCallback(setActivePetAction, []);
  const refreshPets = useCallback(refreshPetsAction, []);

  return {
    pets: state.pets,
    activePet: state.activePet,
    setActivePet,
    loading: state.loading,
    refreshPets,
  };
};
