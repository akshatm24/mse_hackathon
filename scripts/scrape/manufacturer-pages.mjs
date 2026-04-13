import { slugify, writeJson } from "../lib/pipeline-utils.mjs";
import {
  classifyCategory,
  fetchHtml,
  isAllowedByRobots,
  saveProgressEvery,
  toDensityGcm3,
  toMpa,
  toTempC
} from "./common.mjs";

const OUTPUT_PATH = "scripts/scrape/manufacturer-raw.json";

const SITES = [
  {
    name: "Haynes",
    index: "https://www.haynesintl.com/alloys/alloy-portfolio",
    linkPattern: /(alloy|hastelloy|haynes)/i
  },
  {
    name: "SpecialMetals",
    index: "https://www.specialmetals.com/products",
    linkPattern: /(inconel|incoloy|monel|nimonic|waspaloy)/i
  },
  {
    name: "Carpenter",
    index: "https://www.carpentertechnology.com/alloy-tech-center",
    linkPattern: /(alloy|udimet|steel|nitronic)/i
  },
  {
    name: "ATI",
    index: "https://www.atimaterials.com/Products/Pages/default.aspx",
    linkPattern: /(titanium|alloy|nickel|ati)/i
  },
  {
    name: "Kennametal",
    index: "https://www.kennametal.com/en/products/grades.html",
    linkPattern: /(grade|carbide|wc)/i
  }
];

function blankEntry(name, source, url) {
  return {
    id: `mfg-${slugify(`${source}-${name}`)}`,
    name,
    category: classifyCategory(name),
    subcategory: source,
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
    tags: [source.toLowerCase()],
    data_source: `${source} datasheet page`,
    source,
    scrape_url: url,
    data_quality: "scraped"
  };
}

function mapManufacturerField(label, text) {
  const lower = label.toLowerCase();
  if (lower.includes("density")) return ["density_g_cm3", toDensityGcm3(text)];
  if (lower.includes("tensile") && lower.includes("ultimate")) return ["tensile_strength_mpa", toMpa(text)];
  if (lower.includes("tensile") && lower.includes("yield")) return ["yield_strength_mpa", toMpa(text)];
  if (lower.includes("yield strength")) return ["yield_strength_mpa", toMpa(text)];
  if (lower.includes("ultimate tensile")) return ["tensile_strength_mpa", toMpa(text)];
  if (lower.includes("elongation")) return ["elongation_pct", parseFloat(text)];
  if (lower.includes("max") && lower.includes("temp")) return ["max_service_temp_c", toTempC(text)];
  if (lower.includes("service temperature")) return ["max_service_temp_c", toTempC(text)];
  return [null, null];
}

async function productLinksForSite(site) {
  if (!(await isAllowedByRobots(site.index))) {
    console.log(`[scrape] Blocked by ${site.name}`);
    return [];
  }

  const $ = await fetchHtml(site.index, { minDelay: 2000, maxDelay: 2200 });
  if (!$) return [];

  const links = new Set();
  $("a[href]").each((_, anchor) => {
    const href = $(anchor).attr("href");
    const text = $(anchor).text().trim();
    if (!href || !site.linkPattern.test(`${href} ${text}`)) return;
    const absolute = new URL(href, site.index).toString();
    if (new URL(absolute).origin !== new URL(site.index).origin) return;
    links.add(absolute);
  });

  return [...links].slice(0, 50);
}

async function scrapeProduct(site, url) {
  const $ = await fetchHtml(url, { minDelay: 2000, maxDelay: 2200 });
  if (!$) return null;

  const name = $("h1").first().text().trim() || $("title").text().trim();
  const entry = blankEntry(name, site.name, url);

  $("table tr").each((_, row) => {
    const cells = $(row)
      .find("th,td")
      .map((__, cell) => $(cell).text().trim())
      .get();
    if (cells.length < 2) return;
    const [field, value] = mapManufacturerField(cells[0], cells[1]);
    if (field) entry[field] = value;
  });

  return entry;
}

export async function run() {
  const entries = [];
  let count = 0;

  for (const site of SITES) {
    const links = await productLinksForSite(site);
    for (const link of links) {
      const entry = await scrapeProduct(site, link);
      if (!entry) continue;
      entries.push(entry);
      count += 1;
      saveProgressEvery(count, OUTPUT_PATH, entries);
    }
  }

  writeJson(OUTPUT_PATH, entries);
  console.log(`[scrape] Manufacturer pages wrote ${entries.length}`);
  return entries;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
