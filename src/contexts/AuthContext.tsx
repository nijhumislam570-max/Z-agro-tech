import { useSyncExternalStore, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { QueryClient } from '@tanstack/react-query';

// ─── Module-level auth store (external store pattern) ────────────────

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

let state: AuthState = { user: null, session: null, loading: true, error: null };
let queryClientRef: QueryClient | null = null;

const listeners = new Set<() => void>();

function emitChange() {
  // Create a new state reference so useSyncExternalStore detects the change
  state = { ...state };
  listeners.forEach(fn => fn());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot(): AuthState {
  return state;
}

// Also export for other stores (Wishlist, Pet) to subscribe to auth changes
export const authSubscribe = subscribe;
export function getAuthUser(): User | null { return state.user; }

// Start the Supabase auth listener immediately at module load
supabase.auth.onAuthStateChange((event, currentSession) => {
  if (event === 'SIGNED_OUT' && queryClientRef) {
    queryClientRef.clear();
  }
  state.session = currentSession;
  state.user = currentSession?.user ?? null;
  state.loading = false;
  state.error = null;
  emitChange();
});

// ─── Auth actions (pure functions) ───────────────────────────────────

async function signUpAction(email: string, password: string, fullName: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    if (error) {
      if (error.message.includes('already registered')) {
        return { error: new Error('This email is already registered. Please sign in instead.'), user: null };
      }
      return { error, user: null };
    }
    return { error: null, user: data.user };
  } catch (err) {
    return { error: err as Error, user: null };
  }
}

async function signInAction(email: string, password: string) {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: new Error('Invalid email or password. Please try again.') };
      }
      return { error };
    }
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

async function signOutAction() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    logger.error('Error signing out:', err);
  }
}

async function refreshSessionAction() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      logger.error('Error refreshing session:', error);
      state.error = error;
      emitChange();
    } else if (data.session) {
      state.session = data.session;
      state.user = data.session.user;
      emitChange();
    }
  } catch (err) {
    logger.error('Error refreshing session:', err);
  }
}

function clearErrorAction() {
  state.error = null;
  emitChange();
}

// ─── No-op Provider (backward compatible) ────────────────────────────

export const AuthProvider = ({ children, queryClient }: { children: React.ReactNode; queryClient?: QueryClient }) => {
  // Register queryClient reference (no hooks, just assignment)
  if (queryClient) queryClientRef = queryClient;
  return <>{children}</>;
};

// ─── Hook ────────────────────────────────────────────────────────────

export const useAuth = () => {
  const authState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const signUp = useCallback(signUpAction, []);
  const signIn = useCallback(signInAction, []);
  const signOut = useCallback(signOutAction, []);
  const refreshSession = useCallback(refreshSessionAction, []);
  const clearError = useCallback(clearErrorAction, []);

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    signUp,
    signIn,
    signOut,
    refreshSession,
    clearError,
  };
};
