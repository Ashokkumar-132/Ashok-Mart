import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";

import { CustomerShell } from "@/components/CustomerShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/order-confirmation/$id")({
  head: () => ({
    meta: [
      { title: "Order Placed — AshokMart" },
      { name: "description", content: "Your AshokMart order has been placed. View the order ID, items and estimated delivery." },
      { property: "og:title", content: "Order Placed — AshokMart" },
      { property: "og:description", content: "Your AshokMart order has been placed successfully." },
    ],
  }),
  component: OrderConfirmationPage,
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

function OrderConfirmationPage() {
  const { id } = Route.useParams();

  const { data, isPending } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return order;
    },
  });

  if (isPending) {
    return (
      <CustomerShell>
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-orange" />
        </div>
      </CustomerShell>
    );
  }

  if (!data) {
    return (
      <CustomerShell>
        <p className="glass rounded-2xl px-6 py-16 text-center text-muted-foreground">Order not found.</p>
      </CustomerShell>
    );
  }

  const addr = (data.address_snapshot ?? {}) as Snapshot;
  const eta = new Date(new Date(data.created_at).getTime() + 5 * 86400000);

  return (
    <CustomerShell>
      <div className="glass mx-auto max-w-3xl rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="size-14 text-success" />
          <h1 className="mt-3 font-display text-2xl font-bold text-navy">Order Placed Successfully!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Order ID <strong className="text-navy">{data.order_no}</strong> · Status {data.status}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {data.order_items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
              <img src={item.image} alt={item.name} loading="lazy" className="size-14 rounded-lg bg-white object-contain p-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-navy">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold text-navy">{inr(Number(item.price) * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white/70 p-4">
            <h2 className="mb-1 text-sm font-bold text-navy">Delivery Address</h2>
            <p className="text-sm text-muted-foreground">
              {addr.full_name}
              <br />
              {addr.house_number}, {addr.street}, {addr.area}
              <br />
              {addr.city}, {addr.state} — {addr.pincode}
            </p>
          </div>
          <div className="rounded-xl bg-white/70 p-4">
            <h2 className="mb-1 text-sm font-bold text-navy">Payment & Total</h2>
            <p className="text-sm text-muted-foreground">
              Method: {data.payment_method}
              <br />
              Delivery: {Number(data.delivery_charge) === 0 ? "FREE" : inr(data.delivery_charge)}
              <br />
              <span className="text-base font-bold text-navy">Total {inr(data.total_amount)}</span>
              <br />
              Estimated delivery: {eta.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/orders">
            <Button className="bg-navy text-white hover:bg-navy-soft">View My Orders</Button>
          </Link>
          <Link to="/home" search={{ q: undefined, category: undefined }}>
            <Button variant="outline">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </CustomerShell>
  );
}
