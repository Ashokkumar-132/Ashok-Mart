import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { CustomerShell } from "@/components/CustomerShell";
import { ProductCard, type Product } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAshokMart";
import { addToCart } from "@/lib/cart";
import { CATEGORIES } from "@/lib/format";

type HomeSearch = { q?: string; category?: string };

export const Route = createFileRoute("/_authenticated/home")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    q: typeof search["q"] === "string" && search["q"] ? search["q"] : undefined,
    category:
      typeof search["category"] === "string" && search["category"] ? search["category"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop on AshokMart — Everything You Need. Delivered." },
      {
        name: "description",
        content:
          "Browse electronics, mobiles, computers, fashion, grocery, beauty and more on AshokMart with best prices in INR.",
      },
      { property: "og:title", content: "Shop on AshokMart" },
      { property: "og:description", content: "Browse 10 categories of products at great prices on AshokMart." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { q, category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const rootNavigate = useNavigate();
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState("");

  const { data: products, isPending } = useQuery({
    queryKey: ["products", q ?? "", category ?? ""],
    queryFn: async () => {
      let query = supabase.from("products").select("*").order("created_at", { ascending: false });
      if (category) query = query.eq("category", category);
      if (q) query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%,category.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });

  async function handleAdd(product: Product, buyNow = false) {
    if (!user) return;
    setBusyId(product.id);
    await addToCart(user.id, product.id, 1, product.stock);
    await queryClient.invalidateQueries({ queryKey: ["cart"] });
    setBusyId(null);
    if (buyNow) {
      rootNavigate({ to: "/cart" });
      return;
    }
    setFlash(`${product.name} added to cart`);
    setTimeout(() => setFlash(""), 2200);
  }

  return (
    <CustomerShell search={q ?? ""}>
      <section className="glass mb-6 overflow-hidden rounded-3xl">
        <div className="brand-backdrop px-6 py-10 text-center sm:px-10 sm:py-14">
          <h1 className="font-display text-2xl font-bold text-white sm:text-4xl">
            Everything You Need. Delivered.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/75">
            Great prices across 10 categories, fast delivery all over India, and free shipping on
            orders above ₹500.
          </p>
        </div>
      </section>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={category ? "outline" : "default"}
          className={!category ? "bg-navy text-white hover:bg-navy-soft" : ""}
          onClick={() => navigate({ to: ".", search: { q, category: undefined } })}
        >
          All
        </Button>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "outline"}
            className={category === c ? "bg-orange text-orange-foreground hover:bg-orange/90" : ""}
            onClick={() => navigate({ to: ".", search: { q, category: c } })}
          >
            {c}
          </Button>
        ))}
      </div>

      {flash && (
        <p className="mb-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success">
          {flash}
        </p>
      )}

      {isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-orange" />
        </div>
      ) : !products || products.length === 0 ? (
        <p className="glass rounded-2xl px-6 py-16 text-center text-base font-medium text-muted-foreground">
          No products found.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              busy={busyId === p.id}
              onAddToCart={(prod) => handleAdd(prod)}
              onBuyNow={(prod) => handleAdd(prod, true)}
            />
          ))}
        </div>
      )}
    </CustomerShell>
  );
}
