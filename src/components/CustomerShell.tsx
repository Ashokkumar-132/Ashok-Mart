import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Navbar } from "@/components/Navbar";
import { useAuthUser, useRole } from "@/hooks/useAshokMart";

export function CustomerShell({
  children,
  search = "",
}: {
  children: ReactNode;
  search?: string;
}) {
  const user = useAuthUser();
  const { data: role } = useRole(user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (role === "seller") navigate({ to: "/seller/dashboard", replace: true });
  }, [role, navigate]);

  return (
    <div className="soft-backdrop min-h-screen">
      <Navbar initialSearch={search} />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <footer className="mt-12 bg-navy px-4 py-8 text-center text-sm text-white/70">
        <p className="font-display text-base font-semibold text-white">AshokMart</p>
        <p className="mt-1 text-xs tracking-wide text-orange uppercase">
          Everything You Need. Delivered.
        </p>
        <p className="mt-3 text-xs">© {new Date().getFullYear()} AshokMart. Student project demo.</p>
      </footer>
    </div>
  );
}
