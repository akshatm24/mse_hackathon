"use client";

import {
  Label,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from "recharts";

import { ENGINEERING_MATERIALS } from "@/data";

const COLORS: Record<string, string> = {
  Metal: "#60a5fa",
  Polymer: "#34d399",
  Ceramic: "#f87171",
  Composite: "#fbbf24",
  Solder: "#a78bfa"
};

export default function AshbyPlot() {
  const grouped = ENGINEERING_MATERIALS.filter(
    (material) =>
      material.density_g_cm3 != null && material.tensile_strength_mpa != null
  ).reduce<Record<string, Array<{ x: number; y: number; name: string }>>>(
    (accumulator, material) => {
      const key = material.category;
      accumulator[key] ??= [];
      accumulator[key].push({
        x: material.density_g_cm3 as number,
        y: material.tensile_strength_mpa as number,
        name: material.name
      });
      return accumulator;
    },
    {}
  );

  return (
    <div className="w-full rounded-xl border border-surface-800 bg-surface-900 p-4">
      <h2 className="mb-2 text-sm font-semibold text-white">
        Ashby Plot - Strength vs Density
      </h2>
      <div className="h-[480px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 30 }}>
            <XAxis
              dataKey="x"
              type="number"
              name="Density"
              unit=" g/cm³"
              domain={[0, "auto"]}
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
            >
              <Label
                value="Density (g/cm³)"
                position="insideBottom"
                offset={-15}
                fill="#9ca3af"
                fontSize={12}
              />
            </XAxis>
            <YAxis
              dataKey="y"
              type="number"
              name="Tensile Strength"
              unit=" MPa"
              domain={[0, "auto"]}
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
            >
              <Label
                value="Tensile Strength (MPa)"
                angle={-90}
                position="insideLeft"
                fill="#9ca3af"
                fontSize={12}
              />
            </YAxis>
            <ZAxis range={[30, 30]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "none",
                borderRadius: 8
              }}
              labelStyle={{ color: "#f3f4f6" }}
              formatter={(value, name) => {
                const numericValue =
                  typeof value === "number" ? value : Number(value ?? 0);
                return [
                  name === "Density" ? `${numericValue} g/cm³` : `${numericValue} MPa`,
                  String(name)
                ];
              }}
            />
            <Legend wrapperStyle={{ color: "#d1d5db", fontSize: 12 }} />
            {Object.entries(grouped).map(([category, materials]) => (
              <Scatter
                key={category}
                name={category}
                data={materials}
                fill={COLORS[category] ?? "#94a3b8"}
                opacity={0.75}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
