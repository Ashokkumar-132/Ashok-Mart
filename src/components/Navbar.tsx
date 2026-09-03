import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Menu, Package, Search, ShoppingCart, User2, LogOut } from "lucide-react";
import { useState } from "react";

import logo from "@/assets/ashokmart-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAddresses, useAuthUser, useCart, useProfile } from "@/hooks/useAshokMart";

export function Navbar({ initialSearch = "" }: { initialSearch?: string }) {
  const user = useAuthUser();
  const { data: profile } = useProfile(user?.id);
  const { data: addresses } = useAddresses(user?.id);
  const { data: cart } = useCart(user?.id);
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState(initialSearch);
  const [open, setOpen] = useState(false);

  const address = addresses?.[0];
  const cartCount = (cart ?? []).reduce((sum, item) => sum + item.quantity, 0);

  async function handleLogout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/", replace: true });
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/home", search: { q: term || undefined, category: undefined } });
    setOpen(false);
  }

  const links = (
    <>
      <Link
        to="/account"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
      >
        <User2 className="size-4" /> Account
      </Link>
      <Link
        to="/orders"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
      >
        <Package className="size-4" /> Orders
      </Link>
      <Link
        to="/address"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
      >
        <MapPin className="size-4" /> Address
      </Link>
      <Link
        to="/cart"
        className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
      >
        <ShoppingCart className="size-4" /> Cart
        {cartCount > 0 && (
          <span className="ml-1 rounded-full bg-orange px-2 py-0.5 text-xs font-bold text-orange-foreground">
            {cartCount}
          </span>
        )}
      </Link>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
      >
        <LogOut className="size-4" /> Logout
      </button>
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-navy/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/home" className="shrink-0">
          <img src={logo} alt="AshokMart" className="h-8 w-auto brightness-0 invert md:h-9" />
        </Link>

        <form onSubmit={submitSearch} className="relative mx-2 hidden flex-1 md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products..."
            className="h-11 rounded-full border-0 bg-white pl-10 text-foreground"
            aria-label="Search products"
          />
        </form>

        <div className="hidden items-center gap-1 lg:flex">
          <div className="mr-2 hidden max-w-[190px] flex-col leading-tight xl:flex">
            <span className="text-[11px] text-white/60">Deliver to</span>
            <span className="truncate text-xs font-semibold text-white">
              {address ? `${address.full_name}, ${address.city}` : "Add delivery address"}
            </span>
          </div>
          {links}
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <Link to="/cart" className="relative p-2 text-white">
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 rounded-full bg-orange px-1.5 text-[10px] font-bold text-orange-foreground">
                {cartCount}
              </span>
            )}
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-navy p-4 pt-12">
              <div className="flex flex-col gap-1">
                <p className="px-3 pb-2 text-xs text-white/60">
                  {profile?.full_name ? `Hi, ${profile.full_name}` : "Welcome"}
                </p>
                {links}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <form onSubmit={submitSearch} className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products..."
            className="h-10 rounded-full border-0 bg-white pl-10 text-foreground"
            aria-label="Search products"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 bg-navy-soft px-4 py-2 text-xs text-white/85">
        <MapPin className="size-3.5 text-orange" />
        {address ? (
          <span>
            Deliver to <strong className="text-white">{address.full_name}</strong> — {address.city},{" "}
            {address.state} {address.pincode}
          </span>
        ) : (
          <Link to="/address" className="underline underline-offset-2">
            Set your delivery address
          </Link>
        )}
      </div>
    </header>
  );
}
