import { useSyncExternalStore } from 'react';
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

// Also export for other stores (Wishlist, Cart) to subscribe to auth changes
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

// ─── Auth actions (pure, module-scope, stable identity) ──────────────

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

// Frozen, stable-identity bundle of auth actions. Consumers can destructure
// without ever causing a re-render due to changed function identity.
const authActions = Object.freeze({
  signUp: signUpAction,
  signIn: signInAction,
  signOut: signOutAction,
  refreshSession: refreshSessionAction,
  clearError: clearErrorAction,
});

export type AuthActions = typeof authActions;

// ─── Selector subscriptions (avoid full-snapshot re-renders) ─────────

function getUserSnapshot(): User | null { return state.user; }
function getSessionSnapshot(): Session | null { return state.session; }
function getLoadingSnapshot(): boolean { return state.loading; }
function getErrorSnapshot(): AuthError | null { return state.error; }

/** Subscribe to just `state.user` — re-renders only when user identity changes. */
export const useAuthUser = (): User | null =>
  useSyncExternalStore(subscribe, getUserSnapshot, getUserSnapshot);

/** Subscribe to just `state.session` — re-renders on token rotation. */
export const useAuthSession = (): Session | null =>
  useSyncExternalStore(subscribe, getSessionSnapshot, getSessionSnapshot);

/** Subscribe to `state.loading`. */
export const useAuthLoading = (): boolean =>
  useSyncExternalStore(subscribe, getLoadingSnapshot, getLoadingSnapshot);

/** Subscribe to `state.error`. */
export const useAuthError = (): AuthError | null =>
  useSyncExternalStore(subscribe, getErrorSnapshot, getErrorSnapshot);

/** Stable bundle of auth action functions — never causes re-renders. */
export const useAuthActions = (): AuthActions => authActions;

// ─── No-op Provider (backward compatible) ────────────────────────────

let providerInitialized = false;

export const AuthProvider = ({ children, queryClient }: { children: React.ReactNode; queryClient?: QueryClient }) => {
  // One-time queryClient registration — guarded against per-render reassignment.
  if (!providerInitialized && queryClient) {
    queryClientRef = queryClient;
    providerInitialized = true;
  }
  return <>{children}</>;
};

// ─── Hook (backward compatible — returns full snapshot + actions) ────

/**
 * Returns the full auth snapshot plus action functions. For new code prefer
 * the selector hooks (`useAuthUser`, `useAuthSession`, `useAuthLoading`)
 * + `useAuthActions()` to avoid unnecessary re-renders on token rotation.
 */
export const useAuth = () => {
  const authState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    signUp: authActions.signUp,
    signIn: authActions.signIn,
    signOut: authActions.signOut,
    refreshSession: authActions.refreshSession,
    clearError: authActions.clearError,
  };
};
