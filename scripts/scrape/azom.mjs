import { slugify, writeJson } from "../lib/pipeline-utils.mjs";
import {
  classifyCategory,
  extractStandards,
  fetchHtml,
  saveProgressEvery,
  toDensityGcm3,
  toExpansion,
  toMpa,
  toResistivity,
  toTempC,
  toThermalConductivity
} from "./common.mjs";

const OUTPUT_PATH = "scripts/scrape/azom-raw.json";
const INDEX_URL = "https://www.azom.com/materials.aspx";

function mapProperty(label, text) {
  const lower = label.toLowerCase();
  if (lower.includes("tensile strength") && lower.includes("ultimate")) return ["tensile_strength_mpa", toMpa(text)];
  if (lower.includes("tensile strength") && lower.includes("yield")) return ["yield_strength_mpa", toMpa(text)];
  if (lower.includes("elongation")) return ["elongation_pct", parseFloat(text)];
  if (lower.includes("density")) return ["density_g_cm3", toDensityGcm3(text)];
  if (lower.includes("hardness") && lower.includes("vickers")) return ["hardness_vickers", parseFloat(text)];
  if (lower.includes("hardness") && lower.includes("rockwell c")) return ["hardness_rockwell_c", parseFloat(text)];
  if (lower.includes("hardness") && lower.includes("brinell")) return ["hardness_brinell", parseFloat(text)];
  if (lower.includes("thermal conductivity")) return ["thermal_conductivity_w_mk", toThermalConductivity(text)];
  if (lower.includes("cte") || lower.includes("linear")) return ["thermal_expansion_ppm_k", toExpansion(text)];
  if (lower.includes("electrical resistivity")) return ["electrical_resistivity_ohm_m", toResistivity(text)];
  if (lower.includes("melting point")) return ["melting_point_c", toTempC(text)];
  if (lower.includes("maximum service temp")) return ["max_service_temp_c", toTempC(text)];
  if (lower.includes("flexural strength")) return ["flexural_strength_mpa", toMpa(text)];
  if (lower.includes("compressive strength")) return ["compressive_strength_mpa", toMpa(text)];
  if (lower.includes("young")) return ["elastic_modulus_gpa", parseFloat(text)];
  if (lower.includes("poisson")) return ["poissons_ratio", parseFloat(text)];
  if (lower.includes("fracture toughness")) return ["fracture_toughness_mpa_m05", parseFloat(text)];
  return [null, null];
}

function blankEntry(name, category, url, standards) {
  return {
    id: `azom-${slugify(name)}`,
    name,
    category: classifyCategory(name, category),
    subcategory: category || "AZoM",
    density_g_cm3: null,
    tensile_strength_mpa: null,
    yield_strength_mpa: null,
    elastic_modulus_gpa: null,
    hardness_vickers: null,
    hardness_rockwell_c: null,
    hardness_brinell: null,
    elongation_pct: null,
    thermal_conductivity_w_mk: null,
    specific_heat_j_gk: null,
    melting_point_c: null,
    glass_transition_c: null,
    max_service_temp_c: null,
    thermal_expansion_ppm_k: null,
    electrical_resistivity_ohm_m: null,
    flexural_strength_mpa: null,
    compressive_strength_mpa: null,
    poissons_ratio: null,
    fracture_toughness_mpa_m05: null,
    corrosion_resistance: null,
    machinability: "n/a",
    printability_fdm: "n/a",
    cost_usd_kg: null,
    tags: ["azom"],
    standards,
    data_source: "AZoM",
    source: "AZoM",
    scrape_url: url,
    data_quality: "scraped"
  };
}

async function collectCategoryLinks() {
  const $ = await fetchHtml(INDEX_URL);
  if (!$) return [];
  const links = new Set();

  $("a[href*='materials.aspx?MaterialTypeID=']").each((_, link) => {
    const href = $(link).attr("href");
    if (!href) return;
    links.add(new URL(href, INDEX_URL).toString());
  });

  return [...links];
}

async function collectArticleLinks(categoryUrl) {
  const $ = await fetchHtml(categoryUrl);
  if (!$) return [];
  const links = new Set();

  $("a[href*='article.aspx?ArticleID=']").each((_, link) => {
    const href = $(link).attr("href");
    if (!href) return;
    links.add(new URL(href, categoryUrl).toString());
  });

  return [...links];
}

async function scrapeArticle(url) {
  const $ = await fetchHtml(url);
  if (!$) return null;

  const name = $("h1").first().text().trim();
  const breadcrumb = $(".breadcrumbs a, nav.breadcrumb a")
    .map((_, link) => $(link).text().trim())
    .get()
    .filter(Boolean);
  const category = breadcrumb.at(-1) ?? "AZoM";
  const standards = extractStandards($.text());
  const entry = blankEntry(name, category, url, standards);

  $("table tr").each((_, row) => {
    const cells = $(row)
      .find("th,td")
      .map((__, cell) => $(cell).text().trim())
      .get();
    if (cells.length < 2) return;
    const [field, value] = mapProperty(cells[0], cells[1]);
    if (field) entry[field] = value;
  });

  return entry;
}

export async function run() {
  const entries = [];
  const categoryLinks = await collectCategoryLinks();
  const articleLinks = new Set();

  for (const categoryUrl of categoryLinks) {
    const links = await collectArticleLinks(categoryUrl);
    links.forEach((link) => articleLinks.add(link));
  }

  let count = 0;
  for (const articleUrl of articleLinks) {
    const entry = await scrapeArticle(articleUrl);
    if (entry) {
      entries.push(entry);
      count += 1;
      saveProgressEvery(count, OUTPUT_PATH, entries);
    }
  }

  writeJson(OUTPUT_PATH, entries);
  console.log(`[scrape] AZoM wrote ${entries.length}`);
  return entries;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
