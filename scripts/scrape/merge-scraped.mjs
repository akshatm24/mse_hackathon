import {
  APP_DB_PATH,
  SCRAPED_MERGED_PATH,
  mergeMaterialRecords,
  normalizeMaterial,
  normalizeName,
  pickPreferredMaterial,
  readJson,
  writeJson
} from "../lib/pipeline-utils.mjs";

const RAW_FILES = [
  ["AZoM", "scripts/scrape/azom-raw.json"],
  ["EngineeringToolbox", "scripts/scrape/toolbox-raw.json"],
  ["Wikipedia", "scripts/scrape/wikipedia-raw.json"],
  ["Manufacturer", "scripts/scrape/manufacturer-raw.json"],
  ["MatWeb", "scripts/scrape/matweb-raw.json"],
  ["NIST", "scripts/scrape/nist-raw.json"]
];

function loadExisting() {
  return (readJson(APP_DB_PATH, []) ?? []).map((material) => normalizeMaterial(material));
}

function mergeByName(entries) {
  const merged = new Map();
  const rawCounts = {};

  for (const [source, filePath] of RAW_FILES) {
    const rows = readJson(filePath, []) ?? [];
    rawCounts[source] = rows.length;

    for (const row of rows) {
      if (source === "NIST") continue;
      const material = normalizeMaterial({
        ...row,
        source,
        data_source: row.data_source ?? source,
        data_quality: "scraped"
      });
      const key = normalizeName(material.name);
      const current = merged.get(key);
      if (!current) {
        merged.set(key, material);
        continue;
      }
      const preferred = pickPreferredMaterial(current, material);
      const fallback = preferred === current ? material : current;
      merged.set(key, mergeMaterialRecords(preferred, fallback, { overwrite: false }));
    }
  }

  return { merged: [...merged.values()], rawCounts };
}

export async function run() {
  const existing = loadExisting();
  const existingByFormula = new Map();
  const existingByName = new Map();
  const nistRows = readJson("scripts/scrape/nist-raw.json", []) ?? [];

  existing.forEach((material, index) => {
    if (material.formula_pretty) existingByFormula.set(material.formula_pretty, index);
    existingByName.set(normalizeName(material.name), index);
  });

  const { merged, rawCounts } = mergeByName();
  let enrichmentOnly = 0;
  const newEntries = [];

  for (const row of merged) {
    const formula = row.formula_pretty;
    const nameKey = normalizeName(row.name);

    if ((formula && existingByFormula.has(formula)) || existingByName.has(nameKey)) {
      enrichmentOnly += 1;
      continue;
    }

    newEntries.push(row);
  }

  const payload = {
    meta: {
      rawCounts,
      uniqueCounts: {
        AZoM: merged.filter((entry) => entry.source === "AZoM").length,
        EngineeringToolbox: merged.filter((entry) => entry.source === "EngineeringToolbox").length,
        Wikipedia: merged.filter((entry) => entry.source === "Wikipedia").length,
        Manufacturer: merged.filter((entry) => entry.source === "Manufacturer").length,
        MatWeb: merged.filter((entry) => entry.source === "MatWeb").length,
        NIST: nistRows.length
      }
    },
    enrichmentOnly,
    data: newEntries,
    nist: nistRows
  };

  writeJson(SCRAPED_MERGED_PATH, payload);

  console.log(`AZoM:               ${rawCounts.AZoM ?? 0} raw -> ${payload.meta.uniqueCounts.AZoM}`);
  console.log(`EngineeringToolbox: ${rawCounts.EngineeringToolbox ?? 0} raw -> ${payload.meta.uniqueCounts.EngineeringToolbox}`);
  console.log(`Wikipedia:          ${rawCounts.Wikipedia ?? 0} raw -> ${payload.meta.uniqueCounts.Wikipedia}`);
  console.log(`Manufacturers:      ${rawCounts.Manufacturer ?? 0} raw -> ${payload.meta.uniqueCounts.Manufacturer}`);
  console.log(`MatWeb:             ${rawCounts.MatWeb ?? 0} raw -> ${payload.meta.uniqueCounts.MatWeb}`);
  console.log(`NIST:               ${rawCounts.NIST ?? 0} raw -> ${nistRows.length} used for enrichment`);
  console.log("────────────────────────────────────");
  console.log(`Total new entries: ${newEntries.length}`);
  console.log(`Used for enrichment only (no new row): ${enrichmentOnly}`);

  return payload;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
