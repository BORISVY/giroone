import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Car,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/useAccess";

const NAV = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard, screen: "painel" },
  { to: "/movimentacoes", label: "Movimentações", icon: Activity, screen: "movimentacoes" },
  { to: "/ocorrencias", label: "Ocorrências", icon: AlertTriangle, screen: "ocorrencias" },
  { to: "/veiculos", label: "Veículos", icon: Car, screen: "veiculos" },
  { to: "/motoristas", label: "Motoristas", icon: Users, screen: "motoristas" },
  { to: "/manutencoes", label: "Manutenções", icon: Wrench, screen: "manutencoes" },
  { to: "/qrcodes", label: "QR Codes", icon: QrCode, screen: "qrcodes" },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart, screen: "relatorios" },
  { to: "/usuarios", label: "Usuários", icon: ShieldCheck, screen: "usuarios", adminOnly: true },
  { to: "/configuracoes", label: "Configurações", icon: Settings, screen: "configuracoes", adminOnly: true },
] as const;

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { isAdmin, canView } = useAccess();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.filter((item) => ("adminOnly" in item && item.adminOnly ? isAdmin : canView(item.screen))).map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar p-4 lg:flex">
        <Brand />
        <div className="mt-6 flex-1">{nav}</div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4" /> Sair
        </button>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar p-4">
            <div className="flex items-center justify-between">
              <Brand />
              <button onClick={() => setOpen(false)} className="text-sidebar-foreground">
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-6 flex-1">{nav}</div>
            <button
              onClick={signOut}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75"
            >
              <LogOut className="size-4" /> Sair
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold lg:text-xl">{title}</h1>
              {description ? (
                <p className="truncate text-xs text-muted-foreground lg:text-sm">{description}</p>
              ) : null}
            </div>
            {actions}
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/painel" className="flex items-center gap-2.5">
      <span className="brand-gradient flex size-9 items-center justify-center rounded-xl font-display text-sm font-bold text-primary-foreground">
        GI
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">
        GIRO
      </span>
    </Link>
  );
}
