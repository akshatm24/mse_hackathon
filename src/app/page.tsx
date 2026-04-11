"use client";

import { AlertTriangle } from "lucide-react";
import { startTransition, useEffect, useRef, useState } from "react";

import DatabaseExplorer from "@/components/DatabaseExplorer";
import Header from "@/components/Header";
import QueryForm from "@/components/QueryForm";
import ResultsPanel from "@/components/ResultsPanel";
import materialsDB from "@/lib/materials-db";
import {
  mergeConstraints,
  normalisePriorityWeights,
  scoreMaterials
} from "@/lib/scoring";
import type { RecommendResponse, UserConstraints } from "@/types";

function inferConstraintsLocally(query: string): UserConstraints {
  const q = query.toLowerCase();
  const weights = {
    strength: 0.2,
    thermal: 0.2,
    weight: 0.2,
    cost: 0.2,
    corrosion: 0.2
  };

  if (
    q.includes("heat") ||
    q.includes("temp") ||
    q.includes("motor") ||
    q.includes("hot")
  ) {
    weights.thermal = 0.35;
  }
  if (q.includes("light") || q.includes("lightweight") || q.includes("density")) {
    weights.weight = 0.35;
  }
  if (q.includes("strength") || q.includes("load") || q.includes("bracket")) {
    weights.strength = 0.35;
  }
  if (q.includes("cost") || q.includes("budget") || q.includes("cheap")) {
    weights.cost = 0.35;
  }
  if (q.includes("corrosion") || q.includes("marine") || q.includes("rust")) {
    weights.corrosion = 0.35;
  }

  const tempMatch = q.match(/(\d{2,4})\s*°?\s*c/);

  return {
    rawQuery: query,
    maxTemperature_c: tempMatch ? parseInt(tempMatch[1], 10) : undefined,
    needsFDMPrintability:
      q.includes("3d print") || q.includes("fdm") || q.includes("desktop printer")
        ? true
        : undefined,
    priorityWeights: normalisePriorityWeights(weights)
  };
}

function buildLocalExplanation(query: string, response: RecommendResponse) {
  const top = response.rankedMaterials[0];
  return (
    `Offline mode is active, so the app used local constraint extraction and deterministic scoring for "${query}". ` +
    `${top?.name ?? "The top candidate"} ranks highest with ${top?.max_service_temp_c}°C service temperature, ` +
    `${top?.tensile_strength_mpa} MPa tensile strength, ${top?.density_g_cm3} g/cm³ density, and a cost near $${top?.cost_usd_kg}/kg. ` +
    "Use the comparison view to inspect trade-offs before final selection."
  );
}

function buildLoadingSteps(query: string, manualConstraints?: Partial<UserConstraints>) {
  const steps = ["Extracting constraints..."];
  const tempMatch = query.match(/(\d{2,4})\s*°?\s*c/i);

  if (tempMatch) {
    steps.push(`✓ Max temperature: ${tempMatch[1]}°C`);
  }
  if (
    query.toLowerCase().includes("3d print") ||
    query.toLowerCase().includes("fdm") ||
    manualConstraints?.needsFDMPrintability
  ) {
    steps.push("✓ FDM printable: yes");
  }
  if (manualConstraints?.maxDensity_g_cm3) {
    steps.push(`✓ Max density: ${manualConstraints.maxDensity_g_cm3} g/cm³`);
  }

  const weights = manualConstraints?.priorityWeights;
  if (weights) {
    const priority = Object.entries(weights)
      .sort(([, left], [, right]) => (right ?? 0) - (left ?? 0))
      .slice(0, 3)
      .map(([key, value]) => `${key} (${Math.round((value ?? 0) * 100)}%)`)
      .join(" > ");
    steps.push(`✓ Priority: ${priority}`);
  }

  steps.push("Scoring 42 materials...");
  steps.push("Ranking top candidates...");
  return steps;
}

export default function HomePage() {
  const [results, setResults] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiAvailable, setApiAvailable] = useState(true);
  const [lastQuery, setLastQuery] = useState("");
  const [lastManualConstraints, setLastManualConstraints] = useState<
    Partial<UserConstraints> | undefined
  >(undefined);
  const [searchDurationMs, setSearchDurationMs] = useState(0);
  const [visibleLoadingStep, setVisibleLoadingStep] = useState(1);
  const [summaryBarVisible, setSummaryBarVisible] = useState(false);
  const querySectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!loading) {
      setVisibleLoadingStep(1);
      return;
    }

    const interval = window.setInterval(() => {
      setVisibleLoadingStep((current) => current + 1);
    }, 380);

    return () => window.clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    function onScroll() {
      if (!results || !querySectionRef.current) {
        setSummaryBarVisible(false);
        return;
      }

      const rect = querySectionRef.current.getBoundingClientRect();
      setSummaryBarVisible(rect.bottom < 52);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [results]);

  async function handleSubmit(query: string, manualConstraints?: object) {
    const manual = manualConstraints as Partial<UserConstraints> | undefined;
    const started = performance.now();

    setLoading(true);
    setError("");
    setLastQuery(query);
    setLastManualConstraints(manual);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, manualConstraints: manual })
      });

      if (response.status === 503) {
        setApiAvailable(false);
        const localConstraints = mergeConstraints(
          inferConstraintsLocally(query),
          manual ? { ...manual, rawQuery: query } : undefined
        );
        const rankedMaterials = scoreMaterials(localConstraints, materialsDB);
        const localResults: RecommendResponse = {
          rankedMaterials,
          llmExplanation: "",
          inferredConstraints: localConstraints,
          clarifications: "Running in graceful offline mode.",
          matchCount: rankedMaterials.length
        };

        localResults.llmExplanation = buildLocalExplanation(query, localResults);
        startTransition(() => setResults(localResults));
        setSearchDurationMs(performance.now() - started);
        return;
      }

      const data = (await response.json()) as RecommendResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }

      setApiAvailable(true);
      startTransition(() => setResults(data));
      setSearchDurationMs(performance.now() - started);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const loadingSteps = buildLoadingSteps(lastQuery, lastManualConstraints);

  return (
    <>
      <Header />

      {summaryBarVisible && results ? (
        <div className="fixed left-0 right-0 top-[52px] z-40 border-b border-surface-800 bg-surface-900/95 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-2 text-[11px] text-surface-400">
            Showing top {Math.min(5, results.rankedMaterials.length)} of{" "}
            {results.matchCount ?? results.rankedMaterials.length} results for:{" "}
            <span className="text-zinc-100">{lastQuery || "current constraints"}</span>
          </div>
        </div>
      ) : null}

      <main id="top" className="pt-[52px]">
        <section className="relative overflow-hidden px-4 pb-10 pt-20 text-center">
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2"
            style={{
              background:
                "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)"
            }}
          />

          <div className="relative mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-surface-800 bg-surface-900 px-3.5 py-1 text-[10px] font-semibold tracking-[0.1em] text-brand">
              <span>✦</span>
              AI-POWERED MATERIAL SCIENCE
            </div>
            <h1 className="mt-5 text-[36px] font-bold tracking-tight text-zinc-100">
              Find the right material. <span className="text-brand">Fast.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[480px] text-[14px] leading-[1.7] text-zinc-500">
              Describe your engineering challenge in plain English. The AI extracts
              constraints and ranks 42+ materials from ASM Handbook and MatWeb in
              under 3 seconds.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
              {[
                ["42", "Materials"],
                ["5", "Categories"],
                ["18", "Properties"]
              ].map(([value, label], index) => (
                <div key={label} className="flex items-center gap-6">
                  <div>
                    <div className="font-mono text-[20px] font-bold text-brand">{value}</div>
                    <div className="text-[11px] text-surface-600">{label}</div>
                  </div>
                  {index < 2 ? <div className="hidden h-8 w-px bg-surface-800 sm:block" /> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="query" ref={querySectionRef} className="px-4">
          <QueryForm
            onSubmit={handleSubmit}
            loading={loading}
            apiAvailable={apiAvailable}
          />
        </section>

        {loading ? (
          <section className="mx-auto mt-8 max-w-6xl px-4">
            <div className="mb-4 text-center text-[12px] text-surface-600">
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full bg-brand"
                style={{ animation: "pulse 2s ease-in-out infinite" }}
              />
              Analysing constraints and searching 42 materials...
            </div>
            <div className="mx-auto mb-6 max-w-[780px] rounded-xl border border-surface-800 bg-surface-900 px-4 py-3">
              <div className="space-y-1.5 text-left text-[12px] text-surface-400">
                {loadingSteps.slice(0, visibleLoadingStep).map((step) => (
                  <div key={step} className="fade-slide-up">
                    {step}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[0, 1, 2].map((card) => (
                <div
                  key={card}
                  className="rounded-xl border border-surface-800 bg-surface-900 p-4"
                >
                  <div className="shimmer h-3.5 w-[40%] rounded" />
                  <div className="shimmer mt-2 h-2.5 w-[25%] rounded" />
                  <div className="shimmer mt-4 h-[3px] w-[60%] rounded" />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((pill) => (
                      <div key={pill} className="shimmer h-10 rounded-md" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {error ? (
          <section className="mx-auto mt-8 max-w-[780px] px-4">
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-brand" />
                <div>
                  <div className="text-[13px] font-semibold text-zinc-100">
                    Something went wrong
                  </div>
                  <div className="mt-1 font-mono text-[12px] text-surface-400">{error}</div>
                  <button
                    type="button"
                    onClick={() => void handleSubmit(lastQuery, lastManualConstraints)}
                    className="mt-3 rounded-lg bg-brand px-4 py-2 text-[12px] font-bold text-brand-subtle transition hover:bg-amber-400"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {results ? (
          <section className="mx-auto mt-8 max-w-6xl px-4">
            <ResultsPanel
              data={results}
              query={lastQuery}
              searchDurationMs={searchDurationMs}
            />
          </section>
        ) : null}

        <section id="database" className="mx-auto mt-12 max-w-6xl px-4">
          <DatabaseExplorer />
        </section>

        <footer className="mt-16 border-t border-surface-900 px-4 py-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <div className="text-[11px] text-surface-700">
              Smart Alloy Selector · MET-QUEST&apos;26
            </div>
            <div className="text-[10px] text-surface-700">
              42 materials · ASM Handbook · MatWeb · NASA TPSX
            </div>
            <div className="flex items-center gap-3 text-[10px] text-surface-700">
              <span>Built with Next.js + Gemini</span>
              <a
                href="/api/recommend?query=lightweight%203D%20printable%20bracket%20for%2085%20degree%20motor%20heat"
                className="text-brand transition hover:text-amber-300"
              >
                API sample
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
