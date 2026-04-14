"use client";

import type { RankedMaterial, UserConstraints } from "@/types";

interface ScoreBreakdownProps {
  material: RankedMaterial;
  weights: UserConstraints["priorityWeights"];
}

export default function ScoreBreakdown({
  material,
  weights
}: ScoreBreakdownProps) {
  if (!material.normalizedScores) {
    return null;
  }

  const rows = [
    { label: "Thermal", weight: weights.thermal, normalized: material.normalizedScores.thermal },
    { label: "Strength", weight: weights.strength, normalized: material.normalizedScores.strength },
    { label: "Weight", weight: weights.weight, normalized: material.normalizedScores.weight },
    { label: "Cost", weight: weights.cost, normalized: material.normalizedScores.cost },
    { label: "Corrosion", weight: weights.corrosion, normalized: material.normalizedScores.corrosion }
  ];

  return (
    <div className="mt-3 rounded-md border border-surface-800 bg-[#0C0A09] px-2 py-2">
      <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-surface-600">
        Score Breakdown
      </div>
      <div className="mt-2 space-y-1 text-[11px] font-mono">
        {rows.map((row) => {
          const contribution = row.weight * row.normalized * 100;
          const percent = Math.round(row.normalized * 100);

          return (
            <div key={row.label} className="flex items-center gap-2">
              <span className="w-16 text-surface-500">{row.label}</span>
              <div className="h-2 flex-1 rounded bg-surface-800">
                <div
                  className="h-2 rounded bg-sky-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-14 text-right text-surface-300">
                {contribution.toFixed(1)} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
