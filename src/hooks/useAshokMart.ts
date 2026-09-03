import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type Role = "customer" | "seller";

export function useAuthUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: s }) => setUser(s.session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  return user;
}

export function useRole(userId: string | undefined) {
  return useQuery({
    queryKey: ["role", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Role | null> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.role as Role) ?? null;
    },
  });
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useAddresses(userId: string | undefined) {
  return useQuery({
    queryKey: ["addresses", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCart(userId: string | undefined) {
  return useQuery({
    queryKey: ["cart", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, product_id, products(*)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).filter((row) => row.products);
    },
  });
}

export async function signOutEverywhere() {
  await supabase.auth.signOut();
}
