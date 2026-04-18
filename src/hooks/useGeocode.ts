import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GeocodeResult = {
  lat: number;
  lng: number;
  display_name?: string;
};

export function useGeocode(query: string) {
  return useQuery({
    queryKey: ["geocode", query],
    enabled: Boolean(query?.trim()),
    staleTime: 1000 * 60 * 60 * 24, // 24h
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7d
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("geocode", {
        body: { q: query },
      });

      if (error) throw error;
      return data as GeocodeResult;
    },
  });
}
