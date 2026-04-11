import { CORROSION_RANKS, QUALITY_RANKS } from "@/lib/scoring";
import { RankedMaterial } from "@/types";

interface ComparisonTableProps {
  selectedMaterials: RankedMaterial[];
}

type ComparisonRow = {
  label: string;
  display: (material: RankedMaterial) => string;
  rank?: (material: RankedMaterial) => number | null;
  better?: "higher" | "lower";
};

const rows: ComparisonRow[] = [
  { label: "Category", display: (material) => material.category },
  { label: "Subcategory", display: (material) => material.subcategory },
  {
    label: "Score",
    display: (material) => material.score.toFixed(1),
    rank: (material) => material.score,
    better: "higher"
  },
  {
    label: "Density (g/cm³)",
    display: (material) => material.density_g_cm3.toFixed(2),
    rank: (material) => material.density_g_cm3,
    better: "lower"
  },
  {
    label: "Tensile Strength (MPa)",
    display: (material) => material.tensile_strength_mpa.toFixed(0),
    rank: (material) => material.tensile_strength_mpa,
    better: "higher"
  },
  {
    label: "Yield Strength (MPa)",
    display: (material) => material.yield_strength_mpa.toFixed(0),
    rank: (material) => material.yield_strength_mpa,
    better: "higher"
  },
  {
    label: "Elastic Modulus (GPa)",
    display: (material) => material.elastic_modulus_gpa.toFixed(1),
    rank: (material) => material.elastic_modulus_gpa,
    better: "higher"
  },
  {
    label: "Hardness (HV)",
    display: (material) => (material.hardness_vickers === null ? "—" : material.hardness_vickers.toFixed(0)),
    rank: (material) => material.hardness_vickers,
    better: "higher"
  },
  {
    label: "Thermal Conductivity (W/m·K)",
    display: (material) => material.thermal_conductivity_w_mk.toFixed(2),
    rank: (material) => material.thermal_conductivity_w_mk,
    better: "higher"
  },
  {
    label: "Specific Heat (J/g·K)",
    display: (material) => material.specific_heat_j_gk.toFixed(3),
    rank: (material) => material.specific_heat_j_gk,
    better: "higher"
  },
  {
    label: "Melting Point (°C)",
    display: (material) => (material.melting_point_c === null ? "—" : material.melting_point_c.toFixed(0)),
    rank: (material) => material.melting_point_c,
    better: "higher"
  },
  {
    label: "Glass Transition (°C)",
    display: (material) => (material.glass_transition_c === null ? "—" : material.glass_transition_c.toFixed(0)),
    rank: (material) => material.glass_transition_c,
    better: "higher"
  },
  {
    label: "Max Service Temp (°C)",
    display: (material) => material.max_service_temp_c.toFixed(0),
    rank: (material) => material.max_service_temp_c,
    better: "higher"
  },
  {
    label: "Thermal Expansion (ppm/K)",
    display: (material) => material.thermal_expansion_ppm_k.toFixed(2),
    rank: (material) => material.thermal_expansion_ppm_k,
    better: "lower"
  },
  {
    label: "Electrical Resistivity (Ω·m)",
    display: (material) => material.electrical_resistivity_ohm_m.toExponential(2),
    rank: (material) => material.electrical_resistivity_ohm_m,
    better: "lower"
  },
  {
    label: "Corrosion Resistance",
    display: (material) => material.corrosion_resistance,
    rank: (material) => CORROSION_RANKS[material.corrosion_resistance],
    better: "higher"
  },
  {
    label: "Machinability",
    display: (material) => material.machinability,
    rank: (material) => QUALITY_RANKS[material.machinability],
    better: "higher"
  },
  {
    label: "FDM Printability",
    display: (material) => material.printability_fdm,
    rank: (material) => QUALITY_RANKS[material.printability_fdm],
    better: "higher"
  },
  {
    label: "Cost ($/kg)",
    display: (material) => material.cost_usd_kg.toFixed(2),
    rank: (material) => material.cost_usd_kg,
    better: "lower"
  }
];

function cellTone(
  row: ComparisonRow,
  material: RankedMaterial,
  selectedMaterials: RankedMaterial[]
): string {
  if (!row.rank || !row.better) {
    return "text-zinc-200";
  }

  const rankedValues = selectedMaterials
    .map((entry) => ({ id: entry.id, value: row.rank?.(entry) }))
    .filter((entry): entry is { id: string; value: number } => entry.value !== null && entry.value !== undefined);

  if (rankedValues.length < 2) {
    return "text-zinc-200";
  }

  const values = rankedValues.map((entry) => entry.value);
  const best = row.better === "higher" ? Math.max(...values) : Math.min(...values);
  const worst = row.better === "higher" ? Math.min(...values) : Math.max(...values);
  const current = row.rank(material);

  if (current === null || current === undefined || best === worst) {
    return "text-zinc-200";
  }

  if (current === best) {
    return "bg-emerald-500/10 text-emerald-400";
  }

  if (current === worst) {
    return "bg-rose-500/10 text-rose-400";
  }

  return "text-zinc-200";
}

export default function ComparisonTable({ selectedMaterials }: ComparisonTableProps): JSX.Element | null {
  if (selectedMaterials.length < 2) {
    return null;
  }

  return (
    <section className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Comparison Table</p>
        <h3 className="mt-2 text-lg font-medium text-zinc-100">Side-by-side engineering property view</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-zinc-900 px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                Property
              </th>
              {selectedMaterials.map((material) => (
                <th key={material.id} className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  {material.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="sticky left-0 z-10 border-t border-zinc-800 bg-zinc-900 px-4 py-3 font-medium text-zinc-200">
                  {row.label}
                </td>
                {selectedMaterials.map((material) => (
                  <td
                    key={`${row.label}-${material.id}`}
                    className={`border-t border-zinc-800 px-4 py-3 ${cellTone(row, material, selectedMaterials)}`}
                  >
                    {row.display(material)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
