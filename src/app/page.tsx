"use client";

import { AlertTriangle } from "lucide-react";
import { startTransition, useEffect, useRef, useState } from "react";

import DatabaseExplorer from "@/components/DatabaseExplorer";
import Header from "@/components/Header";
import NovelAlloyPredictor from "@/components/NovelAlloyPredictor";
import QueryForm from "@/components/QueryForm";
import ResultsPanel from "@/components/ResultsPanel";
import materialsDB, { materialCount } from "@/lib/materials-db";
import { sourceCount } from "@/lib/material-display";
import type { RecommendResponse, UserConstraints } from "@/types";

type WeightState = UserConstraints["priorityWeights"];

const DEFAULT_WEIGHTS: WeightState = {
  strength: 0.3,
  thermal: 0.15,
  weight: 0.15,
  cost: 0.3,
  corrosion: 0.1
};

function buildLoadingSteps(totalMaterials: number) {
  return [
    "Extracting constraints...",
    `Scoring ${totalMaterials} materials...`,
    "Selecting best candidates (RAG)...",
    "Generating explanation..."
  ];
}

export default function HomePage() {
  const [results, setResults] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [lastManualConstraints, setLastManualConstraints] = useState<
    Partial<UserConstraints> | undefined
  >(undefined);
  const [searchDurationMs, setSearchDurationMs] = useState(0);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [summaryBarVisible, setSummaryBarVisible] = useState(false);
  const [weights, setWeights] = useState<WeightState>(DEFAULT_WEIGHTS);
  const [weightsAutoDetected, setWeightsAutoDetected] = useState(false);
  const [hasManualWeightOverride, setHasManualWeightOverride] = useState(false);
  const [negatedAxes, setNegatedAxes] = useState<string[]>([]);
  const querySectionRef = useRef<HTMLElement | null>(null);
  const totalSources = sourceCount(materialsDB);

  const loadingSteps = buildLoadingSteps(materialCount);

  useEffect(() => {
    if (!loading) {
      setLoadingStepIndex(0);
      return;
    }

    setLoadingStepIndex(0);
    const interval = window.setInterval(() => {
      setLoadingStepIndex((current) =>
        current < loadingSteps.length - 1 ? current + 1 : current
      );
    }, 600);

    return () => window.clearInterval(interval);
  }, [loading, loadingSteps.length]);

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

  function applyInferredWeights(nextWeights: WeightState) {
    setWeights({
      strength: Math.round(nextWeights.strength * 100) / 100,
      thermal: Math.round(nextWeights.thermal * 100) / 100,
      weight: Math.round(nextWeights.weight * 100) / 100,
      cost: Math.round(nextWeights.cost * 100) / 100,
      corrosion: Math.round(nextWeights.corrosion * 100) / 100
    });
    setWeightsAutoDetected(true);
    setHasManualWeightOverride(false);
  }

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

      const data = (await response.json()) as RecommendResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      if (data.inferredConstraints?.priorityWeights) {
        applyInferredWeights(data.inferredConstraints.priorityWeights);
      }
      setNegatedAxes(data.inferredConstraints?._negatedAxes ?? []);

      startTransition(() => setResults(data));
      setSearchDurationMs(performance.now() - started);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

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
              constraints and ranks {materialCount.toLocaleString()} materials spanning curated,
              cited, scraped, and Materials Project engineering datasets.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
              {[
                [materialCount.toLocaleString(), "Materials"],
                ["5", "Categories"],
                [String(totalSources), "Sources"]
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
            weights={weights}
            weightsAutoDetected={weightsAutoDetected}
            hasManualWeightOverride={hasManualWeightOverride}
            negatedAxes={negatedAxes}
            onWeightsChange={setWeights}
            onManualWeightOverride={() => {
              setWeightsAutoDetected(false);
              setHasManualWeightOverride(true);
              setNegatedAxes([]);
            }}
          />
        </section>

        {loading ? (
          <section className="mx-auto mt-8 max-w-6xl px-4">
            <div className="mb-4 text-center text-[12px] text-surface-600">
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full bg-brand"
                style={{ animation: "pulse 2s ease-in-out infinite" }}
              />
              ● {loadingSteps[loadingStepIndex]}
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

        <section className="mx-auto mt-12 max-w-6xl px-4">
          <NovelAlloyPredictor />
        </section>

        <footer className="mt-16 border-t border-surface-900 px-4 py-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <div className="text-[11px] text-surface-700">
              Smart Alloy Selector · MET-QUEST&apos;26
            </div>
            <div className="text-[10px] text-surface-700">
              {materialCount.toLocaleString()} materials from {totalSources} sources
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
