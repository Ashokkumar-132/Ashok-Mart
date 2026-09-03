import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { SellerShell } from "@/components/SellerShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ALL_STATUSES, inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/seller/orders")({
  head: () => ({
    meta: [
      { title: "Seller Orders — AshokMart" },
      { name: "description", content: "View every AshokMart customer order and update its delivery status." },
      { property: "og:title", content: "Seller Orders — AshokMart" },
      { property: "og:description", content: "View customer orders and update delivery status." },
    ],
  }),
  component: SellerOrdersPage,
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

function SellerOrdersPage() {
  const queryClient = useQueryClient();

  const { data: orders, isPending } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function updateStatus(orderId: string, status: string) {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    await queryClient.invalidateQueries();
  }

  return (
    <SellerShell title="Customer Orders">
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
                      {addr.full_name} · {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-navy">{inr(order.total_amount)}</span>
                    <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                      <SelectTrigger className="h-9 w-44 bg-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  Deliver to: {addr.house_number}, {addr.street}, {addr.area}, {addr.city}, {addr.state} — {addr.pincode} · {addr.phone}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </SellerShell>
  );
}
