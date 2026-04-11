"use client";

import { FlaskConical, Sparkles } from "lucide-react";
import { useState } from "react";

import { NovelMaterialPrediction } from "@/types";

const examples = ["Fe70Ni30", "NiTi", "CuZn", "TiAl", "Al2O3"];

function categoryTone(category: NovelMaterialPrediction["predictedCategory"]) {
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

function confidenceTone(confidence: number) {
  if (confidence >= 80) {
    return "text-emerald-400";
  }
  if (confidence >= 65) {
    return "text-amber-300";
  }
  return "text-rose-400";
}

export default function NovelAlloyPredictor() {
  const [composition, setComposition] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState<NovelMaterialPrediction | null>(null);

  async function runPrediction(nextComposition?: string) {
    const trimmed = (nextComposition ?? composition).trim();

    if (!trimmed || loading) {
      return;
    }

    setComposition(trimmed);
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/predict-alloy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ composition: trimmed })
      });

      const data = (await response.json()) as NovelMaterialPrediction & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to predict this composition right now.");
      }

      setPrediction(data);
    } catch (nextError) {
      setPrediction(null);
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to predict this composition right now."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="predictor" className="space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.12em] text-surface-600">
          Brownie Point 2
        </div>
        <h2 className="mt-1 text-[20px] font-semibold text-zinc-100">Predict Novel Alloy</h2>
        <p className="mt-1 max-w-[760px] text-[13px] leading-[1.7] text-zinc-500">
          Estimate screening-level properties for a composition that is not already in the
          database. The model parses the composition, compares it to nearby known chemistries,
          and returns predicted properties plus the closest analog materials.
        </p>
      </div>

      <div className="rounded-2xl border border-surface-800 bg-surface-900 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex-1 space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
              Composition
            </span>
            <input
              value={composition}
              onChange={(event) => setComposition(event.target.value)}
              placeholder="Fe70Ni30 or NiTi or Al2O3"
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-[13px] text-zinc-100 outline-none transition focus:border-amber-500/40"
            />
          </label>
          <button
            type="button"
            onClick={() => void runPrediction()}
            disabled={!composition.trim() || loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-[12px] font-semibold text-brand-subtle transition hover:bg-amber-400 disabled:bg-surface-800 disabled:text-surface-700"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            {loading ? "Predicting..." : "Predict"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => void runPrediction(example)}
              className="rounded-full border border-surface-700 bg-surface-800 px-3 py-1.5 text-[11px] text-surface-400 transition hover:border-surface-600 hover:text-zinc-100"
            >
              {example}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] leading-[1.6] text-amber-100/90">
          Screening guidance only: use these predictions to shortlist candidate chemistries,
          then confirm experimentally or with higher-fidelity simulation.
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[12px] text-rose-200">
          {error}
        </div>
      ) : null}

      {prediction ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-surface-800 bg-surface-900 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.08em] text-surface-600">
                  Predicted Composition
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[18px] font-semibold text-zinc-100">
                    {prediction.inputComposition}
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${categoryTone(
                      prediction.predictedCategory
                    )}`}
                  >
                    {prediction.predictedCategory}
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-surface-500">
                  Normalized as {prediction.normalizedFormula}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.08em] text-surface-600">
                  Model Confidence
                </div>
                <div className={`mt-1 text-[22px] font-semibold ${confidenceTone(prediction.confidence)}`}>
                  {prediction.confidence}%
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {prediction.parsedComposition.map((component) => (
                <span
                  key={component.element}
                  className="rounded-full border border-surface-700 bg-surface-800 px-2.5 py-1 text-[11px] text-surface-300"
                >
                  {component.element} {Math.round(component.fraction * 100)} at.%
                </span>
              ))}
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-3">
              {[
                ["Density", `${prediction.predictedProperties.density_g_cm3.toFixed(2)} g/cm³`],
                ["Tensile Strength", `${prediction.predictedProperties.tensile_strength_mpa} MPa`],
                ["Elastic Modulus", `${prediction.predictedProperties.elastic_modulus_gpa.toFixed(1)} GPa`],
                [
                  "Thermal Conductivity",
                  `${prediction.predictedProperties.thermal_conductivity_w_mk.toFixed(1)} W/m·K`
                ],
                [
                  "Max Service Temp",
                  `${prediction.predictedProperties.max_service_temp_c}°C`
                ],
                [
                  "Electrical Resistivity",
                  `${prediction.predictedProperties.electrical_resistivity_ohm_m.toExponential(2)} Ω·m`
                ],
                ["Corrosion", prediction.predictedProperties.corrosion_resistance]
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-surface-800 bg-surface-950 px-3 py-3"
                >
                  <div className="text-[10px] uppercase tracking-[0.08em] text-surface-600">
                    {label}
                  </div>
                  <div className="mt-1 text-[14px] font-medium text-zinc-100">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-surface-800 bg-surface-900 p-4">
              <div className="flex items-center gap-2 text-[12px] text-surface-400">
                <Sparkles className="h-4 w-4 text-brand" />
                <span>Prediction Notes</span>
              </div>
              <p className="mt-3 text-[13px] leading-[1.75] text-surface-300">
                {prediction.explanation}
              </p>
            </div>

            <div className="rounded-2xl border border-surface-800 bg-surface-900 p-4">
              <div className="text-[12px] text-surface-400">Nearest Known Analogs</div>
              <div className="mt-3 space-y-2">
                {prediction.nearestAnalogs.map((analog) => (
                  <div
                    key={`${analog.formula}-${analog.name}`}
                    className="rounded-xl border border-surface-800 bg-surface-950 px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[13px] font-medium text-zinc-100">{analog.formula}</div>
                        <div className="mt-1 text-[11px] text-surface-500">{analog.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-[0.08em] text-surface-600">
                          Similarity
                        </div>
                        <div className="mt-1 text-[13px] font-medium text-brand">
                          {Math.round(analog.similarity * 100)}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-surface-600">{analog.source}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

