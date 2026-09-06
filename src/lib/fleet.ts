import type { Database } from "@/integrations/supabase/types";

export type Tables = Database["public"]["Tables"];
export type Vehicle = Tables["vehicles"]["Row"];
export type Driver = Tables["drivers"]["Row"];
export type Movement = Tables["movements"]["Row"];
export type Trip = Tables["trips"]["Row"];
export type Incident = Tables["incidents"]["Row"];
export type IncidentHistory = Tables["incident_history"]["Row"];
export type MaintenanceRecord = Tables["maintenance_records"]["Row"];
export type MaintenanceType = Tables["maintenance_types"]["Row"];
export type ServiceProvider = Tables["service_providers"]["Row"];
export type ErrorEvent = Tables["error_events"]["Row"];

export type IncidentStatus = Database["public"]["Enums"]["incident_status"];
export type IncidentCategory = Database["public"]["Enums"]["incident_category"];
export type VehicleStatus = Database["public"]["Enums"]["vehicle_status"];
export type ErrorKind = Database["public"]["Enums"]["error_kind"];

export const INCIDENT_STATUS: { value: IncidentStatus; label: string; dot: string }[] = [
  { value: "nova", label: "Nova", dot: "bg-accent" },
  { value: "visualizada", label: "Visualizada", dot: "bg-info" },
  { value: "pendente", label: "Pendente", dot: "bg-warning" },
  { value: "realizada", label: "Realizada", dot: "bg-success" },
  { value: "recusada", label: "Recusada", dot: "bg-destructive" },
];

export const INCIDENT_CATEGORIES: { value: IncidentCategory; label: string }[] = [
  { value: "pneus", label: "Pneus" },
  { value: "freios", label: "Freios" },
  { value: "motor", label: "Motor" },
  { value: "suspensao", label: "Suspensão" },
  { value: "eletrica", label: "Elétrica" },
  { value: "funilaria", label: "Funilaria" },
  { value: "ar_condicionado", label: "Ar-condicionado" },
  { value: "documentacao", label: "Documentação" },
  { value: "limpeza", label: "Limpeza" },
  { value: "seguranca", label: "Segurança" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "outros", label: "Outros" },
];

export const ERROR_KIND_LABEL: Record<ErrorKind, string> = {
  saida_duplicada: "Saída duplicada",
  retorno_sem_saida: "Retorno sem saída",
  km_invalido: "KM incorreto",
  correcao: "Lançamento corrigido",
  retorno_esquecido: "Retorno esquecido",
  veiculo_incorreto: "Veículo incorreto",
  outros: "Outros",
};

export function statusLabel(status: IncidentStatus) {
  return INCIDENT_STATUS.find((s) => s.value === status)?.label ?? status;
}

export function categoryLabel(category: IncidentCategory) {
  return INCIDENT_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function vehicleLabel(v?: Pick<Vehicle, "brand" | "model" | "plate"> | null) {
  if (!v) return "—";
  return `${[v.brand, v.model].filter(Boolean).join(" ")} · ${v.plate}`;
}

export const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
export const cf = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

export function fmtKm(value?: number | null) {
  return `${nf.format(Number(value ?? 0))} km`;
}

export function fmtMoney(value?: number | null) {
  return cf.format(Number(value ?? 0));
}

export function fmtDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = value.length <= 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  return d.toLocaleDateString("pt-BR");
}

export function fmtDuration(ms: number) {
  if (!isFinite(ms) || ms <= 0) return "—";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  return `${h}h ${m}min`;
}

export function pct(part: number, total: number) {
  if (!total) return 0;
  return (part / total) * 100;
}

export function fmtPct(value: number, digits = 1) {
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

export const MOVEMENT_ERROR_MESSAGES: Record<string, string> = {
  VEICULO_NAO_ENCONTRADO: "Veículo não encontrado. Confira o QR Code.",
  VEICULO_INATIVO: "Este veículo está inativo e não pode ser utilizado.",
  MOTORISTA_INVALIDO: "Selecione um motorista válido.",
  MOTIVO_OBRIGATORIO: "Informe o motivo da utilização.",
  KM_INVALIDO: "Quilometragem inválida.",
  SAIDA_DUPLICADA: "Este veículo já está EM USO. Registre o retorno antes de uma nova saída.",
  RETORNO_SEM_SAIDA: "Não existe saída aberta para este veículo.",
  FOTO_OBRIGATORIA: "Anexe a foto do painel para concluir o registro.",
};

export function parseMovementError(message: string) {
  const code = message.split(":")[0]?.trim();
  if (code === "KM_MENOR_QUE_ULTIMO") {
    const last = message.split(":")[1];
    return `Quilometragem menor que a última registrada (${nf.format(Number(last ?? 0))} km).`;
  }
  return MOVEMENT_ERROR_MESSAGES[code ?? ""] ?? "Não foi possível registrar. Tente novamente.";
}
