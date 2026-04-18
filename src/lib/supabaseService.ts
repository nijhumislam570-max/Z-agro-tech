/**
 * Supabase Service Wrapper
 * Standardized error handling for all data fetching operations.
 * Automatically surfaces user-friendly toast messages on failure.
 */
import { toast } from 'sonner';

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

// Human-readable messages for common Supabase/HTTP error codes
const getErrorMessage = (code: string | number | undefined, fallback: string): string => {
  const map: Record<string, string> = {
    'PGRST116': 'Item not found.',
    'PGRST301': 'Session expired. Please log in again.',
    '23505':    'This record already exists.',
    '23503':    'Related item not found.',
    '42501':    'You do not have permission to do that.',
    '401':      'Session expired. Please log in again.',
    '403':      'Access denied.',
    '404':      'Resource not found.',
    '500':      'Server error. Please try again shortly.',
    '503':      'Service temporarily unavailable.',
    'NetworkError': 'Network error. Please check your connection.',
    'Failed to fetch': 'Network error. Please check your connection.',
  };
  const key = String(code ?? '');
  return map[key] ?? fallback;
};

/**
 * Wraps a Supabase query promise and handles errors uniformly.
 * Shows a toast on error and returns a typed result object.
 *
 * @param promise  - A Supabase `.select()` / `.insert()` etc. call
 * @param userMsg  - The friendly message shown in the toast on failure
 */
export async function safeQuery<T>(
  promise: Promise<{ data: T | null; error: { message: string; code?: string; status?: number } | null }>,
  userMsg: string
): Promise<ServiceResult<T>> {
  try {
    const { data, error } = await promise;

    if (error) {
      const message = getErrorMessage(error.code ?? error.status, userMsg);
      toast.error(message);
      console.error('[supabaseService]', error);
      return { data: null, error: message };
    }

    return { data, error: null };
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : String(err);
    const message = getErrorMessage(raw, userMsg);
    toast.error(message);
    console.error('[supabaseService] Unexpected error:', err);
    return { data: null, error: message };
  }
}

/**
 * Wraps a mutation (insert/update/delete) with a loading toast lifecycle.
 * Shows success or error toasts automatically.
 */
export async function safeMutation<T>(
  promise: Promise<{ data: T | null; error: { message: string; code?: string; status?: number } | null }>,
  { successMsg, errorMsg }: { successMsg: string; errorMsg: string }
): Promise<ServiceResult<T>> {
  try {
    const { data, error } = await promise;

    if (error) {
      const message = getErrorMessage(error.code ?? error.status, errorMsg);
      toast.error(message);
      console.error('[supabaseService]', error);
      return { data: null, error: message };
    }

    toast.success(successMsg);
    return { data, error: null };
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : String(err);
    const message = getErrorMessage(raw, errorMsg);
    toast.error(message);
    console.error('[supabaseService] Unexpected error:', err);
    return { data: null, error: message };
  }
}
