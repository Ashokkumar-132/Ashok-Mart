import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your AshokMart password" },
      {
        name: "description",
        content: "Request a secure password reset link for your AshokMart customer or seller account.",
      },
      { property: "og:title", content: "Reset your AshokMart password" },
      { property: "og:description", content: "Request a secure password reset link for AshokMart." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("Please enter all required fields.");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage("If that email exists, a reset link is on its way.");
  }

  return (
    <div className="brand-backdrop flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass w-full max-w-md rounded-3xl p-8">
        <div className="mb-6 flex justify-center">
          <Logo className="h-10 w-auto" showTagline />
        </div>
        <h1 className="text-center font-display text-xl font-bold text-navy">Forgot Password?</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          We&apos;ll email you a link to set a new one.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Gmail / Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/80"
            />
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          {message && <p className="text-sm font-medium text-success">{message}</p>}
          <Button className="h-11 w-full bg-orange text-orange-foreground hover:bg-orange/90">
            Send reset link
          </Button>
        </form>

        <p className="mt-5 text-center text-sm">
          <Link to="/" className="font-semibold text-navy hover:text-orange">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
