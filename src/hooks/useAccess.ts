import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AccessState {
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
  perms: Record<string, { view: boolean; edit: boolean }>;
}

async function fetchAccess(): Promise<AccessState> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { userId: null, email: null, isAdmin: false, perms: {} };

  const [{ data: roles }, { data: perms }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("user_permissions").select("screen, can_view, can_edit").eq("user_id", user.id),
  ]);

  const map: Record<string, { view: boolean; edit: boolean }> = {};
  for (const p of perms ?? []) map[p.screen] = { view: p.can_view, edit: p.can_edit };

  return {
    userId: user.id,
    email: user.email ?? null,
    isAdmin: (roles ?? []).some((r) => r.role === "admin"),
    perms: map,
  };
}

export function useAccess() {
  const query = useQuery({ queryKey: ["access"], queryFn: fetchAccess, staleTime: 30_000 });
  const access = query.data;
  const isAdmin = access?.isAdmin ?? false;

  function canView(screen: string) {
    if (isAdmin) return true;
    return access?.perms[screen]?.view ?? true;
  }
  function canEdit(screen: string) {
    if (isAdmin) return true;
    return access?.perms[screen]?.edit ?? false;
  }

  return { ...query, isAdmin, canView, canEdit, userId: access?.userId ?? null };
}
