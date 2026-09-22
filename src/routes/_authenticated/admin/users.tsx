import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { AdminShell } from "@/components/layout/AdminShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "All Users — AshokMart Admin" },
      { name: "description", content: "List of every AshokMart buyer and seller account with contact details." },
      { property: "og:title", content: "All Users — AshokMart Admin" },
      { property: "og:description", content: "Every registered buyer and seller on AshokMart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminUsersPage,
});

const LABEL: Record<string, string> = { customer: "Buyer", seller: "Seller", admin: "Admin" };

function AdminUsersPage() {
  const { data: users, isPending } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      const roleMap = new Map((roles.data ?? []).map((r) => [r.user_id, r.role as string]));
      return (profiles.data ?? []).map((p) => ({ ...p, role: roleMap.get(p.id) ?? "customer" }));
    },
  });

  return (
    <AdminShell title="All Users">
      {isPending ? (
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-orange" />
        </div>
      ) : !users || users.length === 0 ? (
        <p className="glass rounded-2xl px-6 py-16 text-center text-muted-foreground">No users yet.</p>
      ) : (
        <div className="glass overflow-x-auto rounded-2xl p-2">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-3 font-medium text-navy">{u.full_name || "—"}</td>
                  <td className="px-3 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-3 py-3 text-muted-foreground">{u.phone || "—"}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        u.role === "seller"
                          ? "bg-orange/15 text-orange"
                          : u.role === "admin"
                            ? "bg-navy/10 text-navy"
                            : "bg-success/15 text-success"
                      }`}
                    >
                      {LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
