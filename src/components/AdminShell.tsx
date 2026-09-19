import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { LogOut } from "lucide-react";

import logo from "@/assets/ashokmart-logo.png";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useRole } from "@/hooks/useAshokMart";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/products", label: "Products" },
] as const;

export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  const user = useAuthUser();
  const { data: role, isPending } = useRole(user?.id);
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isPending || !role) return;
    if (role === "seller") navigate({ to: "/seller/dashboard", replace: true });
    if (role === "customer") navigate({ to: "/home", search: {}, replace: true });
  }, [role, isPending, navigate]);

  async function logout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/admin", replace: true });
  }

  return (
    <div className="soft-backdrop min-h-screen">
      <header className="sticky top-0 z-40 bg-navy/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="AshokMart" className="h-8 w-auto brightness-0 invert" />
            <span className="rounded-full bg-orange px-2 py-0.5 text-[10px] font-bold tracking-wide text-orange-foreground uppercase">
              Admin
            </span>
          </Link>
          <nav className="ml-auto flex flex-wrap items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "bg-white/15 text-white" }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            <Button size="sm" variant="ghost" onClick={logout} className="text-white/85 hover:bg-white/10">
              <LogOut className="size-4" /> Logout
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-5 font-display text-2xl font-bold text-navy">{title}</h1>
        {children}
      </main>
    </div>
  );
}
