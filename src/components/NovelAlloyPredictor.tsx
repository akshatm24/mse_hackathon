"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { formatNullable } from "@/lib/material-display";
import type { Material, PredictorMatchResponse } from "@/types";

function categoryTone(category: Material["category"]) {
  if (category === "Metal") {
    return "border-blue-800 bg-[#1E3A5F] text-sky-400";
  }
  if (category === "Polymer") {
    return "border-green-800 bg-[#14532D] text-emerald-400";
  }
  if (category === "Ceramic") {
    return "border-violet-900 bg-[#3B1F6E] text-violet-400";
  }
  if (category === "Composite") {
    return "border-orange-900 bg-[#44240C] text-orange-400";
  }
  return "border-rose-900 bg-[#3B1111] text-rose-400";
}

function propertyGrid(material: Material) {
  return [
    ["Strength", formatNullable(material.tensile_strength_mpa, { suffix: " MPa" })],
    ["Max Temp", formatNullable(material.max_service_temp_c, { suffix: "°C" })],
    ["Density", formatNullable(material.density_g_cm3, { digits: 2, suffix: " g/cm³" })],
    ["Cost", formatNullable(material.cost_usd_kg, { digits: 2, prefix: "$", suffix: "/kg" })]
  ];
}

export default function NovelAlloyPredictor() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PredictorMatchResponse | null>(null);

  async function handlePredict() {
    if (!query.trim() || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/predictor?formula=${encodeURIComponent(query.trim())}`
      );
      const payload = (await response.json()) as PredictorMatchResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Prediction failed");
      }

      setResult(payload);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="predictor"
      className="rounded-3xl border border-surface-800 bg-surface-900 px-5 py-6"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-surface-600">
            Brownie Point Feature
          </div>
          <h2 className="mt-1 text-[20px] font-semibold text-zinc-100">
            Novel Alloy Predictor
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-[1.7] text-zinc-500">
            Enter a composition like <span className="text-zinc-200">NiCo20Cr20MoTi</span> or{" "}
            <span className="text-zinc-200">Ti3SiC2</span> to find the closest
            Materials Project compound and the nearest engineering-grade analogue from
            the curated selector database.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] text-brand">
          <Sparkles className="h-3.5 w-3.5" />
          MP compound to engineering analogue
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr,auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handlePredict();
            }
          }}
          placeholder="Formula e.g. NiCo20Cr20MoTi or Ti3SiC2"
          className="rounded-xl border border-surface-800 bg-surface-950 px-4 py-3 text-[13px] text-zinc-100 outline-none transition focus:border-amber-500/40"
        />
        <button
          type="button"
          onClick={() => void handlePredict()}
          disabled={loading || !query.trim()}
          className="inline-flex min-w-[144px] items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-[12px] font-bold text-brand-subtle transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-surface-800 disabled:text-surface-600"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : null}
          {loading ? "Matching..." : "Predict"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <div className="text-[12px] font-semibold text-zinc-100">Prediction issue</div>
          <div className="mt-1 font-mono text-[11px] text-amber-100">{error}</div>
        </div>
      ) : null}

      {result ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr,1.2fr]">
          <div className="rounded-2xl border border-surface-800 bg-surface-950 px-4 py-4">
            <div className="text-[10px] uppercase tracking-[0.1em] text-surface-600">
              Closest MP Compound
            </div>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <div className="text-[20px] font-semibold text-zinc-100">
                  {result.compound.name}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${categoryTone(result.compound.category)}`}
                  >
                    {result.compound.category}
                  </span>
                  <span className="rounded-full border border-surface-700 px-2 py-0.5 text-[10px] text-surface-400">
                    {result.compound.subcategory}
                  </span>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-brand">
                    confidence {result.confidence}%
                  </span>
                </div>
              </div>
              {result.compound.source_url ? (
                <a
                  href={result.compound.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-400 transition hover:text-sky-300 hover:underline"
                >
                  View source →
                </a>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-surface-500 md:grid-cols-4">
              {propertyGrid(result.compound).map(([label, value]) => (
                <div key={label}>
                  <div>{label}</div>
                  <div className="mt-1 font-mono text-zinc-100">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-surface-800 bg-surface-900 px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.1em] text-surface-600">
                Parsed composition
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(result.elementFractions).map(([element, fraction]) => (
                  <span
                    key={element}
                    className="rounded-full border border-surface-700 px-2 py-1 text-[11px] text-zinc-100"
                  >
                    {element}: {(fraction * 100).toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-800 bg-surface-950 px-4 py-4">
            <div className="text-[10px] uppercase tracking-[0.1em] text-surface-600">
              Nearest Engineering Analogue
            </div>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <div className="text-[20px] font-semibold text-zinc-100">
                  {result.analogue.name}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${categoryTone(result.analogue.category)}`}
                  >
                    {result.analogue.category}
                  </span>
                  <span className="rounded-full border border-surface-700 px-2 py-0.5 text-[10px] text-surface-400">
                    {result.analogue.subcategory}
                  </span>
                </div>
              </div>
              {result.analogue.source_url ? (
                <a
                  href={result.analogue.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-400 transition hover:text-sky-300 hover:underline"
                >
                  Datasheet →
                </a>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-surface-500 md:grid-cols-4">
              {propertyGrid(result.analogue).map(([label, value]) => (
                <div key={label}>
                  <div>{label}</div>
                  <div className="mt-1 font-mono text-zinc-100">{value}</div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[13px] leading-[1.7] text-surface-400">
              {result.explanation}
            </p>

            {result.alternatives.length > 0 ? (
              <div className="mt-4 rounded-xl border border-surface-800 bg-surface-900 px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.1em] text-surface-600">
                  Nearby engineering alternatives
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.alternatives.map((material) => (
                    <span
                      key={material.id}
                      className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] text-brand"
                    >
                      {material.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
