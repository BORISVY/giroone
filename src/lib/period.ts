export type PeriodKey =
  | "hoje"
  | "7d"
  | "30d"
  | "mes_atual"
  | "mes_anterior"
  | "6m"
  | "12m"
  | "tudo"
  | "custom";

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "mes_atual", label: "Mês atual" },
  { value: "mes_anterior", label: "Mês anterior" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "12m", label: "Últimos 12 meses" },
  { value: "tudo", label: "Todo o período" },
  { value: "custom", label: "Período personalizado" },
];

export interface Range {
  from: Date;
  to: Date;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function resolveRange(key: PeriodKey, from?: string, to?: string): Range {
  const now = new Date();
  switch (key) {
    case "hoje":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "7d":
      return { from: startOfDay(new Date(now.getTime() - 6 * 86400000)), to: endOfDay(now) };
    case "30d":
      return { from: startOfDay(new Date(now.getTime() - 29 * 86400000)), to: endOfDay(now) };
    case "mes_atual":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };
    case "mes_anterior":
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        to: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "6m":
      return { from: new Date(now.getFullYear(), now.getMonth() - 5, 1), to: endOfDay(now) };
    case "12m":
      return { from: new Date(now.getFullYear(), now.getMonth() - 11, 1), to: endOfDay(now) };
    case "custom":
      return {
        from: from ? startOfDay(new Date(`${from}T12:00:00`)) : new Date(2000, 0, 1),
        to: to ? endOfDay(new Date(`${to}T12:00:00`)) : endOfDay(now),
      };
    case "tudo":
    default:
      return { from: new Date(2000, 0, 1), to: endOfDay(now) };
  }
}

export function inRange(dateLike: string | null | undefined, range: Range) {
  if (!dateLike) return false;
  const d = dateLike.length <= 10 ? new Date(`${dateLike}T12:00:00`) : new Date(dateLike);
  return d >= range.from && d <= range.to;
}

export function monthKey(dateLike: string) {
  const d = dateLike.length <= 10 ? new Date(`${dateLike}T12:00:00`) : new Date(dateLike);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
