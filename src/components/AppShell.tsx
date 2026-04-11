"use client";

import { AlertTriangle, ArrowRight, Cpu, Database, RefreshCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { startTransition, useState } from "react";

import ChatInterface from "@/components/ChatInterface";
import DatabaseExplorer from "@/components/DatabaseExplorer";
import Header from "@/components/Header";
import QueryForm from "@/components/QueryForm";
import ResultsPanel from "@/components/ResultsPanel";
import { materialsDB } from "@/lib/materials-db";
import { buildDefaultConstraints, mergeConstraints, scoreMaterials } from "@/lib/scoring";
import { ChatMessage, RecommendResponse, UserConstraints } from "@/types";

interface AppShellProps {
  databaseSize: number;
  llmEnabled: boolean;
}

interface SearchPayload {
  query: string;
  manualConstraints: UserConstraints;
}

type FailedAction =
  | {
      kind: "search";
      payload: SearchPayload;
    }
  | {
      kind: "chat";
      payload: SearchPayload;
      message: string;
      historySnapshot: ChatMessage[];
    };

function historyToApi(messages: ChatMessage[]): { role: "user" | "model"; parts: string }[] {
  return messages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: message.content
  }));
}

function buildOfflineExplanation(query: string, response: RecommendResponse): string {
  const [first, second, third] = response.rankedMaterials;

  if (!first) {
    return "No materials survived the local hard filters. Relax the strictest numeric limit or printability requirement and run the search again to inspect near-miss options.";
  }

  const promptLabel = query.trim().length > 0 ? `for "${query.trim()}"` : "for the current manual constraint set";
  const firstParagraph = `${first.name} is the strongest offline recommendation ${promptLabel} because it clears the active hard filters and then scores well on ${first.matchReason.toLowerCase()}`;
  const secondParagraph = second && third
    ? `${second.name} and ${third.name} remain credible alternatives. ${second.name} gives a different balance of density, service temperature, and cost, while ${third.name} broadens the trade space if manufacturability or corrosion resistance becomes more important than the current top pick.`
    : `${first.name} is currently the only strong local match, which usually means the entered constraints are tight enough that the solution space has collapsed around a single material family.`;
  const thirdParagraph = `This offline explanation is deterministic and based only on the embedded database, so use the detailed cards, radar chart, and comparison table to verify edge cases such as fatigue, creep, joining method, and supply-chain availability before committing to procurement.`;

  return [firstParagraph, secondParagraph, thirdParagraph].join("\n\n");
}

function buildOfflineResponse(payload: SearchPayload): RecommendResponse {
  const mergedConstraints = mergeConstraints(
    buildDefaultConstraints(payload.query),
    payload.manualConstraints
  );
  const rankedMaterials = scoreMaterials(mergedConstraints, materialsDB);
  const preliminary: RecommendResponse = {
    rankedMaterials,
    llmExplanation: "",
    inferredConstraints: mergedConstraints,
    clarifications:
      "Offline mode is active, so the ranking uses only manual filters plus the deterministic scoring engine against the embedded database."
  };

  return {
    ...preliminary,
    llmExplanation: buildOfflineExplanation(payload.query, preliminary)
  };
}

async function requestRecommendation(
  query: string,
  history: ChatMessage[],
  manualConstraints: UserConstraints
): Promise<RecommendResponse> {
  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      history: historyToApi(history),
      manualConstraints
    })
  });

  const data = (await response.json()) as RecommendResponse | { error: string };

  if (response.ok === false) {
    const message = "error" in data ? data.error : "The recommendation request failed.";
    throw new Error(message);
  }

  return data as RecommendResponse;
}

function LoadingShell(): JSX.Element {
  return (
    <section className="space-y-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-6">
      <div className="space-y-3">
        <div className="shimmer-card h-4 w-40 rounded-full animate-shimmer" />
        <div className="shimmer-card h-8 w-3/4 rounded-xl animate-shimmer" />
        <div className="shimmer-card h-4 w-full rounded-full animate-shimmer" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((card) => (
          <div key={card} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="space-y-3">
              <div className="shimmer-card h-5 w-20 rounded-full animate-shimmer" />
              <div className="shimmer-card h-6 w-2/3 rounded-xl animate-shimmer" />
              <div className="shimmer-card h-4 w-full rounded-full animate-shimmer" />
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((pill) => (
                  <div key={pill} className="shimmer-card h-16 rounded-xl animate-shimmer" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AppShell({ databaseSize, llmEnabled }: AppShellProps): JSX.Element {
  const [results, setResults] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSearch, setLastSearch] = useState<SearchPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedAction, setFailedAction] = useState<FailedAction | null>(null);

  function toggleCompare(id: string): void {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((entry) => entry !== id);
      }

      if (current.length >= 4) {
        return current;
      }

      return [...current, id];
    });
  }

  async function runSearch(payload: SearchPayload): Promise<void> {
    setLoading(true);
    setError(null);
    setFailedAction(null);

    try {
      const response = llmEnabled
        ? await requestRecommendation(payload.query, [], payload.manualConstraints)
        : buildOfflineResponse(payload);

      startTransition(() => {
        setResults(response);
        setLastSearch(payload);
        setSelectedIds([]);
        setChatMessages(
          llmEnabled
            ? [
                { role: "user", content: payload.query || response.inferredConstraints.rawQuery },
                { role: "assistant", content: response.llmExplanation }
              ]
            : []
        );
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Search failed.");
      setFailedAction({ kind: "search", payload });
    } finally {
      setLoading(false);
    }
  }

  async function runChat(message: string, payload: SearchPayload, historySnapshot: ChatMessage[]): Promise<void> {
    const nextHistory = [...historySnapshot, { role: "user" as const, content: message }];

    setChatMessages(nextHistory);
    setChatLoading(true);
    setError(null);
    setFailedAction(null);

    try {
      const response = await requestRecommendation(message, historySnapshot, payload.manualConstraints);

      startTransition(() => {
        setResults(response);
        setSelectedIds([]);
        setChatMessages([...nextHistory, { role: "assistant", content: response.llmExplanation }]);
      });
    } catch (requestError) {
      setChatMessages(historySnapshot);
      setError(requestError instanceof Error ? requestError.message : "Follow-up request failed.");
      setFailedAction({ kind: "chat", payload, message, historySnapshot });
    } finally {
      setChatLoading(false);
    }
  }

  function retryLastAction(): void {
    if (!failedAction) {
      return;
    }

    if (failedAction.kind === "search") {
      void runSearch(failedAction.payload);
      return;
    }

    void runChat(failedAction.message, failedAction.payload, failedAction.historySnapshot);
  }

  return (
    <div id="top" className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-28">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
          <QueryForm llmEnabled={llmEnabled} loading={loading} onSubmit={(payload) => void runSearch(payload)} />

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-6 shadow-glow">
              <p className="text-xs uppercase tracking-[0.28em] text-amber-400">Needle In The Data-Stack</p>
              <h2 className="mt-3 text-2xl font-semibold text-zinc-100">
                LLM guidance where it helps, deterministic scoring where it matters.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Gemini extracts constraints and explains trade-offs, while a strict ranking engine filters and scores the embedded materials database with reproducible math.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  { label: "Database", value: `${databaseSize} materials` },
                  { label: "Deployment", value: "Vercel-ready" },
                  { label: "Setup", value: "1 env var" }
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">{stat.label}</p>
                    <p className="mt-2 text-lg font-medium text-zinc-100">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="how-it-works" className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">How It Works</p>
              <div className="mt-4 space-y-3">
                {[
                  {
                    icon: Cpu,
                    title: "1. Extract",
                    body: "Gemini parses the engineering brief into temperatures, density limits, manufacturability requirements, and priority weights."
                  },
                  {
                    icon: Database,
                    title: "2. Rank",
                    body: "A deterministic engine hard-filters the embedded dataset and computes weighted scores across strength, thermal, weight, cost, and corrosion."
                  },
                  {
                    icon: ShieldCheck,
                    title: "3. Explain",
                    body: "The app surfaces ranked cards, radar charts, comparison tables, and a follow-up chat so the recommendation stays auditable."
                  }
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                    <div className="flex items-start gap-3">
                      <item.icon className="mt-0.5 h-4 w-4 text-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-400">{item.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        {error ? (
          <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-100">The last request did not complete.</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-300">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={retryLastAction}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-zinc-100"
              >
                <RefreshCcw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </section>
        ) : null}

        {loading ? <LoadingShell /> : null}
        {results ? (
          <ResultsPanel
            results={results}
            selectedIds={selectedIds}
            llmEnabled={llmEnabled}
            onToggleSelect={toggleCompare}
          />
        ) : null}
        {results && llmEnabled ? (
          <ChatInterface
            messages={chatMessages}
            loading={chatLoading}
            onSend={(message) => {
              if (lastSearch) {
                void runChat(message, lastSearch, chatMessages);
              }
            }}
          />
        ) : null}

        <DatabaseExplorer />

        <section id="github-launch" className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">GitHub + Vercel Launch</p>
              <h2 className="mt-2 text-lg font-medium text-zinc-100">
                Push this folder, add one environment variable, and deploy.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
                The project is structured for a standard Next.js Vercel deployment. Once it is in a GitHub repository, Vercel only needs the <span className="font-mono text-amber-400">GEMINI_API_KEY</span> variable to enable the LLM route.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="https://github.com"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-500 hover:text-zinc-100"
              >
                Open GitHub
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="https://vercel.com/new"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
              >
                Open Vercel Import
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              "1. Push the smart-alloy-selector folder to a GitHub repository.",
              "2. Import the repository in Vercel and add GEMINI_API_KEY before deploying.",
              "3. The same codebase runs locally with .env.local and in production with the Vercel environment variable."
            ].map((step) => (
              <div key={step} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm leading-relaxed text-zinc-300">
                {step}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
