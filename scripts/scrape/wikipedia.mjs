import { slugify, writeJson } from "../lib/pipeline-utils.mjs";
import {
  classifyCategory,
  dedupeByNormalizedName,
  fetchHtml,
  representativeValue,
  toDensityGcm3,
  toMpa,
  toResistivity,
  toTempC,
  toThermalConductivity
} from "./common.mjs";

const OUTPUT_PATH = "scripts/scrape/wikipedia-raw.json";

const PAGES = [
  "https://en.wikipedia.org/wiki/Aluminium_alloy",
  "https://en.wikipedia.org/wiki/Titanium_alloy",
  "https://en.wikipedia.org/wiki/Stainless_steel",
  "https://en.wikipedia.org/wiki/Nickel_superalloy",
  "https://en.wikipedia.org/wiki/Inconel",
  "https://en.wikipedia.org/wiki/Hastelloy",
  "https://en.wikipedia.org/wiki/Waspaloy",
  "https://en.wikipedia.org/wiki/Tool_steel",
  "https://en.wikipedia.org/wiki/Maraging_steel",
  "https://en.wikipedia.org/wiki/High_strength_low-alloy_steel",
  "https://en.wikipedia.org/wiki/Duplex_stainless_steel",
  "https://en.wikipedia.org/wiki/Copper_alloy",
  "https://en.wikipedia.org/wiki/Brass",
  "https://en.wikipedia.org/wiki/Bronze",
  "https://en.wikipedia.org/wiki/Magnesium_alloy",
  "https://en.wikipedia.org/wiki/Zinc_alloy",
  "https://en.wikipedia.org/wiki/Cobalt_alloys",
  "https://en.wikipedia.org/wiki/Refractory_metals",
  "https://en.wikipedia.org/wiki/Shape-memory_alloy",
  "https://en.wikipedia.org/wiki/Superalloy",
  "https://en.wikipedia.org/wiki/Polyether_ether_ketone",
  "https://en.wikipedia.org/wiki/Polyimide",
  "https://en.wikipedia.org/wiki/Polyamide",
  "https://en.wikipedia.org/wiki/Polycarbonate",
  "https://en.wikipedia.org/wiki/Polytetrafluoroethylene",
  "https://en.wikipedia.org/wiki/Ultra-high-molecular-weight_polyethylene",
  "https://en.wikipedia.org/wiki/Polyetherimide",
  "https://en.wikipedia.org/wiki/Polyphenylene_sulfide",
  "https://en.wikipedia.org/wiki/Silicon_carbide",
  "https://en.wikipedia.org/wiki/Silicon_nitride",
  "https://en.wikipedia.org/wiki/Aluminium_oxide",
  "https://en.wikipedia.org/wiki/Zirconium_dioxide",
  "https://en.wikipedia.org/wiki/Boron_carbide",
  "https://en.wikipedia.org/wiki/Boron_nitride",
  "https://en.wikipedia.org/wiki/Titanium_nitride",
  "https://en.wikipedia.org/wiki/Titanium_carbide",
  "https://en.wikipedia.org/wiki/Tungsten_carbide",
  "https://en.wikipedia.org/wiki/MAX_phases",
  "https://en.wikipedia.org/wiki/Solder",
  "https://en.wikipedia.org/wiki/Lead-free_solder",
  "https://en.wikipedia.org/wiki/Brazing",
  "https://en.wikipedia.org/wiki/Carbon-fiber-reinforced_polymers",
  "https://en.wikipedia.org/wiki/Glass-fiber-reinforced_polymer",
  "https://en.wikipedia.org/wiki/Metal_matrix_composite",
  "https://en.wikipedia.org/wiki/Ceramic_matrix_composite"
];

function headerField(header) {
  const lower = header.toLowerCase();
  if (lower.includes("density") || lower.includes("g/cm")) return "density_g_cm3";
  if (lower.includes("tensile") || lower.includes("strength") || lower.includes("uts")) return "tensile_strength_mpa";
  if (lower.includes("yield")) return "yield_strength_mpa";
  if (lower.includes("modulus") || lower.includes("gpa")) return "elastic_modulus_gpa";
  if (lower.includes("thermal conduct")) return "thermal_conductivity_w_mk";
  if (lower.includes("resistiv")) return "electrical_resistivity_ohm_m";
  if (lower.includes("melting")) return "melting_point_c";
  return null;
}

function normalizeFieldValue(field, text) {
  if (field === "density_g_cm3") return toDensityGcm3(text);
  if (field === "tensile_strength_mpa" || field === "yield_strength_mpa") return toMpa(text);
  if (field === "elastic_modulus_gpa") return representativeValue(text);
  if (field === "thermal_conductivity_w_mk") return toThermalConductivity(text);
  if (field === "electrical_resistivity_ohm_m") return toResistivity(text);
  if (field === "melting_point_c") return toTempC(text);
  return representativeValue(text);
}

function blankEntry(name, url) {
  return {
    id: `wiki-${slugify(name)}`,
    name,
    category: classifyCategory(name),
    subcategory: "Wikipedia",
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
    tags: ["wikipedia"],
    data_source: "Wikipedia",
    source: "Wikipedia",
    scrape_url: url,
    data_quality: "scraped"
  };
}

function parsePropertyTables($, url, pageTitle) {
  const output = [];

  $("table.wikitable").each((_, table) => {
    const headers = $(table)
      .find("tr")
      .first()
      .find("th,td")
      .map((__, cell) => $(cell).text().trim())
      .get();

    if (!headers.some((header) => /mpa|gpa|density|strength|thermal|resist/i.test(header))) {
      return;
    }

    $(table)
      .find("tr")
      .slice(1)
      .each((__, row) => {
        const cells = $(row)
          .find("th,td")
          .map((___, cell) => $(cell).text().trim())
          .get();
        if (cells.length < 2) return;

        const name = cells[0] || pageTitle;
        const entry = blankEntry(name, url);
        for (let index = 1; index < Math.min(cells.length, headers.length); index += 1) {
          const field = headerField(headers[index]);
          if (!field) continue;
          entry[field] = normalizeFieldValue(field, cells[index]);
        }
        output.push(entry);
      });
  });

  $("table.infobox tr").each((_, row) => {
    const label = $(row).find("th").first().text().trim();
    const value = $(row).find("td").first().text().trim();
    const field = headerField(label);
    if (!field) return;

    const entry = blankEntry(pageTitle, url);
    entry[field] = normalizeFieldValue(field, value);
    output.push(entry);
  });

  return output;
}

export async function run() {
  const entries = [];

  for (const url of PAGES) {
    const $ = await fetchHtml(url);
    if (!$) continue;
    const title = $("#firstHeading").text().trim() || new URL(url).pathname.split("/").pop();
    entries.push(...parsePropertyTables($, url, title));
  }

  const output = dedupeByNormalizedName(entries);
  writeJson(OUTPUT_PATH, output);
  console.log(`[scrape] Wikipedia wrote ${output.length}`);
  return output;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
