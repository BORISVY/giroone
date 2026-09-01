import { Input } from "@/components/ui/input";
import { PERIOD_OPTIONS, type PeriodKey } from "@/lib/period";
import { cn } from "@/lib/utils";

interface Props {
  value: PeriodKey;
  onChange: (value: PeriodKey) => void;
  from?: string;
  to?: string;
  onFrom?: (v: string) => void;
  onTo?: (v: string) => void;
}

export function PeriodPicker({ value, onChange, from, to, onFrom, onTo }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              value === opt.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {value === "custom" ? (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={from ?? ""}
            onChange={(e) => onFrom?.(e.target.value)}
            className="h-9 w-[9.5rem]"
            aria-label="Data inicial"
          />
          <span className="text-muted-foreground">até</span>
          <Input
            type="date"
            value={to ?? ""}
            onChange={(e) => onTo?.(e.target.value)}
            className="h-9 w-[9.5rem]"
            aria-label="Data final"
          />
        </div>
      ) : null}
    </div>
  );
}
