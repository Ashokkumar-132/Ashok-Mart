import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { destinationFor, ensureProfileAndRole, rememberRole } from "@/lib/afterLogin";
import type { Role } from "@/hooks/useAshokMart";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your AshokMart account" },
      {
        name: "description",
        content:
          "Register on AshokMart as a customer or seller. Free account, secure password and fast checkout across India.",
      },
      { property: "og:title", content: "Create your AshokMart account" },
      {
        property: "og:description",
        content: "Register on AshokMart as a customer or seller in under a minute.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("customer");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirm: "",
    mobile: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.confirm || !form.mobile.trim()) {
      setError("Please enter all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!/^\d{10}$/.test(form.mobile.trim())) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: form.fullName.trim(), phone: form.mobile.trim() },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }
    if (!data.session || !data.user) {
      setLoading(false);
      setError("Account created. Please check your email to confirm, then log in.");
      return;
    }

    const resolved = await ensureProfileAndRole(data.user, role);
    rememberRole(resolved);
    navigate({ to: await destinationFor(resolved), replace: true });
  }

  return (
    <div className="brand-backdrop flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass w-full max-w-md rounded-3xl p-7 sm:p-9">
        <div className="mb-6 flex justify-center">
          <Logo className="h-10 w-auto" showTagline />
        </div>
        <h1 className="text-center font-display text-xl font-bold text-navy">Create Account</h1>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-white/60 p-1">
          {(["customer", "seller"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                role === r ? "bg-orange text-orange-foreground" : "text-navy"
              }`}
            >
              {r === "customer" ? "User / Customer" : "Seller"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <Field label="Full Name" id="fullName" value={form.fullName} onChange={(v) => set("fullName", v)} />
          <Field label="Gmail / Email" id="email" type="email" value={form.email} onChange={(v) => set("email", v)} />
          <Field label="Mobile Number" id="mobile" inputMode="numeric" value={form.mobile} onChange={(v) => set("mobile", v)} />
          <Field label="Password" id="password" type="password" value={form.password} onChange={(v) => set("password", v)} />
          <Field label="Confirm Password" id="confirm" type="password" value={form.confirm} onChange={(v) => set("confirm", v)} />

          {error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full bg-orange text-base font-semibold text-orange-foreground hover:bg-orange/90"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Create Account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/" className="font-semibold text-navy hover:text-orange">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/80"
      />
    </div>
  );
}
