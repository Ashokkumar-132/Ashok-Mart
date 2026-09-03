import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAddresses, useAuthUser, useProfile } from "@/hooks/useAshokMart";

export const Route = createFileRoute("/_authenticated/address")({
  head: () => ({
    meta: [
      { title: "Delivery Address — AshokMart" },
      { name: "description", content: "Save or edit the delivery address for your AshokMart orders." },
      { property: "og:title", content: "Delivery Address — AshokMart" },
      { property: "og:description", content: "Save or edit your AshokMart delivery address." },
    ],
  }),
  component: AddressPage,
});

const EMPTY = {
  full_name: "",
  house_number: "",
  street: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
};

function AddressPage() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: addresses } = useAddresses(user?.id);
  const { data: profile } = useProfile(user?.id);
  const existing = addresses?.[0];

  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        full_name: existing.full_name,
        house_number: existing.house_number,
        street: existing.street,
        area: existing.area,
        city: existing.city,
        state: existing.state,
        pincode: existing.pincode,
        phone: existing.phone,
      });
      setEditing(false);
    } else if (profile) {
      setForm((f) => ({ ...f, full_name: f.full_name || profile.full_name, phone: f.phone || (profile.phone ?? "") }));
    }
  }, [existing, profile]);

  function set(key: keyof typeof EMPTY, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (Object.values(form).some((v) => !v.trim())) {
      setError("Please enter all required fields.");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setError("Pincode must be 6 digits.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setError("Phone number must be 10 digits.");
      return;
    }
    if (!user) return;

    setSaving(true);
    const payload = { ...form, user_id: user.id, is_default: true };
    const { error: saveError } = existing
      ? await supabase.from("addresses").update(payload).eq("id", existing.id)
      : await supabase.from("addresses").insert(payload);
    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["addresses"] });
    navigate({ to: "/home", search: { q: undefined, category: undefined } });
  }

  return (
    <div className="brand-backdrop flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass w-full max-w-2xl rounded-3xl p-7 sm:p-9">
        <div className="mb-6 flex justify-center">
          <Logo className="h-10 w-auto" showTagline />
        </div>
        <h1 className="text-center font-display text-xl font-bold text-navy">Delivery Address</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Where should we deliver your orders?
        </p>

        <form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2">
          <F label="Full Name" id="full_name" value={form.full_name} onChange={(v) => set("full_name", v)} disabled={!editing} />
          <F label="House / Door Number" id="house_number" value={form.house_number} onChange={(v) => set("house_number", v)} disabled={!editing} />
          <F label="Street" id="street" value={form.street} onChange={(v) => set("street", v)} disabled={!editing} />
          <F label="Area / Locality" id="area" value={form.area} onChange={(v) => set("area", v)} disabled={!editing} />
          <F label="City" id="city" value={form.city} onChange={(v) => set("city", v)} disabled={!editing} />
          <F label="State" id="state" value={form.state} onChange={(v) => set("state", v)} disabled={!editing} />
          <F label="Pincode" id="pincode" value={form.pincode} onChange={(v) => set("pincode", v)} disabled={!editing} />
          <F label="Phone Number" id="phone" value={form.phone} onChange={(v) => set("phone", v)} disabled={!editing} />

          {error && (
            <p className="sm:col-span-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3 sm:col-span-2">
            {editing ? (
              <Button type="submit" disabled={saving} className="bg-orange text-orange-foreground hover:bg-orange/90">
                Save Address
              </Button>
            ) : (
              <Button type="button" onClick={() => setEditing(true)} className="bg-navy text-white hover:bg-navy-soft">
                Edit Address
              </Button>
            )}
            {existing && (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/home", search: { q: undefined, category: undefined } })}
              >
                Continue shopping
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function F({
  label,
  id,
  value,
  onChange,
  disabled,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="bg-white/80" />
    </div>
  );
}
