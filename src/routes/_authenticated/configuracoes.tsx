import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/fleet/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAccess } from "@/hooks/useAccess";
import { useSettings, DEFAULT_SETTINGS, type FleetSettings } from "@/hooks/useSettings";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações do sistema — GIRO" },
      { name: "description", content: "Ajuste a tolerância de retorno e outras regras operacionais da frota." },
      { property: "og:title", content: "Configurações do sistema — GIRO" },
      { property: "og:description", content: "Regras operacionais e parâmetros da gestão de frota GIRO." },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const { isAdmin, isLoading } = useAccess();
  const { data } = useSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<FleetSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("settings")
        .upsert(
          { key: "geral", value: { ...form }, updated_at: new Date().toISOString() },
          { onConflict: "key" },
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Configurações salvas.");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isLoading && !isAdmin) {
    return (
      <AppShell title="Configurações">
        <div className="surface p-6 text-sm text-muted-foreground">
          Esta tela está disponível apenas para administradores.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Configurações" description="Parâmetros gerais de operação da frota">
      <div className="surface max-w-xl space-y-6 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="tol">Tolerância de retorno (horas)</Label>
          <Input
            id="tol"
            inputMode="numeric"
            value={String(form.trip_tolerance_hours)}
            onChange={(e) =>
              setForm({ ...form, trip_tolerance_hours: Number(e.target.value.replace(/\D/g, "")) || 0 })
            }
          />
          <p className="text-xs text-muted-foreground">
            Tempo máximo entre a saída e o retorno antes de o veículo aparecer como atrasado no painel.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Exigir foto do painel</p>
            <p className="text-xs text-muted-foreground">
              O motorista precisa anexar a foto do odômetro em cada registro.
            </p>
          </div>
          <Switch
            checked={form.require_photo}
            onCheckedChange={(v) => setForm({ ...form, require_photo: v })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="jump">Variação máxima de KM por registro</Label>
          <Input
            id="jump"
            inputMode="numeric"
            value={String(form.km_max_jump)}
            onChange={(e) => setForm({ ...form, km_max_jump: Number(e.target.value.replace(/\D/g, "")) || 0 })}
          />
          <p className="text-xs text-muted-foreground">
            Acima dessa diferença o registro é destacado como possível erro de digitação.
          </p>
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </AppShell>
  );
}
