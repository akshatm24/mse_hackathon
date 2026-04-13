"use client";

import { useEffect, useState } from "react";
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

import type { Material } from "@/types";

const COLORS: Record<string, string> = {
  Metal: "#60A5FA",
  Polymer: "#34D399",
  Ceramic: "#F87171",
  Composite: "#FBBF24",
  Solder: "#A78BFA"
};

export default function AshbyPlot() {
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const response = await fetch("/api/materials?scope=engineering");
      const payload = (await response.json()) as { materials?: Material[] };
      if (active) {
        setMaterials(payload.materials ?? []);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const byCategory = materials
    .filter((material) => material.density_g_cm3 != null && material.tensile_strength_mpa != null)
    .reduce<Record<string, Array<{ x: number; y: number; name: string }>>>((acc, material) => {
      const key = material.category;
      acc[key] ??= [];
      acc[key].push({
        x: material.density_g_cm3 as number,
        y: material.tensile_strength_mpa as number,
        name: material.name
      });
      return acc;
    }, {});

  return (
    <div className="w-full rounded-2xl border border-surface-800 bg-surface-900 p-4">
      <h2 className="mb-2 text-sm font-semibold text-white">
        Ashby Plot — Strength vs Density
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
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
            >
              <Label
                value="Density (g/cm³)"
                position="insideBottom"
                offset={-15}
                fill="#9CA3AF"
                fontSize={12}
              />
            </XAxis>
            <YAxis
              dataKey="y"
              type="number"
              name="Tensile Strength"
              unit=" MPa"
              domain={[0, "auto"]}
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
            >
              <Label
                value="Tensile Strength (MPa)"
                angle={-90}
                position="insideLeft"
                fill="#9CA3AF"
                fontSize={12}
              />
            </YAxis>
            <ZAxis range={[30, 30]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "none",
                borderRadius: 8
              }}
              labelStyle={{ color: "#F3F4F6" }}
              formatter={(value, name) => [
                name === "Density" ? `${value} g/cm³` : `${value} MPa`,
                name
              ]}
            />
            <Legend wrapperStyle={{ color: "#D1D5DB", fontSize: 12 }} />
            {Object.entries(byCategory).map(([category, materials]) => (
              <Scatter
                key={category}
                name={category}
                data={materials}
                fill={COLORS[category] ?? "#94A3B8"}
                opacity={0.75}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
