import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { SellerShell } from "@/components/SellerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAshokMart";
import { CATEGORIES, discountPercent, inr } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export const Route = createFileRoute("/_authenticated/seller/products")({
  head: () => ({
    meta: [
      { title: "Manage Products — AshokMart Seller" },
      { name: "description", content: "Add, edit and delete the products you sell on AshokMart, with prices in INR." },
      { property: "og:title", content: "Manage Products — AshokMart Seller" },
      { property: "og:description", content: "Add, edit and delete your AshokMart product catalogue." },
    ],
  }),
  component: SellerProductsPage,
});

const EMPTY = {
  name: "",
  category: CATEGORIES[0] as string,
  brand: "",
  description: "",
  image: "",
  mrp: "",
  price: "",
  stock: "",
  specifications: "",
};

function SellerProductsPage() {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: products, isPending } = useQuery({
    queryKey: ["seller-products"],
    queryFn: async () => {
      const { data, error: qErr } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (qErr) throw qErr;
      return data as Product[];
    },
  });

  function set(key: keyof typeof EMPTY, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openAdd() {
    setForm(EMPTY);
    setEditingId(null);
    setError("");
    setOpen(true);
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      category: p.category,
      brand: p.brand,
      description: p.description ?? "",
      image: p.image,
      mrp: String(p.mrp),
      price: String(p.price),
      stock: String(p.stock),
      specifications: p.specifications ?? "",
    });
    setEditingId(p.id);
    setError("");
    setOpen(true);
  }

  async function save() {
    setError("");
    if (!form.name.trim() || !form.brand.trim() || !form.image.trim() || !form.mrp || !form.price || !form.stock) {
      setError("Please enter all required fields.");
      return;
    }
    const mrp = Number(form.mrp);
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (price > mrp) {
      setError("Selling price cannot be higher than MRP.");
      return;
    }
    if (!user) return;

    const payload = {
      name: form.name.trim(),
      category: form.category,
      brand: form.brand.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      mrp,
      price,
      discount: discountPercent(mrp, price),
      stock: Math.max(0, Math.floor(stock)),
      specifications: form.specifications.trim(),
    };

    setSaving(true);
    const { error: saveError } = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert({ ...payload, seller_id: user.id });
    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }
    setOpen(false);
    await queryClient.invalidateQueries();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await supabase.from("products").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    await queryClient.invalidateQueries();
  }

  return (
    <SellerShell title="Products">
      <div className="mb-4 flex justify-end">
        <Button onClick={openAdd} className="bg-orange text-orange-foreground hover:bg-orange/90">
          <Plus className="size-4" /> Add Product
        </Button>
      </div>

      {isPending ? (
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-orange" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(products ?? []).map((p) => (
            <article key={p.id} className="glass flex gap-3 rounded-2xl p-4">
              <img src={p.image} alt={p.name} loading="lazy" className="size-20 rounded-xl bg-white object-contain p-1.5" />
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-semibold text-navy">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.category} · {p.brand}</p>
                <p className="text-sm font-bold text-navy">{inr(p.price)} <span className="text-xs font-normal text-muted-foreground line-through">{inr(p.mrp)}</span></p>
                <p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
                <div className="mt-1 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(p)}>
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>All prices are in Indian Rupees (₹).</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Product Name" id="name" value={form.name} onChange={(v) => set("name", v)} full />
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field label="Brand" id="brand" value={form.brand} onChange={(v) => set("brand", v)} />
            <Field label="Image URL" id="image" value={form.image} onChange={(v) => set("image", v)} full />
            <Field label="MRP (₹)" id="mrp" type="number" value={form.mrp} onChange={(v) => set("mrp", v)} />
            <Field label="Selling Price (₹)" id="price" type="number" value={form.price} onChange={(v) => set("price", v)} />
            <Field label="Stock" id="stock" type="number" value={form.stock} onChange={(v) => set("stock", v)} />
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="specifications">Specifications</Label>
              <Textarea id="specifications" value={form.specifications} onChange={(e) => set("specifications", e.target.value)} rows={3} />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-orange text-orange-foreground hover:bg-orange/90">
              {saving ? <Loader2 className="size-4 animate-spin" /> : editingId ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this product?</DialogTitle>
            <DialogDescription>{deleteTarget?.name}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SellerShell>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  full,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  full?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
