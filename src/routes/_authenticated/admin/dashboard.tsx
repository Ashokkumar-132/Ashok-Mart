import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, ShoppingBag, Store, Users } from "lucide-react";

import { AdminShell } from "@/components/layout/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — AshokMart" },
      {
        name: "description",
        content: "Overview of AshokMart buyers, sellers, products and orders for administrators.",
      },
      { property: "og:title", content: "Admin Dashboard — AshokMart" },
      { property: "og:description", content: "Buyers, sellers, products and order totals at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { data, isPending } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [roles, products, orders] = await Promise.all([
        supabase.from("user_roles").select("role"),
        supabase.from("products").select("id, removed"),
        supabase.from("orders").select("total_amount"),
      ]);
      if (roles.error) throw roles.error;
      if (products.error) throw products.error;
      if (orders.error) throw orders.error;

      const list = roles.data ?? [];
      return {
        buyers: list.filter((r) => r.role === "customer").length,
        sellers: list.filter((r) => r.role === "seller").length,
        products: (products.data ?? []).filter((p) => !p.removed).length,
        removed: (products.data ?? []).filter((p) => p.removed).length,
        orders: (orders.data ?? []).length,
        sales: (orders.data ?? []).reduce((sum, o) => sum + Number(o.total_amount), 0),
      };
    },
  });

  return (
    <AdminShell title="Admin Dashboard">
      {isPending || !data ? (
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-orange" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card icon={<Users className="size-5" />} label="Buyers" value={String(data.buyers)} />
          <Card icon={<Store className="size-5" />} label="Sellers" value={String(data.sellers)} />
          <Card
            icon={<Package className="size-5" />}
            label="Live Products"
            value={String(data.products)}
            note={`${data.removed} removed by admin`}
          />
          <Card icon={<ShoppingBag className="size-5" />} label="Total Orders" value={String(data.orders)} />
          <Card icon={<ShoppingBag className="size-5" />} label="Total Sales" value={inr(data.sales)} />
        </div>
      )}
    </AdminShell>
  );
}

function Card({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <article className="glass rounded-2xl p-5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-orange/15 text-orange">
        {icon}
      </span>
      <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="font-display text-2xl font-bold text-navy">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </article>
  );
}
