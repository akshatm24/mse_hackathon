import {
  APP_DB_PATH,
  BASELINE_DB_PATH,
  HARDCODED_PATH,
  MP_PROCESSED_PATH,
  SCRAPED_MERGED_PATH,
  countKnownCoreFields,
  materialFormulaKey,
  mergeMaterialRecords,
  normalizeMaterial,
  normalizeName,
  readJson,
  writeJson
} from "./lib/pipeline-utils.mjs";

function loadMaterials(filePath) {
  return (readJson(filePath, []) ?? []).map((material) => normalizeMaterial(material));
}

function buildIndexes(materials) {
  const byExactName = new Map();
  const byNormalizedName = new Map();
  const byFormula = new Map();

  materials.forEach((material, index) => {
    byExactName.set(material.name.toLowerCase(), index);
    byNormalizedName.set(normalizeName(material.name), index);
    const formula = materialFormulaKey(material);
    if (formula) byFormula.set(formula, index);
  });

  return { byExactName, byNormalizedName, byFormula };
}

function findMatch(indexes, material) {
  const formula = materialFormulaKey(material);
  if (indexes.byExactName.has(material.name.toLowerCase())) {
    return indexes.byExactName.get(material.name.toLowerCase());
  }
  if (formula && indexes.byFormula.has(formula)) {
    return indexes.byFormula.get(formula);
  }
  const normalized = normalizeName(material.name);
  if (indexes.byNormalizedName.has(normalized)) {
    return indexes.byNormalizedName.get(normalized);
  }
  return null;
}

function addOrEnrich(target, indexes, material, stats, label) {
  const matchIndex = findMatch(indexes, material);

  if (matchIndex !== null) {
    const current = target[matchIndex];
    target[matchIndex] = mergeMaterialRecords(current, material, { overwrite: false });
    stats.enriched += 1;
    return;
  }

  target.push(material);
  const index = target.length - 1;
  indexes.byExactName.set(material.name.toLowerCase(), index);
  indexes.byNormalizedName.set(normalizeName(material.name), index);
  const formula = materialFormulaKey(material);
  if (formula) indexes.byFormula.set(formula, index);
  stats.added += 1;
  stats.bySource[label] = (stats.bySource[label] ?? 0) + 1;
}

function summarize(materials) {
  const byCategory = { Metal: 0, Polymer: 0, Ceramic: 0, Composite: 0, Solder: 0 };
  const byQuality = {
    experimental: 0,
    "hardcoded-cited": 0,
    scraped: 0,
    "mp-calculated": 0,
    estimated: 0
  };

  let complete = 0;
  let partial = 0;

  for (const material of materials) {
    byCategory[material.category] += 1;
    byQuality[material.data_quality ?? "experimental"] += 1;
    if (
      material.tensile_strength_mpa !== null &&
      material.density_g_cm3 !== null &&
      material.cost_usd_kg !== null
    ) {
      complete += 1;
    } else {
      partial += 1;
    }
  }

  return { byCategory, byQuality, complete, partial };
}

function main() {
  const baseline = loadMaterials(BASELINE_DB_PATH);
  const mpProcessed = loadMaterials(MP_PROCESSED_PATH);
  const scrapedPayload = readJson(SCRAPED_MERGED_PATH, { data: [], nist: [] }) ?? { data: [], nist: [] };
  const hardcoded = loadMaterials(HARDCODED_PATH);

  const materials = [...baseline];
  const indexes = buildIndexes(materials);
  const stats = {
    enriched: 0,
    added: 0,
    bySource: {}
  };

  for (const material of hardcoded) {
    addOrEnrich(materials, indexes, normalizeMaterial(material), stats, "Hardcoded");
  }

  for (const material of scrapedPayload.data ?? []) {
    addOrEnrich(materials, indexes, normalizeMaterial(material), stats, "Scraped");
  }

  for (const nist of scrapedPayload.nist ?? []) {
    const formula = nist.formula_pretty;
    if (!formula || !indexes.byFormula.has(formula)) continue;
    const position = indexes.byFormula.get(formula);
    materials[position] = mergeMaterialRecords(materials[position], {
      melting_point_c: nist.melting_point_c ?? null,
      specific_heat_j_gk: nist.specific_heat_j_gk ?? null,
      source: "NIST",
      data_source: "NIST WebBook",
      scrape_url: nist.scrape_url ?? null
    });
  }

  const baselineByName = new Set(baseline.map((material) => normalizeName(material.name)));
  for (const material of mpProcessed) {
    if (baselineByName.has(normalizeName(material.name))) {
      continue;
    }
    addOrEnrich(materials, indexes, normalizeMaterial(material), stats, "MP");
  }

  writeJson(APP_DB_PATH, materials);

  const summary = summarize(materials);
  const mpAdded = stats.bySource.MP ?? 0;
  const scrapedAdded = stats.bySource.Scraped ?? 0;
  const hardcodedAdded = stats.bySource.Hardcoded ?? 0;

  console.log("══════════════════════════════════════════════════════");
  console.log("FINAL DATABASE ASSEMBLY COMPLETE");
  console.log("══════════════════════════════════════════════════════");
  console.log(`Original entries preserved:      ${baseline.length}`);
  console.log(`Original entries enriched:       ${stats.enriched}`);
  console.log(`MP entries added:                ${mpAdded}`);
  console.log(`Scraped entries added:           ${scrapedAdded}`);
  console.log(`Hardcoded entries added:         ${hardcodedAdded}`);
  console.log("──────────────────────────────────────────────────────");
  console.log(`TOTAL UNIQUE MATERIALS:          ${materials.length}`);
  console.log("──────────────────────────────────────────────────────");
  console.log("By category:");
  console.log(`  Metal:      ${summary.byCategory.Metal}`);
  console.log(`  Polymer:    ${summary.byCategory.Polymer}`);
  console.log(`  Ceramic:    ${summary.byCategory.Ceramic}`);
  console.log(`  Composite:  ${summary.byCategory.Composite}`);
  console.log(`  Solder:     ${summary.byCategory.Solder}`);
  console.log("By data quality:");
  console.log(`  Experimental (curated):   ${summary.byQuality.experimental}`);
  console.log(`  Hardcoded-cited:          ${summary.byQuality["hardcoded-cited"]}`);
  console.log(`  Scraped:                  ${summary.byQuality.scraped}`);
  console.log(`  MP-calculated:            ${summary.byQuality["mp-calculated"]}`);
  console.log(`  Estimated:                ${summary.byQuality.estimated}`);
  console.log(`With complete data (UTS + density + cost): ${summary.complete}`);
  console.log(`With partial data (some nulls):            ${summary.partial}`);
  console.log("══════════════════════════════════════════════════════");
}

main();
