import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, IndianRupee, Loader2, Package, ShoppingBag } from "lucide-react";

import { SellerShell } from "@/components/SellerShell";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/seller/dashboard")({
  head: () => ({
    meta: [
      { title: "Seller Dashboard — AshokMart" },
      { name: "description", content: "Track products, stock, orders and total sales in INR on your AshokMart seller dashboard." },
      { property: "og:title", content: "Seller Dashboard — AshokMart" },
      { property: "og:description", content: "Track products, stock, orders and sales on AshokMart." },
    ],
  }),
  component: SellerDashboard,
});

function SellerDashboard() {
  const { data, isPending } = useQuery({
    queryKey: ["seller-dashboard"],
    queryFn: async () => {
      const [{ data: products, error: pErr }, { data: orders, error: oErr }] = await Promise.all([
        supabase.from("products").select("id, name, stock, price"),
        supabase.from("orders").select("id, total_amount, status"),
      ]);
      if (pErr) throw pErr;
      if (oErr) throw oErr;
      const list = products ?? [];
      return {
        totalProducts: list.length,
        totalStock: list.reduce((s, p) => s + p.stock, 0),
        lowStock: list.filter((p) => p.stock > 0 && p.stock <= 10),
        outOfStock: list.filter((p) => p.stock === 0).length,
        totalOrders: (orders ?? []).length,
        totalSales: (orders ?? [])
          .filter((o) => o.status !== "Cancelled")
          .reduce((s, o) => s + Number(o.total_amount), 0),
      };
    },
  });

  if (isPending || !data) {
    return (
      <SellerShell title="Seller Dashboard">
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-orange" />
        </div>
      </SellerShell>
    );
  }

  return (
    <SellerShell title="Seller Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card icon={<Package className="size-5" />} label="Total Products" value={String(data.totalProducts)} />
        <Card icon={<Boxes className="size-5" />} label="Total Stock" value={String(data.totalStock)} />
        <Card icon={<ShoppingBag className="size-5" />} label="Total Orders" value={String(data.totalOrders)} />
        <Card icon={<IndianRupee className="size-5" />} label="Total Sales" value={inr(data.totalSales)} />
      </div>

      <section className="glass mt-6 rounded-2xl p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-navy">
          <AlertTriangle className="size-4 text-warning" /> Low Stock Products
        </h2>
        {data.lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground">All products are well stocked.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-navy">{p.name}</span>
                <span className="font-semibold text-warning">{p.stock} left</span>
              </li>
            ))}
          </ul>
        )}
        {data.outOfStock > 0 && (
          <p className="mt-3 text-sm font-semibold text-destructive">
            {data.outOfStock} product(s) are out of stock.
          </p>
        )}
      </section>
    </SellerShell>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-orange/15 text-orange">{icon}</span>
      <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}
