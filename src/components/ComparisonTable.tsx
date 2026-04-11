"use client";

import { RankedMaterial } from "@/types";

interface ComparisonTableProps {
  materials: RankedMaterial[];
}

type Row = {
  label: string;
  value: (material: RankedMaterial) => number | null;
  display: (material: RankedMaterial) => string;
  better: "higher" | "lower";
};

const rows: Row[] = [
  {
    label: "Score",
    value: (material) => material.score,
    display: (material) => `${material.score}/100`,
    better: "higher"
  },
  {
    label: "Max Temp (°C)",
    value: (material) => material.max_service_temp_c,
    display: (material) => `${material.max_service_temp_c}°C`,
    better: "higher"
  },
  {
    label: "Density (g/cm³)",
    value: (material) => material.density_g_cm3,
    display: (material) => material.density_g_cm3.toFixed(2),
    better: "lower"
  },
  {
    label: "Tensile (MPa)",
    value: (material) => material.tensile_strength_mpa,
    display: (material) => `${material.tensile_strength_mpa}`,
    better: "higher"
  },
  {
    label: "Yield (MPa)",
    value: (material) => material.yield_strength_mpa,
    display: (material) => `${material.yield_strength_mpa}`,
    better: "higher"
  },
  {
    label: "Modulus (GPa)",
    value: (material) => material.elastic_modulus_gpa,
    display: (material) => material.elastic_modulus_gpa.toFixed(1),
    better: "higher"
  },
  {
    label: "Thermal Cond. (W/m·K)",
    value: (material) => material.thermal_conductivity_w_mk,
    display: (material) => material.thermal_conductivity_w_mk.toFixed(2),
    better: "higher"
  },
  {
    label: "Expansion (ppm/K)",
    value: (material) => material.thermal_expansion_ppm_k,
    display: (material) => material.thermal_expansion_ppm_k.toFixed(1),
    better: "lower"
  },
  {
    label: "Resistivity (Ω·m)",
    value: (material) => material.electrical_resistivity_ohm_m,
    display: (material) => material.electrical_resistivity_ohm_m.toExponential(2),
    better: "lower"
  },
  {
    label: "Cost ($/kg)",
    value: (material) => material.cost_usd_kg,
    display: (material) => material.cost_usd_kg.toFixed(2),
    better: "lower"
  }
];

function categoryTone(category: RankedMaterial["category"]) {
  if (category === "Metal") {
    return "border-blue-800 bg-[#1E3A5F] text-sky-400";
  }
  if (category === "Polymer") {
    return "border-green-800 bg-[#14532D] text-emerald-400";
  }
  if (category === "Ceramic") {
    return "border-violet-900 bg-[#3B1F6E] text-violet-400";
  }
  if (category === "Composite") {
    return "border-orange-900 bg-[#44240C] text-orange-400";
  }
  return "border-rose-900 bg-[#3B1111] text-rose-400";
}

function toneForRow(row: Row, material: RankedMaterial, materials: RankedMaterial[]) {
  const values = materials
    .map((item) => row.value(item))
    .filter((value): value is number => value !== null);
  const current = row.value(material);

  if (current === null || values.length < 2) {
    return { className: "text-surface-200", label: "" };
  }

  const best = row.better === "higher" ? Math.max(...values) : Math.min(...values);
  const worst = row.better === "higher" ? Math.min(...values) : Math.max(...values);

  if (best === worst) {
    return { className: "text-surface-200", label: "" };
  }

  if (current === best) {
    return {
      className: "bg-emerald-500/10 text-status-best",
      label: "▲ best"
    };
  }

  if (current === worst) {
    return {
      className: "bg-rose-500/10 text-status-worst",
      label: "▼ worst"
    };
  }

  return { className: "text-surface-200", label: "" };
}

export default function ComparisonTable({
  materials
}: ComparisonTableProps) {
  if (materials.length < 2) {
    return null;
  }

  return (
    <section className="fade-slide-up max-w-[1200px] rounded-xl border border-surface-800 bg-surface-900">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-surface-800">
              <th className="sticky left-0 z-20 w-[160px] bg-surface-800 px-4 py-3 text-left text-[11px] uppercase tracking-[0.08em] text-surface-600">
                Property
              </th>
              {materials.map((material) => (
                <th
                  key={material.id}
                  className="px-4 py-3 text-left align-top"
                >
                  <div className="text-[13px] font-semibold text-zinc-100">{material.name}</div>
                  <span
                    className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] ${categoryTone(material.category)}`}
                  >
                    {material.category}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.label}
                className={`${index % 2 === 0 ? "bg-surface-900" : "bg-transparent"} transition hover:bg-[#1F1F23]`}
              >
                <td className="sticky left-0 z-10 bg-inherit px-4 py-3 text-[11px] text-surface-600">
                  {row.label}
                </td>
                {materials.map((material) => {
                  const tone = toneForRow(row, material, materials);
                  return (
                    <td
                      key={`${row.label}-${material.id}`}
                      className={`px-4 py-3 text-right font-mono text-[12px] ${tone.className}`}
                    >
                      <div>{row.display(material)}</div>
                      {tone.label ? (
                        <div className="text-[7px] uppercase tracking-[0.08em] text-surface-600">
                          {tone.label}
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
