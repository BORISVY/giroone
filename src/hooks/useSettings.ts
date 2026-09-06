import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FleetSettings {
  trip_tolerance_hours: number;
  require_photo: boolean;
  km_max_jump: number;
}

export const DEFAULT_SETTINGS: FleetSettings = {
  trip_tolerance_hours: 12,
  require_photo: true,
  km_max_jump: 1000,
};

export function useSettings() {
  return useQuery({
    queryKey: ["settings", "geral"],
    staleTime: 60_000,
    queryFn: async (): Promise<FleetSettings> => {
      const { data, error } = await supabase.from("settings").select("value").eq("key", "geral").maybeSingle();
      if (error) throw new Error(error.message);
      const value = (data?.value ?? {}) as Partial<FleetSettings>;
      return { ...DEFAULT_SETTINGS, ...value };
    },
  });
}
