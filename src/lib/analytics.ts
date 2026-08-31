import type { FleetDataset } from "@/hooks/useFleet";
import { inRange, monthKey, type Range } from "@/lib/period";
import type { IncidentCategory, IncidentStatus } from "@/lib/fleet";

export interface DriverMetric {
  id: string;
  name: string;
  exits: number;
  returns: number;
  movements: number;
  trips: number;
  km: number;
  corrected: number;
  blockedErrors: number;
  realErrors: number;
  errorRate: number;
  quality: number;
  incidents: number;
  incidentsResolved: number;
  duplicateExits: number;
  returnsWithoutExit: number;
  kmErrors: number;
}

export interface VehicleMetric {
  id: string;
  label: string;
  plate: string;
  exits: number;
  trips: number;
  km: number;
  usageMs: number;
  avgKmPerTrip: number;
  avgDurationMs: number;
  distinctDrivers: number;
  incidents: number;
  pendingIncidents: number;
  maintenanceCount: number;
  maintenanceCost: number;
  costPerKm: number;
  sharePct: number;
}

export interface Analytics {
  totals: {
    vehicles: number;
    available: number;
    inUse: number;
    pendingReturns: number;
    km: number;
    trips: number;
    movements: number;
    incidents: number;
    pendingIncidents: number;
    maintenanceCount: number;
    maintenanceCost: number;
    corrections: number;
    blockedErrors: number;
    avgResolutionMs: number;
    costPerKm: number;
  };
  drivers: DriverMetric[];
  vehicles: VehicleMetric[];
  matrix: { driverId: string; driverName: string; cells: Record<string, number> }[];
  topCombo: { driver: string; vehicle: string; count: number } | null;
  incidentsByStatus: Record<IncidentStatus, number>;
  incidentsByCategory: { name: string; value: number }[];
  errorsByKind: { name: string; value: number }[];
  timeline: { month: string; km: number; trips: number; incidents: number; cost: number }[];
  maintenanceByProvider: { name: string; count: number; total: number; avg: number }[];
  openTrips: {
    tripId: string;
    vehicleId: string;
    vehicle: string;
    driver: string;
    startedAt: string;
    km: number;
    openMs: number;
  }[];
  agingIncidents: { id: string; number: number; description: string; days: number; vehicle: string }[];
}

const CATEGORY_LABEL: Record<IncidentCategory, string> = {
  pneus: "Pneus",
  freios: "Freios",
  motor: "Motor",
  suspensao: "Suspensão",
  eletrica: "Elétrica",
  funilaria: "Funilaria",
  ar_condicionado: "Ar-condicionado",
  documentacao: "Documentação",
  limpeza: "Limpeza",
  seguranca: "Segurança",
  equipamentos: "Equipamentos",
  outros: "Outros",
};

const ERROR_LABEL: Record<string, string> = {
  saida_duplicada: "Saída duplicada",
  retorno_sem_saida: "Retorno sem saída",
  km_invalido: "KM incorreto",
  correcao: "Lançamento corrigido",
  retorno_esquecido: "Retorno esquecido",
  veiculo_incorreto: "Veículo incorreto",
  outros: "Outros",
};

export function buildAnalytics(data: FleetDataset, range: Range, pendingReturnHours = 12): Analytics {
  const now = Date.now();
  const movements = data.movements.filter((m) => inRange(m.occurred_at, range));
  const trips = data.trips.filter((t) => inRange(t.started_at, range));
  const incidents = data.incidents.filter((i) => inRange(i.created_at, range));
  const maintenance = data.maintenance.filter((m) => inRange(m.performed_at, range));
  const errors = data.errors.filter((e) => inRange(e.created_at, range));

  const vehicleById = new Map(data.vehicles.map((v) => [v.id, v]));
  const driverById = new Map(data.drivers.map((d) => [d.id, d]));
  const vLabel = (id: string) => {
    const v = vehicleById.get(id);
    return v ? `${[v.brand, v.model].filter(Boolean).join(" ")} · ${v.plate}` : "—";
  };

  const tripKm = (t: (typeof trips)[number]) => Number(t.distance_km ?? 0);
  const tripMs = (t: (typeof trips)[number]) =>
    t.ended_at ? new Date(t.ended_at).getTime() - new Date(t.started_at).getTime() : 0;

  // ---- Drivers
  const drivers: DriverMetric[] = data.drivers.map((d) => {
    const dm = movements.filter((m) => m.driver_id === d.id);
    const dt = trips.filter((t) => t.driver_id === d.id);
    const de = errors.filter((e) => e.driver_id === d.id);
    const di = incidents.filter((i) => i.driver_id === d.id);
    const corrected = dm.filter((m) => m.corrected).length;
    const blocked = de.filter((e) => e.blocked).length;
    const real = corrected;
    const total = dm.length || 0;
    return {
      id: d.id,
      name: d.name,
      exits: dm.filter((m) => m.type === "saida").length,
      returns: dm.filter((m) => m.type === "retorno").length,
      movements: total,
      trips: dt.length,
      km: dt.reduce((s, t) => s + tripKm(t), 0),
      corrected,
      blockedErrors: blocked,
      realErrors: real,
      errorRate: total ? (real / total) * 100 : 0,
      quality: total ? ((total - real) / total) * 100 : 100,
      incidents: di.length,
      incidentsResolved: di.filter((i) => i.status === "realizada").length,
      duplicateExits: de.filter((e) => e.kind === "saida_duplicada").length,
      returnsWithoutExit: de.filter((e) => e.kind === "retorno_sem_saida").length,
      kmErrors: de.filter((e) => e.kind === "km_invalido").length,
    };
  });

  // ---- Vehicles
  const totalTripsAll = trips.length || 1;
  const vehicles: VehicleMetric[] = data.vehicles.map((v) => {
    const vt = trips.filter((t) => t.vehicle_id === v.id);
    const vm = movements.filter((m) => m.vehicle_id === v.id);
    const vi = incidents.filter((i) => i.vehicle_id === v.id);
    const vmaint = maintenance.filter((m) => m.vehicle_id === v.id);
    const km = vt.reduce((s, t) => s + tripKm(t), 0);
    const usageMs = vt.reduce((s, t) => s + tripMs(t), 0);
    const closed = vt.filter((t) => t.ended_at).length || 0;
    const cost = vmaint.reduce((s, m) => s + Number(m.amount ?? 0), 0);
    return {
      id: v.id,
      label: `${[v.brand, v.model].filter(Boolean).join(" ")}`,
      plate: v.plate,
      exits: vm.filter((m) => m.type === "saida").length,
      trips: vt.length,
      km,
      usageMs,
      avgKmPerTrip: closed ? km / closed : 0,
      avgDurationMs: closed ? usageMs / closed : 0,
      distinctDrivers: new Set(vt.map((t) => t.driver_id)).size,
      incidents: vi.length,
      pendingIncidents: vi.filter((i) => i.status === "pendente" || i.status === "nova").length,
      maintenanceCount: vmaint.length,
      maintenanceCost: cost,
      costPerKm: km ? cost / km : 0,
      sharePct: (vt.length / totalTripsAll) * 100,
    };
  });

  // ---- Matrix driver x vehicle
  const matrix = data.drivers.map((d) => {
    const cells: Record<string, number> = {};
    data.vehicles.forEach((v) => {
      cells[v.id] = trips.filter((t) => t.driver_id === d.id && t.vehicle_id === v.id).length;
    });
    return { driverId: d.id, driverName: d.name, cells };
  });

  let topCombo: Analytics["topCombo"] = null;
  matrix.forEach((row) => {
    Object.entries(row.cells).forEach(([vid, count]) => {
      if (count > (topCombo?.count ?? 0)) {
        topCombo = { driver: row.driverName, vehicle: vLabel(vid), count };
      }
    });
  });

  // ---- Incidents
  const incidentsByStatus = {
    nova: 0,
    visualizada: 0,
    pendente: 0,
    realizada: 0,
    recusada: 0,
  } as Record<IncidentStatus, number>;
  incidents.forEach((i) => {
    incidentsByStatus[i.status] += 1;
  });

  const catMap = new Map<string, number>();
  incidents.forEach((i) => {
    const label = CATEGORY_LABEL[i.category];
    catMap.set(label, (catMap.get(label) ?? 0) + 1);
  });

  const resolved = incidents.filter((i) => i.status === "realizada" && i.resolved_at);
  const avgResolutionMs = resolved.length
    ? resolved.reduce((s, i) => s + (new Date(i.resolved_at!).getTime() - new Date(i.created_at).getTime()), 0) /
      resolved.length
    : 0;

  const errMap = new Map<string, number>();
  errors.forEach((e) => {
    const label = ERROR_LABEL[e.kind] ?? e.kind;
    errMap.set(label, (errMap.get(label) ?? 0) + 1);
  });

  // ---- Timeline
  const tl = new Map<string, { km: number; trips: number; incidents: number; cost: number }>();
  const bump = (key: string) => {
    if (!tl.has(key)) tl.set(key, { km: 0, trips: 0, incidents: 0, cost: 0 });
    return tl.get(key)!;
  };
  trips.forEach((t) => {
    const b = bump(monthKey(t.started_at));
    b.km += tripKm(t);
    b.trips += 1;
  });
  incidents.forEach((i) => {
    bump(monthKey(i.created_at)).incidents += 1;
  });
  maintenance.forEach((m) => {
    bump(monthKey(m.performed_at)).cost += Number(m.amount ?? 0);
  });
  const timeline = [...tl.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));

  // ---- Providers
  const provMap = new Map<string, { count: number; total: number }>();
  maintenance.forEach((m) => {
    const name = data.providers.find((p) => p.id === m.provider_id)?.name ?? "Não informado";
    const cur = provMap.get(name) ?? { count: 0, total: 0 };
    cur.count += 1;
    cur.total += Number(m.amount ?? 0);
    provMap.set(name, cur);
  });
  const maintenanceByProvider = [...provMap.entries()]
    .map(([name, v]) => ({ name, count: v.count, total: v.total, avg: v.total / v.count }))
    .sort((a, b) => b.total - a.total);

  // ---- Open trips / pending returns (sempre em tempo real, fora do período)
  const openTrips = data.trips
    .filter((t) => t.open)
    .map((t) => ({
      tripId: t.id,
      vehicleId: t.vehicle_id,
      vehicle: vLabel(t.vehicle_id),
      driver: driverById.get(t.driver_id)?.name ?? "—",
      startedAt: t.started_at,
      km: Number(t.start_km ?? 0),
      openMs: now - new Date(t.started_at).getTime(),
    }))
    .sort((a, b) => b.openMs - a.openMs);

  const pendingReturns = openTrips.filter((t) => t.openMs > pendingReturnHours * 3_600_000).length;

  const agingIncidents = data.incidents
    .filter((i) => i.status === "pendente" || i.status === "nova")
    .map((i) => ({
      id: i.id,
      number: Number(i.number),
      description: i.description,
      vehicle: vLabel(i.vehicle_id),
      days: Math.floor((now - new Date(i.created_at).getTime()) / 86400000),
    }))
    .sort((a, b) => b.days - a.days);

  const km = trips.reduce((s, t) => s + tripKm(t), 0);
  const maintenanceCost = maintenance.reduce((s, m) => s + Number(m.amount ?? 0), 0);

  return {
    totals: {
      vehicles: data.vehicles.length,
      available: data.vehicles.filter((v) => v.status === "disponivel").length,
      inUse: data.vehicles.filter((v) => v.status === "em_uso").length,
      pendingReturns,
      km,
      trips: trips.length,
      movements: movements.length,
      incidents: incidents.length,
      pendingIncidents: incidentsByStatus.pendente + incidentsByStatus.nova,
      maintenanceCount: maintenance.length,
      maintenanceCost,
      corrections: movements.filter((m) => m.corrected).length,
      blockedErrors: errors.filter((e) => e.blocked).length,
      avgResolutionMs,
      costPerKm: km ? maintenanceCost / km : 0,
    },
    drivers,
    vehicles,
    matrix,
    topCombo,
    incidentsByStatus,
    incidentsByCategory: [...catMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    errorsByKind: [...errMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    timeline,
    maintenanceByProvider,
    openTrips,
    agingIncidents,
  };
}
