"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { formatNullable } from "@/lib/material-display";
import type { Material, PredictorResponse } from "@/types";

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

export default function NovelAlloyPredictor() {
  const [formula, setFormula] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PredictorResponse | null>(null);

  async function handlePredict() {
    if (!formula.trim() || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          formula: formula.trim(),
          context: context.trim()
        })
      });

      const payload = (await response.json()) as PredictorResponse & { error?: string };
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
            Enter a formula or candidate composition and the app will surface the closest
            known engineering analogue from the expanded curated + Materials Project
            database, with exact-match detection and screening-level composition estimates
            when possible.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] text-brand">
          <Sparkles className="h-3.5 w-3.5" />
          Hybrid screening predictor
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1.1fr,1.4fr,auto]">
        <input
          value={formula}
          onChange={(event) => setFormula(event.target.value)}
          placeholder="Formula e.g. Ti3SiC2 or NiTi"
          className="rounded-xl border border-surface-800 bg-surface-950 px-4 py-3 text-[13px] text-zinc-100 outline-none transition focus:border-amber-500/40"
        />
        <input
          value={context}
          onChange={(event) => setContext(event.target.value)}
          placeholder="Application notes e.g. high-cycle actuator wire"
          className="rounded-xl border border-surface-800 bg-surface-950 px-4 py-3 text-[13px] text-zinc-100 outline-none transition focus:border-amber-500/40"
        />
        <button
          type="button"
          onClick={() => void handlePredict()}
          disabled={loading || !formula.trim()}
          className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-[12px] font-bold text-brand-subtle transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-surface-800 disabled:text-surface-600"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : null}
          {loading ? "Predicting..." : "Predict"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <div className="text-[12px] font-semibold text-zinc-100">Prediction issue</div>
          <div className="mt-1 font-mono text-[11px] text-amber-100">{error}</div>
        </div>
      ) : null}

      {result ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr,0.9fr]">
          <div className="rounded-2xl border border-surface-800 bg-surface-950 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-surface-600">
                  Predicted Closest Match
                </div>
                <div className="mt-1 text-[20px] font-semibold text-zinc-100">
                  {result.winner.name}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${categoryTone(result.winner.category)}`}
                  >
                    {result.winner.category}
                  </span>
                  <span className="rounded-full border border-surface-700 px-2 py-0.5 text-[10px] text-surface-500">
                    {result.winner.subcategory}
                  </span>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-brand">
                    {result.method}
                  </span>
                  <span className="rounded-full border border-surface-700 px-2 py-0.5 text-[10px] text-surface-400">
                    confidence {result.confidence}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-right text-[11px] text-surface-500">
                <div>
                  <div>Tensile</div>
                  <div className="mt-1 font-mono text-zinc-100">
                    {result.winner.tensile_strength_mpa} MPa
                  </div>
                </div>
                <div>
                  <div>Max Temp</div>
                  <div className="mt-1 font-mono text-zinc-100">
                    {result.winner.max_service_temp_c}°C
                  </div>
                </div>
                <div>
                  <div>Density</div>
                  <div className="mt-1 font-mono text-zinc-100">
                    {formatNullable(result.winner.density_g_cm3, { digits: 2, suffix: " g/cm³" })}
                  </div>
                </div>
                <div>
                  <div>Cost</div>
                  <div className="mt-1 font-mono text-zinc-100">
                    {formatNullable(result.winner.cost_usd_kg, { digits: 2, prefix: "$", suffix: "/kg" })}
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-[1.7] text-surface-400">
              {result.explanation}
            </p>

            {result.warnings.length > 0 ? (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.1em] text-brand">
                  Screening warnings
                </div>
                <div className="mt-2 space-y-2 text-[12px] leading-[1.6] text-amber-100">
                  {result.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              </div>
            ) : null}

            {result.predictedProperties ? (
              <div className="mt-4 rounded-xl border border-surface-800 bg-surface-900 px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.1em] text-surface-600">
                  Screening estimate
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-surface-500 md:grid-cols-3">
                  <div>
                    <div>Density</div>
                    <div className="mt-1 font-mono text-zinc-100">
                      {result.predictedProperties.density_g_cm3.toFixed(2)} g/cm³
                    </div>
                  </div>
                  <div>
                    <div>Tensile</div>
                    <div className="mt-1 font-mono text-zinc-100">
                      {result.predictedProperties.tensile_strength_mpa.toFixed(0)} MPa
                    </div>
                  </div>
                  <div>
                    <div>Modulus</div>
                    <div className="mt-1 font-mono text-zinc-100">
                      {result.predictedProperties.elastic_modulus_gpa.toFixed(1)} GPa
                    </div>
                  </div>
                  <div>
                    <div>CTE</div>
                    <div className="mt-1 font-mono text-zinc-100">
                      {result.predictedProperties.thermal_expansion_ppm_k.toFixed(1)} ppm/K
                    </div>
                  </div>
                  <div>
                    <div>Resistivity</div>
                    <div className="mt-1 font-mono text-zinc-100">
                      {result.predictedProperties.electrical_resistivity_ohm_m.toExponential(2)} Ω·m
                    </div>
                  </div>
                  <div>
                    <div>Cost</div>
                    <div className="mt-1 font-mono text-zinc-100">
                      ${result.predictedProperties.cost_usd_kg.toFixed(2)}/kg
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-surface-800 bg-surface-950 px-4 py-4">
            <div className="text-[10px] uppercase tracking-[0.1em] text-surface-600">
              Nearby Candidates
            </div>
            {result.nearestAnalogs && result.nearestAnalogs.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {result.nearestAnalogs.slice(0, 5).map((material) => (
                  <span
                    key={material.id}
                    className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-brand"
                  >
                    {material.name}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-3 space-y-2">
              {result.alternatives.map((material) => (
                <div
                  key={material.id}
                  className="rounded-xl border border-surface-800 bg-surface-900 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[13px] font-medium text-zinc-100">{material.name}</div>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] ${categoryTone(material.category)}`}
                    >
                      {material.category}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-surface-500">
                    <div>
                      <div>Strength</div>
                      <div className="mt-1 font-mono text-zinc-100">
                        {material.tensile_strength_mpa}
                      </div>
                    </div>
                    <div>
                      <div>Temp</div>
                      <div className="mt-1 font-mono text-zinc-100">
                        {material.max_service_temp_c}°C
                      </div>
                    </div>
                    <div>
                      <div>Cost</div>
                      <div className="mt-1 font-mono text-zinc-100">
                        {formatNullable(material.cost_usd_kg, { digits: 0, prefix: "$" })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {result.alternatives.length === 0 ? (
                <div className="rounded-xl border border-dashed border-surface-800 px-3 py-4 text-[12px] text-surface-500">
                  No additional close analogues were found for this formula.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
