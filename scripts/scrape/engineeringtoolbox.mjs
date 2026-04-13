import { normalizeName, slugify, writeJson } from "../lib/pipeline-utils.mjs";
import {
  classifyCategory,
  dedupeByNormalizedName,
  fetchHtml,
  representativeValue,
  toDensityGcm3,
  toExpansion,
  toMpa,
  toResistivity,
  toTempC,
  toThermalConductivity
} from "./common.mjs";

const OUTPUT_PATH = "scripts/scrape/toolbox-raw.json";

const PAGES = [
  "https://www.engineeringtoolbox.com/metals-alloys-densities-d_50.html",
  "https://www.engineeringtoolbox.com/metals-strengths-d_1544.html",
  "https://www.engineeringtoolbox.com/young-modulus-d_417.html",
  "https://www.engineeringtoolbox.com/thermal-conductivity-metals-d_858.html",
  "https://www.engineeringtoolbox.com/linear-expansion-coefficients-d_95.html",
  "https://www.engineeringtoolbox.com/resistivity-conductivity-d_418.html",
  "https://www.engineeringtoolbox.com/melting-temperature-metals-d_860.html",
  "https://www.engineeringtoolbox.com/polymer-properties-d_1592.html",
  "https://www.engineeringtoolbox.com/plastics-thermal-properties-d_1757.html",
  "https://www.engineeringtoolbox.com/ceramics-properties-d_1738.html",
  "https://www.engineeringtoolbox.com/thermal-conductivity-d_429.html"
];

function mapHeaderToField(header, valueText) {
  const lower = header.toLowerCase();
  if (lower.includes("density") || lower.includes("ρ")) {
    return ["density_g_cm3", toDensityGcm3(valueText)];
  }
  if (lower.includes("yield")) {
    return ["yield_strength_mpa", toMpa(valueText)];
  }
  if (lower.includes("ultimate") || lower.includes("uts") || lower.includes("tensile")) {
    return ["tensile_strength_mpa", toMpa(valueText)];
  }
  if (lower.includes("thermal conduct")) {
    return ["thermal_conductivity_w_mk", toThermalConductivity(valueText)];
  }
  if (lower.includes("expansion") || lower.includes("cte") || lower.includes("linear coef")) {
    return ["thermal_expansion_ppm_k", toExpansion(valueText)];
  }
  if (lower.includes("modulus") || lower.includes("young") || lower.includes("elastic")) {
    return ["elastic_modulus_gpa", representativeValue(valueText)];
  }
  if (lower.includes("resistiv") || lower.includes("ω")) {
    return ["electrical_resistivity_ohm_m", toResistivity(valueText)];
  }
  if (lower.includes("melt")) {
    return ["melting_point_c", toTempC(valueText)];
  }
  return [null, null];
}

function mergeEntry(current, update) {
  return {
    ...current,
    ...Object.fromEntries(
      Object.entries(update).filter(([, value]) => value !== null && value !== undefined)
    )
  };
}

function parseTables($, url) {
  const entries = new Map();
  const tables = $("table");

  tables.each((_, table) => {
    const rows = $(table).find("tr");
    if (rows.length < 2) return;

    const headers = $(rows[0])
      .find("th,td")
      .map((__, cell) => $(cell).text().trim())
      .get();

    rows.slice(1).each((__, row) => {
      const cells = $(row)
        .find("td,th")
        .map((___, cell) => $(cell).text().trim())
        .get();
      if (cells.length < 2) return;

      const name = cells[0];
      if (!name || name.toLowerCase().includes("material")) return;

      const key = normalizeName(name);
      const current = entries.get(key) ?? {
        id: `toolbox-${slugify(name)}`,
        name,
        category: classifyCategory(name),
        subcategory: "EngineeringToolbox",
        density_g_cm3: null,
        tensile_strength_mpa: null,
        yield_strength_mpa: null,
        elastic_modulus_gpa: null,
        hardness_vickers: null,
        thermal_conductivity_w_mk: null,
        specific_heat_j_gk: null,
        melting_point_c: null,
        glass_transition_c: null,
        max_service_temp_c: null,
        thermal_expansion_ppm_k: null,
        electrical_resistivity_ohm_m: null,
        corrosion_resistance: null,
        machinability: "n/a",
        printability_fdm: "n/a",
        cost_usd_kg: null,
        tags: ["engineeringtoolbox"],
        data_source: "EngineeringToolbox",
        source: "EngineeringToolbox",
        scrape_url: url,
        data_quality: "scraped"
      };

      const update = {};
      for (let index = 1; index < cells.length; index += 1) {
        const [field, value] = mapHeaderToField(headers[index] ?? "", cells[index]);
        if (field) {
          update[field] = value;
        }
      }

      entries.set(key, mergeEntry(current, update));
    });
  });

  return [...entries.values()];
}

export async function run() {
  const merged = new Map();

  for (const url of PAGES) {
    const $ = await fetchHtml(url);
    if (!$) continue;

    const pageEntries = parseTables($, url);
    for (const entry of pageEntries) {
      const key = normalizeName(entry.name);
      merged.set(key, mergeEntry(merged.get(key) ?? entry, entry));
    }
  }

  const output = dedupeByNormalizedName([...merged.values()]);
  writeJson(OUTPUT_PATH, output);
  console.log(`[scrape] EngineeringToolbox wrote ${output.length}`);
  return output;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
