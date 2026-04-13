import { writeJson } from "../lib/pipeline-utils.mjs";
import { currentDatabase, fetchHtml } from "./common.mjs";

const OUTPUT_PATH = "scripts/scrape/nist-raw.json";

function formulaCandidates() {
  const formulas = new Set();
  for (const material of currentDatabase()) {
    const formula = material.formula_pretty;
    if (!formula) continue;
    const elements = formula.match(/[A-Z][a-z]?/g) ?? [];
    if (new Set(elements).size <= 2) {
      formulas.add(formula);
    }
  }
  return [...formulas];
}

function parseValue(label, text) {
  const regex = new RegExp(`${label}[^\\d-]*(-?\\d+(?:\\.\\d+)?)`, "i");
  const match = text.match(regex);
  return match ? Number.parseFloat(match[1]) : null;
}

export async function run() {
  const formulas = formulaCandidates();
  const entries = [];

  for (const formula of formulas) {
    const url = `https://webbook.nist.gov/cgi/cbook.cgi?ID=${encodeURIComponent(formula)}&Type=SatP`;
    const $ = await fetchHtml(url, { minDelay: 500, maxDelay: 500, skipRobots: true });
    if (!$) continue;

    const text = $("body").text().replace(/\s+/g, " ");
    entries.push({
      formula_pretty: formula,
      source: "NIST",
      scrape_url: url,
      melting_point_c: parseValue("melting point", text),
      boiling_point_c: parseValue("boiling point", text),
      specific_heat_j_gk: parseValue("heat capacity", text),
      enthalpy_kj_mol: parseValue("enthalpy", text)
    });
  }

  writeJson(OUTPUT_PATH, entries);
  console.log(`[scrape] NIST wrote ${entries.length}`);
  return entries;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
