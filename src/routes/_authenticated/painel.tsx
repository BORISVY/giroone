import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Car, CheckCircle2, Clock, Gauge, Wrench } from "lucide-react";
import { AppShell } from "@/components/fleet/AppShell";
import { StatCard } from "@/components/fleet/StatCard";
import { PeriodPicker } from "@/components/fleet/PeriodPicker";
import { VehicleStatusPill } from "@/components/fleet/StatusPill";
import { useFleet, EMPTY_FLEET } from "@/hooks/useFleet";
import { usePeriod } from "@/hooks/usePeriod";
import { buildAnalytics } from "@/lib/analytics";
import { fmtDuration, fmtKm, fmtMoney, fmtPct, nf, vehicleLabel } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel gerencial da frota — GIRO" },
      { name: "description", content: "Visão executiva da frota: disponibilidade, KM, ocorrências, manutenções e rankings." },
      { property: "og:title", content: "Painel gerencial da frota — GIRO" },
      { property: "og:description", content: "Indicadores de utilização, qualidade de lançamento e custos da frota." },
    ],
  }),
  component: Painel,
});

const CHART_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function Painel() {
  const { data, isLoading } = useFleet();
  const p = usePeriod("30d");
  const fleet = data ?? EMPTY_FLEET;
  const a = useMemo(() => buildAnalytics(fleet, p.range), [fleet, p.range]);

  const topKmDrivers = [...a.drivers].filter((d) => d.movements > 0).sort((x, y) => y.km - x.km).slice(0, 5);
  const bestQuality = [...a.drivers].filter((d) => d.movements >= 1).sort((x, y) => y.quality - x.quality || y.movements - x.movements).slice(0, 5);
  const worstQuality = [...a.drivers].filter((d) => d.movements >= 1 && d.errorRate > 0).sort((x, y) => y.errorRate - x.errorRate).slice(0, 5);
  const topUsed = [...a.vehicles].sort((x, y) => y.trips - x.trips).slice(0, 5);
  const topKmVehicles = [...a.vehicles].sort((x, y) => y.km - x.km).slice(0, 5);
  const topCostKm = [...a.vehicles].filter((v) => v.km > 0).sort((x, y) => y.costPerKm - x.costPerKm).slice(0, 5);

  return (
    <AppShell title="Painel gerencial" description="Resumo executivo da frota no período selecionado">
      <div className="space-y-6">
        <PeriodPicker
          value={p.period}
          onChange={p.setPeriod}
          from={p.from}
          to={p.to}
          onFrom={p.setFrom}
          onTo={p.setTo}
        />

        {(a.totals.pendingReturns > 0 || a.totals.pendingIncidents > 0) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {a.totals.pendingReturns > 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
                <Clock className="size-5 text-destructive" />
                <p className="text-sm font-semibold">
                  {a.totals.pendingReturns} retorno(s) pendente(s) há mais de 12h
                </p>
              </div>
            ) : null}
            {a.totals.pendingIncidents > 0 ? (
              <Link
                to="/ocorrencias"
                className="flex items-center gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4 transition-colors hover:bg-warning/20"
              >
                <AlertTriangle className="size-5 text-warning" />
                <p className="text-sm font-semibold">
                  {a.totals.pendingIncidents} ocorrência(s) aguardando tratativa
                  {a.agingIncidents[0] ? ` · mais antiga há ${a.agingIncidents[0].days} dia(s)` : ""}
                </p>
              </Link>
            ) : null}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Veículos" value={a.totals.vehicles} icon={<Car className="size-4" />} />
          <StatCard label="Disponíveis" value={a.totals.available} tone="success" icon={<CheckCircle2 className="size-4" />} />
          <StatCard label="Em uso" value={a.totals.inUse} tone="danger" />
          <StatCard label="Retornos pendentes" value={a.totals.pendingReturns} tone="warning" />
          <StatCard label="KM rodados" value={fmtKm(a.totals.km)} icon={<Gauge className="size-4" />} hint={`${a.totals.trips} viagens`} />
          <StatCard label="Ocorrências" value={a.totals.incidents} hint={`${a.totals.pendingIncidents} em aberto`} />
          <StatCard label="Tempo médio de resolução" value={fmtDuration(a.totals.avgResolutionMs)} tone="info" />
          <StatCard label="Manutenções" value={a.totals.maintenanceCount} icon={<Wrench className="size-4" />} />
          <StatCard label="Valor gasto" value={fmtMoney(a.totals.maintenanceCost)} tone="accent" />
          <StatCard label="Custo por KM" value={fmtMoney(a.totals.costPerKm)} hint="Manutenção / KM rodados" />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Panel title="Status atual da frota" className="lg:col-span-1">
            <div className="space-y-2">
              {fleet.vehicles.map((v) => {
                const open = a.openTrips.find((t) => t.vehicleId === v.id);
                return (
                  <Link
                    key={v.id}
                    to="/veiculos/$code"
                    params={{ code: v.code }}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{vehicleLabel(v)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {open ? `${open.driver} · há ${fmtDuration(open.openMs)}` : fmtKm(v.current_km)}
                      </p>
                    </div>
                    <VehicleStatusPill status={v.status} />
                  </Link>
                );
              })}
              {fleet.vehicles.length === 0 && !isLoading ? (
                <p className="text-sm text-muted-foreground">Nenhum veículo cadastrado.</p>
              ) : null}
            </div>
          </Panel>

          <Panel title="Evolução no período" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={a.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--color-muted-foreground)" />
                <Tooltip />
                <Line type="monotone" dataKey="km" name="KM" stroke="var(--color-chart-1)" strokeWidth={2} />
                <Line type="monotone" dataKey="trips" name="Viagens" stroke="var(--color-chart-2)" strokeWidth={2} />
                <Line type="monotone" dataKey="incidents" name="Ocorrências" stroke="var(--color-chart-5)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Panel title="🏆 Melhor qualidade de lançamento">
            <RankList
              items={bestQuality.map((d) => ({
                key: d.id,
                title: d.name,
                sub: `${d.movements} lançamentos · ${d.corrected} corrigidos`,
                value: fmtPct(d.quality, 0),
              }))}
            />
          </Panel>
          <Panel title="⚠️ Maior taxa de erro">
            <RankList
              items={worstQuality.map((d) => ({
                key: d.id,
                title: d.name,
                sub: `${d.realErrors} erros em ${d.movements} lançamentos`,
                value: fmtPct(d.errorRate, 1),
              }))}
              emptyText="Nenhum erro registrado no período."
            />
          </Panel>
          <Panel title="🚗 Motoristas que mais rodaram">
            <RankList
              items={topKmDrivers.map((d) => ({
                key: d.id,
                title: d.name,
                sub: `${d.trips} viagens`,
                value: fmtKm(d.km),
              }))}
            />
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Panel title="🚙 Veículos mais utilizados">
            <RankList
              items={topUsed.map((v) => ({
                key: v.id,
                title: `${v.label} · ${v.plate}`,
                sub: `${fmtPct(v.sharePct, 0)} das utilizações`,
                value: `${v.trips}`,
              }))}
            />
          </Panel>
          <Panel title="🛣️ Veículos que mais rodaram">
            <RankList
              items={topKmVehicles.map((v) => ({
                key: v.id,
                title: `${v.label} · ${v.plate}`,
                sub: `média de ${fmtKm(v.avgKmPerTrip)} por viagem`,
                value: fmtKm(v.km),
              }))}
            />
          </Panel>
          <Panel title="💸 Maior custo por KM">
            <RankList
              items={topCostKm.map((v) => ({
                key: v.id,
                title: `${v.label} · ${v.plate}`,
                sub: `${fmtMoney(v.maintenanceCost)} em ${v.maintenanceCount} manutenções`,
                value: `${fmtMoney(v.costPerKm)}/km`,
              }))}
              emptyText="Sem manutenções lançadas no período."
            />
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="Ocorrências por categoria">
            {a.incidentsByCategory.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={a.incidentsByCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                    {a.incidentsByCategory.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </Panel>
          <Panel title="Tipos de erro no período">
            {a.errorsByKind.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={a.errorsByKind}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" fontSize={10} stroke="var(--color-muted-foreground)" />
                  <YAxis fontSize={11} allowDecimals={false} stroke="var(--color-muted-foreground)" />
                  <Tooltip />
                  <Bar dataKey="value" name="Ocorrências" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty text="Nenhum erro ou bloqueio registrado." />
            )}
          </Panel>
        </section>

        <Panel
          title="Matriz motorista × veículo"
          subtitle={
            a.topCombo
              ? `Combinação mais frequente: ${a.topCombo.driver} + ${a.topCombo.vehicle} (${a.topCombo.count} utilizações)`
              : undefined
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="p-2">Motorista</th>
                  {fleet.vehicles.map((v) => (
                    <th key={v.id} className="p-2 text-center">
                      {v.plate}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {a.matrix.map((row) => (
                  <tr key={row.driverId} className="border-b border-border/60">
                    <td className="p-2 font-medium">{row.driverName}</td>
                    {fleet.vehicles.map((v) => (
                      <td key={v.id} className="p-2 text-center tabular-nums">
                        {row.cells[v.id] ? nf.format(row.cells[v.id]) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

export function Panel({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`surface p-4 ${className ?? ""}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function RankList({
  items,
  emptyText,
}: {
  items: { key: string; title: string; sub: string; value: string }[];
  emptyText?: string;
}) {
  if (!items.length) return <Empty text={emptyText} />;
  return (
    <ol className="space-y-2">
      {items.map((it, i) => (
        <li key={it.key} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{it.title}</p>
            <p className="truncate text-xs text-muted-foreground">{it.sub}</p>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums">{it.value}</span>
        </li>
      ))}
    </ol>
  );
}

function Empty({ text = "Sem dados no período." }: { text?: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}
