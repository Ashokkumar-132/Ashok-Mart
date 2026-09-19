import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the AshokMart Shopping Assistant, a helpful guide for the AshokMart online store (an Indian e-commerce site, all prices in INR with the ₹ symbol).

Help shoppers with:
- Searching products (search bar at the top of the home page) and filtering by category
  (Electronics, Mobiles, Computers, Fashion, Home & Kitchen, Grocery, Beauty, Sports, Books, Accessories)
- Adding items to the cart, changing quantity, removing items
- Checkout: Cart → Checkout → Delivery Address → Order Summary → Confirm Order → Order Successful
- Payment options in the demo store: Cash on Delivery, UPI or Card
- Delivery: ₹49 delivery charge, free above ₹500
- Viewing order history and order status on the Orders page
- Managing the delivery address on the Address page
- Becoming a seller: register a new account choosing the Seller role, then use the Seller Dashboard to add products, manage stock and price, and view orders received
- Rating and reviewing a product after purchase, from the product details page

Rules: answer only AshokMart shopping and navigation questions. Be short (2-4 sentences), friendly and practical. Never invent prices, stock or order details — tell the user where in the site to look instead.`;

function validate(input: { messages: ChatMessage[] }) {
  const messages = (input.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (messages.length === 0) throw new Error("Please type a question.");
  return { messages };
}

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { reply: "The shopping assistant is not configured right now. Please try again later." };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages],
      }),
    });

    if (response.status === 429) {
      return { reply: "The assistant is busy right now. Please try again in a moment." };
    }
    if (!response.ok) {
      return { reply: "Sorry, I could not answer that just now. Please try again." };
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim();
    return { reply: reply || "Sorry, I could not answer that just now. Please try again." };
  });
