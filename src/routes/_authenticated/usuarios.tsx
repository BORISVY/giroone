import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/fleet/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAccess } from "@/hooks/useAccess";
import { EDITABLE_SCREENS } from "@/lib/screens";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Controle de usuários — GIRO" },
      { name: "description", content: "Defina quem é administrador e o que cada usuário pode ver ou editar." },
      { property: "og:title", content: "Controle de usuários — GIRO" },
      { property: "og:description", content: "Permissões de visualização e edição por tela para cada usuário." },
    ],
  }),
  component: Usuarios,
});

interface UserRow {
  id: string;
  name: string;
  email: string | null;
  isAdmin: boolean;
  perms: Record<string, { view: boolean; edit: boolean }>;
}

function Usuarios() {
  const { isAdmin, isLoading: accessLoading, userId } = useAccess();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [draft, setDraft] = useState<Record<string, { view: boolean; edit: boolean }>>({});

  const users = useQuery({
    queryKey: ["users-admin"],
    enabled: isAdmin,
    queryFn: async (): Promise<UserRow[]> => {
      const [{ data: profiles, error }, { data: roles }, { data: perms }] = await Promise.all([
        supabase.from("profiles").select("id, name, email").order("name"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("user_permissions").select("user_id, screen, can_view, can_edit"),
      ]);
      if (error) throw new Error(error.message);
      return (profiles ?? []).map((p) => {
        const map: Record<string, { view: boolean; edit: boolean }> = {};
        for (const perm of perms ?? []) {
          if (perm.user_id === p.id) map[perm.screen] = { view: perm.can_view, edit: perm.can_edit };
        }
        return {
          id: p.id,
          name: p.name || (p.email ?? "Sem nome"),
          email: p.email,
          isAdmin: (roles ?? []).some((r) => r.user_id === p.id && r.role === "admin"),
          perms: map,
        };
      });
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async (u: UserRow) => {
      if (u.isAdmin) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", "admin");
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: u.id, role: "admin" });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Permissão de administrador atualizada.");
      qc.invalidateQueries({ queryKey: ["users-admin"] });
      qc.invalidateQueries({ queryKey: ["access"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const savePerms = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const rows = EDITABLE_SCREENS.map((s) => ({
        user_id: editing.id,
        screen: s.key,
        can_view: draft[s.key]?.view ?? true,
        can_edit: draft[s.key]?.edit ?? false,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from("user_permissions").upsert(rows, { onConflict: "user_id,screen" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Permissões salvas.");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["users-admin"] });
      qc.invalidateQueries({ queryKey: ["access"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!accessLoading && !isAdmin) {
    return (
      <AppShell title="Usuários">
        <div className="surface p-6 text-sm text-muted-foreground">
          Esta tela está disponível apenas para administradores.
        </div>
      </AppShell>
    );
  }

  const rows = users.data ?? [];

  return (
    <AppShell title="Usuários" description={`${rows.length} usuário(s) com acesso ao sistema`}>
      <div className="surface overflow-x-auto">
        <table className="w-full min-w-[44rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="p-3">Usuário</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Administrador</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-border/60 last:border-0">
                <td className="p-3 font-medium">
                  <span className="flex items-center gap-2">
                    {u.isAdmin ? <ShieldCheck className="size-4 text-primary" /> : null}
                    {u.name}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{u.email ?? "—"}</td>
                <td className="p-3">
                  <Switch
                    checked={u.isAdmin}
                    disabled={u.id === userId || toggleAdmin.isPending}
                    onCheckedChange={() => toggleAdmin.mutate(u)}
                  />
                </td>
                <td className="p-3">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={u.isAdmin}
                      onClick={() => {
                        setEditing(u);
                        const d: Record<string, { view: boolean; edit: boolean }> = {};
                        for (const s of EDITABLE_SCREENS) {
                          d[s.key] = u.perms[s.key] ?? { view: true, edit: false };
                        }
                        setDraft(d);
                      }}
                    >
                      <SlidersHorizontal className="size-4" /> Permissões
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permissões de {editing?.name}</DialogTitle>
            <DialogDescription>
              Escolha o que este usuário pode ver e editar. Administradores têm acesso total.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-1 text-xs uppercase text-muted-foreground">
              <span>Tela</span>
              <span className="w-14 text-center">Ver</span>
              <span className="w-14 text-center">Editar</span>
            </div>
            {EDITABLE_SCREENS.map((s) => {
              const value = draft[s.key] ?? { view: true, edit: false };
              return (
                <div
                  key={s.key}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <span className="text-sm font-medium">{s.label}</span>
                  <div className="flex w-14 justify-center">
                    <Switch
                      checked={value.view}
                      onCheckedChange={(v) =>
                        setDraft((d) => ({ ...d, [s.key]: { view: v, edit: v ? value.edit : false } }))
                      }
                    />
                  </div>
                  <div className="flex w-14 justify-center">
                    <Switch
                      checked={value.edit}
                      onCheckedChange={(v) => setDraft((d) => ({ ...d, [s.key]: { view: v || value.view, edit: v } }))}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={() => savePerms.mutate()} disabled={savePerms.isPending}>
              Salvar permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
