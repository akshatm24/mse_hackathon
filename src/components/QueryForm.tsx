"use client";

import { useMemo, useState } from "react";

type WeightKey = "strength" | "thermal" | "weight" | "cost" | "corrosion";

interface QueryFormProps {
  onSubmit: (query: string, manualConstraints?: object) => void;
  loading: boolean;
  apiAvailable: boolean;
}

const propertyMeta: Array<{
  key: WeightKey;
  label: string;
  color: string;
}> = [
  { key: "strength", label: "Strength", color: "#34D399" },
  { key: "thermal", label: "Thermal", color: "#F59E0B" },
  { key: "weight", label: "Weight", color: "#38BDF8" },
  { key: "cost", label: "Cost", color: "#A78BFA" },
  { key: "corrosion", label: "Corrosion", color: "#FB7185" }
];

const placeholder = `Describe your engineering problem... e.g. 'We're building a
4-point probe for sintered copper-cobalt pellets. The tip
needs to be hard, conductive, and survive 200°C cycling.'`;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toPercent(value: number) {
  return Math.round(value * 100);
}

export default function QueryForm({
  onSubmit,
  loading,
  apiAvailable
}: QueryFormProps) {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [openWeight, setOpenWeight] = useState<WeightKey | null>(null);
  const [weights, setWeights] = useState<Record<WeightKey, number>>({
    strength: 0.3,
    thermal: 0.15,
    weight: 0.15,
    cost: 0.3,
    corrosion: 0.1
  });
  const [maxTemp, setMaxTemp] = useState("");
  const [minTensile, setMinTensile] = useState("");
  const [maxDensity, setMaxDensity] = useState("");
  const [maxCost, setMaxCost] = useState("");
  const [needsFDM, setNeedsFDM] = useState(false);

  const filterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    if (maxTemp) {
      chips.push({ key: "maxTemp", label: `Max temp ${maxTemp}°C` });
    }
    if (minTensile) {
      chips.push({ key: "minTensile", label: `Min tensile ${minTensile} MPa` });
    }
    if (maxDensity) {
      chips.push({ key: "maxDensity", label: `Max density ${maxDensity} g/cm³` });
    }
    if (maxCost) {
      chips.push({ key: "maxCost", label: `Max cost $${maxCost}/kg` });
    }
    if (needsFDM) {
      chips.push({ key: "needsFDM", label: "FDM printable" });
    }
    return chips;
  }, [maxCost, maxDensity, maxTemp, minTensile, needsFDM]);

  function removeChip(key: string) {
    if (key === "maxTemp") {
      setMaxTemp("");
    }
    if (key === "minTensile") {
      setMinTensile("");
    }
    if (key === "maxDensity") {
      setMaxDensity("");
    }
    if (key === "maxCost") {
      setMaxCost("");
    }
    if (key === "needsFDM") {
      setNeedsFDM(false);
    }
  }

  function normalise(nextWeights: Record<WeightKey, number>) {
    const total = Object.values(nextWeights).reduce((sum, value) => sum + value, 0);
    return Object.fromEntries(
      Object.entries(nextWeights).map(([key, value]) => [key, value / total])
    ) as Record<WeightKey, number>;
  }

  function updateWeight(targetKey: WeightKey, nextValue: number) {
    setWeights((current) => {
      const clamped = clamp(nextValue, 0.05, 0.8);
      const otherKeys = propertyMeta
        .map((item) => item.key)
        .filter((key) => key !== targetKey);
      const remaining = 1 - clamped;
      const currentOtherTotal = otherKeys.reduce((sum, key) => sum + current[key], 0);

      const nextWeights = { ...current, [targetKey]: clamped };

      otherKeys.forEach((key) => {
        nextWeights[key] =
          currentOtherTotal === 0
            ? remaining / otherKeys.length
            : (current[key] / currentOtherTotal) * remaining;
      });

      return normalise(nextWeights);
    });
  }

  function parseNumber(value: string) {
    if (!value.trim()) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function handleSubmit() {
    const trimmed = query.trim();
    const hasManual =
      maxTemp || minTensile || maxDensity || maxCost || needsFDM;

    if ((!trimmed && !hasManual) || loading) {
      return;
    }

    onSubmit(trimmed, {
      rawQuery: trimmed,
      maxTemperature_c: parseNumber(maxTemp),
      minTensileStrength_mpa: parseNumber(minTensile),
      maxDensity_g_cm3: parseNumber(maxDensity),
      maxCost_usd_kg: parseNumber(maxCost),
      needsFDMPrintability: needsFDM || undefined,
      priorityWeights: weights
    });
  }

  return (
    <div className="mx-auto max-w-[780px] px-4">
      {!apiAvailable ? (
        <div className="mb-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[12px] text-amber-200">
          Gemini is unavailable right now, so the app will use local heuristic extraction
          and deterministic scoring only.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-surface-800 bg-surface-900 transition-all duration-200 focus-within:border-amber-500/40 focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.08)]">
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={placeholder}
          className="min-h-[88px] w-full resize-none bg-transparent px-[18px] py-4 text-[14px] leading-[1.7] text-surface-200 outline-none placeholder:text-surface-700"
        />

        {filterChips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 px-[18px] pb-[10px]">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => removeChip(chip.key)}
                className="chip-pop inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-brand"
              >
                {chip.label}
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="border-t border-surface-800 px-[18px] py-3">
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
              Advanced Filters
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="#71717A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {showFilters ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {[
                {
                  id: "maxTemp",
                  label: "Max Temp (°C)",
                  value: maxTemp,
                  setValue: setMaxTemp
                },
                {
                  id: "minTensile",
                  label: "Min Tensile (MPa)",
                  value: minTensile,
                  setValue: setMinTensile
                },
                {
                  id: "maxDensity",
                  label: "Max Density (g/cm³)",
                  value: maxDensity,
                  setValue: setMaxDensity
                },
                {
                  id: "maxCost",
                  label: "Max Cost ($/kg)",
                  value: maxCost,
                  setValue: setMaxCost
                }
              ].map((field) => (
                <label key={field.id} className="space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                    {field.label}
                  </span>
                  <input
                    value={field.value}
                    onChange={(event) => field.setValue(event.target.value)}
                    className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-[12px] text-surface-200 outline-none transition focus:border-amber-500/40"
                  />
                </label>
              ))}

              <label className="mt-1 flex items-center justify-between rounded-lg border border-surface-700 bg-surface-800 px-3 py-2">
                <span className="text-[11px] text-surface-400">Needs FDM Printability</span>
                <input
                  type="checkbox"
                  checked={needsFDM}
                  onChange={(event) => setNeedsFDM(event.target.checked)}
                  className="h-4 w-4 accent-amber-500"
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="border-t border-surface-800 px-[18px] py-3">
          <div className="flex items-start gap-3">
            <span className="pt-1 text-[11px] text-surface-600">Weights:</span>
            <div className="grid flex-1 gap-3 md:grid-cols-5">
              {propertyMeta.map((item) => (
                <div key={item.key} className="relative flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenWeight((current) => (current === item.key ? null : item.key))
                    }
                    className="text-[9px] uppercase tracking-[0.08em]"
                    style={{ color: item.color }}
                  >
                    {item.label}
                  </button>
                  <div className="h-[2px] w-full rounded-full bg-surface-800">
                    <div
                      className="h-[2px] rounded-full transition-[width] duration-300"
                      style={{
                        backgroundColor: item.color,
                        width: `${toPercent(weights[item.key])}%`
                      }}
                    />
                  </div>
                  <span className="font-mono text-[9px]" style={{ color: item.color }}>
                    {toPercent(weights[item.key])}%
                  </span>

                  {openWeight === item.key ? (
                    <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-xl border border-surface-700 bg-surface-900 p-3 shadow-xl">
                      <input
                        type="range"
                        min={5}
                        max={80}
                        value={toPercent(weights[item.key])}
                        onChange={(event) =>
                          updateWeight(item.key, Number(event.target.value) / 100)
                        }
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-surface-800 px-[18px] py-[10px]">
          <span className="text-[10px] text-zinc-600">⌘ Enter to search</span>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-[12px] font-bold text-brand-subtle transition hover:bg-amber-400 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg
                  className="h-3.5 w-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeOpacity="0.25"
                    strokeWidth="3"
                  />
                  <path
                    d="M22 12a10 10 0 0 1-10 10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
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
