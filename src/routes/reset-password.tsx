import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new AshokMart password" },
      { name: "description", content: "Choose a new password for your AshokMart account." },
      { property: "og:title", content: "Set a new AshokMart password" },
      { property: "og:description", content: "Choose a new password for your AshokMart account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password || !confirm) {
      setError("Please enter all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/", replace: true }), 1500);
  }

  return (
    <div className="brand-backdrop flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass w-full max-w-md rounded-3xl p-8">
        <div className="mb-6 flex justify-center">
          <Logo className="h-10 w-auto" showTagline />
        </div>
        <h1 className="text-center font-display text-xl font-bold text-navy">Set a new password</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/80" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="bg-white/80" />
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          {done && <p className="text-sm font-medium text-success">Password updated. Redirecting…</p>}
          <Button className="h-11 w-full bg-orange text-orange-foreground hover:bg-orange/90">
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
