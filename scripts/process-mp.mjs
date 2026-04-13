import {
  APP_DB_PATH,
  BASELINE_DB_PATH,
  COMPOUND_DATA,
  ELEMENT_DATA,
  ELEMENT_NAMES,
  MP_PROCESSED_PATH,
  MP_RAW_PATH,
  categoryFromFormula,
  commercialNameForFormula,
  conductivityFromFormula,
  corrosionFromComposition,
  detectEngineeringFamily,
  elementCostWeighted,
  materialFormulaKey,
  mergeMaterialRecords,
  normalizeMaterial,
  parseFormula,
  readJson,
  resistivityFromFormula,
  round,
  serviceTemperatureFromFormula,
  slugify,
  writeJson
} from "./lib/pipeline-utils.mjs";

function youngsFromBulkShear(bulk, shear) {
  const k = bulk?.vrh;
  const g = shear?.vrh;
  if (!Number.isFinite(k) || !Number.isFinite(g) || k <= 0 || g <= 0) {
    return null;
  }
  return (9 * k * g) / (3 * k + g);
}

function estimateYieldStrength(entry, family, category) {
  const shear = entry.shear_modulus?.vrh;
  const bulk = entry.bulk_modulus?.vrh;

  if (Number.isFinite(shear) && shear > 0) {
    if (category === "Metal") {
      return round(shear * 2, 0);
    }
    if (family === "oxide") {
      return round(shear * 0.1, 0);
    }
  }

  if (Number.isFinite(bulk) && bulk > 0 && category === "Metal") {
    return round(bulk * 1.5, 0);
  }

  return null;
}

function estimateUltimateStrength(yieldStrength, category) {
  if (!Number.isFinite(yieldStrength)) {
    return null;
  }
  if (category === "Metal") {
    return round(yieldStrength * 1.35, 0);
  }
  return round(yieldStrength, 0);
}

function estimateCost(formula) {
  const parsed = parseFormula(formula);
  const elements = Object.keys(parsed);

  if (elements.length === 1) {
    return ELEMENT_DATA[elements[0]]?.costPerKg ?? null;
  }

  const weighted = elementCostWeighted(formula);
  return Number.isFinite(weighted) ? round(weighted * 1.5, 2) : null;
}

function estimateSpecificHeat(formula, category) {
  const parsed = parseFormula(formula);
  const elements = Object.keys(parsed);

  if (elements.length === 1) {
    const element = elements[0];
    if (element === "Cu") return 0.385;
    if (element === "Al") return 0.897;
    if (element === "Ti") return 0.523;
    if (element === "Fe") return 0.449;
    if (element === "Ni") return 0.444;
    if (element === "W") return 0.134;
    if (element === "Mo") return 0.251;
  }

  return category === "Metal" ? 0.5 : 0.75;
}

function estimateThermalExpansion(formula, category) {
  const parsed = parseFormula(formula);
  const elements = Object.keys(parsed);
  if (elements.length === 1) {
    const element = elements[0];
    if (element === "Al") return 23.1;
    if (element === "Cu") return 16.5;
    if (element === "Fe") return 11.8;
    if (element === "Ti") return 8.6;
    if (element === "W") return 4.5;
  }
  return category === "Metal" ? 12 : 7;
}

function subcategoryFromFamily(family, category) {
  switch (family) {
    case "pure-metal":
      return "Materials Project Pure Element";
    case "oxide":
      return "Engineering Oxide Ceramic";
    case "carbide":
      return "Engineering Carbide Ceramic";
    case "nitride":
      return "Engineering Nitride Ceramic";
    case "boride":
      return "Engineering Boride Ceramic";
    case "silicide":
      return "Silicide";
    case "fluoride":
      return "Optical Fluoride";
    case "semiconductor":
      return "Semiconductor";
    case "max-phase":
      return "MAX Phase Ceramic";
    case "commercial-intermetallic":
    case "intermetallic":
      return category === "Metal" ? "Intermetallic Alloy" : "Functional Ceramic";
    default:
      return category === "Metal" ? "Materials Project Metal" : "Materials Project Ceramic";
  }
}

function machinabilityFromMaterial(category, family, ultimateStrength) {
  if (category === "Ceramic") {
    return "poor";
  }
  if (family === "commercial-intermetallic" || family === "intermetallic") {
    return "fair";
  }
  if (!Number.isFinite(ultimateStrength)) {
    return "n/a";
  }
  if (ultimateStrength < 300) return "excellent";
  if (ultimateStrength < 700) return "good";
  if (ultimateStrength < 1200) return "fair";
  return "poor";
}

function buildName(formula) {
  const pureElements = Object.keys(parseFormula(formula));
  if (pureElements.length === 1) {
    const symbol = pureElements[0];
    const name = ELEMENT_NAMES[symbol] ?? symbol;
    return `${name} (${symbol}) (MP)`;
  }

  const commercial = commercialNameForFormula(formula);
  if (commercial) {
    return `${commercial} (${formula}) (MP)`;
  }

  return `${formula} (MP)`;
}

function biocompatibilityForFormula(formula) {
  const signature = formula.replace(/\s+/g, "");
  return ["NiTi", "Al2O3", "ZrO2"].includes(signature);
}

function magneticForFormula(formula) {
  const elements = Object.keys(parseFormula(formula));
  return elements.length === 1 && ["Fe", "Co", "Ni"].includes(elements[0]);
}

function buildMpMaterial(entry) {
  const formula = entry.formula_pretty.replace(/\s+/g, "");
  const family = detectEngineeringFamily(formula, parseFormula(formula), entry) ?? "intermetallic";
  const category = categoryFromFormula(formula, entry.is_metal);
  const elasticModulus = youngsFromBulkShear(entry.bulk_modulus, entry.shear_modulus);
  const yieldStrength = estimateYieldStrength(entry, family, category);
  const tensileStrength = estimateUltimateStrength(yieldStrength, category);
  const thermalConductivity = conductivityFromFormula(formula);
  const maxServiceTemp = serviceTemperatureFromFormula(formula, family);
  const cost = estimateCost(formula);
  const resistivity = resistivityFromFormula(formula, entry.band_gap);
  const compoundInfo = COMPOUND_DATA[formula] ?? null;
  const name = buildName(formula);
  const dataQuality =
    yieldStrength !== null ||
    tensileStrength !== null ||
    thermalConductivity !== null ||
    maxServiceTemp !== null ||
    cost !== null
      ? "estimated"
      : "mp-calculated";

  return normalizeMaterial({
    id: `mp-${slugify(formula)}`,
    name,
    category,
    subcategory: subcategoryFromFamily(family, category),
    density_g_cm3: round(entry.density, 3),
    tensile_strength_mpa: tensileStrength,
    yield_strength_mpa: yieldStrength,
    elastic_modulus_gpa: round(elasticModulus, 1),
    hardness_vickers: null,
    thermal_conductivity_w_mk: thermalConductivity,
    specific_heat_j_gk: estimateSpecificHeat(formula, category),
    melting_point_c: compoundInfo?.meltingPointC ?? ELEMENT_DATA[Object.keys(parseFormula(formula))[0]]?.meltingPointC ?? null,
    glass_transition_c: null,
    max_service_temp_c: maxServiceTemp,
    thermal_expansion_ppm_k: estimateThermalExpansion(formula, category),
    electrical_resistivity_ohm_m: resistivity,
    corrosion_resistance: corrosionFromComposition(formula, family),
    machinability: machinabilityFromMaterial(category, family, tensileStrength),
    printability_fdm: "n/a",
    cost_usd_kg: cost,
    tags: [
      formula.toLowerCase(),
      family,
      category.toLowerCase(),
      entry.energy_above_hull > 0 ? "metastable" : "stable"
    ],
    data_source: `Materials Project ${entry.material_id}`,
    source: "MP",
    data_quality: dataQuality,
    source_kind: "materials-project",
    formula_pretty: formula,
    material_id: entry.material_id,
    energy_above_hull: entry.energy_above_hull ?? null,
    band_gap_eV: entry.band_gap ?? null,
    is_stable: Number(entry.energy_above_hull ?? 1) <= 1e-6,
    biocompatible: biocompatibilityForFormula(formula),
    magnetic: magneticForFormula(formula)
  });
}

function buildFormulaIndex(materials) {
  const index = new Map();
  materials.forEach((material, position) => {
    const formula = materialFormulaKey(material);
    if (formula) {
      index.set(formula.replace(/\s+/g, ""), position);
    }
  });
  return index;
}

function main() {
  const rawPayload = readJson(MP_RAW_PATH, { data: [] });
  const baseline = (readJson(BASELINE_DB_PATH, []) ?? []).map((material) => normalizeMaterial(material));
  const materials = [...baseline];
  const formulaIndex = buildFormulaIndex(materials);
  let enrichedCount = 0;
  let addedCount = 0;

  for (const entry of rawPayload.data ?? []) {
    const candidate = buildMpMaterial(entry);
    const formulaKey = candidate.formula_pretty;

    if (formulaKey && formulaIndex.has(formulaKey)) {
      const position = formulaIndex.get(formulaKey);
      const current = materials[position];
      const merged = mergeMaterialRecords(current, {
        density_g_cm3: candidate.density_g_cm3,
        thermal_conductivity_w_mk: candidate.thermal_conductivity_w_mk,
        max_service_temp_c: candidate.max_service_temp_c,
        melting_point_c: candidate.melting_point_c,
        specific_heat_j_gk: candidate.specific_heat_j_gk,
        elastic_modulus_gpa: candidate.elastic_modulus_gpa,
        yield_strength_mpa: candidate.yield_strength_mpa,
        tensile_strength_mpa: candidate.tensile_strength_mpa,
        cost_usd_kg: candidate.cost_usd_kg,
        electrical_resistivity_ohm_m: candidate.electrical_resistivity_ohm_m,
        thermal_expansion_ppm_k: candidate.thermal_expansion_ppm_k,
        formula_pretty: candidate.formula_pretty,
        data_enriched_from_mp: true,
        source: "MP",
        data_source: candidate.data_source,
        band_gap_eV: candidate.band_gap_eV,
        energy_above_hull: candidate.energy_above_hull,
        material_id: candidate.material_id
      });
      materials[position] = merged;
      enrichedCount += 1;
      continue;
    }

    materials.push(candidate);
    if (formulaKey) {
      formulaIndex.set(formulaKey, materials.length - 1);
    }
    addedCount += 1;
  }

  writeJson(MP_PROCESSED_PATH, materials);
  writeJson(APP_DB_PATH, materials);

  const nullTensile = materials.filter((material) => material.tensile_strength_mpa === null).length;
  const nullCost = materials.filter((material) => material.cost_usd_kg === null).length;

  console.log(`Existing entries preserved: ${baseline.length}`);
  console.log(`Existing entries enriched:  ${enrichedCount}`);
  console.log(`New MP entries added:       ${addedCount}`);
  console.log(`Total in database:          ${materials.length}`);
  console.log(`Entries with null UTS:      ${nullTensile}`);
  console.log(`Entries with null cost:     ${nullCost}`);
}

main();
