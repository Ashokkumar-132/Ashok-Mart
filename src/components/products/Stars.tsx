import { Star } from "lucide-react";

export function Stars({ rating, reviews }: { rating: number; reviews?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={
              i <= Math.round(rating)
                ? "size-3.5 fill-warning text-warning"
                : "size-3.5 text-muted-foreground/40"
            }
          />
        ))}
      </span>
      <span className="text-xs font-semibold text-foreground">{rating.toFixed(1)}</span>
      {reviews !== undefined && (
        <span className="text-xs text-muted-foreground">({reviews.toLocaleString("en-IN")})</span>
      )}
    </div>
  );
}
