import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Stars } from "@/components/Stars";
import { discountPercent, inr, stockLabel, stockState } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;

export function ProductCard({
  product,
  onAddToCart,
  onBuyNow,
  busy,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  onBuyNow: (p: Product) => void;
  busy?: boolean;
}) {
  const off = product.discount || discountPercent(Number(product.mrp), Number(product.price));
  const state = stockState(product.stock);

  return (
    <article className="group glass flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden bg-white"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="size-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
        />
        {off > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-orange px-2.5 py-1 text-[11px] font-bold text-orange-foreground shadow">
            {off}% OFF
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {product.category}
        </span>
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="line-clamp-2 text-sm font-semibold text-foreground hover:text-orange"
        >
          {product.name}
        </Link>
        <Stars rating={Number(product.rating)} reviews={product.reviews} />

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-navy">{inr(product.price)}</span>
          <span className="text-xs text-muted-foreground line-through">{inr(product.mrp)}</span>
        </div>

        <span
          className={
            state === "out"
              ? "text-xs font-semibold text-destructive"
              : state === "low"
                ? "text-xs font-semibold text-warning"
                : "text-xs font-semibold text-success"
          }
        >
          {stockLabel(product.stock)}
        </span>

        <div className="mt-auto flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-navy/25 text-navy hover:bg-navy hover:text-white"
            disabled={state === "out" || busy}
            onClick={() => onAddToCart(product)}
          >
            Add to Cart
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-orange text-orange-foreground hover:bg-orange/90"
            disabled={state === "out" || busy}
            onClick={() => onBuyNow(product)}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </article>
  );
}
