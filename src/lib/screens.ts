export interface ScreenDef {
  key: string;
  label: string;
  adminOnly?: boolean;
}

export const SCREENS: ScreenDef[] = [
  { key: "painel", label: "Painel" },
  { key: "movimentacoes", label: "Movimentações" },
  { key: "ocorrencias", label: "Ocorrências" },
  { key: "veiculos", label: "Veículos" },
  { key: "motoristas", label: "Motoristas" },
  { key: "manutencoes", label: "Manutenções" },
  { key: "qrcodes", label: "QR Codes" },
  { key: "relatorios", label: "Relatórios" },
  { key: "importacao", label: "Importar dados", adminOnly: true },
  { key: "usuarios", label: "Usuários", adminOnly: true },
  { key: "configuracoes", label: "Configurações", adminOnly: true },
];

export const EDITABLE_SCREENS = SCREENS.filter((s) => !s.adminOnly);
