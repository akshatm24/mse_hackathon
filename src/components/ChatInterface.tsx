"use client";

import { SendHorizontal } from "lucide-react";
import { useState } from "react";

import { ChatMessage } from "@/types";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (message: string) => void;
}

const SUGGESTED_PROMPTS = [
  "Compare cost vs performance of top 3",
  "Which is easiest to machine?",
  "How do these behave at cryogenic temperatures?",
  "What's the fatigue life of the top pick?"
];

export default function ChatInterface({ messages, loading, onSend }: ChatInterfaceProps): JSX.Element {
  const [input, setInput] = useState("");

  function submitMessage(message: string): void {
    const trimmed = message.trim();

    if (trimmed.length === 0 || loading) {
      return;
    }

    onSend(trimmed);
    setInput("");
  }

  return (
    <section className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Follow-up Chat</p>
        <h3 className="mt-2 text-lg font-medium text-zinc-100">Ask for trade-offs, processability, or edge-case behavior</h3>
      </div>

      <div className="space-y-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-3xl rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                message.role === "user"
                  ? "border-amber-500/30 bg-amber-500/10 text-zinc-100"
                  : "border-zinc-700 bg-zinc-800 text-zinc-200"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="h-2 w-2 rounded-full bg-amber-400 animate-pulse-dot"
                    style={{ animationDelay: `${dot * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {messages.length <= 2 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => submitMessage(prompt)}
              className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="mt-4 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a follow-up about processability, fatigue, corrosion, or manufacturing trade-offs"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 font-semibold text-zinc-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SendHorizontal className="h-4 w-4" />
          Send
        </button>
      </form>
    </section>
  );
}
