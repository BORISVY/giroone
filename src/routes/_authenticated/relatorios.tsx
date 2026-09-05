import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Download } from "lucide-react";
import { AppShell } from "@/components/fleet/AppShell";
import { PeriodPicker } from "@/components/fleet/PeriodPicker";
import { StatCard } from "@/components/fleet/StatCard";
import { Button } from "@/components/ui/button";
import { useFleet, EMPTY_FLEET } from "@/hooks/useFleet";
import { usePeriod } from "@/hooks/usePeriod";
import { buildAnalytics } from "@/lib/analytics";
import { inRange } from "@/lib/period";
import {
  ERROR_KIND_LABEL,
  categoryLabel,
  fmtDate,
  fmtDateTime,
  fmtKm,
  fmtMoney,
  fmtPct,
  statusLabel,
  vehicleLabel,
} from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios e exportação — GIRO" },
      { name: "description", content: "Exporte movimentações, ocorrências, manutenções e erros em planilha CSV." },
      { property: "og:title", content: "Relatórios e exportação — GIRO" },
      { property: "og:description", content: "Dados da frota prontos para planilha, filtrados por período." },
    ],
  }),
  component: Relatorios,
});

function toCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers.join(";"), ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(";"))].join("\n");
}

function download(name: string, rows: Record<string, string | number>[]) {
  const csv = toCsv(rows);
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Relatorios() {
  const { data } = useFleet();
  const fleet = data ?? EMPTY_FLEET;
  const p = usePeriod("30d");
  const a = useMemo(() => buildAnalytics(fleet, p.range), [fleet, p.range]);

  const vName = (id: string | null) => vehicleLabel(fleet.vehicles.find((v) => v.id === id));
  const dName = (id: string | null) => fleet.drivers.find((d) => d.id === id)?.name ?? "—";

  const movements = fleet.movements.filter((m) => inRange(m.occurred_at, p.range));
  const incidents = fleet.incidents.filter((i) => inRange(i.created_at, p.range));
  const maintenance = fleet.maintenance.filter((m) => inRange(m.performed_at, p.range));
  const errors = fleet.errors.filter((e) => inRange(e.created_at, p.range));

  const reports = [
    {
      title: "Movimentações",
      count: movements.length,
      description: "Saídas e retornos com motorista, KM e motivo.",
      build: () =>
        movements.map((m) => ({
          Data: fmtDateTime(m.occurred_at),
          Tipo: m.type === "saida" ? "Saída" : "Retorno",
          Veiculo: vName(m.vehicle_id),
          Motorista: dName(m.driver_id),
          KM: Number(m.km),
          Motivo: m.reason ?? "",
          Observacao: m.notes ?? "",
          Corrigido: m.corrected ? "Sim" : "Não",
        })),
    },
    {
      title: "Ocorrências",
      count: incidents.length,
      description: "Relatos dos motoristas com status e tratativa.",
      build: () =>
        incidents.map((i) => ({
          Numero: Number(i.number),
          Data: fmtDateTime(i.created_at),
          Veiculo: vName(i.vehicle_id),
          Motorista: dName(i.driver_id),
          Categoria: categoryLabel(i.category),
          Status: statusLabel(i.status),
          Descricao: i.description,
          Resolucao: i.resolution_note ?? "",
        })),
    },
    {
      title: "Manutenções",
      count: maintenance.length,
      description: "Serviços realizados, fornecedores e valores.",
      build: () =>
        maintenance.map((m) => ({
          Data: fmtDate(m.performed_at),
          Veiculo: vName(m.vehicle_id),
          Servico: fleet.maintenanceTypes.find((t) => t.id === m.type_id)?.name ?? m.description ?? "",
          Natureza: m.kind,
          Fornecedor: fleet.providers.find((x) => x.id === m.provider_id)?.name ?? "",
          KM: m.km ? Number(m.km) : "",
          Valor: Number(m.amount ?? 0),
        })),
    },
    {
      title: "Erros e bloqueios",
      count: errors.length,
      description: "Tentativas bloqueadas e correções de lançamento.",
      build: () =>
        errors.map((e) => ({
          Data: fmtDateTime(e.created_at),
          Tipo: ERROR_KIND_LABEL[e.kind] ?? e.kind,
          Veiculo: vName(e.vehicle_id),
          Motorista: dName(e.driver_id),
          Bloqueado: e.blocked ? "Sim" : "Não",
          Detalhes: e.details ?? "",
        })),
    },
    {
      title: "Desempenho por motorista",
      count: a.drivers.length,
      description: "Viagens, KM, ocorrências e taxa de erro.",
      build: () =>
        a.drivers.map((d) => ({
          Motorista: d.name,
          Viagens: d.trips,
          KM: Math.round(d.km),
          Saidas: d.exits,
          Retornos: d.returns,
          Ocorrencias: d.incidents,
          Correcoes: d.corrected,
          TaxaErro: fmtPct(d.errorRate, 1),
          Qualidade: fmtPct(d.quality, 0),
        })),
    },
    {
      title: "Desempenho por veículo",
      count: a.vehicles.length,
      description: "Utilização, KM, custos e custo por KM.",
      build: () =>
        a.vehicles.map((v) => ({
          Veiculo: `${v.label} ${v.plate}`,
          Viagens: v.trips,
          KM: Math.round(v.km),
          MediaKmViagem: Math.round(v.avgKmPerTrip),
          Ocorrencias: v.incidents,
          Manutencoes: v.maintenanceCount,
          Custo: Number(v.maintenanceCost.toFixed(2)),
          CustoPorKm: Number(v.costPerKm.toFixed(2)),
        })),
    },
  ];

  return (
    <AppShell title="Relatórios" description="Exporte os dados do período para planilha">
      <div className="space-y-4">
        <PeriodPicker value={p.period} onChange={p.setPeriod} from={p.from} to={p.to} onFrom={p.setFrom} onTo={p.setTo} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="KM rodados" value={fmtKm(a.totals.km)} />
          <StatCard label="Viagens" value={a.totals.trips} />
          <StatCard label="Ocorrências" value={a.totals.incidents} />
          <StatCard label="Custo de manutenção" value={fmtMoney(a.totals.maintenanceCost)} tone="accent" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <div key={r.title} className="surface flex flex-col p-4">
              <p className="font-semibold">{r.title}</p>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{r.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">{r.count} registro(s) no período</p>
              <Button
                variant="outline"
                className="mt-3"
                disabled={!r.count}
                onClick={() => download(r.title.toLowerCase().replace(/\s/g, "-"), r.build())}
              >
                <Download className="size-4" /> Baixar CSV
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
