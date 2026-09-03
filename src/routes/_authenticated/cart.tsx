import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";

import { CustomerShell } from "@/components/CustomerShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useCart } from "@/hooks/useAshokMart";
import { DELIVERY_CHARGE, FREE_DELIVERY_ABOVE, inr, stockLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — AshokMart" },
      { name: "description", content: "Review the items in your AshokMart cart and proceed to checkout." },
      { property: "og:title", content: "Your Cart — AshokMart" },
      { property: "og:description", content: "Review your AshokMart cart and checkout securely." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: items, isPending } = useCart(user?.id);

  async function setQty(itemId: string, quantity: number) {
    if (quantity <= 0) {
      await supabase.from("cart_items").delete().eq("id", itemId);
    } else {
      await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
    }
    await queryClient.invalidateQueries({ queryKey: ["cart"] });
  }

  const rows = items ?? [];
  const subtotal = rows.reduce((s, r) => s + Number(r.products!.price) * r.quantity, 0);
  const mrpTotal = rows.reduce((s, r) => s + Number(r.products!.mrp) * r.quantity, 0);
  const discount = mrpTotal - subtotal;
  const delivery = rows.length === 0 || subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;

  return (
    <CustomerShell>
      <h1 className="mb-5 font-display text-2xl font-bold text-navy">Shopping Cart</h1>

      {isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-orange" />
        </div>
      ) : rows.length === 0 ? (
        <div className="glass rounded-2xl px-6 py-16 text-center">
          <p className="font-medium text-muted-foreground">Your cart is empty.</p>
          <Link to="/home" search={{ q: undefined, category: undefined }}>
            <Button className="mt-4 bg-orange text-orange-foreground hover:bg-orange/90">
              Start shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {rows.map((row) => {
              const p = row.products!;
              return (
                <div key={row.id} className="glass flex gap-4 rounded-2xl p-4">
                  <Link to="/product/$id" params={{ id: p.id }} className="shrink-0">
                    <img src={p.image} alt={p.name} loading="lazy" className="size-24 rounded-xl bg-white object-contain p-2" />
                  </Link>
                  <div className="flex flex-1 flex-col gap-1">
                    <Link to="/product/$id" params={{ id: p.id }} className="text-sm font-semibold text-navy hover:text-orange">
                      {p.name}
                    </Link>
                    <span className="text-lg font-bold text-navy">{inr(p.price)}</span>
                    <span className={p.stock <= 10 ? "text-xs font-semibold text-warning" : "text-xs font-semibold text-success"}>
                      {stockLabel(p.stock)}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-full bg-white/80 p-1">
                        <Button size="icon" variant="ghost" className="size-7 rounded-full" onClick={() => setQty(row.id, row.quantity - 1)}>
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-7 text-center text-sm font-semibold">{row.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 rounded-full"
                          disabled={row.quantity >= p.stock}
                          onClick={() => setQty(row.id, row.quantity + 1)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setQty(row.id, 0)}>
                        <Trash2 className="size-4" /> Remove
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="glass h-fit rounded-2xl p-5">
            <h2 className="mb-4 font-display text-lg font-bold text-navy">Price Details</h2>
            <Row label={`Subtotal (${rows.length} items)`} value={inr(subtotal)} />
            <Row label="Discount" value={`− ${inr(discount)}`} success />
            <Row label="Delivery Charge" value={delivery === 0 ? "FREE" : inr(delivery)} />
            <div className="my-3 h-px bg-border" />
            <Row label="Total" value={inr(subtotal + delivery)} bold />
            <Button
              className="mt-5 h-11 w-full bg-orange text-base font-semibold text-orange-foreground hover:bg-orange/90"
              onClick={() => navigate({ to: "/checkout" })}
            >
              Proceed to Checkout
            </Button>
          </aside>
        </div>
      )}
    </CustomerShell>
  );
}

function Row({ label, value, bold, success }: { label: string; value: string; bold?: boolean; success?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className={bold ? "font-bold text-navy" : "text-muted-foreground"}>{label}</span>
      <span className={bold ? "text-lg font-bold text-navy" : success ? "font-semibold text-success" : "font-semibold text-navy"}>
        {value}
      </span>
    </div>
  );
}
