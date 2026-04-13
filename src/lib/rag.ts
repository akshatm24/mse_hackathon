import type { RankedMaterial } from "@/types";
import type { Material } from "@/types";

function words(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

export async function searchDatabase(
  query: string,
  materials: Material[],
  k: number
): Promise<Material[]> {
  const qWords = new Set(words(query));

  const scored = materials.map((material) => {
    const haystack = [
      material.name,
      material.category,
      material.subcategory,
      material.formula_pretty ?? "",
      ...material.tags
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const word of qWords) {
      if (haystack.includes(word)) {
        score += 1;
      }
    }

    return { material, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((entry) => entry.material);
}

export function selectFromCandidates(
  query: string,
  candidates: RankedMaterial[],
  negatedAxes: string[],
  k: number
): RankedMaterial[] {
  if (candidates.length <= k) {
    return candidates;
  }

  const q = query.toLowerCase();

  const scored = candidates.map((material) => {
    const desc = [
      material.name,
      material.category,
      material.subcategory,
      ...material.tags
    ]
      .join(" ")
      .toLowerCase();

    const words = new Set(q.split(/\s+/).filter((word) => word.length > 2));
    let kw = 0;
    for (const word of words) {
      if (desc.includes(word)) {
        kw += 1;
      }
    }
    const kwScore = kw / Math.max(words.size, 1);

    let intent = 0;
    if (!negatedAxes.includes("cost") && /cheap|budget|low\s+cost/.test(q)) {
      intent += typeof material.cost_usd_kg === "number" ? Math.max(0, 1 - material.cost_usd_kg / 500) : 0;
    }
    if (!negatedAxes.includes("thermal") && /heat|hot|temp|motor/.test(q)) {
      intent += typeof material.max_service_temp_c === "number" ? Math.min(1, material.max_service_temp_c / 500) : 0;
    }
    if (!negatedAxes.includes("weight") && /light|drone|aircraft/.test(q)) {
      intent += typeof material.density_g_cm3 === "number" ? Math.max(0, 1 - material.density_g_cm3 / 20) : 0;
    }
    if (!negatedAxes.includes("strength") && /strong|load|structural/.test(q)) {
      intent += typeof material.tensile_strength_mpa === "number" ? Math.min(1, material.tensile_strength_mpa / 1500) : 0;
    }
    if (negatedAxes.includes("strength")) {
      intent += typeof material.tensile_strength_mpa === "number" ? Math.max(0, 1 - material.tensile_strength_mpa / 1500) : 0;
    }
    if (/3d\s*print|fdm/.test(q)) {
      intent +=
        material.printability_fdm === "excellent"
          ? 1
          : material.printability_fdm === "good"
            ? 0.5
            : 0;
    }
    if (/marine|seawater|acid/.test(q)) {
      const ranking = { excellent: 1, good: 0.7, fair: 0.4, poor: 0 } as const;
      intent += material.corrosion_resistance ? ranking[material.corrosion_resistance] ?? 0 : 0;
    }

    const combined = kwScore * 0.35 + intent * 0.35 + (material.score / 100) * 0.3;
    return { material, combined };
  });

  return scored
    .sort((a, b) => b.combined - a.combined)
    .slice(0, k)
    .map((entry) => entry.material);
}
