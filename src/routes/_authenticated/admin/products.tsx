import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({
    meta: [
      { title: "All Products — AshokMart Admin" },
      {
        name: "description",
        content: "Review every AshokMart product and remove inappropriate listings from the storefront.",
      },
      { property: "og:title", content: "All Products — AshokMart Admin" },
      { property: "og:description", content: "Review and remove AshokMart product listings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const { data: products, isPending } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("products")
        .select("id, name, category, brand, price, stock, removed")
        .order("name");
      if (err) throw err;
      return data;
    },
  });

  async function setRemoved(id: string, removed: boolean) {
    setBusy(true);
    setError("");
    const { error: err } = await supabase.from("products").update({ removed }).eq("id", id);
    setBusy(false);
    if (err) {
      setError("Could not update this product. Please try again.");
      return;
    }
    setTarget(null);
    await queryClient.invalidateQueries();
  }

  return (
    <AdminShell title="All Products">
      {error && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {isPending ? (
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-orange" />
        </div>
      ) : (
        <div className="glass overflow-x-auto rounded-2xl p-2">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Brand</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Visibility</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(products ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-3 font-medium text-navy">{p.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-3 py-3 text-muted-foreground">{p.brand}</td>
                  <td className="px-3 py-3 font-semibold text-navy">{inr(p.price)}</td>
                  <td className="px-3 py-3">{p.stock}</td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        p.removed ? "font-semibold text-destructive" : "font-semibold text-success"
                      }
                    >
                      {p.removed ? "Removed" : "Visible"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {p.removed ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => setRemoved(p.id, false)}
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setTarget({ id: p.id, name: p.name })}
                      >
                        Remove
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this product?</DialogTitle>
            <DialogDescription>
              {target?.name} will be hidden from the storefront and can no longer be ordered. You can
              restore it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => target && setRemoved(target.id, true)}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Remove Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
