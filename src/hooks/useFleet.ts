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

async function fetchFleet(): Promise<FleetDataset> {
  const [vehicles, drivers, movements, trips, incidents, maintenance, maintenanceTypes, providers, errors] =
    await Promise.all([
      supabase.from("vehicles").select("*").is("deleted_at", null).order("created_at"),
      supabase.from("drivers").select("*").is("deleted_at", null).order("name"),
      supabase.from("movements").select("*").is("deleted_at", null).order("occurred_at", { ascending: false }),
      supabase.from("trips").select("*").order("started_at", { ascending: false }),
      supabase.from("incidents").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase
        .from("maintenance_records")
        .select("*")
        .is("deleted_at", null)
        .order("performed_at", { ascending: false }),
      supabase.from("maintenance_types").select("*").order("name"),
      supabase.from("service_providers").select("*").order("name"),
      supabase.from("error_events").select("*").order("created_at", { ascending: false }),
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
  return useQuery({ queryKey: ["fleet"], queryFn: fetchFleet, staleTime: 15_000 });
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
