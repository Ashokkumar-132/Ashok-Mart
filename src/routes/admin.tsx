import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Login — AshokMart" },
      {
        name: "description",
        content:
          "Secure administrator sign-in for AshokMart. Manage users, orders and the product catalogue.",
      },
      { property: "og:title", content: "Admin Login — AshokMart" },
      { property: "og:description", content: "Secure administrator sign-in for AshokMart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setLoading(false);
      setError("Invalid email or password");
      return;
    }

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (roleRow?.role !== "admin") {
      await supabase.auth.signOut();
      setLoading(false);
      setError("This account does not have administrator access.");
      return;
    }

    navigate({ to: "/admin/dashboard", replace: true });
  }

  return (
    <div className="brand-backdrop flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass w-full max-w-md rounded-3xl p-7 sm:p-9">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo className="h-10 w-auto" />
          <span className="flex items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
            <ShieldCheck className="size-3.5" /> Administrator
          </span>
        </div>

        <h1 className="text-center font-display text-xl font-bold text-navy">Admin Login</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Administrator accounts are created internally — there is no public registration.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ashokmart.in"
                className="bg-white/80 pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/80 pl-9"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full bg-navy text-base font-semibold text-white hover:bg-navy-soft"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Login as Admin"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Not an administrator?{" "}
          <Link to="/" className="font-semibold text-navy hover:text-orange">
            Customer / Seller login
          </Link>
        </p>
      </div>
    </div>
  );
}
