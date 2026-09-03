import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/hooks/useAshokMart";

export const ROLE_KEY = "ashokmart.role";

export function rememberRole(role: Role) {
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch {
    /* ignore */
  }
}

export function readRememberedRole(): Role {
  try {
    const v = localStorage.getItem(ROLE_KEY);
    return v === "seller" ? "seller" : "customer";
  } catch {
    return "customer";
  }
}

/** Makes sure the signed-in user has a profile row and exactly one role row. */
export async function ensureProfileAndRole(user: User, desiredRole: Role): Promise<Role> {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    await supabase.from("profiles").insert({
      id: user.id,
      full_name: (user.user_metadata?.["full_name"] as string) ?? user.email?.split("@")[0] ?? "",
      email: user.email ?? "",
      phone: (user.user_metadata?.["phone"] as string) ?? "",
    });
  }

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleRow) return roleRow.role as Role;

  await supabase.from("user_roles").insert({ user_id: user.id, role: desiredRole });
  return desiredRole;
}

export async function destinationFor(role: Role): Promise<string> {
  if (role === "seller") return "/seller/dashboard";
  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true });
  return count && count > 0 ? "/home" : "/address";
}
