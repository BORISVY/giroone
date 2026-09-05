import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import { AppShell } from "@/components/fleet/AppShell";
import { Button } from "@/components/ui/button";
import { useFleet, EMPTY_FLEET } from "@/hooks/useFleet";
import { vehicleLabel } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/qrcodes")({
  head: () => ({
    meta: [
      { title: "QR Codes dos veículos — GIRO" },
      { name: "description", content: "Gere e imprima o QR Code de cada veículo para registro rápido de saída e retorno." },
      { property: "og:title", content: "QR Codes dos veículos — GIRO" },
      { property: "og:description", content: "Etiquetas prontas para colar no para-brisa de cada veículo." },
    ],
  }),
  component: QrCodes,
});

function QrCodes() {
  const { data } = useFleet();
  const fleet = data ?? EMPTY_FLEET;
  const [images, setImages] = useState<Record<string, string>>({});
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!origin) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        fleet.vehicles.map(async (v) => {
          const url = `${origin}/veiculos/${v.code}/registro`;
          const img = await QRCode.toDataURL(url, { width: 512, margin: 1 });
          return [v.id, img] as const;
        }),
      );
      if (!cancelled) setImages(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [fleet.vehicles, origin]);

  return (
    <AppShell
      title="QR Codes"
      description="Imprima e cole no para-brisa. O motorista escaneia e registra em segundos."
      actions={
        <Button onClick={() => window.print()} className="print:hidden">
          <Printer className="size-4" /> Imprimir
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fleet.vehicles.map((v) => (
          <div key={v.id} className="surface flex flex-col items-center p-5 text-center">
            <p className="font-display text-lg font-bold">{v.plate}</p>
            <p className="text-sm text-muted-foreground">{vehicleLabel(v)}</p>
            {images[v.id] ? (
              <img src={images[v.id]} alt={`QR Code do veículo ${v.plate}`} className="my-4 size-44" />
            ) : (
              <div className="my-4 size-44 animate-pulse rounded-lg bg-muted" />
            )}
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Escaneie para registrar saída ou retorno
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {origin}/veiculos/{v.code}/registro
            </p>
          </div>
        ))}
        {fleet.vehicles.length === 0 ? (
          <p className="surface p-8 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            Cadastre veículos para gerar os QR Codes.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
