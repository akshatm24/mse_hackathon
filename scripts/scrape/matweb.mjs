import { chromium } from "playwright";

import { slugify, writeJson } from "../lib/pipeline-utils.mjs";
import {
  classifyCategory,
  isAllowedByRobots,
  saveProgressEvery
} from "./common.mjs";

const OUTPUT_PATH = "scripts/scrape/matweb-raw.json";
const SEARCH_URL = "https://www.matweb.com/search/MaterialGroupSearch.aspx";
const MAX_MATERIALS = 300;
const MAX_DURATION_MS = 45 * 60 * 1000;

function blankEntry(name, url) {
  return {
    id: `matweb-${slugify(name)}`,
    name,
    category: classifyCategory(name),
    subcategory: "MatWeb",
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
    tags: ["matweb"],
    data_source: "MatWeb",
    source: "MatWeb",
    scrape_url: url,
    data_quality: "scraped"
  };
}

function mapRow(entry, label, value) {
  const lower = label.toLowerCase();
  if (lower.includes("density")) entry.density_g_cm3 = parseFloat(value);
  if (lower.includes("tensile strength, ultimate")) entry.tensile_strength_mpa = parseFloat(value);
  if (lower.includes("tensile strength, yield")) entry.yield_strength_mpa = parseFloat(value);
  if (lower.includes("modulus of elasticity")) entry.elastic_modulus_gpa = parseFloat(value);
  if (lower.includes("thermal conductivity")) entry.thermal_conductivity_w_mk = parseFloat(value);
  if (lower.includes("melting point")) entry.melting_point_c = parseFloat(value);
}

export async function run() {
  if (!(await isAllowedByRobots(SEARCH_URL))) {
    console.log("[scrape] MatWeb disallowed by robots");
    writeJson(OUTPUT_PATH, []);
    return [];
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const started = Date.now();
  const entries = [];

  try {
    await page.goto(SEARCH_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);

    const categoryLinks = await page
      .locator("a")
      .evaluateAll((anchors) =>
        anchors
          .map((anchor) => anchor.href)
          .filter((href) => href && /MaterialGroupSearch|DataSheet|Search/i.test(href))
      );

    const uniqueLinks = [...new Set(categoryLinks)].slice(0, 40);

    for (const link of uniqueLinks) {
      if (entries.length >= MAX_MATERIALS || Date.now() - started > MAX_DURATION_MS) {
        break;
      }

      await page.goto(link, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(3000 + Math.floor(Math.random() * 3000));

      const blockedText = await page.textContent("body");
      if (/captcha|rate limit|forbidden|access denied/i.test(blockedText ?? "")) {
        console.log("[scrape] MatWeb rate limited or blocked, stopping.");
        break;
      }

      const materialLinks = await page
        .locator("a")
        .evaluateAll((anchors) =>
          anchors
            .map((anchor) => anchor.href)
            .filter((href) => href && /DataSheet\.aspx/i.test(href))
        );

      for (const materialUrl of [...new Set(materialLinks)]) {
        if (entries.length >= MAX_MATERIALS || Date.now() - started > MAX_DURATION_MS) {
          break;
        }

        await page.goto(materialUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.waitForTimeout(3000 + Math.floor(Math.random() * 3000));

        const bodyText = await page.textContent("body");
        if (/captcha|rate limit|forbidden|access denied/i.test(bodyText ?? "")) {
          console.log("[scrape] MatWeb rate limited during material parsing, stopping.");
          writeJson(OUTPUT_PATH, entries);
          return entries;
        }

        const name = (await page.locator("h1, #matName").first().textContent())?.trim();
        if (!name) continue;
        const entry = blankEntry(name, materialUrl);

        const rows = await page.locator("table tr").evaluateAll((trs) =>
          trs.map((tr) => Array.from(tr.querySelectorAll("th,td")).map((cell) => cell.textContent?.trim() ?? ""))
        );
        for (const row of rows) {
          if (row.length < 2) continue;
          mapRow(entry, row[0], row[1]);
        }

        entries.push(entry);
        saveProgressEvery(entries.length, OUTPUT_PATH, entries);
      }
    }
  } finally {
    await browser.close();
  }

  writeJson(OUTPUT_PATH, entries);
  console.log(`[scrape] MatWeb wrote ${entries.length}`);
  return entries;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
