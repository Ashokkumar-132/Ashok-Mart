import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({
    meta: [
      { title: "All Orders — AshokMart Admin" },
      { name: "description", content: "Every AshokMart order with buyer, items, amount in INR and current status." },
      { property: "og:title", content: "All Orders — AshokMart Admin" },
      { property: "og:description", content: "Every order placed on AshokMart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminOrdersPage,
});

type Snapshot = {
  full_name?: string;
  house_number?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
};

function AdminOrdersPage() {
  const { data: orders, isPending } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminShell title="All Orders">
      {isPending ? (
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-orange" />
        </div>
      ) : !orders || orders.length === 0 ? (
        <p className="glass rounded-2xl px-6 py-16 text-center text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const addr = (order.address_snapshot ?? {}) as Snapshot;
            return (
              <article key={order.id} className="glass rounded-2xl p-5">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-bold text-navy">{order.order_no}</p>
                    <p className="text-xs text-muted-foreground">
                      Buyer: {addr.full_name ?? "—"} ·{" "}
                      {new Date(order.created_at).toLocaleDateString("en-IN")} · {order.payment_method}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-navy">{inr(order.total_amount)}</span>
                    <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold text-navy">
                      {order.status}
                    </span>
                  </div>
                </header>

                <div className="mt-3 space-y-1.5">
                  {order.order_items.map((item) => (
                    <p key={item.id} className="text-sm text-muted-foreground">
                      {item.name} × {item.quantity} — {inr(Number(item.price) * item.quantity)}
                    </p>
                  ))}
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Deliver to: {addr.house_number}, {addr.street}, {addr.area}, {addr.city}, {addr.state} —{" "}
                  {addr.pincode} · {addr.phone}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
