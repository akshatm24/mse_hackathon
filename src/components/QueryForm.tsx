"use client";

import { ChevronDown, Loader2, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { normalisePriorityWeights } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { UserConstraints } from "@/types";

interface QueryFormProps {
  llmEnabled: boolean;
  loading: boolean;
  onSubmit: (payload: { query: string; manualConstraints: UserConstraints }) => void;
}

type WeightKey = keyof UserConstraints["priorityWeights"];
type WeightDraft = Record<WeightKey, number>;

const INITIAL_WEIGHTS: WeightDraft = {
  strength: 20,
  thermal: 20,
  weight: 20,
  cost: 20,
  corrosion: 20
};

const MINI_BAR_COLOURS: Record<WeightKey, string> = {
  strength: "bg-sky-400",
  thermal: "bg-amber-400",
  weight: "bg-emerald-400",
  cost: "bg-cyan-400",
  corrosion: "bg-rose-400"
};

function hasManualFilters(
  numericValues: string[],
  flags: Array<boolean>
): boolean {
  return numericValues.some((value) => value.trim() !== "") || flags.some(Boolean);
}

export default function QueryForm({ llmEnabled, loading, onSubmit }: QueryFormProps): JSX.Element {
  const [query, setQuery] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [maxTemperature, setMaxTemperature] = useState("");
  const [minTensile, setMinTensile] = useState("");
  const [maxDensity, setMaxDensity] = useState("");
  const [maxCost, setMaxCost] = useState("");
  const [corrosionRequired, setCorrosionRequired] = useState<"" | "excellent" | "good" | "fair">("");
  const [needsFDMPrintability, setNeedsFDMPrintability] = useState(false);
  const [electricallyConductive, setElectricallyConductive] = useState(false);
  const [thermallyConductive, setThermallyConductive] = useState(false);
  const [rawWeights, setRawWeights] = useState<WeightDraft>(INITIAL_WEIGHTS);

  const normalisedWeights = useMemo(
    () => normalisePriorityWeights(rawWeights),
    [rawWeights]
  );

  const canSubmit =
    query.trim().length > 0 ||
    hasManualFilters(
      [maxTemperature, minTensile, maxDensity, maxCost, corrosionRequired],
      [needsFDMPrintability, electricallyConductive, thermallyConductive]
    );

  function handleWeightChange(key: WeightKey, nextValue: number): void {
    setRawWeights((current) => ({
      ...current,
      [key]: nextValue
    }));
  }

  function parseNumber(value: string): number | undefined {
    if (value.trim() === "") {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!canSubmit || loading) {
      return;
    }

    onSubmit({
      query: query.trim(),
      manualConstraints: {
        rawQuery: query.trim(),
        maxTemperature_c: parseNumber(maxTemperature),
        minTensileStrength_mpa: parseNumber(minTensile),
        maxDensity_g_cm3: parseNumber(maxDensity),
        maxCost_usd_kg: parseNumber(maxCost),
        corrosionRequired: corrosionRequired || undefined,
        electricallyConductive,
        thermallyConductive,
        needsFDMPrintability,
        priorityWeights: normalisedWeights
      }
    });
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-6 shadow-glow sm:p-8">
      <div className="absolute inset-0 surface-grid opacity-20" aria-hidden="true" />
      <div className="relative space-y-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.32em] text-amber-400">Engineering Search Workspace</p>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-100 sm:text-5xl">
              Find the right material. Fast.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Describe the thermal, structural, manufacturing, and cost envelope in plain language, then steer the ranking with explicit filters when you want hard control.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!llmEnabled ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              LLM features disabled. Enter constraints manually below.
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-400">
              Manual filters override inferred values whenever you specify them, so you can combine natural language with exact engineering limits.
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="problem-query" className="text-xs uppercase tracking-wide text-zinc-500">
              Problem Description
            </label>
            <textarea
              id="problem-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Our robotics team needs a lightweight bracket for a high-torque motor, 3D printed, must survive 85°C continuous heat, resist corrosion from humid workshops, and stay under $30/kg if possible."
              className="min-h-[120px] w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60">
            <button
              type="button"
              onClick={() => setAdvancedOpen((current) => !current)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              aria-expanded={advancedOpen}
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-100">
                <SlidersHorizontal className="h-4 w-4 text-amber-400" />
                Advanced Filters
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-zinc-400 transition-transform",
                  advancedOpen ? "rotate-180" : "rotate-0"
                )}
              />
            </button>

            {advancedOpen ? (
              <div className="space-y-6 border-t border-zinc-800 px-4 py-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2 text-xs uppercase tracking-wide text-zinc-500">
                    Max Temp (°C)
                    <input
                      value={maxTemperature}
                      onChange={(event) => setMaxTemperature(event.target.value)}
                      inputMode="decimal"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </label>
                  <label className="space-y-2 text-xs uppercase tracking-wide text-zinc-500">
                    Min Tensile (MPa)
                    <input
                      value={minTensile}
                      onChange={(event) => setMinTensile(event.target.value)}
                      inputMode="decimal"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </label>
                  <label className="space-y-2 text-xs uppercase tracking-wide text-zinc-500">
                    Max Density (g/cm³)
                    <input
                      value={maxDensity}
                      onChange={(event) => setMaxDensity(event.target.value)}
                      inputMode="decimal"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </label>
                  <label className="space-y-2 text-xs uppercase tracking-wide text-zinc-500">
                    Max Cost ($/kg)
                    <input
                      value={maxCost}
                      onChange={(event) => setMaxCost(event.target.value)}
                      inputMode="decimal"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2 text-xs uppercase tracking-wide text-zinc-500">
                    Corrosion Requirement
                    <select
                      value={corrosionRequired}
                      onChange={(event) =>
                        setCorrosionRequired(event.target.value as "" | "excellent" | "good" | "fair")
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">No minimum</option>
                      <option value="fair">Fair</option>
                      <option value="good">Good</option>
                      <option value="excellent">Excellent</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    {
                      label: "Needs FDM Printability",
                      checked: needsFDMPrintability,
                      onChange: setNeedsFDMPrintability
                    },
                    {
                      label: "Electrically Conductive",
                      checked: electricallyConductive,
                      onChange: setElectricallyConductive
                    },
                    {
                      label: "Thermally Conductive",
                      checked: thermallyConductive,
                      onChange: setThermallyConductive
                    }
                  ].map((toggle) => (
                    <label
                      key={toggle.label}
                      className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-sm text-zinc-300"
                    >
                      <span>{toggle.label}</span>
                      <input
                        type="checkbox"
                        checked={toggle.checked}
                        onChange={(event) => toggle.onChange(event.target.checked)}
                        className="range-accent h-4 w-4 rounded border-zinc-600 bg-zinc-900"
                      />
                    </label>
                  ))}
                </div>

                <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Priority Weights</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      Adjust the sliders to bias the ranking. They auto-normalise to sum to 100%.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {(Object.keys(rawWeights) as WeightKey[]).map((key) => (
                      <div key={key} className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-500">
                          <span>{key}</span>
                          <span className="font-mono text-amber-400">
                            {Math.round(normalisedWeights[key] * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={rawWeights[key]}
                          onChange={(event) => handleWeightChange(key, Number(event.target.value))}
                          className="range-accent"
                        />
                        <div className="h-1.5 rounded-full bg-zinc-700">
                          <div
                            className={cn(
                              "h-1.5 rounded-full transition-[width] duration-700 ease-out",
                              MINI_BAR_COLOURS[key]
                            )}
                            style={{ width: `${Math.round(normalisedWeights[key] * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500">
              {llmEnabled
                ? "Gemini extracts constraints, then a deterministic scoring engine ranks the database."
                : "Offline mode uses only your manual constraints and the local scoring engine."}
            </p>
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 font-semibold text-zinc-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Find Materials
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
