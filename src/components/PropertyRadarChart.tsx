"use client";

import { ResponsiveContainer, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";

import { materialsDB } from "@/lib/materials-db";
import { CORROSION_RANKS, QUALITY_RANKS } from "@/lib/scoring";
import { RankedMaterial } from "@/types";

interface PropertyRadarChartProps {
  materials: RankedMaterial[];
}

const SERIES = [
  { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.22)" },
  { stroke: "#38bdf8", fill: "rgba(56, 189, 248, 0.18)" },
  { stroke: "#34d399", fill: "rgba(52, 211, 153, 0.18)" }
];

function normalise(value: number, maxValue: number): number {
  if (maxValue <= 0) {
    return 0;
  }

  return Number(((value / maxValue) * 100).toFixed(1));
}

export default function PropertyRadarChart({ materials }: PropertyRadarChartProps): JSX.Element | null {
  const topMaterials = materials.slice(0, 3);

  if (topMaterials.length === 0) {
    return null;
  }

  const maxTensile = Math.max(...materialsDB.map((material) => material.tensile_strength_mpa));
  const maxServiceTemp = Math.max(...materialsDB.map((material) => material.max_service_temp_c));
  const maxDensity = Math.max(...materialsDB.map((material) => material.density_g_cm3));
  const maxCost = Math.max(...materialsDB.map((material) => material.cost_usd_kg));

  const axes = [
    {
      key: "Strength",
      value: (material: RankedMaterial) => normalise(material.tensile_strength_mpa, maxTensile)
    },
    {
      key: "Thermal",
      value: (material: RankedMaterial) => normalise(material.max_service_temp_c, maxServiceTemp)
    },
    {
      key: "Lightness",
      value: (material: RankedMaterial) => normalise(maxDensity - material.density_g_cm3, maxDensity)
    },
    {
      key: "Cost Efficiency",
      value: (material: RankedMaterial) => normalise(maxCost - material.cost_usd_kg, maxCost)
    },
    {
      key: "Corrosion",
      value: (material: RankedMaterial) => CORROSION_RANKS[material.corrosion_resistance] * 25
    },
    {
      key: "Printability",
      value: (material: RankedMaterial) => QUALITY_RANKS[material.printability_fdm] * 25
    }
  ];

  const data = axes.map((axis) => {
    return topMaterials.reduce<Record<string, number | string>>(
      (entry, material) => {
        entry[material.name] = axis.value(material);
        return entry;
      },
      { subject: axis.key }
    );
  });

  return (
    <section className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Property Radar</p>
        <h3 className="mt-2 text-lg font-medium text-zinc-100">Top 3 comparison across core decision axes</h3>
      </div>
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="#52525b" strokeDasharray="3 3" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
            {topMaterials.map((material, index) => (
              <Radar
                key={material.id}
                dataKey={material.name}
                stroke={SERIES[index]?.stroke ?? SERIES[0].stroke}
                fill={SERIES[index]?.fill ?? SERIES[0].fill}
                fillOpacity={1}
                strokeWidth={2}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-300">
        {topMaterials.map((material, index) => (
          <div key={material.id} className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: SERIES[index]?.stroke ?? SERIES[0].stroke }}
            />
            {material.name}
          </div>
        ))}
      </div>
    </section>
  );
}
