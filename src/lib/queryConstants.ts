/**
 * Centralized TanStack Query staleTime constants.
 * Audit P2: prevents staleTime drift between page hooks and prefetchers.
 */
export const STALE_30S = 1000 * 30;
export const STALE_1MIN = 1000 * 60;
export const STALE_2MIN = 1000 * 60 * 2;
export const STALE_5MIN = 1000 * 60 * 5;
export const STALE_15MIN = 1000 * 60 * 15;
export const STALE_30MIN = 1000 * 60 * 30;

export const GC_10MIN = 1000 * 60 * 10;
export const GC_30MIN = 1000 * 60 * 30;
export const GC_1HR = 1000 * 60 * 60;
