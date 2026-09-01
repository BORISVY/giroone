import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, BarChart3, QrCode, ShieldCheck, Wrench } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GIRO — Controle de frota, saídas, retornos e ocorrências" },
      {
        name: "description",
        content:
          "Substitua planilhas por um sistema real de gestão de frota: registro por QR Code, controle de KM, ocorrências rastreáveis e painel gerencial.",
      },
      { property: "og:title", content: "GIRO — Gestão Integrada de Rotas e Operações" },
      {
        property: "og:description",
        content: "Registro de viagens por QR Code, alertas de retorno pendente e indicadores gerenciais da frota.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: QrCode, title: "Registro em segundos", text: "O motorista escaneia o QR Code do painel e lança saída ou retorno sem login." },
  { icon: ShieldCheck, title: "Validação no servidor", text: "Saída duplicada, retorno sem saída e KM retroativo são bloqueados na origem." },
  { icon: AlertTriangle, title: "Ocorrências rastreáveis", text: "Toda observação vira uma ocorrência com status, histórico e tempo de resolução." },
  { icon: Wrench, title: "Manutenções e custos", text: "Gastos por veículo, por prestador, por tipo e custo por quilômetro rodado." },
  { icon: Activity, title: "Qualidade de lançamento", text: "Taxa de erro e ranking por motorista, considerando correções feitas depois." },
  { icon: BarChart3, title: "Painel gerencial", text: "Utilização da frota, rankings, matriz motorista × veículo e evolução no tempo." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="brand-gradient flex size-9 items-center justify-center rounded-xl font-display text-sm font-bold text-primary-foreground">
              GI
            </span>
            <span className="font-display text-lg font-bold tracking-tight">GIRO</span>
          </div>
          <Link
            to="/auth"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Acesso administrativo
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Gestão Integrada de Rotas e Operações
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight lg:text-6xl">
          Onde está cada veículo, quem está dirigindo e quanto ele custa.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground lg:text-lg">
          O GIRO substitui o Google Forms + planilha por um sistema de controle de frota com status por veículo,
          histórico completo, ocorrências acompanhadas até a conclusão e indicadores para decisão.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Entrar no painel
          </Link>
          <Link
            to="/qrcodes"
            className="rounded-lg border border-input px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
          >
            QR Codes da frota
          </Link>
        </div>
      </section>

      <section className="border-t border-border bg-card/50">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="surface p-5">
                <Icon className="size-5 text-primary" />
                <h2 className="mt-3 text-base font-semibold">{f.title}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        GIRO · Controle de frota, saídas, chegadas, manutenções e ocorrências.
      </footer>
    </div>
  );
}
