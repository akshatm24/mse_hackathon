"use client";

import { Bot, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ComparisonTable from "@/components/ComparisonTable";
import MaterialCard from "@/components/MaterialCard";
import PropertyRadarChart from "@/components/PropertyRadarChart";
import { cn } from "@/lib/utils";
import { RecommendResponse } from "@/types";

interface ResultsPanelProps {
  results: RecommendResponse;
  selectedIds: string[];
  llmEnabled: boolean;
  onToggleSelect: (id: string) => void;
}

function activeConstraintChips(results: RecommendResponse): string[] {
  const { inferredConstraints } = results;
  const chips: string[] = [];

  if (inferredConstraints.maxTemperature_c !== undefined) {
    chips.push(`Temp >= ${inferredConstraints.maxTemperature_c}°C`);
  }

  if (inferredConstraints.minTensileStrength_mpa !== undefined) {
    chips.push(`Tensile >= ${inferredConstraints.minTensileStrength_mpa} MPa`);
  }

  if (inferredConstraints.maxDensity_g_cm3 !== undefined) {
    chips.push(`Density <= ${inferredConstraints.maxDensity_g_cm3} g/cm³`);
  }

  if (inferredConstraints.maxCost_usd_kg !== undefined) {
    chips.push(`Cost <= $${inferredConstraints.maxCost_usd_kg}/kg`);
  }

  if (inferredConstraints.corrosionRequired) {
    chips.push(`Corrosion >= ${inferredConstraints.corrosionRequired}`);
  }

  if (inferredConstraints.needsFDMPrintability) {
    chips.push("FDM printable");
  }

  if (inferredConstraints.electricallyConductive) {
    chips.push("Electrically conductive");
  }

  if (inferredConstraints.thermallyConductive) {
    chips.push("Thermally conductive");
  }

  return chips;
}

export default function ResultsPanel({
  results,
  selectedIds,
  llmEnabled,
  onToggleSelect
}: ResultsPanelProps): JSX.Element {
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(results.rankedMaterials[0]?.id ?? null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setShowAll(false);
    setExpandedId(results.rankedMaterials[0]?.id ?? null);
    setVisible(false);

    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [results]);

  const constraintChips = useMemo(() => activeConstraintChips(results), [results]);
  const visibleMaterials = showAll ? results.rankedMaterials : results.rankedMaterials.slice(0, 5);
  const selectedMaterials = results.rankedMaterials.filter((material) => selectedIds.includes(material.id));

  if (results.rankedMaterials.length === 0) {
    return (
      <section
        className={cn(
          "space-y-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-6 transition-all duration-500 ease-out",
          visible ? "fade-slide-in" : "fade-slide-ready"
        )}
      >
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <h2 className="text-lg font-medium text-zinc-100">No materials cleared the active hard filters</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">{results.clarifications}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "space-y-6 transition-all duration-500 ease-out",
        visible ? "fade-slide-in" : "fade-slide-ready"
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Recommendation Results</p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-100">
            Top-ranked materials for the current engineering envelope
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">{results.clarifications}</p>
        </div>
        {constraintChips.length > 0 ? (
          <div className="flex flex-wrap gap-2 lg:max-w-xl lg:justify-end">
            {constraintChips.map((chip) => (
              <span key={chip} className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-400">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {llmEnabled ? "LLM Explanation" : "Scoring Explanation"}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
                <Sparkles className="h-3 w-3" />
                {llmEnabled ? "AI-assisted summary" : "Rules-only summary"}
              </span>
            </div>
            <div className="prose-copy mt-3 border-l-4 border-amber-500 pl-4 text-sm leading-relaxed text-zinc-200">
              {results.llmExplanation.split(/\n\s*\n/).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PropertyRadarChart materials={results.rankedMaterials.slice(0, 3)} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Ranked Materials</p>
            <p className="mt-1 text-sm text-zinc-400">
              Select up to four materials to compare them side by side.
            </p>
          </div>
          {results.rankedMaterials.length > 5 ? (
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
              onClick={() => setShowAll((current) => (current ? false : true))}
            >
              {showAll ? "Show top 5" : "Show all 10"}
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleMaterials.map((material, index) => (
            <MaterialCard
              key={material.id}
              material={material}
              rank={index + 1}
              isExpanded={expandedId === material.id}
              isSelected={selectedIds.includes(material.id)}
              disableCompare={selectedIds.length >= 4}
              onToggle={() => setExpandedId((current) => (current === material.id ? null : material.id))}
              onCompareToggle={() => onToggleSelect(material.id)}
            />
          ))}
        </div>
      </div>

      <ComparisonTable selectedMaterials={selectedMaterials} />
    </section>
  );
}
