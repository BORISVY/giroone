import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Driver,
  ErrorEvent,
  Incident,
  MaintenanceRecord,
  MaintenanceType,
  Movement,
  ServiceProvider,
  Trip,
  Vehicle,
} from "@/lib/fleet";

export interface FleetDataset {
  vehicles: Vehicle[];
  drivers: Driver[];
  movements: Movement[];
  trips: Trip[];
  incidents: Incident[];
  maintenance: MaintenanceRecord[];
  maintenanceTypes: MaintenanceType[];
  providers: ServiceProvider[];
  errors: ErrorEvent[];
}

// Busca todas as linhas, contornando o limite de 1000 por requisição.
async function all<T>(build: () => any): Promise<{ data: T[]; error: { message: string } | null }> {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await build().range(from, from + size - 1);
    if (error) return { data: out, error };
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < size) break;
  }
  return { data: out, error: null };
}

async function fetchFleet(): Promise<FleetDataset> {
  const [vehicles, drivers, movements, trips, incidents, maintenance, maintenanceTypes, providers, errors] =
    await Promise.all([
      all<Vehicle>(() => supabase.from("vehicles").select("*").is("deleted_at", null).order("created_at")),
      all<Driver>(() => supabase.from("drivers").select("*").is("deleted_at", null).order("name")),
      all<Movement>(() =>
        supabase.from("movements").select("*").is("deleted_at", null).order("occurred_at", { ascending: false }),
      ),
      all<Trip>(() => supabase.from("trips").select("*").order("started_at", { ascending: false })),
      all<Incident>(() =>
        supabase.from("incidents").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
      ),
      all<MaintenanceRecord>(() =>
        supabase.from("maintenance_records").select("*").is("deleted_at", null).order("performed_at", { ascending: false }),
      ),
      all<MaintenanceType>(() => supabase.from("maintenance_types").select("*").order("name")),
      all<ServiceProvider>(() => supabase.from("service_providers").select("*").order("name")),
      all<ErrorEvent>(() => supabase.from("error_events").select("*").order("created_at", { ascending: false })),
    ]);

  const first = [vehicles, drivers, movements, trips, incidents, maintenance, maintenanceTypes, providers, errors].find(
    (r) => r.error,
  );
  if (first?.error) throw new Error(first.error.message);

  return {
    vehicles: vehicles.data ?? [],
    drivers: drivers.data ?? [],
    movements: movements.data ?? [],
    trips: trips.data ?? [],
    incidents: incidents.data ?? [],
    maintenance: maintenance.data ?? [],
    maintenanceTypes: maintenanceTypes.data ?? [],
    providers: providers.data ?? [],
    errors: errors.data ?? [],
  };
}

export function useFleet() {
  return useQuery({
    queryKey: ["fleet"],
    queryFn: fetchFleet,
    staleTime: 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });
}

export const EMPTY_FLEET: FleetDataset = {
  vehicles: [],
  drivers: [],
  movements: [],
  trips: [],
  incidents: [],
  maintenance: [],
  maintenanceTypes: [],
  providers: [],
  errors: [],
};
