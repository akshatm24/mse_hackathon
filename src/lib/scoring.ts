import { Material, RankedMaterial, UserConstraints } from "@/types";

export const DEFAULT_PRIORITY_WEIGHTS: UserConstraints["priorityWeights"] = {
  strength: 0.2,
  thermal: 0.2,
  weight: 0.2,
  cost: 0.2,
  corrosion: 0.2
};

export const CORROSION_RANKS = {
  poor: 1,
  fair: 2,
  good: 3,
  excellent: 4
} as const;

export const QUALITY_RANKS = {
  "n/a": 0,
  poor: 1,
  fair: 2,
  good: 3,
  excellent: 4
} as const;

const THERMALLY_CONDUCTIVE_THRESHOLD_W_MK = 10;

function safeDivide(value: number, maxValue: number): number {
  if (maxValue <= 0) {
    return 0;
  }

  return value / maxValue;
}

export function normalisePriorityWeights(
  weights?: Partial<UserConstraints["priorityWeights"]>
): UserConstraints["priorityWeights"] {
  const merged = {
    ...DEFAULT_PRIORITY_WEIGHTS,
    ...weights
  };

  const entries = Object.entries(merged) as Array<[
    keyof UserConstraints["priorityWeights"],
    number
  ]>;
  const positiveTotal = entries.reduce((total, [, value]) => total + Math.max(0, value), 0);

  if (positiveTotal <= 0) {
    return { ...DEFAULT_PRIORITY_WEIGHTS };
  }

  return entries.reduce<UserConstraints["priorityWeights"]>((accumulator, [key, value]) => {
    accumulator[key] = Math.max(0, value) / positiveTotal;
    return accumulator;
  }, { ...DEFAULT_PRIORITY_WEIGHTS });
}

export function buildDefaultConstraints(rawQuery: string): UserConstraints {
  return {
    rawQuery,
    priorityWeights: { ...DEFAULT_PRIORITY_WEIGHTS }
  };
}

export function mergeConstraints(
  inferred: UserConstraints,
  manual?: Partial<UserConstraints>
): UserConstraints {
  if (!manual) {
    return {
      ...inferred,
      priorityWeights: normalisePriorityWeights(inferred.priorityWeights)
    };
  }

  return {
    maxTemperature_c: manual.maxTemperature_c ?? inferred.maxTemperature_c,
    minTensileStrength_mpa: manual.minTensileStrength_mpa ?? inferred.minTensileStrength_mpa,
    maxDensity_g_cm3: manual.maxDensity_g_cm3 ?? inferred.maxDensity_g_cm3,
    maxCost_usd_kg: manual.maxCost_usd_kg ?? inferred.maxCost_usd_kg,
    corrosionRequired: manual.corrosionRequired ?? inferred.corrosionRequired,
    electricallyConductive: manual.electricallyConductive ?? inferred.electricallyConductive,
    thermallyConductive: manual.thermallyConductive ?? inferred.thermallyConductive,
    needsFDMPrintability: manual.needsFDMPrintability ?? inferred.needsFDMPrintability,
    priorityWeights: normalisePriorityWeights(manual.priorityWeights ?? inferred.priorityWeights),
    rawQuery: manual.rawQuery ?? inferred.rawQuery
  };
}

function passesHardFilters(
  material: Material,
  constraints: UserConstraints,
  costMultiplier = 1
): boolean {
  const requiredTemp = constraints.maxTemperature_c ?? 0;
  const requiredStrength = constraints.minTensileStrength_mpa ?? 0;
  const maxDensity = constraints.maxDensity_g_cm3 ?? Number.POSITIVE_INFINITY;
  const maxCost = constraints.maxCost_usd_kg
    ? constraints.maxCost_usd_kg * costMultiplier
    : Number.POSITIVE_INFINITY;

  if (material.max_service_temp_c < requiredTemp) {
    return false;
  }

  if (material.tensile_strength_mpa < requiredStrength) {
    return false;
  }

  if (material.density_g_cm3 > maxDensity) {
    return false;
  }

  if (material.cost_usd_kg > maxCost) {
    return false;
  }

  if (
    constraints.corrosionRequired &&
    CORROSION_RANKS[material.corrosion_resistance] < CORROSION_RANKS[constraints.corrosionRequired]
  ) {
    return false;
  }

  if (
    constraints.needsFDMPrintability &&
    (material.printability_fdm === "n/a" || material.printability_fdm === "poor")
  ) {
    return false;
  }

  if (constraints.electricallyConductive && material.electrical_resistivity_ohm_m > 1e-4) {
    return false;
  }

  if (
    constraints.thermallyConductive &&
    material.thermal_conductivity_w_mk < THERMALLY_CONDUCTIVE_THRESHOLD_W_MK
  ) {
    return false;
  }

  return true;
}

function buildMatchReason(
  material: Material,
  weightedFactors: Record<keyof UserConstraints["priorityWeights"], number>
): string {
  const factorLabels: Record<keyof UserConstraints["priorityWeights"], string> = {
    strength: "high tensile capability",
    thermal: "strong high-temperature survivability",
    weight: "low density",
    cost: "cost efficiency",
    corrosion: "corrosion resistance"
  };

  const topFactors = Object.entries(weightedFactors)
    .sort(([, first], [, second]) => second - first)
    .slice(0, 2)
    .map(([key]) => factorLabels[key as keyof UserConstraints["priorityWeights"]]);

  const [firstFactor, secondFactor] = topFactors;

  if (firstFactor && secondFactor) {
    return `${material.name} rises because it combines ${firstFactor} with ${secondFactor} in the surviving candidate set.`;
  }

  if (firstFactor) {
    return `${material.name} remains competitive primarily because of its ${firstFactor}.`;
  }

  return `${material.name} clears the filters with a balanced overall profile.`;
}

function scoreFilteredMaterials(
  materials: Material[],
  constraints: UserConstraints
): RankedMaterial[] {
  const weights = normalisePriorityWeights(constraints.priorityWeights);
  const maxTensile = Math.max(...materials.map((material) => material.tensile_strength_mpa), 1);
  const maxServiceTemp = Math.max(...materials.map((material) => material.max_service_temp_c), 1);
  const maxDensity = Math.max(...materials.map((material) => material.density_g_cm3), 1);
  const maxCost = Math.max(...materials.map((material) => material.cost_usd_kg), 1);

  return materials
    .map<RankedMaterial>((material) => {
      const strengthScore = safeDivide(material.tensile_strength_mpa, maxTensile);
      const thermalScore = safeDivide(material.max_service_temp_c, maxServiceTemp);
      const weightScore = Math.max(0, 1 - safeDivide(material.density_g_cm3, maxDensity));
      const costScore = Math.max(0, 1 - safeDivide(material.cost_usd_kg, maxCost));
      const corrosionScore = CORROSION_RANKS[material.corrosion_resistance] / 4;

      const weightedFactors = {
        strength: weights.strength * strengthScore,
        thermal: weights.thermal * thermalScore,
        weight: weights.weight * weightScore,
        cost: weights.cost * costScore,
        corrosion: weights.corrosion * corrosionScore
      };

      const score =
        100 *
        (weightedFactors.strength +
          weightedFactors.thermal +
          weightedFactors.weight +
          weightedFactors.cost +
          weightedFactors.corrosion);

      return {
        ...material,
        score: Number(score.toFixed(2)),
        matchReason: buildMatchReason(material, weightedFactors)
      };
    })
    .sort((first, second) => second.score - first.score);
}

export function scoreMaterials(constraints: UserConstraints, db: Material[]): RankedMaterial[] {
  const normalizedConstraints = {
    ...constraints,
    priorityWeights: normalisePriorityWeights(constraints.priorityWeights)
  };

  const firstPass = db.filter((material) => passesHardFilters(material, normalizedConstraints));

  if (firstPass.length >= 3 || normalizedConstraints.maxCost_usd_kg === undefined) {
    return scoreFilteredMaterials(firstPass, normalizedConstraints).slice(0, 10);
  }

  const relaxedCostPass = db.filter((material) =>
    passesHardFilters(material, normalizedConstraints, 2)
  );

  return scoreFilteredMaterials(relaxedCostPass, normalizedConstraints).slice(0, 10);
}
