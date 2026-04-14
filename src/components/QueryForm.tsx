"use client";

import { useCallback, useState } from "react";

import type { UserConstraints } from "@/types";

interface QueryFormProps {
  onSubmit: (query: string) => void;
  loading: boolean;
  inferredConstraints?: UserConstraints | null;
  autoDetected?: boolean;
  negatedAxes?: string[];
}

const DEFAULT_WEIGHTS = {
  strength: 30,
  thermal: 15,
  weight: 15,
  cost: 30,
  corrosion: 10
};

const WEIGHT_COLORS = {
  strength: "#F59E0B",
  thermal: "#38BDF8",
  weight: "#34D399",
  cost: "#A78BFA",
  corrosion: "#FB7185"
} as const;

export default function QueryForm({
  onSubmit,
  loading,
  inferredConstraints,
  autoDetected = false,
  negatedAxes = []
}: QueryFormProps) {
  const [query, setQuery] = useState("");

  const displayWeights = inferredConstraints?.priorityWeights
    ? {
        strength: Math.round(inferredConstraints.priorityWeights.strength * 100),
        thermal: Math.round(inferredConstraints.priorityWeights.thermal * 100),
        weight: Math.round(inferredConstraints.priorityWeights.weight * 100),
        cost: Math.round(inferredConstraints.priorityWeights.cost * 100),
        corrosion: Math.round(inferredConstraints.priorityWeights.corrosion * 100)
      }
    : DEFAULT_WEIGHTS;

  const handleSubmit = useCallback(() => {
    if (!query.trim() || loading) {
      return;
    }
    onSubmit(query.trim());
  }, [loading, onSubmit, query]);

  return (
    <div id="query" className="mx-auto max-w-3xl px-4 py-8">
      <div
        className={`overflow-hidden rounded-xl border bg-zinc-900 transition-all duration-200 ${
          loading
            ? "border-amber-500/30"
            : "border-zinc-700 focus-within:border-amber-500/50"
        }`}
      >
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={
            "Describe your engineering challenge in plain English...\n\n" +
            'e.g. "Our robotics team needs a 3D printed mounting bracket for a high-torque DC motor. Must survive 85°C heat, lightweight, easy to print on a desktop printer."'
          }
          rows={5}
          disabled={loading}
          className="w-full resize-none border-none bg-transparent p-4 text-sm leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-600 disabled:opacity-60"
        />

        {inferredConstraints ? (
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {inferredConstraints.maxTemperature_c ? (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                Max temp: {inferredConstraints.maxTemperature_c}°C
              </span>
            ) : null}
            {inferredConstraints.needsFDMPrintability ? (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                FDM printable
              </span>
            ) : null}
            {inferredConstraints.maxCost_usd_kg ? (
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-400">
                Max ${inferredConstraints.maxCost_usd_kg}/kg
              </span>
            ) : null}
            {inferredConstraints.electricallyConductive ? (
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-400">
                Electrically conductive
              </span>
            ) : null}
            {inferredConstraints.corrosionRequired ? (
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-400">
                Corrosion: {inferredConstraints.corrosionRequired}
              </span>
            ) : null}
            {negatedAxes.map((axis) => (
              <span
                key={axis}
                className="rounded-full border border-zinc-600 bg-zinc-700/50 px-2 py-0.5 text-[10px] text-zinc-400 line-through"
              >
                {axis} deprioritised
              </span>
            ))}
          </div>
        ) : null}

        <div className="border-t border-zinc-800" />

        <div className="px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">
              Priority weights:
            </span>
            {autoDetected ? (
              <span className="rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 text-[9px] text-amber-400">
                Auto-detected
              </span>
            ) : null}
          </div>
          <div className="flex gap-3">
            {Object.entries(displayWeights).map(([key, value]) => (
              <div key={key} className="flex-1 text-center">
                <div
                  className="mb-1 text-[9px] uppercase tracking-wide"
                  style={{ color: WEIGHT_COLORS[key as keyof typeof WEIGHT_COLORS] }}
                >
                  {key}
                </div>
                <div className="h-1 rounded-full bg-zinc-700">
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: `${value}%`,
                      background: WEIGHT_COLORS[key as keyof typeof WEIGHT_COLORS],
                      opacity: negatedAxes.includes(key) ? 0.3 : 1
                    }}
                  />
                </div>
                <div
                  className="mt-0.5 text-[9px] font-mono"
                  style={{
                    color: negatedAxes.includes(key)
                      ? "#52525b"
                      : WEIGHT_COLORS[key as keyof typeof WEIGHT_COLORS]
                  }}
                >
                  {value}%
                  {negatedAxes.includes(key) ? " x" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-800" />

        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-[10px] text-zinc-600">⌘↵ to search</span>
          <button
            onClick={handleSubmit}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-zinc-950 transition-all duration-150 hover:bg-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
                  />
                </svg>
                Searching...
              </>
            ) : (
              "Find Materials"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
