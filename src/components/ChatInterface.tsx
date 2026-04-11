"use client";

import { MessageSquareText, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ChatMessage, RankedMaterial } from "@/types";

interface ChatInterfaceProps {
  initialQuery: string;
  initialResults: RankedMaterial[];
}

const suggestedPrompts = [
  "Compare cost vs performance of top 3",
  "Which is easiest to machine?",
  "How do these behave at cryogenic temperatures?",
  "What is the fatigue life of the top pick?"
];

export default function ChatInterface({
  initialQuery,
  initialResults
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ role: string; parts: string }>>([]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(nextMessage: string) {
    const trimmed = nextMessage.trim();
    if (!trimmed || loading) {
      return;
    }

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    const requestHistory = [...history, { role: "user", parts: trimmed }];
    setMessages(nextMessages);
    setHistory(requestHistory);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: trimmed, history: requestHistory })
      });

      const data = (await response.json()) as {
        llmExplanation?: string;
        error?: string;
      };

      const assistantReply =
        response.ok && data.llmExplanation
          ? data.llmExplanation
          : `Unable to answer that follow-up right now. ${data.error ?? "Please try again."}`;

      setMessages((current) => [
        ...current,
        { role: "assistant", content: assistantReply }
      ]);
      setHistory((current) => [
        ...current,
        { role: "model", parts: assistantReply }
      ]);
    } catch {
      const fallback = `I couldn't reach the recommendation API just now. Based on the current shortlist, ${
        initialResults[0]?.name ?? "the top candidate"
      } is still the strongest starting point for "${initialQuery}".`;
      setMessages((current) => [
        ...current,
        { role: "assistant", content: fallback }
      ]);
      setHistory((current) => [...current, { role: "model", parts: fallback }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-[780px] overflow-hidden rounded-2xl border border-surface-800 bg-surface-900">
      <div className="flex items-center justify-between border-b border-surface-800 px-4 py-3">
        <div className="flex items-center gap-2 text-[12px] text-surface-400">
          <MessageSquareText className="h-4 w-4 text-brand" />
          <span>Follow-up questions</span>
        </div>
        <span className="text-[9px] text-surface-700">Powered by Gemini</span>
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-wrap gap-1.5 px-4 py-3">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendMessage(prompt)}
              className="rounded-full border border-surface-700 bg-surface-800 px-3 py-1.5 text-[11px] text-surface-400 transition hover:border-surface-600 hover:text-zinc-100"
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      <div className="max-h-[320px] space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`${message.role === "user" ? "max-w-[75%]" : "max-w-[85%]"}`}>
              {message.role === "assistant" ? (
                <div className="mb-1 text-[9px] text-surface-700">Gemini</div>
              ) : null}
              <div
                className={`text-[13px] leading-[1.65] ${
                  message.role === "user"
                    ? "rounded-[10px_10px_2px_10px] border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-zinc-100"
                    : "rounded-[2px_10px_10px_10px] border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-surface-400"
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              <div className="mb-1 text-[9px] text-surface-700">Gemini</div>
              <div className="flex items-center gap-1 rounded-[2px_10px_10px_10px] border border-surface-700 bg-surface-800 px-3.5 py-3">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="h-1.5 w-1.5 rounded-full bg-surface-600"
                    style={{
                      animation: "bounce 1.2s infinite",
                      animationDelay: `${dot * 200}ms`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form
        className="flex items-center gap-2 border-t border-surface-800 px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a follow-up question..."
          className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-[13px] text-zinc-100 outline-none transition focus:border-amber-500/40"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-subtle transition hover:bg-amber-400 disabled:bg-surface-800 disabled:text-surface-700"
        >
          <SendHorizontal className="h-3.5 w-3.5" />
        </button>
      </form>
    </section>
  );
}
