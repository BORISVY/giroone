import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  value: (row: T) => number | string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right";
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  searchText: (row: T) => string;
  defaultSort: string;
  defaultDir?: "asc" | "desc";
  emptyText?: string;
}

const LIMITS = [5, 10, 25, 0] as const;

export function SortableTable<T>({ rows, columns, rowKey, searchText, defaultSort, defaultDir = "desc", emptyText }: Props<T>) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(defaultSort);
  const [dir, setDir] = useState<"asc" | "desc">(defaultDir);
  const [limit, setLimit] = useState<number>(10);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const col = columns.find((c) => c.key === sort) ?? columns[0]!;
    const list = term ? rows.filter((r) => searchText(r).toLowerCase().includes(term)) : [...rows];
    list.sort((a, b) => {
      const va = col.value(a);
      const vb = col.value(b);
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "pt-BR");
      return dir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rows, columns, sort, dir, q, searchText]);

  const shown = limit ? filtered.slice(0, limit) : filtered;

  function toggle(key: string) {
    if (key === sort) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setSort(key);
      setDir("desc");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar..." className="h-9 max-w-xs" />
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {LIMITS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLimit(l)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium",
                limit === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {l ? `Top ${l}` : "Todos"}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} registro(s)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted-foreground">
              <th className="p-2 text-left">#</th>
              {columns.map((c) => (
                <th key={c.key} className={cn("p-2", c.align === "right" ? "text-right" : "text-left")}>
                  <button type="button" onClick={() => toggle(c.key)} className="inline-flex items-center gap-1 hover:text-foreground">
                    {c.label}
                    {sort === c.key ? (
                      dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                    ) : (
                      <ArrowUpDown className="size-3 opacity-40" />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={rowKey(r)} className="border-b border-border/60">
                <td className="p-2 text-xs text-muted-foreground">{i + 1}</td>
                {columns.map((c) => (
                  <td key={c.key} className={cn("p-2 tabular-nums", c.align === "right" ? "text-right" : "text-left")}>
                    {c.render ? c.render(r) : c.value(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length ? <p className="py-6 text-center text-sm text-muted-foreground">{emptyText ?? "Sem dados no período."}</p> : null}
      </div>
    </div>
  );
}
