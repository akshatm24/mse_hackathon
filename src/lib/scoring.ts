import { Material, RankedMaterial, UserConstraints } from "@/types";

export const DEFAULT_PRIORITY_WEIGHTS: UserConstraints["priorityWeights"] = {
  strength: 0.2,
  thermal: 0.2,
  weight: 0.2,
  cost: 0.2,
  corrosion: 0.2
};

export const corrosionRank = { excellent: 4, good: 3, fair: 2, poor: 1 } as const;
export const CORROSION_RANKS = corrosionRank;
export const QUALITY_RANKS = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1,
  "n/a": 0
} as const;

export function normalisePriorityWeights(
  weights?: Partial<UserConstraints["priorityWeights"]>
): UserConstraints["priorityWeights"] {
  const merged = { ...DEFAULT_PRIORITY_WEIGHTS, ...weights };
  const total = Object.values(merged).reduce((sum, value) => sum + Math.max(0, value), 0);

  if (total <= 0) {
    return { ...DEFAULT_PRIORITY_WEIGHTS };
  }

  return {
    strength: Math.max(0, merged.strength) / total,
    thermal: Math.max(0, merged.thermal) / total,
    weight: Math.max(0, merged.weight) / total,
    cost: Math.max(0, merged.cost) / total,
    corrosion: Math.max(0, merged.corrosion) / total
  };
}

export function buildDefaultConstraints(rawQuery: string): UserConstraints {
  return {
    priorityWeights: { ...DEFAULT_PRIORITY_WEIGHTS },
    rawQuery
  };
}

export function mergeConstraints(
  base: UserConstraints,
  overrides?: Partial<UserConstraints>
): UserConstraints {
  if (!overrides) {
    return {
      ...base,
      priorityWeights: normalisePriorityWeights(base.priorityWeights)
    };
  }

  return {
    maxTemperature_c: overrides.maxTemperature_c ?? base.maxTemperature_c,
    minTensileStrength_mpa:
      overrides.minTensileStrength_mpa ?? base.minTensileStrength_mpa,
    maxDensity_g_cm3: overrides.maxDensity_g_cm3 ?? base.maxDensity_g_cm3,
    maxCost_usd_kg: overrides.maxCost_usd_kg ?? base.maxCost_usd_kg,
    corrosionRequired: overrides.corrosionRequired ?? base.corrosionRequired,
    electricallyConductive:
      overrides.electricallyConductive ?? base.electricallyConductive,
    thermallyConductive:
      overrides.thermallyConductive ?? base.thermallyConductive,
    needsFDMPrintability:
      overrides.needsFDMPrintability ?? base.needsFDMPrintability,
    priorityWeights: normalisePriorityWeights(
      overrides.priorityWeights ?? base.priorityWeights
    ),
    rawQuery: overrides.rawQuery ?? base.rawQuery
  };
}

function buildReason(m: Material, w: UserConstraints["priorityWeights"]): string {
  const factors: { label: string; weight: number }[] = [
    { label: "thermal performance", weight: w.thermal },
    { label: "strength-to-weight", weight: w.strength },
    { label: "low density", weight: w.weight },
    { label: "cost efficiency", weight: w.cost },
    { label: "corrosion resistance", weight: w.corrosion }
  ];
  const top = factors.sort((a, b) => b.weight - a.weight).slice(0, 2);
  return `Strong ${top[0].label} and ${top[1].label} for ${m.subcategory} class.`;
}

export function filterMaterialsForConstraints(
  constraints: UserConstraints,
  db: Material[]
): Material[] {
  const reqRank = constraints.corrosionRequired
    ? corrosionRank[constraints.corrosionRequired]
    : 0;

  let filtered = db.filter((m) => {
    if (
      constraints.maxTemperature_c !== undefined &&
      m.max_service_temp_c < constraints.maxTemperature_c
    ) {
      return false;
    }
    if (
      constraints.minTensileStrength_mpa !== undefined &&
      m.tensile_strength_mpa < constraints.minTensileStrength_mpa
    ) {
      return false;
    }
    if (
      constraints.maxDensity_g_cm3 !== undefined &&
      m.density_g_cm3 > constraints.maxDensity_g_cm3
    ) {
      return false;
    }
    if (
      constraints.maxCost_usd_kg !== undefined &&
      m.cost_usd_kg > constraints.maxCost_usd_kg
    ) {
      return false;
    }
    if (reqRank > 0 && corrosionRank[m.corrosion_resistance] < reqRank) {
      return false;
    }
    if (
      constraints.needsFDMPrintability &&
      (m.printability_fdm === "n/a" || m.printability_fdm === "poor")
    ) {
      return false;
    }
    if (
      constraints.electricallyConductive &&
      m.electrical_resistivity_ohm_m > 1e-4
    ) {
      return false;
    }
    if (
      constraints.thermallyConductive &&
      m.thermal_conductivity_w_mk < 10
    ) {
      return false;
    }
    return true;
  });

  if (filtered.length < 3) {
    filtered = db.filter(
      (m) =>
        !constraints.needsFDMPrintability ||
        (m.printability_fdm !== "n/a" && m.printability_fdm !== "poor")
    );
  }

  if (filtered.length === 0) {
    filtered = [...db];
  }

  return filtered;
}

export function scoreMaterials(
  constraints: UserConstraints,
  db: Material[]
): RankedMaterial[] {
  const normalisedConstraints = {
    ...constraints,
    priorityWeights: normalisePriorityWeights(constraints.priorityWeights)
  };
  const filtered = filterMaterialsForConstraints(normalisedConstraints, db);
  const maxT = Math.max(...filtered.map((m) => m.max_service_temp_c));
  const maxStr = Math.max(...filtered.map((m) => m.tensile_strength_mpa));
  const maxRho = Math.max(...filtered.map((m) => m.density_g_cm3));
  const maxC = Math.max(...filtered.map((m) => m.cost_usd_kg));
  const w = normalisedConstraints.priorityWeights;

  return filtered
    .map((m) => {
      const thermal = maxT > 0 ? m.max_service_temp_c / maxT : 0;
      const strength = maxStr > 0 ? m.tensile_strength_mpa / maxStr : 0;
      const lightness = maxRho > 0 ? 1 - m.density_g_cm3 / maxRho : 0;
      const costEff = maxC > 0 ? 1 - m.cost_usd_kg / maxC : 0;
      const corrosion = corrosionRank[m.corrosion_resistance] / 4;

      const score = Math.round(
        100 *
          (w.thermal * thermal +
            w.strength * strength +
            w.weight * lightness +
            w.cost * costEff +
            w.corrosion * corrosion)
      );

      return { ...m, score, matchReason: buildReason(m, w) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
