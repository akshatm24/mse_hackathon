import { inferQueryIntent, QueryIntentProfile } from "@/lib/query-intent";
import { normalisePriorityWeights } from "@/lib/weights";
import { Material, RankedMaterial, UserConstraints } from "@/types";

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

const MACHINABILITY_RANK = {
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

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function safeArray(values: number[], fallback: number): number[] {
  return values.length > 0 ? values : [fallback];
}

function hardFilter(
  db: Material[],
  constraints: UserConstraints,
  profile: QueryIntentProfile,
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
  const requiresConductive =
    constraints.electricallyConductive || profile.wantsElectricalConductivity;
  const requiresInsulating =
    constraints.electricallyInsulating || profile.wantsElectricalInsulation;
  const requiresThermallyConductive =
    constraints.thermallyConductive || profile.wantsThermalConductivity;
  const requiresFdm = constraints.needsFDMPrintability || profile.wantsFDM;
  const intent = profile.categoryIntent;

  return db.filter((material) => {
    const materialText = `${material.name} ${material.subcategory} ${material.tags.join(" ")}`.toLowerCase();

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

    if (
      !options.ignoreCategory &&
      profile.wantsElectronics &&
      material.category === "Solder" &&
      !includesAny(materialText, ["electronics", "pcb", "rohs", "microelectronics", "solder"])
    ) {
      return false;
    }

    if (
      !options.ignoreCategory &&
      profile.wantsProbe &&
      material.data_source.startsWith("Materials Project API")
    ) {
      return false;
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
      requiresFdm &&
      (material.printability_fdm === "n/a" || material.printability_fdm === "poor")
    ) {
      return false;
    }

    const conductivityThreshold =
      profile.wantsMachinability || profile.wantsProbe || profile.wantsElectronics
        ? 2e-7
        : 1e-5;

    if (requiresConductive && material.electrical_resistivity_ohm_m > conductivityThreshold) {
      return false;
    }

    if (requiresInsulating && material.electrical_resistivity_ohm_m < 1e8) {
      return false;
    }

    if (requiresThermallyConductive && material.thermal_conductivity_w_mk < 15) {
      return false;
    }

    if (!options.relaxNumeric && profile.wantsMachinability && material.machinability === "poor") {
      return false;
    }

    return true;
  });
}

function buildReason(
  material: Material,
  weights: UserConstraints["priorityWeights"],
  profile: QueryIntentProfile
): string {
  const reasons: string[] = [];

  if (profile.categoryIntent.includeOnly?.includes(material.category)) {
    reasons.push(`${material.category.toLowerCase()} category fit`);
  }
  if (profile.wantsElectricalConductivity && material.electrical_resistivity_ohm_m <= 1e-6) {
    reasons.push("strong electrical conductivity");
  }
  if (profile.wantsElectricalInsulation && material.electrical_resistivity_ohm_m >= 1e8) {
    reasons.push("electrical insulation");
  }
  if (profile.wantsThermalConductivity && material.thermal_conductivity_w_mk >= 20) {
    reasons.push("high thermal conductivity");
  }
  if (profile.wantsFDM && PRINTABILITY_RANK[material.printability_fdm] >= 3) {
    reasons.push("practical FDM printability");
  }
  if (profile.wantsMachinability && MACHINABILITY_RANK[material.machinability] >= 3) {
    reasons.push("easy machining");
  }
  if (profile.wantsHardness && (material.hardness_vickers ?? 0) >= 250) {
    reasons.push("high surface hardness");
  }
  if (profile.wantsBiocompatible && includesAny(material.tags.join(" ").toLowerCase(), ["biomedical", "medical", "dental"])) {
    reasons.push("biomedical fit");
  }
  if (profile.wantsMarine && includesAny(material.tags.join(" ").toLowerCase(), ["marine", "seawater"])) {
    reasons.push("marine service compatibility");
  }
  if (profile.wantsAcidResistance && includesAny(material.tags.join(" ").toLowerCase(), ["acid-resistant", "chemical", "corrosion-resistant"])) {
    reasons.push("chemical corrosion resistance");
  }
  if (profile.wantsOutdoor && includesAny(material.tags.join(" ").toLowerCase(), ["outdoor", "uv-resistant"])) {
    reasons.push("outdoor weathering fit");
  }
  if (profile.wantsProbe && includesAny(material.tags.join(" ").toLowerCase(), ["probe-tip", "electrical", "conductive", "connectors"])) {
    reasons.push("probe/contact use case fit");
  }
  if (profile.wantsElectronics && includesAny(material.tags.join(" ").toLowerCase(), ["electronics", "pcb", "rohs", "solder"])) {
    reasons.push("electronics use case fit");
  }

  if (reasons.length >= 2) {
    return `Best match for ${reasons[0]} and ${reasons[1]}.`;
  }

  const rankedAxes = [
    { label: "thermal resistance", value: weights.thermal },
    { label: "tensile strength", value: weights.strength },
    { label: "low density", value: weights.weight },
    { label: "cost efficiency", value: weights.cost },
    { label: "corrosion resistance", value: weights.corrosion }
  ].sort((left, right) => right.value - left.value);

  return `Top ${rankedAxes[0].label} and ${rankedAxes[1].label} match within ${material.category.toLowerCase()} candidates.`;
}

function queryFitBonus(
  material: Material,
  profile: QueryIntentProfile,
  filtered: Material[]
): number {
  const text = `${material.name} ${material.subcategory} ${material.category} ${material.tags.join(" ")}`.toLowerCase();
  const resistivities = safeArray(
    filtered.map((candidate) => candidate.electrical_resistivity_ohm_m),
    material.electrical_resistivity_ohm_m
  );
  const thermalConductivities = safeArray(
    filtered.map((candidate) => candidate.thermal_conductivity_w_mk),
    material.thermal_conductivity_w_mk
  );
  const costs = safeArray(
    filtered.map((candidate) => candidate.cost_usd_kg),
    material.cost_usd_kg
  );
  const hardnessValues = safeArray(
    filtered
      .map((candidate) => candidate.hardness_vickers)
      .filter((value): value is number => value !== null),
    material.hardness_vickers ?? 0
  );
  const specificStrengthValues = safeArray(
    filtered.map((candidate) => candidate.tensile_strength_mpa / candidate.density_g_cm3),
    material.tensile_strength_mpa / material.density_g_cm3
  );

  const conductivityQuality = 1 - logNorm(material.electrical_resistivity_ohm_m, resistivities);
  const insulationQuality = logNorm(material.electrical_resistivity_ohm_m, resistivities);
  const thermalConductivityQuality = norm(
    material.thermal_conductivity_w_mk,
    Math.min(...thermalConductivities),
    Math.max(...thermalConductivities)
  );
  const linearCostEfficiency =
    1 - norm(material.cost_usd_kg, Math.min(...costs), Math.max(...costs));
  const hardnessQuality =
    material.hardness_vickers === null
      ? 0
      : norm(
          material.hardness_vickers,
          Math.min(...hardnessValues),
          Math.max(...hardnessValues)
        );
  const specificStrengthQuality = norm(
    material.tensile_strength_mpa / material.density_g_cm3,
    Math.min(...specificStrengthValues),
    Math.max(...specificStrengthValues)
  );
  const lightnessQuality =
    1 -
    norm(
      material.density_g_cm3,
      Math.min(...filtered.map((candidate) => candidate.density_g_cm3)),
      Math.max(...filtered.map((candidate) => candidate.density_g_cm3))
    );

  let bonus = 0;

  if (profile.categoryIntent.includeOnly?.includes(material.category)) {
    bonus += 8;
  }

  if (profile.wantsFDM) {
    bonus += 8 * (PRINTABILITY_RANK[material.printability_fdm] / 4);
    bonus += includesAny(text, ["3d-printing", "fused-deposition", "additive"]) ? 4 : -2;
  }

  if (profile.wantsElectricalConductivity) {
    bonus += 10 * conductivityQuality;
  }

  if (profile.wantsElectricalInsulation) {
    bonus += 10 * insulationQuality;
  }

  if (profile.wantsThermalConductivity) {
    bonus += 8 * thermalConductivityQuality;
  }

  if (profile.wantsMachinability) {
    bonus += 12 * (MACHINABILITY_RANK[material.machinability] / 4);
  }

  if (profile.wantsHardness) {
    bonus += 8 * hardnessQuality;
  }

  if (profile.wantsBiocompatible) {
    bonus += includesAny(text, ["biomedical", "medical", "dental"]) ? 10 : -6;
  }

  if (profile.wantsMarine) {
    bonus += includesAny(text, ["marine", "seawater"]) ? 12 : CORROSION_RANK[material.corrosion_resistance] - 2;
  }

  if (profile.wantsAcidResistance) {
    bonus += includesAny(text, ["acid-resistant", "chemical", "corrosion-resistant"])
      ? 14
      : -6;
  }

  if (profile.wantsOutdoor) {
    bonus += includesAny(text, ["outdoor", "uv-resistant", "weather"]) ? 16 : -14;
  }

  if (profile.wantsProbe) {
    bonus += includesAny(text, ["probe-tip", "electrical", "conductive", "connectors"])
      ? 14
      : conductivityQuality * 3;
  }

  if (profile.wantsMachinability && profile.wantsElectricalConductivity) {
    bonus += 10 * conductivityQuality * (MACHINABILITY_RANK[material.machinability] / 4);
  }

  if (profile.wantsElectronics) {
    bonus += includesAny(text, ["electronics", "pcb", "rohs", "solder", "microelectronics"])
      ? 18
      : -18;
    bonus += includesAny(text, ["brazing", "hvac", "plumbing", "stainless-joining"]) ? -18 : 0;
  }

  if (profile.wantsStructural) {
    bonus += includesAny(text, ["structural", "general-purpose", "high-strength"]) ? 6 : 0;
  }

  if (profile.axisHits.weight > 0 && profile.axisHits.strength > 0) {
    bonus += 12 * specificStrengthQuality;
    bonus += 12 * lightnessQuality;
  }

  if (
    profile.categoryIntent.includeOnly?.includes("Metal") &&
    profile.axisHits.weight > 0 &&
    material.density_g_cm3 > 6
  ) {
    bonus -= 15;
  }

  if (
    profile.axisHits.cost > 0 &&
    profile.axisHits.thermal === 0 &&
    profile.axisHits.weight === 0 &&
    profile.axisHits.strength === 0 &&
    profile.axisHits.corrosion === 0
  ) {
    bonus += 12 * linearCostEfficiency;
  }

  const lexicalMatches = profile.relevanceTerms.filter((term) => text.includes(term)).length;
  bonus += Math.min(8, lexicalMatches * 1.5);

  return Math.max(-12, Math.min(24, bonus));
}

export function scoreMaterials(
  constraints: UserConstraints,
  db: Material[]
): RankedMaterial[] {
  const profile = inferQueryIntent(constraints.rawQuery ?? "");
  const passes = [
    { relaxCost: false, relaxNumeric: false, ignoreCategory: false },
    { relaxCost: true, relaxNumeric: false, ignoreCategory: false },
    { relaxCost: true, relaxNumeric: true, ignoreCategory: false },
    { relaxCost: true, relaxNumeric: true, ignoreCategory: true }
  ];

  let filtered: Material[] = [];
  for (let index = 0; index < passes.length; index += 1) {
    const pass = passes[index];
    const candidates = hardFilter(db, constraints, profile, pass);
    filtered = candidates;

    if (candidates.length >= 3 || (index === passes.length - 1 && candidates.length > 0)) {
      break;
    }
  }

  if (filtered.length === 0) {
    filtered = [...db];
  }

  const temperatures = safeArray(
    filtered.map((material) => material.max_service_temp_c),
    filtered[0]?.max_service_temp_c ?? 0
  );
  const strengths = safeArray(
    filtered.map((material) => material.tensile_strength_mpa),
    filtered[0]?.tensile_strength_mpa ?? 0
  );
  const densities = safeArray(
    filtered.map((material) => material.density_g_cm3),
    filtered[0]?.density_g_cm3 ?? 0
  );
  const costs = safeArray(
    filtered.map((material) => material.cost_usd_kg),
    filtered[0]?.cost_usd_kg ?? 0
  );

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

    const queryBonus = queryFitBonus(material, profile, filtered);
    const confidencePenalty = material.data_source.startsWith("Materials Project API")
      ? profile.wantsElectricalConductivity ||
        profile.wantsElectricalInsulation ||
        profile.wantsMachinability ||
        profile.wantsHardness ||
        profile.wantsBiocompatible ||
        profile.wantsOutdoor ||
        profile.wantsMarine ||
        profile.wantsAcidResistance
        ? 12
        : 5
      : 0;
    const rankValue = rawScore * 100 + queryBonus - confidencePenalty;

    return {
      ...material,
      rankValue,
      score: Math.round(clampScore(rankValue)),
      matchReason: buildReason(material, weights, profile)
    };
  });

  return scored
    .sort((left, right) => right.rankValue - left.rankValue)
    .slice(0, 10)
    .map(({ rankValue: _rankValue, ...material }) => material);
}
