import { supabase } from "@/integrations/supabase/client";

export async function addToCart(
  userId: string,
  productId: string,
  qty: number,
  stock: number,
): Promise<void> {
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const next = Math.min(existing.quantity + qty, stock);
    await supabase.from("cart_items").update({ quantity: next }).eq("id", existing.id);
    return;
  }

  await supabase
    .from("cart_items")
    .insert({ user_id: userId, product_id: productId, quantity: Math.min(qty, stock) });
}
