import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Camera, Car, CheckCircle2, LogOut, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VehicleStatusPill } from "@/components/fleet/StatusPill";
import { fmtDateTime, fmtKm, parseMovementError, vehicleLabel } from "@/lib/fleet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/veiculos/$code/registro")({
  head: () => ({
    meta: [
      { title: "Registrar movimentação — GIRO" },
      { name: "description", content: "Registre a saída ou o retorno do veículo em poucos segundos." },
      { property: "og:title", content: "Registrar movimentação — GIRO" },
      { property: "og:description", content: "Registro rápido de saída e retorno de veículos da frota." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RegistroPage,
});

interface OpenTrip {
  id: string;
  start_km: number;
  started_at: string;
  reason: string | null;
  driver_id: string;
}

function RegistroPage() {
  const { code } = Route.useParams();
  const qc = useQueryClient();

  const vehicleQuery = useQuery({
    queryKey: ["registro", code],
    queryFn: async () => {
      const { data: vehicle, error } = await supabase
        .from("vehicles")
        .select("id, code, brand, model, plate, current_km, status")
        .eq("code", code)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!vehicle) return null;

      const [{ data: drivers }, { data: trips }] = await Promise.all([
        supabase.from("drivers").select("id, name").eq("active", true).order("name"),
        supabase
          .from("trips")
          .select("id, start_km, started_at, reason, driver_id")
          .eq("vehicle_id", vehicle.id)
          .eq("open", true)
          .order("started_at", { ascending: false })
          .limit(1),
      ]);

      return {
        vehicle,
        drivers: drivers ?? [],
        openTrip: (trips?.[0] as OpenTrip | undefined) ?? null,
      };
    },
  });

  const data = vehicleQuery.data;
  const vehicle = data?.vehicle;
  const openTrip = data?.openTrip ?? null;
  const suggested: "saida" | "retorno" = openTrip ? "retorno" : "saida";

  const [driverId, setDriverId] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"saida" | "retorno" | null>(null);
  const [km, setKm] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState<null | { type: string; km: number }>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const effectiveType = type ?? suggested;

  const filteredDrivers = useMemo(() => {
    const list = data?.drivers ?? [];
    const q = search.trim().toLowerCase();
    return q ? list.filter((d) => d.name.toLowerCase().includes(q)) : list;
  }, [data?.drivers, search]);

  const newDriverName = useMemo(() => {
    const q = search.trim().replace(/\s+/g, " ");
    if (q.length < 3 || !q.includes(" ")) return null;
    const list = data?.drivers ?? [];
    if (list.some((d) => d.name.trim().toLowerCase() === q.toLowerCase())) return null;
    return q
      .split(" ")
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(" ");
  }, [search, data?.drivers]);

  const createDriver = useMutation({
    mutationFn: async (name: string) => {
      const { data: id, error } = await supabase.rpc("ensure_driver", { p_name: name });
      if (error) throw new Error(error.message);
      return id as string;
    },
    onSuccess: (id, name) => {
      setDriverId(id);
      setSearch("");
      qc.invalidateQueries({ queryKey: ["registro", code] });
      toast.success(`Motorista ${name} cadastrado!`);
    },
    onError: () => toast.error("Informe nome e sobrenome para cadastrar o motorista."),
  });

  const openDriverName = openTrip
    ? (data?.drivers.find((d) => d.id === openTrip.driver_id)?.name ?? "Motorista")
    : null;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!photo) throw new Error("FOTO_OBRIGATORIA");
      const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${code}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const upload = await supabase.storage.from("painel-fotos").upload(path, photo, {
        contentType: photo.type || "image/jpeg",
        upsert: false,
      });
      if (upload.error) throw new Error("Falha ao enviar a foto do painel. Tente novamente.");

      const { data: result, error } = await supabase.rpc("register_movement", {
        p_vehicle_code: code,
        p_driver_id: driverId,
        p_type: effectiveType,
        p_km: Number(km),
        p_reason: reason,
        p_photo_url: path,
        ...(notes ? { p_notes: notes } : {}),
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      setDone({ type: effectiveType, km: Number(km) });
      qc.invalidateQueries({ queryKey: ["registro", code] });
    },
    onError: (err: Error) => toast.error(parseMovementError(err.message)),
  });

  if (vehicleQuery.isLoading) {
    return <Centered>Carregando veículo...</Centered>;
  }

  if (!vehicle) {
    return (
      <Centered>
        <p className="text-lg font-semibold">Veículo não encontrado</p>
        <p className="mt-2 text-sm text-muted-foreground">
          O código <span className="font-mono">{code}</span> não corresponde a nenhum veículo ativo. Procure o
          responsável pela frota.
        </p>
      </Centered>
    );
  }

  if (done) {
    return (
      <Centered>
        <CheckCircle2 className="mx-auto size-14 text-success" />
        <p className="mt-4 text-xl font-semibold">
          {done.type === "saida" ? "Saída registrada!" : "Retorno registrado!"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {vehicleLabel(vehicle)} · {fmtKm(done.km)}
        </p>
        {notes ? (
          <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Sua observação foi enviada como ocorrência e será acompanhada pelo responsável.
          </p>
        ) : null}
        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={() => {
            setDone(null);
            setDriverId("");
            setType(null);
            setKm("");
            setReason("");
            setNotes("");
            setSearch("");
            setPhoto(null);
            setPhotoPreview(null);
          }}
        >
          Novo registro
        </Button>
      </Centered>
    );
  }

  const canSubmit = driverId && km !== "" && reason.trim() !== "" && !!photo && !mutation.isPending;

  return (
    <div className="min-h-screen bg-muted/40 pb-10">
      <div className="brand-gradient px-4 pb-16 pt-6 text-primary-foreground">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">GIRO</p>
        <h1 className="mt-1 text-2xl font-bold">Registrar movimentação</h1>
      </div>

      <div className="mx-auto -mt-10 w-full max-w-lg space-y-4 px-4">
        <div className="surface p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Car className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">{vehicleLabel(vehicle)}</p>
              <p className="text-xs text-muted-foreground">Última KM: {fmtKm(vehicle.current_km)}</p>
            </div>
            <VehicleStatusPill status={vehicle.status} />
          </div>
          {openTrip ? (
            <div className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs">
              <p className="font-semibold">Veículo em uso por {openDriverName}</p>
              <p className="text-muted-foreground">
                Saída em {fmtDateTime(openTrip.started_at)} · {fmtKm(openTrip.start_km)}
                {openTrip.reason ? ` · ${openTrip.reason}` : ""}
              </p>
            </div>
          ) : null}
        </div>

        <div className="surface space-y-5 p-4">
          <div className="space-y-2">
            <Label>Motorista</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar pelo nome"
                className="pl-9"
              />
            </div>
            <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-lg border border-border p-1.5">
              {filteredDrivers.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">Nenhum motorista encontrado.</p>
              ) : null}
              {newDriverName ? (
                <button
                  type="button"
                  disabled={createDriver.isPending}
                  onClick={() => createDriver.mutate(newDriverName)}
                  className="w-full rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 px-3 py-2.5 text-left text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  {createDriver.isPending
                    ? "Cadastrando..."
                    : `Cadastrar "${newDriverName}" como novo motorista`}
                </button>
              ) : null}
              {filteredDrivers.length > 0 ? (
                filteredDrivers.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDriverId(d.id)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      driverId === d.id ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                    )}
                  >
                    {d.name}
                  </button>
                ))
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de movimentação</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("saida")}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border-2 py-5 text-sm font-bold transition-colors",
                  effectiveType === "saida"
                    ? "border-accent bg-accent/15 text-accent-foreground"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <LogOut className="size-6" />
                SAÍDA
              </button>
              <button
                type="button"
                onClick={() => setType("retorno")}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border-2 py-5 text-sm font-bold transition-colors",
                  effectiveType === "retorno"
                    ? "border-success bg-success/15 text-success"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <ArrowLeftRight className="size-6" />
                RETORNO
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Sugerido pelo status atual: <strong>{suggested === "saida" ? "SAÍDA" : "RETORNO"}</strong>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="km">Quilometragem do painel</Label>
            <Input
              id="km"
              inputMode="numeric"
              value={km}
              onChange={(e) => setKm(e.target.value.replace(/[^\d]/g, ""))}
              placeholder={String(Math.round(Number(vehicle.current_km)))}
              className="h-12 text-lg"
            />
            <p className="text-xs text-muted-foreground">Não pode ser menor que {fmtKm(vehicle.current_km)}.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="photo">Foto do painel (obrigatória)</Label>
            {photoPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img src={photoPreview} alt="Foto do painel do veículo" className="max-h-64 w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remover foto"
                  onClick={() => {
                    setPhoto(null);
                    setPhotoPreview(null);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-foreground/70 p-1.5 text-background"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="photo"
                className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                <Camera className="size-6" />
                Tirar foto do odômetro
              </label>
            )}
            <input
              id="photo"
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setPhoto(file);
                setPhotoPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              A foto precisa mostrar a quilometragem digitada acima.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Motivo da utilização</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: Entrega de material no cliente X"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observação / ocorrência (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Pneu dianteiro esquerdo aparentando estar murcho"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Se preenchida, vira uma ocorrência acompanhada pelo responsável.
            </p>
          </div>

          <Button
            size="lg"
            className="h-14 w-full text-base font-bold"
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Enviando foto e registrando..." : `REGISTRAR ${effectiveType === "saida" ? "SAÍDA" : "RETORNO"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="surface w-full max-w-md p-6 text-center">{children}</div>
    </div>
  );
}
