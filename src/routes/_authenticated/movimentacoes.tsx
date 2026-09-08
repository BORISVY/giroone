import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/fleet/AppShell";
import { PeriodPicker } from "@/components/fleet/PeriodPicker";
import { MovementTypePill } from "@/components/fleet/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFleet, EMPTY_FLEET } from "@/hooks/useFleet";
import { usePeriod } from "@/hooks/usePeriod";
import { inRange } from "@/lib/period";
import { fmtDateTime, fmtKm, vehicleLabel, type Movement } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/movimentacoes")({
  head: () => ({
    meta: [
      { title: "Movimentações da frota — GIRO" },
      { name: "description", content: "Histórico completo de saídas e retornos com correção auditada de lançamentos." },
      { property: "og:title", content: "Movimentações da frota — GIRO" },
      { property: "og:description", content: "Auditoria de saídas, retornos e correções de quilometragem." },
    ],
  }),
  component: Movimentacoes,
});

function Movimentacoes() {
  const { data } = useFleet();
  const fleet = data ?? EMPTY_FLEET;
  const p = usePeriod("30d");
  const qc = useQueryClient();

  const [vehicleId, setVehicleId] = useState("all");
  const [driverId, setDriverId] = useState("all");
  const [type, setType] = useState("all");
  const [editing, setEditing] = useState<Movement | null>(null);
  const [km, setKm] = useState("");
  const [reason, setReason] = useState("");
  const [justify, setJustify] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  async function openPhoto(path: string) {
    const { data, error } = await supabase.storage.from("painel-fotos").createSignedUrl(path, 300);
    if (error || !data) {
      toast.error("Não foi possível abrir a foto.");
      return;
    }
    setPhotoUrl(data.signedUrl);
  }

  const rows = useMemo(
    () =>
      fleet.movements.filter(
        (m) =>
          inRange(m.occurred_at, p.range) &&
          (vehicleId === "all" || m.vehicle_id === vehicleId) &&
          (driverId === "all" || m.driver_id === driverId) &&
          (type === "all" || m.type === type),
      ),
    [fleet.movements, p.range, vehicleId, driverId, type],
  );

  const vName = (id: string) => vehicleLabel(fleet.vehicles.find((v) => v.id === id));
  const dName = (id: string) => fleet.drivers.find((d) => d.id === id)?.name ?? "—";

  const correct = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const newKm = Number(km);
      const { error } = await supabase
        .from("movements")
        .update({
          km: newKm,
          reason,
          corrected: true,
          correction_count: (editing.correction_count ?? 0) + 1,
        })
        .eq("id", editing.id);
      if (error) throw new Error(error.message);

      if (editing.trip_id) {
        const trip = fleet.trips.find((t) => t.id === editing.trip_id);
        if (trip) {
          const patch =
            editing.type === "saida"
              ? { start_km: newKm, distance_km: trip.end_km != null ? Number(trip.end_km) - newKm : null }
              : { end_km: newKm, distance_km: newKm - Number(trip.start_km) };
          await supabase.from("trips").update(patch).eq("id", trip.id);
        }
      }

      await supabase.from("error_events").insert({
        vehicle_id: editing.vehicle_id,
        driver_id: editing.driver_id,
        movement_id: editing.id,
        kind: "correcao",
        blocked: false,
        details: justify || "Correção manual do lançamento",
      });
      await supabase.from("audit_logs").insert({
        entity: "movements",
        entity_id: editing.id,
        action: "update",
        field: "km",
        old_value: String(editing.km),
        new_value: String(newKm),
        reason: justify,
      });
    },
    onSuccess: () => {
      toast.success("Lançamento corrigido e registrado na auditoria.");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["fleet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (m: Movement) => {
      const { error } = await supabase
        .from("movements")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", m.id);
      if (error) throw new Error(error.message);
      await supabase.from("audit_logs").insert({
        entity: "movements",
        entity_id: m.id,
        action: "delete",
        reason: "Exclusão manual pelo administrativo",
      });
    },
    onSuccess: () => {
      toast.success("Movimentação excluída.");
      qc.invalidateQueries({ queryKey: ["fleet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Movimentações" description={`${rows.length} lançamento(s) no período`}>
      <div className="space-y-4">
        <PeriodPicker value={p.period} onChange={p.setPeriod} from={p.from} to={p.to} onFrom={p.setFrom} onTo={p.setTo} />

        <div className="grid gap-3 sm:grid-cols-3">
          <FilterSelect value={vehicleId} onChange={setVehicleId} placeholder="Todos os veículos">
            {fleet.vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {vehicleLabel(v)}
              </SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect value={driverId} onChange={setDriverId} placeholder="Todos os motoristas">
            {fleet.drivers.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect value={type} onChange={setType} placeholder="Todos os tipos">
            <SelectItem value="saida">Saídas</SelectItem>
            <SelectItem value="retorno">Retornos</SelectItem>
          </FilterSelect>
        </div>

        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="p-3">Data/hora</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Veículo</th>
                <th className="p-3">Motorista</th>
                <th className="p-3">KM</th>
                <th className="p-3">Motivo</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-border/60 last:border-0">
                  <td className="p-3 whitespace-nowrap">{fmtDateTime(m.occurred_at)}</td>
                  <td className="p-3">
                    <MovementTypePill type={m.type} />
                  </td>
                  <td className="p-3">{vName(m.vehicle_id)}</td>
                  <td className="p-3">{dName(m.driver_id)}</td>
                  <td className="p-3 tabular-nums">
                    {fmtKm(m.km)}
                    {m.corrected ? <span className="ml-2 text-xs text-warning">corrigido</span> : null}
                  </td>
                  <td className="p-3 max-w-[16rem] truncate text-muted-foreground">{m.reason ?? "—"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      {m.photo_url ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Ver foto do painel"
                          onClick={() => openPhoto(m.photo_url as string)}
                        >
                          <ImageIcon className="size-4" />
                        </Button>
                      ) : null}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditing(m);
                          setKm(String(m.km));
                          setReason(m.reason ?? "");
                          setJustify("");
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(m)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhuma movimentação no período/filtros.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!photoUrl} onOpenChange={(o) => !o && setPhotoUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foto do painel</DialogTitle>
            <DialogDescription>Imagem enviada pelo motorista no momento do registro.</DialogDescription>
          </DialogHeader>
          {photoUrl ? <img src={photoUrl} alt="Foto do painel do veículo" className="w-full rounded-lg" /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corrigir lançamento</DialogTitle>
            <DialogDescription>
              A correção é registrada na auditoria e conta como erro de lançamento do motorista.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ckm">Quilometragem</Label>
              <Input id="ckm" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="creason">Motivo da utilização</Label>
              <Input id="creason" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cjust">Justificativa da correção</Label>
              <Textarea id="cjust" value={justify} onChange={(e) => setJustify(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={() => correct.mutate()} disabled={correct.isPending || !justify.trim()}>
              Salvar correção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {children}
      </SelectContent>
    </Select>
  );
}
