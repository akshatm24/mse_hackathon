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
  const [composition, setComposition] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PredictorResponse | null>(null);

  const examples = ["Fe70Ni30", "Cu-30Zn", "Ti-6Al-4V-2Sn", "NiCo20Cr20MoTi", "Al-Cu-Mg"];

  async function handlePredict() {
    if (!composition.trim() || loading) {
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
        body: JSON.stringify({ composition: composition.trim() })
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
            Enter a novel composition and the app will estimate screening-level
            behavior from the closest engineering analogues. When Gemini is
            available, it writes a fuller materials-science rationale instead of a
            simple analogue lookup.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] text-brand">
          <Sparkles className="h-3.5 w-3.5" />
          Gemini-enabled screening
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr,auto]">
        <textarea
          value={composition}
          onChange={(event) => setComposition(event.target.value)}
          placeholder="Composition e.g. Fe70Ni30, Cu-30Zn, or Ti-6Al-4V-2Sn"
          rows={4}
          className="rounded-xl border border-surface-800 bg-surface-950 px-4 py-3 text-[13px] leading-relaxed text-zinc-100 outline-none transition focus:border-amber-500/40"
        />
        <button
          type="button"
          onClick={() => void handlePredict()}
          disabled={loading || !composition.trim()}
          className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-[12px] font-bold text-brand-subtle transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-surface-800 disabled:text-surface-600"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : null}
          {loading ? "Predicting..." : "Predict"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setComposition(example)}
            className="rounded-full border border-surface-800 bg-surface-950 px-3 py-1 text-[11px] text-surface-400 transition hover:border-amber-500/30 hover:text-zinc-100"
          >
            {example}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <div className="text-[12px] font-semibold text-zinc-100">Prediction issue</div>
          <div className="mt-1 font-mono text-[11px] text-amber-100">{error}</div>
        </div>
      ) : null}

      {result ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-surface-800 bg-surface-950 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.1em] text-surface-600">
                  Prediction for {result.composition}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                      result.geminiUsed
                        ? "border-amber-500/20 bg-amber-500/10 text-brand"
                        : "border-surface-700 bg-surface-900 text-surface-400"
                    }`}
                  >
                    {result.geminiUsed ? "Powered by Gemini" : "Local estimate"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-[13px] leading-[1.75] text-surface-400">
              {result.prediction.split(/\n\s*\n/).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-surface-800 bg-surface-950 px-4 py-4">
            <div className="text-[10px] uppercase tracking-[0.1em] text-surface-600">
              Closest analogues
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {result.analogues.map((material) => (
                <div
                  key={material.id}
                  className="rounded-xl border border-surface-800 bg-surface-900 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-medium text-zinc-100">{material.name}</div>
                      <div className="mt-1 text-[11px] text-surface-500">
                        {material.subcategory}
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${categoryTone(material.category)}`}
                    >
                      {material.category}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-surface-500">
                    <div>
                      Density
                      <div className="font-mono text-zinc-100">
                        {formatNullable(material.density_g_cm3, {
                          digits: 2,
                          suffix: " g/cm³"
                        })}
                      </div>
                    </div>
                    <div>
                      Tensile
                      <div className="font-mono text-zinc-100">
                        {formatNullable(material.tensile_strength_mpa, { suffix: " MPa" })}
                      </div>
                    </div>
                    <div>
                      Max Temp
                      <div className="font-mono text-zinc-100">
                        {formatNullable(material.max_service_temp_c, { suffix: "°C" })}
                      </div>
                    </div>
                    <div>
                      Cost
                      <div className="font-mono text-zinc-100">
                        {formatNullable(material.cost_usd_kg, {
                          digits: 2,
                          prefix: "$",
                          suffix: "/kg"
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
