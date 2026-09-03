import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Minus, Plus } from "lucide-react";
import { useState } from "react";

import { CustomerShell } from "@/components/CustomerShell";
import { Stars } from "@/components/Stars";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAshokMart";
import { addToCart } from "@/lib/cart";
import { discountPercent, inr, stockLabel, stockState } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/product/$id")({
  head: () => ({
    meta: [
      { title: "Product details — AshokMart" },
      { name: "description", content: "Full specifications, price in INR, stock and reviews for this AshokMart product." },
      { property: "og:title", content: "Product details — AshokMart" },
      { property: "og:description", content: "Specifications, price and stock for this AshokMart product." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const user = useAuthUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [qty, setQty] = useState(1);
  const [flash, setFlash] = useState("");

  const { data: product, isPending } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function handleAdd(buyNow: boolean) {
    if (!user || !product) return;
    await addToCart(user.id, product.id, qty, product.stock);
    await queryClient.invalidateQueries({ queryKey: ["cart"] });
    if (buyNow) {
      navigate({ to: "/cart" });
      return;
    }
    setFlash("Added to cart");
    setTimeout(() => setFlash(""), 2200);
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

  if (!product) {
    return (
      <CustomerShell>
        <p className="glass rounded-2xl px-6 py-16 text-center font-medium text-muted-foreground">
          No products found.
        </p>
      </CustomerShell>
    );
  }

  const state = stockState(product.stock);
  const off = product.discount || discountPercent(Number(product.mrp), Number(product.price));

  return (
    <CustomerShell>
      <div className="glass grid gap-8 rounded-3xl p-5 sm:p-8 lg:grid-cols-2">
        <div className="flex items-center justify-center rounded-2xl bg-white p-6">
          <img
            src={product.image}
            alt={product.name}
            width={768}
            height={768}
            className="max-h-[420px] w-full object-contain"
          />
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold tracking-wide text-orange uppercase">
            {product.category} · {product.brand}
          </span>
          <h1 className="font-display text-2xl font-bold text-navy">{product.name}</h1>
          <Stars rating={Number(product.rating)} reviews={product.reviews} />

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-navy">{inr(product.price)}</span>
            <span className="text-sm text-muted-foreground line-through">{inr(product.mrp)}</span>
            {off > 0 && <span className="text-sm font-bold text-success">{off}% off</span>}
          </div>

          <span
            className={
              state === "out"
                ? "text-sm font-semibold text-destructive"
                : state === "low"
                  ? "text-sm font-semibold text-warning"
                  : "text-sm font-semibold text-success"
            }
          >
            {stockLabel(product.stock)}
          </span>

          <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          {product.specifications && (
            <div className="rounded-2xl bg-white/70 p-4">
              <h2 className="mb-2 text-sm font-bold text-navy">Specifications</h2>
              <p className="text-sm whitespace-pre-line text-muted-foreground">{product.specifications}</p>
            </div>
          )}

          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm font-medium text-navy">Quantity</span>
            <div className="flex items-center gap-1 rounded-full bg-white/80 p-1">
              <Button size="icon" variant="ghost" className="size-8 rounded-full" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
                <Minus className="size-4" />
              </Button>
              <span className="w-8 text-center text-sm font-semibold">{qty}</span>
              <Button size="icon" variant="ghost" className="size-8 rounded-full" onClick={() => setQty((q) => Math.min(product.stock, q + 1))} disabled={qty >= product.stock}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {flash && <p className="text-sm font-medium text-success">{flash}</p>}

          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              onClick={() => handleAdd(false)}
              disabled={state === "out"}
              variant="outline"
              className="min-w-40 border-navy/25 text-navy hover:bg-navy hover:text-white"
            >
              Add to Cart
            </Button>
            <Button
              onClick={() => handleAdd(true)}
              disabled={state === "out"}
              className="min-w-40 bg-orange text-orange-foreground hover:bg-orange/90"
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
