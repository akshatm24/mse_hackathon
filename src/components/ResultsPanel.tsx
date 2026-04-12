"use client";

import { LayoutGrid, Rows3 } from "lucide-react";
import { useEffect, useState } from "react";

import ChatInterface from "@/components/ChatInterface";
import ComparisonTable from "@/components/ComparisonTable";
import MaterialCard from "@/components/MaterialCard";
import PropertyRadarChart from "@/components/PropertyRadarChart";
import { RecommendResponse } from "@/types";

interface ResultsPanelProps {
  data: RecommendResponse;
  query?: string;
  searchDurationMs?: number;
}

export default function ResultsPanel({
  data,
  query,
  searchDurationMs
}: ResultsPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView] = useState<"grid" | "table">("grid");

  useEffect(() => {
    setShowAll(false);
    setSelectedIds([]);
  }, [data]);

  const visibleMaterials = showAll ? data.rankedMaterials : data.rankedMaterials.slice(0, 5);
  const selectedMaterials = data.rankedMaterials.filter((item) => selectedIds.includes(item.id));
  const countLabel = data.matchCount ?? data.rankedMaterials.length;

  function toggleMaterial(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((entry) => entry !== id);
      }
      if (current.length >= 4) {
        return current;
      }
      return [...current, id];
    });
  }

  return (
    <section className="fade-slide-up space-y-6">
      <div className="mx-auto max-w-[780px] rounded-r-xl border border-surface-800 border-l-brand bg-surface-900 px-4 py-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full bg-brand"
              style={{ animation: "pulse 2s ease-in-out infinite" }}
            />
            <span className="text-[10px] font-semibold tracking-[0.08em] text-brand">
              GEMINI ANALYSIS
            </span>
          </div>
          <span className="rounded bg-surface-800 px-2 py-0.5 font-mono text-[9px] text-surface-600">
            gemini-2.0-flash
          </span>
        </div>
        {data.ragMaterials && data.ragMaterials.length > 0 ? (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-surface-500">
            <span>Gemini analysed:</span>
            <span
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-surface-700 text-[10px] text-surface-500"
              title="RAG (Retrieval Augmented Generation) retrieves the most semantically relevant materials from the scored candidates and passes them to Gemini, producing more focused and accurate explanations than sending all results at once."
            >
              i
            </span>
            {data.ragMaterials.map((name) => (
              <span
                key={name}
                className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] text-brand"
              >
                {name}
              </span>
            ))}
          </div>
        ) : null}
        <div className="prose-copy text-[13px] leading-[1.75] text-surface-400">
          {data.llmExplanation.split(/\n\s*\n/).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-[1200px] items-end justify-between gap-4 px-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-surface-600">
            Top Matches
          </div>
          <div className="mt-1 text-[12px] text-zinc-500">
            {countLabel} materials passed filters
            {searchDurationMs ? ` · Found in ${(searchDurationMs / 1000).toFixed(1)}s` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${
              view === "grid"
                ? "border-surface-700 bg-surface-800 text-zinc-100"
                : "border-surface-800 text-surface-600"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${
              view === "table"
                ? "border-surface-700 bg-surface-800 text-zinc-100"
                : "border-surface-800 text-surface-600"
            }`}
          >
            <Rows3 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4">
        <PropertyRadarChart materials={data.rankedMaterials.slice(0, 3)} />
      </div>

      {view === "grid" ? (
        <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 px-4">
          {visibleMaterials.map((material, index) => (
            <MaterialCard
              key={material.id}
              material={material}
              rank={index + 1}
              selected={selectedIds.includes(material.id)}
              compareDisabled={selectedIds.length >= 4}
              onToggle={() => toggleMaterial(material.id)}
              staggerIndex={index}
            />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-[1200px] overflow-x-auto rounded-xl border border-surface-800 bg-surface-900 px-4">
          <table className="min-w-full">
            <thead className="border-b border-surface-800 text-left text-[10px] uppercase tracking-[0.08em] text-surface-600">
              <tr>
                <th className="py-3">Material</th>
                <th className="py-3">Category</th>
                <th className="py-3">Score</th>
                <th className="py-3">Max Temp</th>
                <th className="py-3">Density</th>
                <th className="py-3">Cost</th>
                <th className="py-3">Compare</th>
              </tr>
            </thead>
            <tbody>
              {visibleMaterials.map((material) => (
                <tr key={material.id} className="border-b border-surface-800/60 text-[12px]">
                  <td className="py-3 font-medium text-zinc-100">{material.name}</td>
                  <td className="py-3 text-surface-400">{material.category}</td>
                  <td className="py-3 font-mono text-brand">{material.score}</td>
                  <td className="py-3 font-mono text-surface-400">{material.max_service_temp_c}°C</td>
                  <td className="py-3 font-mono text-surface-400">{material.density_g_cm3.toFixed(2)}</td>
                  <td className="py-3 font-mono text-surface-400">${material.cost_usd_kg.toFixed(2)}</td>
                  <td className="py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(material.id)}
                      onChange={() => toggleMaterial(material.id)}
                      className="h-4 w-4 accent-amber-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.rankedMaterials.length > 5 ? (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="rounded-full border border-surface-800 px-4 py-2 text-[12px] text-surface-400 transition hover:text-zinc-100"
          >
            {showAll ? "Show fewer ↑" : `Show all ${data.rankedMaterials.length} results ↓`}
          </button>
        </div>
      ) : null}

      {selectedMaterials.length >= 2 ? (
        <div className="mx-auto max-w-[1200px] px-4">
          <ComparisonTable materials={selectedMaterials} />
        </div>
      ) : null}

      <ChatInterface
        initialQuery={query ?? data.inferredConstraints.rawQuery}
        initialResults={data.rankedMaterials}
      />
    </section>
  );
}
