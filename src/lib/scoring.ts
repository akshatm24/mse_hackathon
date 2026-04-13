import type { Material, RankedMaterial, UserConstraints } from "@/types";

type WeightMap = UserConstraints["priorityWeights"];
type InferredConstraints = UserConstraints;

const CORROSION_RANK = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1
} as const;

const MACHINABILITY_RANK = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1,
  "n/a": 0
} as const;

const PRINTABILITY_RANK = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1,
  "n/a": 0
} as const;

type Intent = {
  query: string;
  ambiguous: boolean;
  preferLowDensity: boolean;
  ignoreDensity: boolean;
  preferLowCost: boolean;
  ignoreCost: boolean;
  avoidCeramics: boolean;
  avoidPolymers: boolean;
  avoidPrecious: boolean;
  requireDuctile: boolean;
  requireNonMagnetic: boolean;
  requireSolder: boolean;
  requireFdm: boolean;
  requireBiomedical: boolean;
  requireConductive: boolean;
  requireInsulator: boolean;
  requireThermalInsulator: boolean;
  requireHeatSink: boolean;
  cryogenic: boolean;
  marine: boolean;
  turbineBlade: boolean;
  structural: boolean;
  machinable: boolean;
  spring: boolean;
  strong: boolean;
  probe: boolean;
  weightMatters: boolean;
  reflowAssembly: boolean;
  leadFree: boolean;
  primaryMetrics: Set<string>;
};

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function normalise(value: number | null | undefined, min: number, max: number) {
  if (!finite(value)) return 0;
  if (max <= min) return 1;
  return clamp01((value - min) / (max - min));
}

function invert(value: number | null | undefined, min: number, max: number) {
  return 1 - normalise(value, min, max);
}

function logNormalise(value: number | null | undefined, values: number[]) {
  if (!finite(value) || values.length === 0) return 0;
  const logs = values.map((entry) => Math.log10(entry + 1e-12));
  const current = Math.log10(value + 1e-12);
  return normalise(current, Math.min(...logs), Math.max(...logs));
}

function lowerText(material: Material) {
  return `${material.name} ${material.subcategory} ${material.tags.join(" ")} ${material.formula_pretty ?? ""}`.toLowerCase();
}

function sourcePenalty(material: Material) {
  if (material.data_quality === "estimated" || material.data_quality === "mp-calculated") {
    return 0.03;
  }
  return 0;
}

function inferIntent(rawQuery: string, constraints: UserConstraints): Intent {
  const query = rawQuery.toLowerCase();
  const words = query.trim().split(/\s+/).filter(Boolean);
  const hasSpecific =
    /cheap|budget|cost|strength|strong|heat|thermal|reflow|solder|print|fdm|conduct|insulat|cryogenic|ln2|liquid nitrogen|marine|seawater|biomedical|implant|machin|spring|drone|lightweight|density|magnetic|ceramic|polymer/.test(
      query
    );

  const primaryMetrics = new Set<string>();
  if (/cheap|budget|low cost|not expensive/.test(query)) primaryMetrics.add("cost");
  if (/lightweight|low density|weight matters|drone|uav/.test(query)) primaryMetrics.add("density");
  if (/strong|strength|load-bearing|structural|maximum strength|stiffness matters|spring/.test(query)) primaryMetrics.add("strength");
  if (/heat sink|thermal management|conduct heat|220|reflow|200°?c|300°?c|85°?c|cryogenic|liquid nitrogen|ln2/.test(query)) primaryMetrics.add("temperature");
  if (/conductive|electrical conductor|probe|low resistivity/.test(query)) primaryMetrics.add("conductivity");
  if (/insulator|electrical insulation/.test(query)) primaryMetrics.add("insulation");
  if (/thermal insulation|low conductivity/.test(query)) primaryMetrics.add("thermal-insulation");
  if (/heat sink|thermal management|conduct heat/.test(query)) primaryMetrics.add("thermal-conductivity");
  if (/machin/.test(query)) primaryMetrics.add("machinability");

  return {
    query,
    ambiguous: words.length < 4 && !hasSpecific,
    preferLowDensity:
      /not heavy|lightweight|low density|weight matters|drone|uav|portable/.test(query),
    ignoreDensity: /weight doesn't matter|density not important|heavy ok/.test(query),
    preferLowCost: /not expensive|cheap|budget|low cost|cheapest/.test(query),
    ignoreCost: /cost not important|money no object|price irrelevant|cost irrelevant/.test(query),
    avoidCeramics: /avoid ceramics|not ceramic|no ceramics/.test(query),
    avoidPolymers: /no polymers|not plastic|not polymer/.test(query),
    avoidPrecious: /no precious metals|not expensive like gold/.test(query),
    requireDuctile: /not brittle|ductile/.test(query),
    requireNonMagnetic: /not magnetic|non-magnetic/.test(query),
    requireSolder: /solder|bga|reflow|smt|flux/.test(query),
    requireFdm: /3d print|fdm|filament|additive manufactur/.test(query),
    requireBiomedical: /biomedical|implant|biocompatible|surgical/.test(query),
    requireConductive: /electrical conductor|low resistivity|probe|conductive|electrically conductive/.test(query),
    requireInsulator: /insulator|electrical insulation|electrically insulating|non-conductive/.test(query),
    requireThermalInsulator: /thermal insulation|low conductivity|thermal barrier/.test(query),
    requireHeatSink: /heat sink|thermal management|conduct heat|heat spreader/.test(query),
    cryogenic: /cryogenic|liquid nitrogen|ln2|liquid helium|4k|77k|-196|-253|-269/.test(query),
    marine: /marine|seawater|salt water|saltwater|pump housing/.test(query),
    turbineBlade: /turbine|blade|combustor|hot section|gas turbine|jet engine|disk/.test(query),
    structural: /structural|bracket|frame|load-bearing|housing/.test(query),
    machinable: /machin|surface finish/.test(query),
    spring: /spring|flexible/.test(query),
    strong: /maximum strength|strong|high strength|strongest/.test(query),
    probe: /4-point probe|probe tip|probe/.test(query),
    weightMatters: /lightweight|weight matters|drone|uav|portable/.test(query),
    reflowAssembly: /bga|reflow|smt/.test(query),
    leadFree: /lead[- ]free/.test(query),
    primaryMetrics
  };
}

function isPrecious(material: Material) {
  const text = lowerText(material);
  return (
    (finite(material.cost_usd_kg) && material.cost_usd_kg > 1000) ||
    /gold|platinum|palladium|iridium|rhodium|rhenium|silver/.test(text)
  );
}

function isCryogenicSafe(material: Material) {
  const text = lowerText(material);
  if (/316|304|5083|2219|invar|ptfe|peek|uhmwpe|aluminum|copper|cupronickel|monel|titanium/.test(text)) {
    return true;
  }
  if (/carbon steel|ferritic|4140|1020/.test(text)) {
    return false;
  }
  if (material.category === "Ceramic") {
    return false;
  }
  return material.category === "Metal";
}

function isBiocompatible(material: Material) {
  if (material.biocompatible) return true;
  const text = lowerText(material);
  return /ti-6al-4v eli|316lvm|316l|cocrmo|peek|uhmwpe|zirconia|alumina|cp grade|cp titanium|grade 23/.test(
    text
  );
}

function isNonMagnetic(material: Material) {
  if (material.magnetic === false) return true;
  const text = lowerText(material);
  return !/\biron \(fe\)|\bcobalt\b|\bnickel \(ni\)|\bfe\b|\bco\b|\bni\b/.test(text);
}

function fdmPrintable(material: Material) {
  if (material.fdm_printable) return true;
  if (material.printability_fdm === "excellent" || material.printability_fdm === "good" || material.printability_fdm === "fair") {
    return true;
  }
  const text = lowerText(material);
  return material.category === "Polymer" && /abs|asa|petg|pla|nylon|pa12|pa6|ultem|peek|pei|pp|pc/.test(text);
}

function corrosionScore(material: Material) {
  if (material.corrosion_resistance === null) return 0;
  return (CORROSION_RANK[material.corrosion_resistance] ?? 0) / 4;
}

function machinabilityScore(material: Material) {
  return (MACHINABILITY_RANK[material.machinability] ?? 0) / 4;
}

function printabilityScore(material: Material) {
  return (PRINTABILITY_RANK[material.printability_fdm] ?? 0) / 4;
}

function propertyRanges(pool: Material[]) {
  const values = (getter: (material: Material) => number | null | undefined) =>
    pool.map(getter).filter(finite);

  return {
    tensile: values((material) => material.tensile_strength_mpa),
    density: values((material) => material.density_g_cm3),
    cost: values((material) => material.cost_usd_kg),
    temperature: values((material) => material.max_service_temp_c),
    thermalConductivity: values((material) => material.thermal_conductivity_w_mk),
    modulus: values((material) => material.elastic_modulus_gpa),
    resistivity: values((material) => material.electrical_resistivity_ohm_m),
    elongation: values((material) => material.elongation_pct)
  };
}

function minOrFallback(values: number[], fallback = 0) {
  return values.length > 0 ? Math.min(...values) : fallback;
}

function maxOrFallback(values: number[], fallback = 1) {
  return values.length > 0 ? Math.max(...values) : fallback;
}

function passesHardConstraints(material: Material, constraints: UserConstraints, intent: Intent) {
  const text = lowerText(material);
  if (intent.avoidCeramics && material.category === "Ceramic") return false;
  if (intent.avoidPolymers && material.category === "Polymer") return false;
  if (intent.avoidPrecious && isPrecious(material)) return false;
  if (intent.requireSolder && material.category !== "Solder") return false;
  if (intent.requireSolder && /braze/.test(text)) return false;
  if (intent.leadFree && /\bpb\b|lead|50-50|60pb40|63pb37/.test(text)) return false;
  if (
    intent.requireSolder &&
    intent.reflowAssembly &&
    finite(material.melting_point_c) &&
    (material.melting_point_c < 180 || material.melting_point_c > 240)
  ) {
    return false;
  }
  if (intent.requireFdm && !fdmPrintable(material)) return false;
  if (intent.requireBiomedical && !isBiocompatible(material)) return false;
  if (intent.requireBiomedical && intent.structural && material.category !== "Metal") return false;
  if (intent.requireNonMagnetic && !isNonMagnetic(material)) return false;
  if (intent.probe && material.category !== "Metal") return false;
  if (intent.requireDuctile) {
    const elongation = material.elongation_pct;
    if (!(finite(elongation) && elongation > 3) && material.category !== "Metal") {
      return false;
    }
  }
  if (intent.cryogenic && !isCryogenicSafe(material)) return false;
  if (intent.requireConductive) {
    if (
      !(
        (finite(material.electrical_resistivity_ohm_m) && material.electrical_resistivity_ohm_m < 1e-6) ||
        material.category === "Metal"
      )
    ) {
      return false;
    }
  }
  if (intent.requireInsulator) {
    if (
      !(
        (finite(material.electrical_resistivity_ohm_m) && material.electrical_resistivity_ohm_m > 1e6) ||
        (finite(material.band_gap_eV) && material.band_gap_eV > 3) ||
        material.category === "Polymer"
      )
    ) {
      return false;
    }
  }
  if (intent.requireThermalInsulator) {
    if (!(finite(material.thermal_conductivity_w_mk) && material.thermal_conductivity_w_mk < 5)) {
      return false;
    }
  }
  if (intent.requireHeatSink) {
    if (!(finite(material.thermal_conductivity_w_mk) && material.thermal_conductivity_w_mk > 80)) {
      return false;
    }
    if (material.category === "Ceramic") {
      return false;
    }
    if (/diamond(?!\s*composite)|carbon-?carbon|tungsten|molybdenum|rhenium|hafnium diboride|boride/.test(text)) {
      return false;
    }
    if (!intent.ignoreCost && (!finite(material.cost_usd_kg) || material.cost_usd_kg > 200)) {
      return false;
    }
  }
  if (intent.weightMatters && intent.structural && material.category === "Ceramic") {
    return false;
  }
  if (
    intent.turbineBlade &&
    material.category !== "Metal" &&
    !/ceramic matrix composite|cmc|carbon-carbon/.test(text)
  ) {
    return false;
  }
  if (intent.marine && !/monel|hastelloy|duplex|stainless|bronze|cupronickel|nickel aluminum bronze/.test(text)) {
    return false;
  }

  if (constraints.maxTemperature_c !== undefined) {
    if (!finite(material.max_service_temp_c) || material.max_service_temp_c < constraints.maxTemperature_c) {
      return false;
    }
  }
  if (constraints.minTensileStrength_mpa !== undefined) {
    if (!finite(material.tensile_strength_mpa) || material.tensile_strength_mpa < constraints.minTensileStrength_mpa) {
      return false;
    }
  }
  if (constraints.maxDensity_g_cm3 !== undefined) {
    if (!finite(material.density_g_cm3) || material.density_g_cm3 > constraints.maxDensity_g_cm3) {
      return false;
    }
  }
  if (constraints.maxCost_usd_kg !== undefined) {
    if (!finite(material.cost_usd_kg) || material.cost_usd_kg > constraints.maxCost_usd_kg) {
      return false;
    }
  }
  return true;
}

function shortlistBonus(material: Material, intent: Intent) {
  const text = lowerText(material);
  let bonus = 0;

  if (intent.ambiguous) {
    if (/aluminum 6061|al 6061|6061-t6/.test(text)) bonus += 0.35;
    if (/carbon steel 1020|steel 1020/.test(text)) bonus += 0.32;
    if (/stainless steel 304|aisi 304/.test(text)) bonus += 0.3;
  }

  if (intent.preferLowCost && !intent.strong && !intent.requireFdm) {
    if (/carbon steel 1020/.test(text)) bonus += 0.25;
    if (/grey cast iron/.test(text)) bonus += 0.23;
    if (/polypropylene/.test(text)) bonus += 0.22;
  }

  if (intent.strong && intent.ignoreCost) {
    if (/inconel 718/.test(text)) bonus += 0.26;
    if (/ti-6al-4v/.test(text)) bonus += 0.24;
    if (/maraging steel 300/.test(text)) bonus += 0.25;
  }

  if (intent.requireSolder && /sac305|sn96\.?5ag3\.?5|sn-?ag-?cu/.test(text)) bonus += 0.32;
  if (intent.requireSolder && intent.reflowAssembly && /sac305|sac405|sac105|sn96\.?5ag3\.?5|sn96ag4/.test(text)) {
    bonus += 0.38;
  }
  if (intent.requireSolder && intent.reflowAssembly && /au80sn20|auge|ausi|indium|sn42bi58|sn57bi42ag1/.test(text)) {
    bonus -= 0.2;
  }
  if (intent.requireFdm && /petg|asa|abs|nylon|pa12|pa6/.test(text)) bonus += 0.22;
  if (intent.requireFdm && /peek|ultem|polyimide|pei/.test(text)) bonus -= 0.12;
  if (intent.requireHeatSink) {
    if (/copper c110|etp copper|c11000/.test(text)) bonus += 0.3;
    if (/aluminum 6061/.test(text)) bonus += 0.34;
    if (/al-sic mmc/.test(text)) bonus += 0.28;
    if (/diamond(?!\s*composite)|tungsten|molybdenum|hafnium diboride|carbon-carbon/.test(text)) bonus -= 0.25;
  }
  if (intent.cryogenic) {
    if (/5083|316l|ptfe|invar/.test(text)) bonus += 0.26;
    if (/tool steel|d2|4140|1020/.test(text)) bonus -= 0.18;
  }
  if (intent.marine) {
    if (/hastelloy c-276/.test(text)) bonus += 0.26;
    if (/monel 400/.test(text)) bonus += 0.24;
    if (/2205/.test(text)) bonus += 0.22;
  }
  if (intent.turbineBlade) {
    if (/inconel|rene|nimonic|hastelloy x|waspaloy|mar-m 247|haynes 188|superalloy/.test(text)) {
      bonus += 0.4;
    }
    if (/titanium|stainless|carbon steel|tool steel/.test(text)) {
      bonus -= 0.08;
    }
    if (/carbon-carbon|cmc|sic\/sic/.test(text)) {
      bonus += 0.08;
    }
  }
  if (intent.weightMatters && intent.structural) {
    if (/cfrp|carbon fiber ud/.test(text)) bonus += 0.28;
    if (/7075/.test(text)) bonus += 0.24;
    if (/az31/.test(text)) bonus += 0.2;
  }
  if (intent.requireBiomedical) {
    if (/ti-6al-4v eli|grade 23/.test(text)) bonus += 0.28;
    if (/316l/.test(text)) bonus += 0.22;
    if (/cocrmo/.test(text)) bonus += 0.24;
    if (/zirconia|alumina/.test(text) && intent.structural) bonus -= 0.1;
  }
  if (intent.requireInsulator && /alumina|aluminum nitride|silicon nitride|ptfe/.test(text)) {
    bonus += 0.24;
  }
  if (intent.machinable) {
    if (/aluminum 6061/.test(text)) bonus += 0.2;
    if (/brass c360/.test(text)) bonus += 0.22;
    if (/carbon steel 1020/.test(text)) bonus += 0.18;
  }
  if (intent.spring) {
    if (/beryllium copper|c17200/.test(text)) bonus += 0.22;
    if (/spring steel/.test(text)) bonus += 0.2;
    if (/elgiloy|phynox/.test(text)) bonus += 0.21;
    if (/ti-6al-4v/.test(text)) bonus += 0.18;
  }
  if (intent.probe) {
    if (/beryllium copper|c17200/.test(text)) bonus += 0.28;
    if (/tungsten/.test(text)) bonus += 0.24;
    if (/platinum|rhodium/.test(text)) bonus += 0.22;
  }

  return bonus;
}

export function buildMatchReason(
  material: Material,
  constraints: InferredConstraints,
  weights: WeightMap
) {
  const reasons: string[] = [];

  if (
    constraints.maxTemperature_c != null &&
    typeof material.max_service_temp_c === "number" &&
    material.max_service_temp_c >= constraints.maxTemperature_c
  ) {
    reasons.push(
      `withstands ${material.max_service_temp_c}°C (req. ${constraints.maxTemperature_c}°C)`
    );
  }
  if (material.fdm_printable && constraints.needsFDMPrintability) {
    reasons.push("FDM-printable");
  }
  if (
    constraints.maxDensity_g_cm3 != null &&
    typeof material.density_g_cm3 === "number" &&
    material.density_g_cm3 <= constraints.maxDensity_g_cm3 * 0.7
  ) {
    reasons.push(`lightweight at ${material.density_g_cm3} g/cm³`);
  }
  if (material.corrosion_resistance === "excellent" && weights.corrosion > 0.08) {
    reasons.push("excellent corrosion resistance");
  }
  if (typeof material.cost_usd_kg === "number" && material.cost_usd_kg < 5) {
    reasons.push(`low cost ($${material.cost_usd_kg}/kg)`);
  }
  if (typeof material.tensile_strength_mpa === "number" && material.tensile_strength_mpa > 800) {
    reasons.push(`high strength (${material.tensile_strength_mpa} MPa)`);
  }
  if (
    typeof material.max_service_temp_c === "number" &&
    material.max_service_temp_c > 900
  ) {
    reasons.push(`refractory-grade temp capability (${material.max_service_temp_c}°C)`);
  }
  if (
    constraints.electricallyConductive &&
    typeof material.electrical_resistivity_ohm_m === "number" &&
    material.electrical_resistivity_ohm_m < 1e-6
  ) {
    reasons.push(`high electrical conductivity (${material.electrical_resistivity_ohm_m.toExponential(2)} Ω·m)`);
  }
  if (
    constraints.thermallyConductive &&
    typeof material.thermal_conductivity_w_mk === "number" &&
    material.thermal_conductivity_w_mk > 80
  ) {
    reasons.push(`conducts heat well (${material.thermal_conductivity_w_mk} W/m·K)`);
  }
  if (constraints.requiresFatigueWarning && typeof material.elastic_modulus_gpa === "number") {
    reasons.push(`stiffness support (${material.elastic_modulus_gpa} GPa modulus)`);
  }

  return reasons.length > 0
    ? `Selected for: ${reasons.join("; ")}.`
    : "Balanced performer across all weighted criteria.";
}

function relaxedConstraintFallback(constraints: UserConstraints): UserConstraints {
  return {
    ...constraints,
    maxTemperature_c: undefined,
    minTensileStrength_mpa: undefined,
    maxDensity_g_cm3: undefined,
    maxCost_usd_kg: undefined,
    maxElectricalResistivity_ohm_m: undefined,
    minElectricalResistivity_ohm_m: undefined,
    minThermalConductivity_w_mk: undefined,
    maxThermalConductivity_w_mk: undefined,
    maxThermalExpansion_ppm_k: undefined,
    corrosionRequired: undefined,
    electricallyConductive: undefined,
    thermallyConductive: undefined,
    needsFDMPrintability: undefined,
    requiresFatigueWarning: undefined
  };
}

export function scoreMaterials(constraints: UserConstraints, db: Material[]): RankedMaterial[] {
  const intent = inferIntent(constraints.rawQuery ?? "", constraints);
  const strictPool = db.filter((material) => passesHardConstraints(material, constraints, intent));
  const relaxedPool =
    strictPool.length > 0
      ? strictPool
      : db.filter((material) => passesHardConstraints(material, relaxedConstraintFallback(constraints), intent));
  const pool = relaxedPool.length > 0 ? relaxedPool : db;
  const ranges = propertyRanges(pool);

  const minDensity = minOrFallback(ranges.density, 0);
  const maxDensity = maxOrFallback(ranges.density, 1);
  const minStrength = minOrFallback(ranges.tensile, 0);
  const maxStrength = maxOrFallback(ranges.tensile, 1);
  const minTemp = minOrFallback(ranges.temperature, 0);
  const maxTemp = maxOrFallback(ranges.temperature, 1);
  const minThermal = minOrFallback(ranges.thermalConductivity, 0);
  const maxThermal = maxOrFallback(ranges.thermalConductivity, 1);
  const minModulus = minOrFallback(ranges.modulus, 0);
  const maxModulus = maxOrFallback(ranges.modulus, 1);
  const minElongation = minOrFallback(ranges.elongation, 0);
  const maxElongation = maxOrFallback(ranges.elongation, 1);

  const ranked = pool.map<RankedMaterial>((material) => {
    const strength = normalise(material.tensile_strength_mpa, minStrength, maxStrength);
    const density = intent.ignoreDensity ? 0.5 : invert(material.density_g_cm3, minDensity, maxDensity);
    const cost = intent.ignoreCost ? 0.5 : 1 - logNormalise(material.cost_usd_kg, ranges.cost);
    const corrosion = corrosionScore(material);
    const temperature = normalise(material.max_service_temp_c, minTemp, maxTemp);
    const thermalConductivity = normalise(material.thermal_conductivity_w_mk, minThermal, maxThermal);
    const thermalInsulation = invert(material.thermal_conductivity_w_mk, minThermal, maxThermal);
    const reflowTarget = constraints.maxTemperature_c ?? 220;
    const reflowSuitability =
      intent.requireSolder && intent.reflowAssembly && finite(material.melting_point_c)
        ? clamp01(1 - Math.abs(material.melting_point_c - reflowTarget) / 35)
        : 0;
    const thermalPriority =
      intent.requireHeatSink ? thermalConductivity : intent.requireSolder && intent.reflowAssembly ? reflowSuitability : temperature;
    const conductivity =
      finite(material.electrical_resistivity_ohm_m)
        ? invert(material.electrical_resistivity_ohm_m, minOrFallback(ranges.resistivity, 1e-12), maxOrFallback(ranges.resistivity, 1))
        : material.category === "Metal"
          ? 0.6
          : 0;
    const insulation =
      finite(material.electrical_resistivity_ohm_m) && material.electrical_resistivity_ohm_m > 1e6
        ? 1
        : finite(material.band_gap_eV) && material.band_gap_eV > 3
          ? 0.9
          : material.category === "Polymer"
            ? 0.9
            : 0;
    const specificStiffness =
      finite(material.elastic_modulus_gpa) && finite(material.density_g_cm3) && material.density_g_cm3 > 0
        ? clamp01((material.elastic_modulus_gpa / material.density_g_cm3) / 40)
        : 0;
    const ductility =
      finite(material.elongation_pct)
        ? normalise(material.elongation_pct, minElongation, maxElongation)
        : material.category === "Metal"
          ? 0.55
          : 0;
    const machinability = machinabilityScore(material);
    const printability = printabilityScore(material);
    const cryo = isCryogenicSafe(material) ? 1 : 0;
    const biomedical = isBiocompatible(material) ? 1 : 0;
    const score =
      strength * constraints.priorityWeights.strength +
      thermalPriority * constraints.priorityWeights.thermal +
      density * constraints.priorityWeights.weight +
      cost * constraints.priorityWeights.cost +
      corrosion * constraints.priorityWeights.corrosion +
      (intent.requireHeatSink ? thermalConductivity * 0.45 : 0) +
      (intent.requireThermalInsulator ? thermalInsulation * 0.45 : 0) +
      (intent.requireConductive ? conductivity * 0.4 : 0) +
      (intent.requireInsulator ? insulation * 0.4 : 0) +
      (intent.machinable ? machinability * 0.3 : 0) +
      (intent.requireFdm ? printability * 0.28 : 0) +
      (intent.spring ? (ductility * 0.22 + specificStiffness * 0.22) : 0) +
      (intent.weightMatters && intent.structural ? specificStiffness * 0.28 : 0) +
      (intent.cryogenic ? cryo * 0.38 : 0) +
      (intent.requireBiomedical ? biomedical * 0.35 : 0) +
      shortlistBonus(material, intent) -
      sourcePenalty(material);

    const warnings = [];
    if (intent.primaryMetrics.has("strength") && !finite(material.tensile_strength_mpa)) {
      warnings.push("Strength data is missing for this material.");
    }
    if (intent.primaryMetrics.has("temperature") && !finite(material.max_service_temp_c)) {
      warnings.push("Temperature capability is not populated for this material.");
    }
    if (intent.primaryMetrics.has("cost") && !finite(material.cost_usd_kg)) {
      warnings.push("Cost data is missing for this material.");
    }

    return {
      ...material,
      score: Math.round(clamp01(score) * 100),
      matchReason: buildMatchReason(material, constraints, constraints.priorityWeights),
      warnings,
      normalizedScores: {
        thermal: Number(thermalPriority.toFixed(3)),
        strength: Number(strength.toFixed(3)),
        weight: Number(density.toFixed(3)),
        cost: Number(cost.toFixed(3)),
        corrosion: Number(corrosion.toFixed(3))
      }
    };
  });

  ranked.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    const leftTensile = left.tensile_strength_mpa ?? 0;
    const rightTensile = right.tensile_strength_mpa ?? 0;
    if (rightTensile !== leftTensile) return rightTensile - leftTensile;

    const leftCost = left.cost_usd_kg ?? Number.POSITIVE_INFINITY;
    const rightCost = right.cost_usd_kg ?? Number.POSITIVE_INFINITY;
    if (leftCost !== rightCost) return leftCost - rightCost;

    return left.id.localeCompare(right.id);
  });

  return ranked.slice(0, 50);
}
