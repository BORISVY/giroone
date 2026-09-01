import { INCIDENT_STATUS, type IncidentStatus, type VehicleStatus } from "@/lib/fleet";
import { cn } from "@/lib/utils";

export function IncidentStatusPill({ status }: { status: IncidentStatus }) {
  const meta = INCIDENT_STATUS.find((s) => s.value === status);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold">
      <span className={cn("size-2 rounded-full", meta?.dot)} />
      {meta?.label ?? status}
    </span>
  );
}

const vehicleMeta: Record<VehicleStatus, { label: string; dot: string }> = {
  disponivel: { label: "Disponível", dot: "bg-success" },
  em_uso: { label: "Em uso", dot: "bg-destructive" },
  manutencao: { label: "Manutenção", dot: "bg-warning" },
  inativo: { label: "Inativo", dot: "bg-muted-foreground" },
};

export function VehicleStatusPill({ status, size = "sm" }: { status: VehicleStatus; size?: "sm" | "lg" }) {
  const meta = vehicleMeta[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-muted font-semibold",
        size === "lg" ? "px-4 py-2 text-base" : "px-2.5 py-1 text-xs",
      )}
    >
      <span className={cn("rounded-full", meta.dot, size === "lg" ? "size-3" : "size-2")} />
      {meta.label}
    </span>
  );
}

export function MovementTypePill({ type }: { type: "saida" | "retorno" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        type === "saida" ? "bg-accent/20 text-accent-foreground" : "bg-success/15 text-success",
      )}
    >
      {type === "saida" ? "Saída" : "Retorno"}
    </span>
  );
}
