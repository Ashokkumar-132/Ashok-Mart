export function inr(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export type StockState = "in" | "low" | "out";

export function stockState(stock: number): StockState {
  if (stock <= 0) return "out";
  if (stock <= 10) return "low";
  return "in";
}

export function stockLabel(stock: number): string {
  if (stock <= 0) return "Out of Stock";
  if (stock <= 10) return `Only ${stock} left`;
  return "In Stock";
}

export function discountPercent(mrp: number, price: number): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export const CATEGORIES = [
  "Electronics",
  "Mobiles",
  "Computers",
  "Fashion",
  "Home & Kitchen",
  "Grocery",
  "Beauty",
  "Sports",
  "Books",
  "Accessories",
] as const;

export const ORDER_STATUSES = [
  "Ordered",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
] as const;

export const ALL_STATUSES = [...ORDER_STATUSES, "Cancelled"] as const;

export const DELIVERY_CHARGE = 49;
export const FREE_DELIVERY_ABOVE = 500;
