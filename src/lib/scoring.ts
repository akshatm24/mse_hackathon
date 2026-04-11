import { Material, RankedMaterial, UserConstraints } from "@/types";
import { normalisePriorityWeights } from "@/lib/weights";

const CORROSION_RANK = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1
} as const;

const PRINTABILITY_RANK = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1,
  "n/a": 0
} as const;

function norm(val: number, min: number, max: number): number {
  if (max === min) {
    return 1.0;
  }
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
}

function logNorm(val: number, allVals: number[]): number {
  const logs = allVals.map((value) => Math.log1p(Math.max(0, value)));
  return norm(Math.log1p(Math.max(0, val)), Math.min(...logs), Math.max(...logs));
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function inferCategoryIntent(rawQuery: string): {
  exclude: Material["category"][];
  includeOnly?: Material["category"][];
  excludeIds?: string[];
} {
  const q = rawQuery.toLowerCase();
  const practicalFdmQuery =
    ["3d print", "fdm", "filament", "desktop printer", "motor bracket"].some((signal) =>
      q.includes(signal)
    ) &&
    !["aerospace", "autoclave", "medical", "steril", "high-temp", "high temperature"].some(
      (signal) => q.includes(signal)
    );

  if (["solder", "bga", "reflow"].some((signal) => q.includes(signal))) {
    return {
      exclude: [],
      includeOnly: ["Solder", "Metal"]
    };
  }

  if (["3d print", "fdm", "filament"].some((signal) => q.includes(signal))) {
    return {
      exclude: ["Ceramic", "Solder"],
      excludeIds: practicalFdmQuery
        ? [
            "peek",
            "pekk",
            "ultem9085",
            "ultem1010",
            "pps",
            "polycarbonate",
            "delrin_pom"
          ]
        : undefined
    };
  }

  if (["polymer", "plastic"].some((signal) => q.includes(signal))) {
    return {
      exclude: ["Ceramic", "Solder"]
    };
  }

  if (["metal", "alloy", "steel"].some((signal) => q.includes(signal))) {
    return {
      exclude: ["Ceramic", "Polymer", "Solder"]
    };
  }

  return { exclude: [] };
}

function hardFilter(
  db: Material[],
  constraints: UserConstraints,
  intent: {
    exclude: Material["category"][];
    includeOnly?: Material["category"][];
    excludeIds?: string[];
  },
  options: {
    relaxCost: boolean;
    relaxNumeric: boolean;
    ignoreCategory: boolean;
  }
): Material[] {
  const requiredCorrosion = constraints.corrosionRequired
    ? CORROSION_RANK[constraints.corrosionRequired]
    : 0;
  const costCap =
    constraints.maxCost_usd_kg === undefined
      ? Infinity
      : options.relaxCost
        ? constraints.maxCost_usd_kg * 3
        : constraints.maxCost_usd_kg;

  return db.filter((material) => {
    if (!options.ignoreCategory) {
      if (intent.exclude.includes(material.category)) {
        return false;
      }
      if (intent.includeOnly && !intent.includeOnly.includes(material.category)) {
        return false;
      }
      if (intent.excludeIds?.includes(material.id)) {
        return false;
      }
    }

    if (!options.relaxNumeric) {
      if (
        constraints.maxTemperature_c !== undefined &&
        material.max_service_temp_c < constraints.maxTemperature_c
      ) {
        return false;
      }
      if (
        constraints.minTensileStrength_mpa !== undefined &&
        material.tensile_strength_mpa < constraints.minTensileStrength_mpa
      ) {
        return false;
      }
      if (
        constraints.maxDensity_g_cm3 !== undefined &&
        material.density_g_cm3 > constraints.maxDensity_g_cm3
      ) {
        return false;
      }
    }

    if (material.cost_usd_kg > costCap) {
      return false;
    }

    if (
      requiredCorrosion > 0 &&
      CORROSION_RANK[material.corrosion_resistance] < requiredCorrosion
    ) {
      return false;
    }

    if (
      constraints.needsFDMPrintability &&
      (material.printability_fdm === "n/a" || material.printability_fdm === "poor")
    ) {
      return false;
    }

    if (
      constraints.electricallyConductive &&
      material.electrical_resistivity_ohm_m > 1e-4
    ) {
      return false;
    }

    if (
      constraints.thermallyConductive &&
      material.thermal_conductivity_w_mk < 10
    ) {
      return false;
    }

    return true;
  });
}

function buildReason(
  material: Material,
  weights: UserConstraints["priorityWeights"]
): string {
  const rankedAxes = [
    { label: "thermal resistance", value: weights.thermal },
    { label: "tensile strength", value: weights.strength },
    { label: "low density", value: weights.weight },
    { label: "cost efficiency", value: weights.cost },
    { label: "corrosion resistance", value: weights.corrosion }
  ].sort((left, right) => right.value - left.value);

  return `Top ${rankedAxes[0].label} and ${rankedAxes[1].label} match within ${material.category.toLowerCase()} candidates.`;
}

export function scoreMaterials(
  constraints: UserConstraints,
  db: Material[]
): RankedMaterial[] {
  const intent = inferCategoryIntent(constraints.rawQuery ?? "");
  const passes = [
    { relaxCost: false, relaxNumeric: false, ignoreCategory: false },
    { relaxCost: true, relaxNumeric: false, ignoreCategory: false },
    { relaxCost: true, relaxNumeric: true, ignoreCategory: false },
    { relaxCost: true, relaxNumeric: true, ignoreCategory: true }
  ];

  let filtered: Material[] = [];
  for (let index = 0; index < passes.length; index += 1) {
    const pass = passes[index];
    const candidates = hardFilter(db, constraints, intent, pass);
    filtered = candidates;

    if (candidates.length >= 3 || (index === passes.length - 1 && candidates.length > 0)) {
      break;
    }
  }

  if (filtered.length === 0) {
    filtered = [...db];
  }

  const temperatures = filtered.map((material) => material.max_service_temp_c);
  const strengths = filtered.map((material) => material.tensile_strength_mpa);
  const densities = filtered.map((material) => material.density_g_cm3);
  const costs = filtered.map((material) => material.cost_usd_kg);

  const weights = normalisePriorityWeights(constraints.priorityWeights);

  const scored = filtered.map((material) => {
    const thermal = norm(
      material.max_service_temp_c,
      Math.min(...temperatures),
      Math.max(...temperatures)
    );
    const strength = norm(
      material.tensile_strength_mpa,
      Math.min(...strengths),
      Math.max(...strengths)
    );
    const lightness =
      1 -
      norm(
        material.density_g_cm3,
        Math.min(...densities),
        Math.max(...densities)
      );
    const costEfficiency = 1 - logNorm(material.cost_usd_kg, costs);
    const corrosion = CORROSION_RANK[material.corrosion_resistance] / 4;

    const rawScore =
      weights.thermal * thermal +
      weights.strength * strength +
      weights.weight * lightness +
      weights.cost * costEfficiency +
      weights.corrosion * corrosion;
    const confidencePenalty = material.data_source.startsWith("Materials Project API")
      ? 5
      : 0;
    const fdmBonus = constraints.needsFDMPrintability
      ? PRINTABILITY_RANK[material.printability_fdm]
      : 0;

    return {
      ...material,
      score: Math.round(clampScore(rawScore * 100 - confidencePenalty + fdmBonus)),
      matchReason: buildReason(material, weights)
    };
  });

  return scored.sort((left, right) => right.score - left.score).slice(0, 10);
}
