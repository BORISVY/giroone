import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/fleet/AppShell";
import { StatCard } from "@/components/fleet/StatCard";
import { PeriodPicker } from "@/components/fleet/PeriodPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFleet, EMPTY_FLEET } from "@/hooks/useFleet";
import { usePeriod } from "@/hooks/usePeriod";
import { buildAnalytics } from "@/lib/analytics";
import { inRange } from "@/lib/period";
import { fmtDate, fmtKm, fmtMoney, vehicleLabel } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/manutencoes")({
  head: () => ({
    meta: [
      { title: "Manutenções e custos da frota — GIRO" },
      { name: "description", content: "Registre manutenções preventivas e corretivas e acompanhe o custo por veículo." },
      { property: "og:title", content: "Manutenções e custos da frota — GIRO" },
      { property: "og:description", content: "Custos, fornecedores e planos de manutenção da frota." },
    ],
  }),
  component: Manutencoes,
});

const EMPTY = {
  vehicle_id: "",
  type_id: "",
  provider_id: "",
  kind: "corretiva",
  performed_at: new Date().toISOString().slice(0, 10),
  amount: "",
  km: "",
  description: "",
  notes: "",
};

function Manutencoes() {
  const { data } = useFleet();
  const fleet = data ?? EMPTY_FLEET;
  const p = usePeriod("12m");
  const qc = useQueryClient();
  const a = useMemo(() => buildAnalytics(fleet, p.range), [fleet, p.range]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [typeName, setTypeName] = useState("");
  const [providerName, setProviderName] = useState("");

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const rows = fleet.maintenance.filter((m) => inRange(m.performed_at, p.range));

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("maintenance_records").insert({
        vehicle_id: form.vehicle_id,
        type_id: form.type_id || null,
        provider_id: form.provider_id || null,
        kind: form.kind as "preventiva" | "corretiva",
        performed_at: form.performed_at,
        amount: Number(form.amount || 0),
        km: form.km ? Number(form.km) : null,
        description: form.description || null,
        notes: form.notes || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Manutenção registrada.");
      setOpen(false);
      setForm(EMPTY);
      qc.invalidateQueries({ queryKey: ["fleet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addType = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("maintenance_types").insert({ name: typeName.trim() });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setTypeName("");
      qc.invalidateQueries({ queryKey: ["fleet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addProvider = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("service_providers").insert({ name: providerName.trim() });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setProviderName("");
      qc.invalidateQueries({ queryKey: ["fleet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      title="Manutenções"
      description="Custos, fornecedores e tipos de serviço"
      actions={
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Nova manutenção
        </Button>
      }
    >
      <div className="space-y-4">
        <PeriodPicker value={p.period} onChange={p.setPeriod} from={p.from} to={p.to} onFrom={p.setFrom} onTo={p.setTo} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Manutenções" value={rows.length} />
          <StatCard label="Valor total" value={fmtMoney(a.totals.maintenanceCost)} tone="accent" />
          <StatCard
            label="Ticket médio"
            value={fmtMoney(rows.length ? a.totals.maintenanceCost / rows.length : 0)}
          />
          <StatCard label="Custo por KM" value={fmtMoney(a.totals.costPerKm)} />
        </div>

        <Tabs defaultValue="registros">
          <TabsList>
            <TabsTrigger value="registros">Registros</TabsTrigger>
            <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
            <TabsTrigger value="tipos">Tipos de serviço</TabsTrigger>
          </TabsList>

          <TabsContent value="registros">
            <div className="surface overflow-x-auto">
              <table className="w-full min-w-[48rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="p-3">Data</th>
                    <th className="p-3">Veículo</th>
                    <th className="p-3">Serviço</th>
                    <th className="p-3">Fornecedor</th>
                    <th className="p-3">KM</th>
                    <th className="p-3">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <tr key={m.id} className="border-b border-border/60 last:border-0">
                      <td className="p-3 whitespace-nowrap">{fmtDate(m.performed_at)}</td>
                      <td className="p-3">{vehicleLabel(fleet.vehicles.find((v) => v.id === m.vehicle_id))}</td>
                      <td className="p-3">
                        {fleet.maintenanceTypes.find((t) => t.id === m.type_id)?.name ?? m.description ?? "—"}
                        <span className="ml-2 text-xs text-muted-foreground">{m.kind}</span>
                      </td>
                      <td className="p-3">{fleet.providers.find((x) => x.id === m.provider_id)?.name ?? "—"}</td>
                      <td className="p-3 tabular-nums">{m.km ? fmtKm(m.km) : "—"}</td>
                      <td className="p-3 tabular-nums font-medium">{fmtMoney(m.amount)}</td>
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nenhuma manutenção no período.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="fornecedores">
            <div className="surface space-y-3 p-4">
              <div className="flex gap-2">
                <Input
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="Nome do fornecedor / oficina"
                />
                <Button onClick={() => addProvider.mutate()} disabled={!providerName.trim()}>
                  Adicionar
                </Button>
              </div>
              {a.maintenanceByProvider.map((prov) => (
                <div key={prov.name} className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
                  <span className="font-medium">{prov.name}</span>
                  <span className="text-muted-foreground">
                    {prov.count} serviço(s) · média {fmtMoney(prov.avg)}
                  </span>
                  <span className="font-semibold tabular-nums">{fmtMoney(prov.total)}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tipos">
            <div className="surface space-y-3 p-4">
              <div className="flex gap-2">
                <Input value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="Ex.: Troca de óleo" />
                <Button onClick={() => addType.mutate()} disabled={!typeName.trim()}>
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {fleet.maintenanceTypes.map((t) => (
                  <span key={t.id} className="rounded-full border border-border px-3 py-1 text-xs font-medium">
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova manutenção</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Veículo</Label>
              <Select value={form.vehicle_id} onValueChange={(v) => set("vehicle_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {fleet.vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {vehicleLabel(v)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de serviço</Label>
              <Select value={form.type_id} onValueChange={(v) => set("type_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {fleet.maintenanceTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fornecedor</Label>
              <Select value={form.provider_id} onValueChange={(v) => set("provider_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {fleet.providers.map((x) => (
                    <SelectItem key={x.id} value={x.id}>
                      {x.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Natureza</Label>
              <Select value={form.kind} onValueChange={(v) => set("kind", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={form.performed_at} onChange={(e) => set("performed_at", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value.replace(",", "."))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>KM no serviço</Label>
              <Input inputMode="numeric" value={form.km} onChange={(e) => set("km", e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={!form.vehicle_id || save.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
