import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { CustomerShell } from "@/components/CustomerShell";
import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUSES, inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — AshokMart" },
      { name: "description", content: "Track every AshokMart order with a live status timeline from Ordered to Delivered." },
      { property: "og:title", content: "My Orders — AshokMart" },
      { property: "og:description", content: "Track your AshokMart orders and delivery status." },
    ],
  }),
  component: OrdersPage,
});

type Snapshot = { city?: string; state?: string; pincode?: string; full_name?: string };

function OrdersPage() {
  const { data: orders, isPending } = useQuery({
    queryKey: ["my-orders"],
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
    <CustomerShell>
      <h1 className="mb-5 font-display text-2xl font-bold text-navy">My Orders</h1>

      {isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-orange" />
        </div>
      ) : !orders || orders.length === 0 ? (
        <p className="glass rounded-2xl px-6 py-16 text-center text-muted-foreground">
          You have not placed any orders yet.
        </p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const addr = (order.address_snapshot ?? {}) as Snapshot;
            const cancelled = order.status === "Cancelled";
            const activeIndex = ORDER_STATUSES.indexOf(order.status as (typeof ORDER_STATUSES)[number]);
            return (
              <article key={order.id} className="glass rounded-2xl p-5">
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-base font-bold text-navy">{order.order_no}</p>
                    <p className="text-xs text-muted-foreground">
                      Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      cancelled ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                    }`}
                  >
                    {order.status}
                  </span>
                </header>

                <div className="mt-4 space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} loading="lazy" className="size-12 rounded-lg bg-white object-contain p-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-navy">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty {item.quantity} · {inr(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Deliver to {addr.full_name} — {addr.city}, {addr.state} {addr.pincode}
                </p>
                <p className="mt-1 text-sm font-bold text-navy">Total {inr(order.total_amount)}</p>

                {!cancelled && (
                  <ol className="mt-4 flex flex-wrap gap-x-2 gap-y-3">
                    {ORDER_STATUSES.map((status, i) => (
                      <li key={status} className="flex items-center gap-2">
                        <span
                          className={`size-2.5 rounded-full ${i <= activeIndex ? "bg-success" : "bg-border"}`}
                        />
                        <span className={`text-[11px] font-medium ${i <= activeIndex ? "text-navy" : "text-muted-foreground"}`}>
                          {status}
                        </span>
                        {i < ORDER_STATUSES.length - 1 && <span className="h-px w-4 bg-border" />}
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            );
          })}
        </div>
      )}
    </CustomerShell>
  );
}
