"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer
} from "recharts";

import { formatNullable } from "@/lib/material-display";
import { RankedMaterial } from "@/types";

interface PropertyRadarChartProps {
  materials: RankedMaterial[];
}

const series = [
  { stroke: "#F59E0B", fill: "rgba(245,158,11,0.15)" },
  { stroke: "#38BDF8", fill: "rgba(56,189,248,0.10)" },
  { stroke: "#34D399", fill: "rgba(52,211,153,0.10)" }
];

const corrosionRanks = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1
} as const;

const printabilityRanks = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1,
  "n/a": 0
} as const;

function normalise(value: number | null | undefined, maxValue: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  if (maxValue === 0) {
    return 100;
  }
  if (maxValue <= 0) {
    return 0;
  }
  return Number(((value / maxValue) * 100).toFixed(1));
}

export default function PropertyRadarChart({
  materials
}: PropertyRadarChartProps) {
  const topThree = materials.slice(0, 3);

  if (topThree.length === 0) {
    return null;
  }

  const maxStrength = Math.max(...topThree.map((item) => item.tensile_strength_mpa ?? 0), 1500);
  const maxThermal = Math.max(...topThree.map((item) => item.max_service_temp_c ?? 0), 1200);
  const maxDensity = Math.max(...topThree.map((item) => item.density_g_cm3 ?? 0), 10);
  const maxCost = Math.max(...topThree.map((item) => item.cost_usd_kg ?? 0), 300);

  const chartData = [
    {
      axis: "Strength",
      ...Object.fromEntries(
        topThree.map((item) => [item.name, normalise(item.tensile_strength_mpa, maxStrength)])
      )
    },
    {
      axis: "Thermal",
      ...Object.fromEntries(
        topThree.map((item) => [item.name, normalise(item.max_service_temp_c, maxThermal)])
      )
    },
    {
      axis: "Lightness",
      ...Object.fromEntries(
        topThree.map((item) => [
          item.name,
          typeof item.density_g_cm3 === "number"
            ? normalise(maxDensity - item.density_g_cm3, maxDensity)
            : 0
        ])
      )
    },
    {
      axis: "Cost Efficiency",
      ...Object.fromEntries(
        topThree.map((item) => [
          item.name,
          typeof item.cost_usd_kg === "number" ? normalise(maxCost - item.cost_usd_kg, maxCost) : 0
        ])
      )
    },
    {
      axis: "Corrosion",
      ...Object.fromEntries(
        topThree.map((item) => [item.name, (item.corrosion_resistance ? corrosionRanks[item.corrosion_resistance] : 0) * 25])
      )
    },
    {
      axis: "Printability",
      ...Object.fromEntries(
        topThree.map((item) => [item.name, printabilityRanks[item.printability_fdm] * 25])
      )
    }
  ];

  return (
    <section className="rounded-xl border border-surface-800 bg-surface-900 p-4">
      <div className="mb-4">
        <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-surface-600">
          Multiaxis Comparison
        </div>
        <h3 className="mt-1 text-[20px] font-semibold text-zinc-100">
          Top 3 property profile
        </h3>
      </div>
      <div className="hidden sm:block">
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="#27272A" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "#71717A", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#3F3F46", fontSize: 9 }}
            />
            {topThree.map((item, index) => (
              <Radar
                key={item.id}
                name={item.name}
                dataKey={item.name}
                stroke={series[index].stroke}
                fill={series[index].fill}
                fillOpacity={1}
                strokeWidth={1.5}
              />
            ))}
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ color: "#A1A1AA", fontSize: "11px", paddingTop: "12px" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="sm:hidden">
        <div className="mt-2 space-y-2">
          {topThree.map((item, index) => (
            <div
              key={item.id}
              className="rounded-lg border border-surface-800 bg-surface-950 px-3 py-2"
            >
              <div className="flex items-center gap-2 text-[12px] font-medium text-zinc-100">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: series[index].stroke }}
                />
                {item.name}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-surface-500">
                <div>Strength: {formatNullable(item.tensile_strength_mpa, { suffix: " MPa" })}</div>
                <div>Thermal: {formatNullable(item.max_service_temp_c, { suffix: "°C" })}</div>
                <div>Density: {formatNullable(item.density_g_cm3, { digits: 2, suffix: " g/cm³" })}</div>
                <div>Cost: {formatNullable(item.cost_usd_kg, { digits: 2, prefix: "$", suffix: "/kg" })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
