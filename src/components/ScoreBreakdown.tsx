"use client";

interface Props {
  weights: {
    thermal: number;
    strength: number;
    weight: number;
    cost: number;
    corrosion: number;
  };
  normalized: {
    thermal: number;
    strength: number;
    weight: number;
    cost: number;
    corrosion: number;
  };
}

export default function ScoreBreakdown({ weights, normalized }: Props) {
  const rows = [
    { label: "Thermal", w: weights.thermal, n: normalized.thermal },
    { label: "Strength", w: weights.strength, n: normalized.strength },
    { label: "Weight", w: weights.weight, n: normalized.weight },
    { label: "Cost", w: weights.cost, n: normalized.cost },
    { label: "Corrosion", w: weights.corrosion, n: normalized.corrosion }
  ];

  return (
    <div className="mt-2 space-y-1 text-xs font-mono">
      {rows.map((row) => {
        const contribution = row.w * row.n * 100;
        const pct = Math.round(row.n * 100);

        return (
          <div key={row.label} className="flex items-center gap-2">
            <span className="w-16 text-surface-500">{row.label}</span>
            <div className="h-2 flex-1 rounded bg-surface-800">
              <div className="h-2 rounded bg-blue-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-14 text-right text-surface-300">
              {contribution.toFixed(1)} pts
            </span>
          </div>
        );
      })}
    </div>
  );
}
