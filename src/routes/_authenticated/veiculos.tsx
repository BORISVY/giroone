import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/fleet/AppShell";
import { VehicleStatusPill } from "@/components/fleet/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFleet, EMPTY_FLEET } from "@/hooks/useFleet";
import { fmtKm, type Vehicle, type VehicleStatus } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/veiculos")({
  head: () => ({
    meta: [
      { title: "Veículos da frota — GIRO" },
      { name: "description", content: "Cadastro da frota com status atual, quilometragem e histórico por veículo." },
      { property: "og:title", content: "Veículos da frota — GIRO" },
      { property: "og:description", content: "Gerencie marca, modelo, placa, status e KM de cada veículo." },
    ],
  }),
  component: Veiculos,
});

const EMPTY = {
  code: "",
  brand: "",
  model: "",
  plate: "",
  year: "",
  color: "",
  current_km: "0",
  status: "disponivel" as VehicleStatus,
  notes: "",
};

function Veiculos() {
  const { data } = useFleet();
  const fleet = data ?? EMPTY_FLEET;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  // KM atual de cada veículo = KM do lançamento mais recente (saída ou retorno)
  const currentKmByVehicle = useMemo(() => {
    const map = new Map<string, number>();
    const at = new Map<string, number>();
    for (const m of fleet.movements) {
      const km = Number(m.km);
      if (!Number.isFinite(km)) continue;
      const t = new Date(m.occurred_at).getTime();
      if (t >= (at.get(m.vehicle_id) ?? -Infinity)) { at.set(m.vehicle_id, t); map.set(m.vehicle_id, km); }
    }
    return map;
  }, [fleet.movements]);

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.trim().toUpperCase(),
        brand: form.brand,
        model: form.model,
        plate: form.plate.trim().toUpperCase(),
        year: form.year ? Number(form.year) : null,
        color: form.color || null,
        current_km: Number(form.current_km || 0),
        status: form.status,
        notes: form.notes || null,
      };
      const res = editId
        ? await supabase.from("vehicles").update(payload).eq("id", editId)
        : await supabase.from("vehicles").insert(payload);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      toast.success(editId ? "Veículo atualizado." : "Veículo cadastrado.");
      setOpen(false);
      setEditId(null);
      setForm(EMPTY);
      qc.invalidateQueries({ queryKey: ["fleet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await supabase
        .from("vehicles")
        .update({ deleted_at: new Date().toISOString(), active: false })
        .eq("id", id);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      toast.success("Veículo excluído.");
      qc.invalidateQueries({ queryKey: ["fleet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function edit(v: Vehicle) {
    setEditId(v.id);
    setForm({
      code: v.code,
      brand: v.brand,
      model: v.model,
      plate: v.plate,
      year: v.year ? String(v.year) : "",
      color: v.color ?? "",
      current_km: String(v.current_km),
      status: v.status,
      notes: v.notes ?? "",
    });
    setOpen(true);
  }

  return (
    <AppShell
      title="Veículos"
      description={`${fleet.vehicles.length} veículo(s) cadastrado(s)`}
      actions={
        <Button
          onClick={() => {
            setEditId(null);
            setForm(EMPTY);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Novo veículo
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {fleet.vehicles.map((v) => (
          <div key={v.id} className="surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-semibold">
                  {v.brand} {v.model}
                </p>
                <p className="text-sm text-muted-foreground">
                  {v.plate} · código {v.code}
                </p>
              </div>
              <VehicleStatusPill status={v.status} />
            </div>
            <p className="mt-3 text-sm">{fmtKm(currentKmByVehicle.get(v.id) ?? 0)}</p>
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/veiculos/$code" params={{ code: v.code }}>
                  Ver histórico
                </Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => edit(v)}>
                Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  if (confirm(`Excluir o veículo ${v.plate}? O histórico será mantido.`)) remove.mutate(v.id);
                }}
              >
                Excluir
              </Button>
            </div>
          </div>
        ))}
        {fleet.vehicles.length === 0 ? (
          <p className="surface p-8 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
            Nenhum veículo cadastrado ainda.
          </p>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar veículo" : "Novo veículo"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Código (QR)" value={form.code} onChange={(v) => set("code", v)} />
            <Field label="Placa" value={form.plate} onChange={(v) => set("plate", v)} />
            <Field label="Marca" value={form.brand} onChange={(v) => set("brand", v)} />
            <Field label="Modelo" value={form.model} onChange={(v) => set("model", v)} />
            <Field label="Ano" value={form.year} onChange={(v) => set("year", v.replace(/\D/g, ""))} />
            <Field label="Cor" value={form.color} onChange={(v) => set("color", v)} />
            <Field
              label="KM atual"
              value={form.current_km}
              onChange={(v) => set("current_km", v.replace(/\D/g, ""))}
            />
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_uso">Em uso</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Field label="Observações" value={form.notes} onChange={(v) => set("notes", v)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.code || !form.plate}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
