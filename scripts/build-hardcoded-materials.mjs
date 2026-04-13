import axios from "axios";

import {
  APP_DB_PATH,
  HARDCODED_PATH,
  normalizeMaterial,
  normalizeName,
  readJson,
  slugify,
  writeJson
} from "./lib/pipeline-utils.mjs";

const SEEDS = [
  ["Inconel 600", "Metal", "Hardcoded-SpecialMetals", "https://www.specialmetals.com/documents/technical-bulletins/inconel/inconel-alloy-600.pdf"],
  ["Inconel 601", "Metal", "Hardcoded-SpecialMetals", "https://www.specialmetals.com/documents/technical-bulletins/inconel/inconel-alloy-601.pdf"],
  ["Inconel 625", "Metal", "Hardcoded-SpecialMetals", "https://www.specialmetals.com/documents/technical-bulletins/inconel/inconel-alloy-625.pdf"],
  ["Inconel 718", "Metal", "Hardcoded-SpecialMetals", "https://www.specialmetals.com/documents/technical-bulletins/inconel/inconel-alloy-718.pdf"],
  ["Incoloy 825", "Metal", "Hardcoded-SpecialMetals", "https://www.specialmetals.com/documents/technical-bulletins/incoloy/incoloy-alloy-825.pdf"],
  ["Monel 400", "Metal", "Hardcoded-SpecialMetals", "https://www.specialmetals.com/documents/technical-bulletins/monel/monel-alloy-400.pdf"],
  ["Monel K-500", "Metal", "Hardcoded-SpecialMetals", "https://www.specialmetals.com/documents/technical-bulletins/monel/monel-alloy-k-500.pdf"],
  ["Waspaloy", "Metal", "Hardcoded-SpecialMetals", "https://www.specialmetals.com/documents/technical-bulletins/waspaloy.pdf"],
  ["Hastelloy C-22", "Metal", "Hardcoded-Haynes", "https://haynes.com/en-us/alloys/hastelloy/hastelloy-c-22-alloy"],
  ["Hastelloy C-276", "Metal", "Hardcoded-Haynes", "https://haynes.com/en-us/alloys/hastelloy/hastelloy-c-276-alloy"],
  ["Hastelloy X", "Metal", "Hardcoded-Haynes", "https://haynes.com/en-us/alloys/hastelloy/hastelloy-x-alloy"],
  ["Haynes 230", "Metal", "Hardcoded-Haynes", "https://haynes.com/en-us/alloys/haynes/haynes-230-alloy"],
  ["Stainless Steel 2205 Duplex", "Metal", "Hardcoded-Atlas", "https://www.atlassteels.com.au/steel-grades/duplex-2205-stainless-steel/"],
  ["Stainless Steel 2507 Super Duplex", "Metal", "Hardcoded-Atlas", "https://www.atlassteels.com.au/steel-grades/super-duplex-2507-stainless-steel/"],
  ["Ti-6Al-4V ELI", "Metal", "Hardcoded-Titanium", "https://www.titanium.com/en/document-library"],
  ["Rhodium (Rh)", "Metal", "Hardcoded-NIST", "https://webbook.nist.gov/cgi/cbook.cgi?ID=C7440166&Mask=2"],
  ["Al-SiC MMC 20% SiC", "Composite", "Hardcoded-ASM", "https://www.azom.com/article.aspx?ArticleID=1438"],
  ["Al-SiC MMC 40% SiC", "Composite", "Hardcoded-ASM", "https://www.azom.com/article.aspx?ArticleID=1438"],
  ["CFRP Quasi-Isotropic Laminate", "Composite", "Hardcoded-Hexcel", "https://www.hexcel.com/Resources/DataSheets"],
  ["PEEK-CF30", "Polymer", "Hardcoded-MatWeb", "https://www.matweb.com/search/DataSheet.aspx?MatGUID=7f99dcb2ef314c0d9dc86c5969a1a7b2"],
  ["WE43-T6", "Metal", "Hardcoded-MagnesiumElektron", "https://www.magnesium-elektron.com/materials/"],
  ["Nitinol 50/50", "Metal", "Hardcoded-ASM", "https://www.azom.com/article.aspx?ArticleID=1180"],
  ["MP35N", "Metal", "Hardcoded-ASM", "https://www.azom.com/article.aspx?ArticleID=8342"],
  ["W-Cu 20", "Composite", "Hardcoded-Plansee", "https://www.plansee.com/en/materials/tungsten-copper.html"],
  ["Elgiloy / Phynox", "Metal", "Hardcoded-ASM", "https://www.azom.com/article.aspx?ArticleID=8100"],
  ["SAC405 (Sn95.5Ag4Cu0.5)", "Solder", "Hardcoded-Indium", "https://www.indium.com/resources/datasheets/"],
  ["Sn42Bi58", "Solder", "Hardcoded-Indium", "https://www.indium.com/resources/datasheets/"],
  ["In52Sn48", "Solder", "Hardcoded-Indium", "https://www.indium.com/resources/datasheets/"]
];

function blankMaterial(name, category, source, url) {
  return normalizeMaterial({
    id: `hc-${slugify(name)}`,
    name,
    category,
    subcategory: "Hardcoded Cited",
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
    tags: ["hardcoded-cited"],
    data_source: source,
    source,
    source_url: url,
    data_quality: "hardcoded-cited"
  });
}

async function canReach(url) {
  try {
    await axios.get(url, { timeout: 20000, maxRedirects: 5, responseType: "text" });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const database = (readJson(APP_DB_PATH, []) ?? []).map((material) => normalizeMaterial(material));
  const byName = new Map(database.map((material) => [normalizeName(material.name), material]));
  const output = [];

  for (const [name, category, source, url] of SEEDS) {
    const reachable = await canReach(url);
    const match =
      byName.get(normalizeName(name)) ??
      [...byName.values()].find((material) => normalizeName(material.name).includes(normalizeName(name)));

    if (match) {
      output.push(
        normalizeMaterial({
          ...match,
          id: `hc-${slugify(name)}`,
          name,
          category,
          subcategory: match.subcategory || "Hardcoded Cited",
          source,
          source_url: url,
          data_source: `${source}${reachable ? "" : " (cached mapping)"}`,
          data_quality: "hardcoded-cited"
        })
      );
      continue;
    }

    output.push(blankMaterial(name, category, source, url));
  }

  writeJson(HARDCODED_PATH, output);
  console.log(`Hardcoded entries added: ${output.length}`);
}

main();
