import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/fleet/AppShell";
import { PeriodPicker } from "@/components/fleet/PeriodPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFleet, EMPTY_FLEET } from "@/hooks/useFleet";
import { usePeriod } from "@/hooks/usePeriod";
import { buildAnalytics } from "@/lib/analytics";
import { fmtKm, fmtPct, type Driver } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/motoristas")({
  head: () => ({
    meta: [
      { title: "Motoristas e qualidade de lançamento — GIRO" },
      { name: "description", content: "Cadastro de motoristas com KM rodados, viagens, ocorrências e taxa de erro." },
      { property: "og:title", content: "Motoristas e qualidade de lançamento — GIRO" },
      { property: "og:description", content: "Ranking de qualidade e volume de utilização por motorista." },
    ],
  }),
  component: Motoristas,
});

function Motoristas() {
  const { data } = useFleet();
  const fleet = data ?? EMPTY_FLEET;
  const p = usePeriod("30d");
  const qc = useQueryClient();
  const a = useMemo(() => buildAnalytics(fleet, p.range), [fleet, p.range]);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(true);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { name: name.trim(), notes: notes || null, active };
      const res = editId
        ? await supabase.from("drivers").update(payload).eq("id", editId)
        : await supabase.from("drivers").insert(payload);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      toast.success(editId ? "Motorista atualizado." : "Motorista cadastrado.");
      setOpen(false);
      setEditId(null);
      setName("");
      setNotes("");
      setActive(true);
      qc.invalidateQueries({ queryKey: ["fleet"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function edit(d: Driver) {
    setEditId(d.id);
    setName(d.name);
    setNotes(d.notes ?? "");
    setActive(d.active);
    setOpen(true);
  }

  return (
    <AppShell
      title="Motoristas"
      description={`${fleet.drivers.length} cadastrado(s)`}
      actions={
        <Button
          onClick={() => {
            setEditId(null);
            setName("");
            setNotes("");
            setActive(true);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Novo motorista
        </Button>
      }
    >
      <div className="space-y-4">
        <PeriodPicker value={p.period} onChange={p.setPeriod} from={p.from} to={p.to} onFrom={p.setFrom} onTo={p.setTo} />

        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="p-3">Motorista</th>
                <th className="p-3">Viagens</th>
                <th className="p-3">KM</th>
                <th className="p-3">Ocorrências</th>
                <th className="p-3">Correções</th>
                <th className="p-3">Taxa de erro</th>
                <th className="p-3">Qualidade</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {a.drivers.map((d) => {
                const driver = fleet.drivers.find((x) => x.id === d.id)!;
                return (
                  <tr key={d.id} className="border-b border-border/60 last:border-0">
                    <td className="p-3 font-medium">
                      {d.name}
                      {!driver.active ? <span className="ml-2 text-xs text-muted-foreground">(inativo)</span> : null}
                    </td>
                    <td className="p-3 tabular-nums">{d.trips}</td>
                    <td className="p-3 tabular-nums">{fmtKm(d.km)}</td>
                    <td className="p-3 tabular-nums">{d.incidents}</td>
                    <td className="p-3 tabular-nums">{d.corrected}</td>
                    <td className="p-3 tabular-nums">{fmtPct(d.errorRate, 1)}</td>
                    <td className="p-3 tabular-nums font-semibold">{fmtPct(d.quality, 0)}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => edit(driver)}>
                        Editar
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {a.drivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Nenhum motorista cadastrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar motorista" : "Novo motorista"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="dn">Nome</Label>
              <Input id="dn" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dnotes">Observações</Label>
              <Input id="dnotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="dact" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="dact">Ativo (aparece na tela do QR Code)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={!name.trim() || save.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
