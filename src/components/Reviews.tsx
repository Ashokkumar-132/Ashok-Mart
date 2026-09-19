import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useProfile } from "@/hooks/useAshokMart";

export function Reviews({ productId }: { productId: string }) {
  const user = useAuthUser();
  const { data: profile } = useProfile(user?.id);
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: reviews, isPending } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (err) throw err;
      return data;
    },
  });

  const { data: purchased } = useQuery({
    queryKey: ["purchased", productId, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("order_items")
        .select("id, orders!inner(user_id)")
        .eq("product_id", productId)
        .eq("orders.user_id", user!.id)
        .limit(1);
      if (err) throw err;
      return (data ?? []).length > 0;
    },
  });

  const mine = (reviews ?? []).find((r) => r.user_id === user?.id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    if (!comment.trim()) {
      setError("Please write a short comment before submitting.");
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.from("reviews").upsert(
      {
        product_id: productId,
        user_id: user.id,
        user_name: profile?.full_name || user.email?.split("@")[0] || "Customer",
        rating,
        comment: comment.trim(),
      },
      { onConflict: "product_id,user_id" },
    );
    setSaving(false);
    if (err) {
      setError("Only customers who purchased this product can review it.");
      return;
    }
    setComment("");
    await queryClient.invalidateQueries();
  }

  return (
    <section className="glass mt-6 rounded-3xl p-5 sm:p-7">
      <h2 className="font-display text-lg font-bold text-navy">Ratings & Reviews</h2>

      {purchased ? (
        <form onSubmit={submit} className="mt-4 rounded-2xl bg-white/70 p-4">
          <p className="text-sm font-semibold text-navy">
            {mine ? "Update your review" : "Rate this product"}
          </p>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i} star`}
                onClick={() => setRating(i)}
                className="p-0.5"
              >
                <Star
                  className={
                    i <= rating ? "size-6 fill-warning text-warning" : "size-6 text-muted-foreground/40"
                  }
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="mt-3 bg-white"
            rows={3}
          />
          {error && (
            <p className="mt-2 text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={saving}
            className="mt-3 bg-orange text-orange-foreground hover:bg-orange/90"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : mine ? "Update Review" : "Submit Review"}
          </Button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          You can rate and review this product after you buy it.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {isPending ? (
          <Loader2 className="size-5 animate-spin text-orange" />
        ) : !reviews || reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review.</p>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className="rounded-2xl bg-white/70 p-4">
              <div className="flex items-center gap-2">
                <span className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={
                        i <= r.rating
                          ? "size-3.5 fill-warning text-warning"
                          : "size-3.5 text-muted-foreground/40"
                      }
                    />
                  ))}
                </span>
                <span className="text-sm font-semibold text-navy">{r.user_name || "Customer"}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("en-IN")}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{r.comment}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
