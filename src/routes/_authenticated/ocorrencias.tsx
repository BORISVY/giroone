import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/fleet/AppShell";
import { StatCard } from "@/components/fleet/StatCard";
import { IncidentStatusPill } from "@/components/fleet/StatusPill";
import { Button } from "@/components/ui/button";
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
import {
  INCIDENT_CATEGORIES,
  INCIDENT_STATUS,
  categoryLabel,
  fmtDateTime,
  fmtKm,
  statusLabel,
  vehicleLabel,
  type Incident,
  type IncidentCategory,
  type IncidentStatus,
} from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/ocorrencias")({
  head: () => ({
    meta: [
      { title: "Ocorrências da frota — GIRO" },
      { name: "description", content: "Acompanhe, classifique e resolva as ocorrências relatadas pelos motoristas." },
      { property: "og:title", content: "Ocorrências da frota — GIRO" },
      { property: "og:description", content: "Fluxo de tratativa de ocorrências: nova, visualizada, pendente, realizada." },
    ],
  }),
  component: Ocorrencias,
});

function Ocorrencias() {
  const { data } = useFleet();
  const fleet = data ?? EMPTY_FLEET;
  const qc = useQueryClient();

  const [status, setStatus] = useState("abertas");
  const [vehicleId, setVehicleId] = useState("all");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [note, setNote] = useState("");

  const rows = useMemo(
    () =>
      fleet.incidents.filter((i) => {
        const okStatus =
          status === "all"
            ? true
            : status === "abertas"
              ? i.status === "nova" || i.status === "visualizada" || i.status === "pendente"
              : i.status === status;
        return okStatus && (vehicleId === "all" || i.vehicle_id === vehicleId);
      }),
    [fleet.incidents, status, vehicleId],
  );

  const counts = useMemo(() => {
    const base: Record<IncidentStatus, number> = {
      nova: 0,
      visualizada: 0,
      pendente: 0,
      realizada: 0,
      recusada: 0,
    };
    fleet.incidents.forEach((i) => (base[i.status] += 1));
    return base;
  }, [fleet.incidents]);

  const history = useQuery({
    queryKey: ["incident-history", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data: h, error } = await supabase
        .from("incident_history")
        .select("*")
        .eq("incident_id", selected!.id)
        .order("created_at");
      if (error) throw new Error(error.message);
      return h ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async ({ incident, to }: { incident: Incident; to: IncidentStatus }) => {
      const patch: Partial<Incident> = { status: to };
      if (to === "visualizada" && !incident.viewed_at) patch["viewed_at"] = new Date().toISOString();
      if (to === "realizada" || to === "recusada") {
        patch["resolved_at"] = new Date().toISOString();
        patch["resolution_note"] = note || null;
      }
      const { error } = await supabase.from("incidents").update(patch).eq("id", incident.id);
      if (error) throw new Error(error.message);
      await supabase.from("incident_history").insert({
        incident_id: incident.id,
        from_status: incident.status,
        to_status: to,
        note: note || null,
      });
    },
    onSuccess: (_r, vars) => {
      toast.success(`Ocorrência marcada como ${statusLabel(vars.to).toLowerCase()}.`);
      setNote("");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["fleet"] });
      qc.invalidateQueries({ queryKey: ["incident-history"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeCategory = useMutation({
    mutationFn: async ({ incident, category }: { incident: Incident; category: IncidentCategory }) => {
      const { error } = await supabase.from("incidents").update({ category }).eq("id", incident.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fleet"] }),
  });

  return (
    <AppShell title="Ocorrências" description="Tudo que os motoristas relataram, em um só lugar">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Novas" value={counts.nova} tone="accent" />
          <StatCard label="Visualizadas" value={counts.visualizada} tone="info" />
          <StatCard label="Pendentes" value={counts.pendente} tone="warning" />
          <StatCard label="Realizadas" value={counts.realizada} tone="success" />
          <StatCard label="Recusadas" value={counts.recusada} tone="danger" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="abertas">Em aberto</SelectItem>
              <SelectItem value="all">Todos os status</SelectItem>
              {INCIDENT_STATUS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os veículos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os veículos</SelectItem>
              {fleet.vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {vehicleLabel(v)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => {
                setSelected(i);
                setNote("");
                if (i.status === "nova") update.mutate({ incident: i, to: "visualizada" });
              }}
              className="surface p-4 text-left transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">#{i.number}</span>
                <IncidentStatusPill status={i.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-medium">{i.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {vehicleLabel(fleet.vehicles.find((v) => v.id === i.vehicle_id))} ·{" "}
                {fleet.drivers.find((d) => d.id === i.driver_id)?.name ?? "—"} · {fmtDateTime(i.created_at)}
              </p>
              <p className="mt-1 text-xs font-semibold text-primary">{categoryLabel(i.category)}</p>
            </button>
          ))}
          {rows.length === 0 ? (
            <p className="surface p-8 text-center text-sm text-muted-foreground lg:col-span-2">
              Nenhuma ocorrência com esses filtros.
            </p>
          ) : null}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>Ocorrência #{selected.number}</DialogTitle>
                <DialogDescription>
                  {vehicleLabel(fleet.vehicles.find((v) => v.id === selected.vehicle_id))} ·{" "}
                  {fmtDateTime(selected.created_at)} · {fmtKm(selected.km)}
                </DialogDescription>
              </DialogHeader>

              <p className="rounded-lg bg-muted p-3 text-sm">{selected.description}</p>

              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={selected.category}
                  onValueChange={(v) => {
                    changeCategory.mutate({ incident: selected, category: v as IncidentCategory });
                    setSelected({ ...selected, category: v as IncidentCategory });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note">Anotação / tratativa</Label>
                <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              </div>

              {history.data?.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Histórico</p>
                  {history.data.map((h) => (
                    <div key={h.id} className="rounded-lg border border-border p-2 text-xs">
                      <p className="font-medium">
                        {h.from_status ? `${statusLabel(h.from_status)} → ` : ""}
                        {h.to_status ? statusLabel(h.to_status) : "Anotação"}
                      </p>
                      <p className="text-muted-foreground">
                        {fmtDateTime(h.created_at)}
                        {h.note ? ` · ${h.note}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <DialogFooter className="flex-wrap gap-2">
                <Button variant="outline" onClick={() => update.mutate({ incident: selected, to: "pendente" })}>
                  Pendente
                </Button>
                <Button variant="outline" onClick={() => update.mutate({ incident: selected, to: "recusada" })}>
                  Recusar
                </Button>
                <Button onClick={() => update.mutate({ incident: selected, to: "realizada" })}>
                  Marcar como realizada
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
