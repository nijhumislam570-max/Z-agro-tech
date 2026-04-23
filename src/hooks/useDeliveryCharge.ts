import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_5MIN } from '@/lib/queryConstants';

/**
 * Centralized delivery-charge calculation. Used by both Cart (preview) and
 * Checkout (final) to guarantee a consistent total across pages.
 *
 * Rules:
 *   1. If a `division` is provided AND matches an active `delivery_zones`
 *      row → use that zone's `charge`.
 *   2. If a `division` is provided but no zone matches → fallback ৳120.
 *   3. If no `division` is known yet → use the cart-page preview rate of
 *      ৳60 (or FREE when subtotal ≥ ৳500). This keeps the Cart estimate
 *      friendly without locking in a wrong zone fee.
 */
export interface DeliveryChargeResult {
  /** Final delivery charge in BDT. */
  charge: number;
  /** Human-readable matched zone name, or null when using fallback. */
  zoneName: string | null;
  /** True while the zones query is in flight. */
  isLoading: boolean;
}

const FREE_DELIVERY_THRESHOLD = 500;
const PREVIEW_FLAT_RATE = 60;
const FALLBACK_ZONE_RATE = 120;

export const useDeliveryCharge = (
  subtotal: number,
  division?: string | null,
): DeliveryChargeResult => {
  const { data: zones = [], isLoading } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: STALE_5MIN,
  });

  return useMemo(() => {
    // Case 3: no division → cart-style preview
    if (!division || !division.trim()) {
      return {
        charge: subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : PREVIEW_FLAT_RATE,
        zoneName: null,
        isLoading,
      };
    }

    // Case 1: matched zone
    const normalized = division.trim().toLowerCase();
    const matched = zones.find((z) =>
      (z.divisions as string[] | null)?.some((d) => d.toLowerCase() === normalized),
    );
    if (matched) {
      return {
        charge: Number(matched.charge),
        zoneName: matched.zone_name,
        isLoading,
      };
    }

    // Case 2: division given but unknown
    return { charge: FALLBACK_ZONE_RATE, zoneName: null, isLoading };
  }, [subtotal, division, zones, isLoading]);
};
