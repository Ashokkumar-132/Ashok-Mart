import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAssistant, type ChatMessage } from "@/services/Assistant.functions";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm the AshokMart shopping assistant. Ask me how to search products, add to cart, checkout, track orders or become a seller.",
};

const SUGGESTIONS = ["How do I checkout?", "Where are my orders?", "How do I become a seller?"];

export function ChatWidget() {
  const ask = useServerFn(askAssistant);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const result = await ask({ data: { messages: next.filter((m) => m !== GREETING) } });
      setMessages([...next, { role: "assistant", content: result.reply }]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close shopping assistant" : "Open shopping assistant"}
        className="fixed right-4 bottom-4 z-50 size-14 rounded-full bg-orange text-orange-foreground shadow-lg hover:bg-orange/90"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </Button>

      {open && (
        <div className="glass fixed right-4 bottom-20 z-50 flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl">
          <header className="bg-navy px-4 py-3">
            <p className="font-display text-sm font-bold text-white">AshokMart Assistant</p>
            <p className="text-[11px] text-white/70">Shopping help, anytime</p>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <p
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl bg-navy px-3 py-2 text-sm text-white"
                      : "max-w-[90%] text-sm whitespace-pre-line text-foreground"
                  }
                >
                  {m.content}
                </p>
              </div>
            ))}
            {loading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Thinking...
              </p>
            )}
            <div ref={endRef} />
          </div>

          {messages.length === 1 && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-navy hover:bg-white"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-white/70 p-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about AshokMart..."
              aria-label="Ask the AshokMart assistant"
              className="h-10 border-0 bg-white"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="size-10 shrink-0 bg-orange text-orange-foreground hover:bg-orange/90"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
