import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { SellerShell } from "@/components/SellerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { inr, stockLabel, stockState } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/seller/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — AshokMart Seller" },
      { name: "description", content: "Monitor stock levels and update inventory for every AshokMart product you sell." },
      { property: "og:title", content: "Inventory — AshokMart Seller" },
      { property: "og:description", content: "Monitor and update stock levels on AshokMart." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Record<string, string>>({});

  const { data: products, isPending } = useQuery({
    queryKey: ["seller-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, price, stock")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  async function saveStock(id: string) {
    const value = Number(editing[id]);
    if (!Number.isFinite(value) || value < 0) return;
    await supabase.from("products").update({ stock: Math.floor(value) }).eq("id", id);
    setEditing((e) => {
      const next = { ...e };
      delete next[id];
      return next;
    });
    await queryClient.invalidateQueries();
  }

  return (
    <SellerShell title="Inventory">
      {isPending ? (
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-orange" />
        </div>
      ) : (
        <div className="glass overflow-x-auto rounded-2xl p-2">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(products ?? []).map((p) => {
                const state = stockState(p.stock);
                return (
                  <tr key={p.id}>
                    <td className="px-3 py-3 font-medium text-navy">{p.name}</td>
                    <td className="px-3 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-3 py-3 font-semibold text-navy">{inr(p.price)}</td>
                    <td className="px-3 py-3">{p.stock}</td>
                    <td className="px-3 py-3">
                      <span
                        className={
                          state === "out"
                            ? "font-semibold text-destructive"
                            : state === "low"
                              ? "font-semibold text-warning"
                              : "font-semibold text-success"
                        }
                      >
                        {p.stock === 0 ? "Out of Stock" : p.stock <= 10 ? "Low Stock" : "In Stock"}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">({stockLabel(p.stock)})</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={editing[p.id] ?? String(p.stock)}
                          onChange={(e) => setEditing((s) => ({ ...s, [p.id]: e.target.value }))}
                          className="h-9 w-24 bg-white/80"
                        />
                        <Button
                          size="sm"
                          className="bg-navy text-white hover:bg-navy-soft"
                          disabled={editing[p.id] === undefined}
                          onClick={() => saveStock(p.id)}
                        >
                          Save
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SellerShell>
  );
}
