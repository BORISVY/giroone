import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/fleet/AppShell";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/useAccess";
import { useFleet, EMPTY_FLEET } from "@/hooks/useFleet";

export const Route = createFileRoute("/_authenticated/importacao")({
  head: () => ({
    meta: [
      { title: "Importar planilhas — GIRO" },
      {
        name: "description",
        content: "Importe movimentações e manutenções do histórico em planilha Excel para o GIRO.",
      },
      { property: "og:title", content: "Importar planilhas — GIRO" },
      { property: "og:description", content: "Migre o controle antigo de frota em Excel para o GIRO." },
    ],
  }),
  component: Importacao,
});

const MOV_HEADERS = [
  "Codigo do veiculo",
  "Motorista",
  "Tipo (Saida/Retorno)",
  "Data e hora (DD/MM/AAAA HH:MM)",
  "KM",
  "Motivo",
  "Observacoes",
];

const MNT_HEADERS = [
  "Codigo do veiculo",
  "Data (DD/MM/AAAA)",
  "Tipo de servico",
  "Preventiva ou Corretiva",
  "Fornecedor",
  "Descricao",
  "Valor (R$)",
  "KM",
  "Observacoes",
];

type Row = Record<string, unknown>;

function str(v: unknown) {
  return v == null ? "" : String(v).trim();
}

function num(v: unknown) {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Accepts Excel serial dates, Date objects and DD/MM/AAAA [HH:MM] strings. */
function parseDate(v: unknown): Date | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(Math.round((v - 25569) * 86400 * 1000));
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[ ,]+(\d{1,2}):(\d{2}))?/);
  if (m) {
    const year = Number(m[3]!.length === 2 ? `20${m[3]}` : m[3]);
    return new Date(year, Number(m[2]) - 1, Number(m[1]), Number(m[4] ?? 12), Number(m[5] ?? 0));
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function Importacao() {
  const { isAdmin, isLoading } = useAccess();
  const { data } = useFleet();
  const fleet = data ?? EMPTY_FLEET;
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const mov = XLSX.utils.aoa_to_sheet([
      MOV_HEADERS,
      ["V001", "João da Silva", "Saida", "01/08/2026 08:30", 12500, "Entrega de material", ""],
      ["V001", "João da Silva", "Retorno", "01/08/2026 17:10", 12588, "Entrega de material", "Pneu dianteiro gasto"],
    ]);
    mov["!cols"] = MOV_HEADERS.map(() => ({ wch: 24 }));
    const mnt = XLSX.utils.aoa_to_sheet([
      MNT_HEADERS,
      ["V001", "05/08/2026", "Troca de óleo", "Preventiva", "Oficina Central", "Óleo e filtro", 380.5, 12600, ""],
    ]);
    mnt["!cols"] = MNT_HEADERS.map(() => ({ wch: 22 }));
    const guide = XLSX.utils.aoa_to_sheet([
      ["Como preencher a planilha do GIRO"],
      [""],
      ["1. Não altere, não renomeie e não apague a primeira linha (títulos) de cada aba."],
      ["2. Uma linha por registro. Apague as linhas de exemplo antes de importar."],
      ["3. Código do veículo: o mesmo código cadastrado em Veículos (ou a placa)."],
      ["4. Motoristas, fornecedores e tipos de serviço que não existirem serão criados automaticamente."],
      ["5. Datas no formato DD/MM/AAAA e horas no formato HH:MM."],
      ["6. Valores em reais, com vírgula para os centavos. KM apenas números."],
    ]);
    guide["!cols"] = [{ wch: 90 }];
    XLSX.utils.book_append_sheet(wb, guide, "Instruções");
    XLSX.utils.book_append_sheet(wb, mov, "Movimentações");
    XLSX.utils.book_append_sheet(wb, mnt, "Manutenções");
    XLSX.writeFile(wb, "GIRO-modelo-importacao.xlsx");
  }

  async function handleFile(file: File) {
    setBusy(true);
    setLog([]);
    const lines: string[] = [];
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });

      const vehicleByKey = new Map<string, string>();
      for (const v of fleet.vehicles) {
        vehicleByKey.set(v.code.toUpperCase(), v.id);
        vehicleByKey.set(v.plate.toUpperCase().replace(/[^A-Z0-9]/g, ""), v.id);
      }
      const driverByName = new Map(fleet.drivers.map((d) => [d.name.toLowerCase(), d.id]));
      const typeByName = new Map(fleet.maintenanceTypes.map((t) => [t.name.toLowerCase(), t.id]));
      const providerByName = new Map(fleet.providers.map((p) => [p.name.toLowerCase(), p.id]));

      const findVehicle = (raw: string) =>
        vehicleByKey.get(raw.toUpperCase()) ?? vehicleByKey.get(raw.toUpperCase().replace(/[^A-Z0-9]/g, ""));

      async function ensureDriver(name: string) {
        const key = name.toLowerCase();
        const found = driverByName.get(key);
        if (found) return found;
        const { data: created, error } = await supabase.from("drivers").insert({ name }).select("id").single();
        if (error) throw new Error(error.message);
        driverByName.set(key, created.id);
        return created.id;
      }

      // ---- Movimentações ----
      const movSheet = wb.Sheets["Movimentações"] ?? wb.Sheets["Movimentacoes"];
      if (movSheet) {
        const rows = XLSX.utils.sheet_to_json<Row>(movSheet, { defval: "" });
        const payload: Record<string, unknown>[] = [];
        let ignored = 0;
        for (const [i, r] of rows.entries()) {
          const values = Object.values(r).map(str);
          if (values.every((v) => !v)) continue;
          const code = str(r[MOV_HEADERS[0]!]);
          const driverName = str(r[MOV_HEADERS[1]!]);
          const rawType = str(r[MOV_HEADERS[2]!]).toLowerCase();
          const when = parseDate(r[MOV_HEADERS[3]!]);
          const km = num(r[MOV_HEADERS[4]!]);
          const vehicleId = findVehicle(code);
          if (!vehicleId || !driverName || !when || km == null) {
            ignored++;
            lines.push(`Movimentações linha ${i + 2}: ignorada (veículo, motorista, data ou KM inválido).`);
            continue;
          }
          payload.push({
            vehicle_id: vehicleId,
            driver_id: await ensureDriver(driverName),
            type: rawType.startsWith("r") ? "retorno" : "saida",
            km,
            reason: str(r[MOV_HEADERS[5]!]) || null,
            notes: str(r[MOV_HEADERS[6]!]) || null,
            occurred_at: when.toISOString(),
          });
        }
        for (let i = 0; i < payload.length; i += 200) {
          const { error } = await supabase.from("movements").insert(payload.slice(i, i + 200) as never);
          if (error) throw new Error(error.message);
        }
        await supabase.rpc("rebuild_trips_from_movements");
        lines.unshift(`Movimentações: ${payload.length} importada(s)${ignored ? `, ${ignored} ignorada(s)` : ""}.`);

        // atualiza a quilometragem atual de cada veículo
        const maxKm = new Map<string, number>();
        for (const p of payload) {
          const id = p['vehicle_id'] as string;
          maxKm.set(id, Math.max(maxKm.get(id) ?? 0, Number(p['km'])));
        }
        for (const [id, km] of maxKm) {
          const current = Number(fleet.vehicles.find((v) => v.id === id)?.current_km ?? 0);
          if (km > current) await supabase.from("vehicles").update({ current_km: km }).eq("id", id);
        }
      }

      // ---- Manutenções ----
      const mntSheet = wb.Sheets["Manutenções"] ?? wb.Sheets["Manutencoes"];
      if (mntSheet) {
        const rows = XLSX.utils.sheet_to_json<Row>(mntSheet, { defval: "" });
        const payload: Record<string, unknown>[] = [];
        let ignored = 0;
        for (const [i, r] of rows.entries()) {
          if (Object.values(r).map(str).every((v) => !v)) continue;
          const vehicleId = findVehicle(str(r[MNT_HEADERS[0]!]));
          const when = parseDate(r[MNT_HEADERS[1]!]);
          if (!vehicleId || !when) {
            ignored++;
            lines.push(`Manutenções linha ${i + 2}: ignorada (veículo ou data inválida).`);
            continue;
          }
          const typeName = str(r[MNT_HEADERS[2]!]);
          const kind = str(r[MNT_HEADERS[3]!]).toLowerCase().startsWith("p") ? "preventiva" : "corretiva";
          let typeId: string | null = null;
          if (typeName) {
            const key = typeName.toLowerCase();
            typeId = typeByName.get(key) ?? null;
            if (!typeId) {
              const { data: created, error } = await supabase
                .from("maintenance_types")
                .insert({ name: typeName, kind })
                .select("id")
                .single();
              if (error) throw new Error(error.message);
              typeId = created.id;
              typeByName.set(key, created.id);
            }
          }
          const providerName = str(r[MNT_HEADERS[4]!]);
          let providerId: string | null = null;
          if (providerName) {
            const key = providerName.toLowerCase();
            providerId = providerByName.get(key) ?? null;
            if (!providerId) {
              const { data: created, error } = await supabase
                .from("service_providers")
                .insert({ name: providerName })
                .select("id")
                .single();
              if (error) throw new Error(error.message);
              providerId = created.id;
              providerByName.set(key, created.id);
            }
          }
          payload.push({
            vehicle_id: vehicleId,
            type_id: typeId,
            provider_id: providerId,
            kind,
            performed_at: when.toISOString().slice(0, 10),
            description: str(r[MNT_HEADERS[5]!]) || null,
            amount: num(r[MNT_HEADERS[6]!]) ?? 0,
            km: num(r[MNT_HEADERS[7]!]),
            notes: str(r[MNT_HEADERS[8]!]) || null,
          });
        }
        for (let i = 0; i < payload.length; i += 200) {
          const { error } = await supabase.from("maintenance_records").insert(payload.slice(i, i + 200) as never);
          if (error) throw new Error(error.message);
        }
        lines.unshift(`Manutenções: ${payload.length} importada(s)${ignored ? `, ${ignored} ignorada(s)` : ""}.`);
      }

      if (!movSheet && !mntSheet) {
        lines.push('Nenhuma aba "Movimentações" ou "Manutenções" encontrada. Use a planilha modelo.');
      } else {
        await supabase.from("audit_logs").insert({
          entity: "importacao",
          action: "import",
          reason: `Importação de planilha: ${file.name}`,
        });
        toast.success("Importação concluída.");
        qc.invalidateQueries({ queryKey: ["fleet"] });
      }
    } catch (e) {
      lines.unshift(`Erro: ${(e as Error).message}`);
      toast.error("A importação falhou. Veja o resumo abaixo.");
    } finally {
      setLog(lines);
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!isLoading && !isAdmin) {
    return (
      <AppShell title="Importar planilhas" description="Acesso restrito">
        <div className="surface p-8 text-center text-muted-foreground">
          Esta tela está disponível apenas para administradores.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Importar planilhas" description="Traga o histórico do controle antigo para o GIRO">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface space-y-3 p-5">
          <div className="flex items-center gap-2 font-medium">
            <FileSpreadsheet className="size-4 text-primary" /> 1. Baixe a planilha modelo
          </div>
          <p className="text-sm text-muted-foreground">
            O arquivo tem uma aba de instruções, uma de movimentações (saídas e retornos) e uma de manutenções, já com
            exemplos preenchidos. Mantenha os títulos das colunas como estão.
          </p>
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="size-4" /> Baixar planilha modelo
          </Button>
        </section>

        <section className="surface space-y-3 p-5">
          <div className="flex items-center gap-2 font-medium">
            <Upload className="size-4 text-primary" /> 2. Envie a planilha preenchida
          </div>
          <p className="text-sm text-muted-foreground">
            Os veículos precisam estar cadastrados. Motoristas, fornecedores e tipos de serviço novos são criados
            automaticamente durante a importação.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {busy ? <p className="text-sm text-muted-foreground">Importando, aguarde…</p> : null}
        </section>
      </div>

      {log.length ? (
        <div className="surface mt-4 space-y-1 p-5 text-sm">
          <p className="font-medium">Resumo da importação</p>
          {log.map((l, i) => (
            <p key={i} className="text-muted-foreground">
              {l}
            </p>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
