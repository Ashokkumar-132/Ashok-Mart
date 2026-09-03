import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock, Mail, Store, UserRound } from "lucide-react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { destinationFor, ensureProfileAndRole, rememberRole } from "@/lib/afterLogin";
import type { Role } from "@/hooks/useAshokMart";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AshokMart Login — Everything You Need. Delivered." },
      {
        name: "description",
        content:
          "Sign in to AshokMart as a customer or seller. Shop electronics, mobiles, fashion, grocery and more with fast delivery across India.",
      },
      { property: "og:title", content: "AshokMart Login — Everything You Need. Delivered." },
      {
        property: "og:description",
        content: "Sign in to AshokMart as a customer or seller and start shopping.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // If a session already exists (e.g. returning from Google), route the user on.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        if (active) setChecking(false);
        return;
      }
      const resolved = await ensureProfileAndRole(user, role);
      const dest = await destinationFor(resolved);
      if (active) navigate({ to: dest, replace: true });
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter all required fields.");
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

    const actualRole = await ensureProfileAndRole(data.user, role);
    if (actualRole !== role) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(
        `This account is registered as a ${actualRole === "seller" ? "Seller" : "Customer"}. Please choose the correct role.`,
      );
      return;
    }

    rememberRole(actualRole);
    const dest = await destinationFor(actualRole);
    navigate({ to: dest, replace: true });
  }

  async function handleGoogle() {
    setError("");
    rememberRole(role);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const resolved = await ensureProfileAndRole(data.user, role);
      navigate({ to: await destinationFor(resolved), replace: true });
    }
  }

  if (checking) {
    return (
      <div className="brand-backdrop flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-orange" />
      </div>
    );
  }

  return (
    <div className="brand-backdrop flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass w-full max-w-md rounded-3xl p-7 sm:p-9">
        <div className="mb-7 flex flex-col items-center">
          <Logo className="h-11 w-auto" showTagline />
        </div>

        <h1 className="text-center font-display text-xl font-bold text-navy">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Choose how you want to continue
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <RoleTile
            active={role === "customer"}
            icon={<UserRound className="size-5" />}
            title="User / Customer"
            subtitle="Shop & order"
            onClick={() => setRole("customer")}
          />
          <RoleTile
            active={role === "seller"}
            icon={<Store className="size-5" />}
            title="Seller"
            subtitle="Manage products"
            onClick={() => setRole("seller")}
          />
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Gmail / Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="bg-white/80 pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-orange hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
            className="h-11 w-full bg-orange text-base font-semibold text-orange-foreground hover:bg-orange/90"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Login"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogle}
          className="h-11 w-full gap-2 border-navy/20 bg-white/70 font-medium"
        >
          <GoogleIcon /> Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to AshokMart?{" "}
          <Link to="/register" className="font-semibold text-navy hover:text-orange">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

function RoleTile({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition-all ${
        active
          ? "border-orange bg-orange/10 shadow-sm"
          : "border-border bg-white/60 hover:border-navy/30"
      }`}
    >
      <span className={active ? "text-orange" : "text-navy"}>{icon}</span>
      <span className="text-sm font-semibold text-navy">{title}</span>
      <span className="text-[11px] text-muted-foreground">{subtitle}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </svg>
  );
}
