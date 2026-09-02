import { useMemo, useState } from "react";
import { resolveRange, type PeriodKey } from "@/lib/period";

export function usePeriod(initial: PeriodKey = "30d") {
  const [period, setPeriod] = useState<PeriodKey>(initial);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const range = useMemo(() => resolveRange(period, from, to), [period, from, to]);
  return { period, setPeriod, from, setFrom, to, setTo, range };
}
