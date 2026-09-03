import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { CustomerShell } from "@/components/CustomerShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAddresses, useAuthUser, useCart } from "@/hooks/useAshokMart";
import { DELIVERY_CHARGE, FREE_DELIVERY_ABOVE, inr } from "@/lib/format";

const PAYMENTS = ["COD", "UPI", "Card"] as const;

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — AshokMart" },
      { name: "description", content: "Confirm your delivery address, payment method and place your AshokMart order." },
      { property: "og:title", content: "Checkout — AshokMart" },
      { property: "og:description", content: "Confirm address and payment, then place your order." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: addresses } = useAddresses(user?.id);
  const { data: items, isPending } = useCart(user?.id);
  const [payment, setPayment] = useState<(typeof PAYMENTS)[number]>("COD");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const address = addresses?.[0];
  const rows = items ?? [];
  const subtotal = rows.reduce((s, r) => s + Number(r.products!.price) * r.quantity, 0);
  const delivery = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;

  async function placeOrder() {
    setError("");
    if (!address) {
      setError("Please add a delivery address first.");
      return;
    }
    setPlacing(true);
    const { data, error: rpcError } = await supabase.rpc("place_order", {
      p_address_id: address.id,
      p_payment_method: payment,
    });
    setPlacing(false);
    if (rpcError || !data) {
      setError(rpcError?.message ?? "Could not place the order. Please try again.");
      return;
    }
    await queryClient.invalidateQueries();
    navigate({ to: "/order-confirmation/$id", params: { id: data as string }, replace: true });
  }

  if (isPending) {
    return (
      <CustomerShell>
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-orange" />
        </div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell>
      <h1 className="mb-5 font-display text-2xl font-bold text-navy">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="glass rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-navy">Delivery Address</h2>
              <Link to="/address">
                <Button size="sm" variant="outline">Change Address</Button>
              </Link>
            </div>
            {address ? (
              <address className="text-sm leading-relaxed text-muted-foreground not-italic">
                <strong className="text-navy">{address.full_name}</strong>
                <br />
                {address.house_number}, {address.street}, {address.area}
                <br />
                {address.city}, {address.state} — {address.pincode}
                <br />
                Phone: {address.phone}
              </address>
            ) : (
              <p className="text-sm text-destructive">No address saved yet.</p>
            )}
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="mb-3 font-display text-base font-bold text-navy">Order Items</h2>
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-3">
                  <img src={row.products!.image} alt={row.products!.name} loading="lazy" className="size-14 rounded-lg bg-white object-contain p-1" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">{row.products!.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {row.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-navy">
                    {inr(Number(row.products!.price) * row.quantity)}
                  </span>
                </div>
              ))}
              {rows.length === 0 && <p className="text-sm text-muted-foreground">Your cart is empty.</p>}
            </div>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="mb-3 font-display text-base font-bold text-navy">Payment Method</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {PAYMENTS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayment(m)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    payment === m ? "border-orange bg-orange/10 text-navy" : "border-border bg-white/60 text-muted-foreground"
                  }`}
                >
                  {m === "COD" ? "Cash on Delivery" : m === "UPI" ? "UPI (demo)" : "Card (demo)"}
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="glass h-fit rounded-2xl p-5">
          <h2 className="mb-4 font-display text-lg font-bold text-navy">Order Summary</h2>
          <SummaryRow label="Subtotal" value={inr(subtotal)} />
          <SummaryRow label="Delivery Charge" value={delivery === 0 ? "FREE" : inr(delivery)} />
          <div className="my-3 h-px bg-border" />
          <SummaryRow label="Total" value={inr(subtotal + delivery)} bold />
          {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}
          <Button
            className="mt-5 h-11 w-full bg-orange text-base font-semibold text-orange-foreground hover:bg-orange/90"
            disabled={placing || rows.length === 0}
            onClick={placeOrder}
          >
            {placing ? <Loader2 className="size-4 animate-spin" /> : "Place Order"}
          </Button>
        </aside>
      </div>
    </CustomerShell>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className={bold ? "font-bold text-navy" : "text-muted-foreground"}>{label}</span>
      <span className={bold ? "text-lg font-bold text-navy" : "font-semibold text-navy"}>{value}</span>
    </div>
  );
}
