import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/fleet/AppShell";
import { StatCard } from "@/components/fleet/StatCard";
import { IncidentStatusPill, MovementTypePill, VehicleStatusPill } from "@/components/fleet/StatusPill";
import { useFleet, EMPTY_FLEET } from "@/hooks/useFleet";
import { fmtDate, fmtDateTime, fmtDuration, fmtKm, fmtMoney, vehicleLabel } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/veiculos/$code")({
  head: () => ({
    meta: [
      { title: "Histórico do veículo — GIRO" },
      { name: "description", content: "Linha do tempo de uso, ocorrências e manutenções de um veículo da frota." },
      { property: "og:title", content: "Histórico do veículo — GIRO" },
      { property: "og:description", content: "Uso, custos e ocorrências consolidados por veículo." },
    ],
  }),
  component: VeiculoDetalhe,
});

function VeiculoDetalhe() {
  const { code } = Route.useParams();
  const { data } = useFleet();
  const fleet = data ?? EMPTY_FLEET;
  const vehicle = fleet.vehicles.find((v) => v.code === code);

  const info = useMemo(() => {
    if (!vehicle) return null;
    const trips = fleet.trips.filter((t) => t.vehicle_id === vehicle.id);
    const movements = fleet.movements.filter((m) => m.vehicle_id === vehicle.id);
    const incidents = fleet.incidents.filter((i) => i.vehicle_id === vehicle.id);
    const maint = fleet.maintenance.filter((m) => m.vehicle_id === vehicle.id);
    const km = trips.reduce((s, t) => s + Number(t.distance_km ?? 0), 0);
    const currentKm = Number([...movements].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0]?.km ?? 0);
    const cost = maint.reduce((s, m) => s + Number(m.amount ?? 0), 0);
    const usage = trips
      .filter((t) => t.ended_at)
      .reduce((s, t) => s + (new Date(t.ended_at!).getTime() - new Date(t.started_at).getTime()), 0);
    return { trips, movements, incidents, maint, km, currentKm, cost, usage };
  }, [fleet, vehicle]);

  if (!vehicle || !info) {
    return (
      <AppShell title="Veículo">
        <p className="surface p-8 text-center text-muted-foreground">Veículo não encontrado.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={vehicleLabel(vehicle)}
      description={`Código ${vehicle.code} · ${vehicle.year ?? "—"} · ${vehicle.color ?? "—"}`}
      actions={<VehicleStatusPill status={vehicle.status} size="lg" />}
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="KM atual" value={fmtKm(info.currentKm)} />
          <StatCard label="KM rodados" value={fmtKm(info.km)} hint={`${info.trips.length} viagens`} />
          <StatCard label="Tempo total de uso" value={fmtDuration(info.usage)} tone="info" />
          <StatCard label="Custo de manutenção" value={fmtMoney(info.cost)} tone="accent" />
        </div>

        <Section title="Últimas movimentações">
          {info.movements.slice(0, 15).map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-0">
              <MovementTypePill type={m.type} />
              <span className="flex-1 truncate text-muted-foreground">
                {fleet.drivers.find((d) => d.id === m.driver_id)?.name ?? "—"} · {m.reason ?? "—"}
              </span>
              <span className="tabular-nums">{fmtKm(m.km)}</span>
              <span className="whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(m.occurred_at)}</span>
            </div>
          ))}
          {info.movements.length === 0 ? <Empty /> : null}
        </Section>

        <Section title="Ocorrências">
          {info.incidents.slice(0, 15).map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-0">
              <span className="flex-1 truncate">#{i.number} · {i.description}</span>
              <IncidentStatusPill status={i.status} />
              <span className="whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(i.created_at)}</span>
            </div>
          ))}
          {info.incidents.length === 0 ? <Empty /> : null}
        </Section>

        <Section title="Manutenções">
          {info.maint.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-0">
              <span className="flex-1 truncate">
                {fleet.maintenanceTypes.find((t) => t.id === m.type_id)?.name ?? m.description ?? "Manutenção"}
              </span>
              <span className="text-xs text-muted-foreground">
                {fleet.providers.find((p) => p.id === m.provider_id)?.name ?? "—"}
              </span>
              <span className="tabular-nums">{fmtMoney(m.amount)}</span>
              <span className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(m.performed_at)}</span>
            </div>
          ))}
          {info.maint.length === 0 ? <Empty /> : null}
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="py-6 text-center text-sm text-muted-foreground">Nada registrado ainda.</p>;
}
