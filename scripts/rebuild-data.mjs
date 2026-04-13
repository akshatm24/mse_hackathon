import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "src", "lib", "materials-db.json");
const OUTPUT_DIR = path.join(ROOT, "src", "data");
const CURATED_OUTPUT = path.join(OUTPUT_DIR, "materials.json");
const MP_OUTPUT = path.join(OUTPUT_DIR, "mp_materials.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function firstSource(source) {
  if (Array.isArray(source)) {
    return source[0] ?? "";
  }

  return source ?? "";
}

function normaliseSourceKind(material) {
  if (material.source_kind === "materials-project") {
    return "mp";
  }

  if (material.source_kind === "mp") {
    return "mp";
  }

  if (
    material.data_quality === "hardcoded-cited" ||
    /Hardcoded-|SpecialMetals|Haynes|Carpenter|ATI|Kennametal|Manufacturer/i.test(
      firstSource(material.source)
    )
  ) {
    return "hardcoded";
  }

  return material.source_kind ?? "curated";
}

function qualityStrength(material) {
  const rank = {
    validated: 6,
    curated: 5,
    experimental: 4,
    "hardcoded-cited": 4,
    scraped: 3,
    estimated: 2,
    "mp-calculated": 1
  };

  let score = rank[material.data_quality ?? "experimental"] ?? 0;
  if (material.source_url) score += 8;
  if (material.scrape_url) score += 2;
  if (material.source_kind === "hardcoded") score += 3;
  if (material.source_kind === "curated") score += 2;
  if (material.source_kind === "mp") score -= 1;
  return score;
}

function deduplicateById(materials) {
  const seen = new Map();

  for (const material of materials) {
    const existing = seen.get(material.id);
    if (!existing) {
      seen.set(material.id, material);
      continue;
    }

    if (qualityStrength(material) > qualityStrength(existing)) {
      seen.set(material.id, material);
    }
  }

  return [...seen.values()];
}

function withDefaults(material) {
  const sourceKind = normaliseSourceKind(material);
  const source = material.source ?? material.data_source ?? (sourceKind === "mp" ? "Materials Project" : "Curated");
  const dataSource = material.data_source ?? firstSource(source) ?? "Curated";
  const hasMPSlug =
    sourceKind === "mp" && material.material_id && !material.source_url;

  return {
    id: material.id,
    name: material.name,
    category: material.category,
    subcategory: material.subcategory ?? "",
    density_g_cm3: material.density_g_cm3 ?? null,
    tensile_strength_mpa: material.tensile_strength_mpa ?? null,
    yield_strength_mpa: material.yield_strength_mpa ?? null,
    elastic_modulus_gpa: material.elastic_modulus_gpa ?? null,
    hardness_vickers: material.hardness_vickers ?? null,
    hardness_rockwell_c: material.hardness_rockwell_c ?? null,
    hardness_brinell: material.hardness_brinell ?? null,
    elongation_pct: material.elongation_pct ?? null,
    thermal_conductivity_w_mk: material.thermal_conductivity_w_mk ?? null,
    specific_heat_j_gk: material.specific_heat_j_gk ?? null,
    melting_point_c: material.melting_point_c ?? null,
    glass_transition_c: material.glass_transition_c ?? null,
    max_service_temp_c: material.max_service_temp_c ?? null,
    thermal_expansion_ppm_k: material.thermal_expansion_ppm_k ?? null,
    electrical_resistivity_ohm_m: material.electrical_resistivity_ohm_m ?? null,
    flexural_strength_mpa: material.flexural_strength_mpa ?? null,
    compressive_strength_mpa: material.compressive_strength_mpa ?? null,
    poissons_ratio: material.poissons_ratio ?? null,
    fracture_toughness_mpa_m05: material.fracture_toughness_mpa_m05 ?? null,
    corrosion_resistance: material.corrosion_resistance ?? null,
    machinability: material.machinability ?? "n/a",
    printability_fdm: material.printability_fdm ?? (material.fdm_printable ? "fair" : "n/a"),
    cost_usd_kg: material.cost_usd_kg ?? null,
    tags: Array.isArray(material.tags) ? [...new Set(material.tags)] : [],
    data_source: dataSource,
    source,
    source_url:
      material.source_url ??
      (hasMPSlug
        ? `https://next-gen.materialsproject.org/materials/${material.material_id}`
        : null),
    scrape_url: material.scrape_url ?? null,
    data_quality: material.data_quality ?? "experimental",
    source_kind: sourceKind,
    formula_pretty: material.formula_pretty ?? null,
    material_id: material.material_id ?? null,
    energy_above_hull: material.energy_above_hull ?? null,
    band_gap_eV: material.band_gap_eV ?? null,
    is_stable:
      typeof material.is_stable === "boolean"
        ? material.is_stable
        : material.energy_above_hull === 0,
    standards: Array.isArray(material.standards) ? [...new Set(material.standards)] : [],
    data_enriched_from_mp: Boolean(material.data_enriched_from_mp),
    biocompatible: Boolean(material.biocompatible),
    magnetic:
      typeof material.magnetic === "boolean" ? material.magnetic : undefined,
    fdm_printable:
      typeof material.fdm_printable === "boolean"
        ? material.fdm_printable
        : material.printability_fdm &&
            material.printability_fdm !== "n/a" &&
            material.printability_fdm !== "poor"
  };
}

function curatedMaterial(material) {
  return withDefaults({
    hardness_vickers: null,
    hardness_rockwell_c: null,
    hardness_brinell: null,
    elongation_pct: null,
    specific_heat_j_gk: null,
    glass_transition_c: null,
    electrical_resistivity_ohm_m: null,
    flexural_strength_mpa: null,
    compressive_strength_mpa: null,
    poissons_ratio: null,
    fracture_toughness_mpa_m05: null,
    printability_fdm: "n/a",
    data_source: material.source,
    source_kind: "curated",
    data_quality: "validated",
    standards: [],
    tags: [],
    biocompatible: false,
    magnetic: undefined,
    fdm_printable: false,
    ...material
  });
}

const additions = [
  {
    id: "inconel_625",
    name: "Inconel 625 (UNS N06625)",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.44,
    tensile_strength_mpa: 930,
    yield_strength_mpa: 517,
    elastic_modulus_gpa: 207,
    max_service_temp_c: 982,
    thermal_conductivity_w_mk: 9.8,
    specific_heat_j_gk: 0.41,
    thermal_expansion_ppm_k: 12.8,
    melting_point_c: 1350,
    corrosion_resistance: "excellent",
    machinability: "fair",
    cost_usd_kg: 45,
    tags: ["aerospace", "marine", "high-temp", "nickel-alloy", "additive-lpbf"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["AMS 5599", "ASTM B443", "UNS N06625"]
  },
  {
    id: "nimonic_c263",
    name: "Nimonic C-263 (EN 2.4650, NiCo20Cr20MoTi)",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.36,
    tensile_strength_mpa: 970,
    yield_strength_mpa: 590,
    elastic_modulus_gpa: 222,
    max_service_temp_c: 950,
    thermal_conductivity_w_mk: 11.7,
    specific_heat_j_gk: 0.46,
    thermal_expansion_ppm_k: 11.9,
    melting_point_c: 1300,
    corrosion_resistance: "excellent",
    machinability: "fair",
    cost_usd_kg: 55,
    tags: ["aerospace", "gas-turbine", "high-temp", "nickel-alloy", "combustion-liner"],
    source: "makeitfrom.com / MatWeb",
    source_url:
      "https://www.makeitfrom.com/material-properties/EN-2.4650-NiCo20Cr20MoTi-Nickel-Alloy",
    standards: ["EN 2.4650", "DTD 5014", "AMS 5872"]
  },
  {
    id: "hastelloy_x",
    name: "Hastelloy X (UNS N06002)",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.22,
    tensile_strength_mpa: 785,
    yield_strength_mpa: 358,
    elastic_modulus_gpa: 196,
    max_service_temp_c: 1175,
    thermal_conductivity_w_mk: 9.1,
    specific_heat_j_gk: 0.46,
    thermal_expansion_ppm_k: 13.9,
    melting_point_c: 1290,
    corrosion_resistance: "excellent",
    machinability: "fair",
    cost_usd_kg: 60,
    tags: ["aerospace", "combustion", "high-temp", "nasa", "oxidation-resistant"],
    source: "NASA TPSX / MatWeb",
    source_url: "https://tpsx.arc.nasa.gov/",
    standards: ["AMS 5536", "ASTM B435"]
  },
  {
    id: "rene_41",
    name: "René 41 Nickel Superalloy",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.25,
    tensile_strength_mpa: 1420,
    yield_strength_mpa: 1100,
    elastic_modulus_gpa: 220,
    max_service_temp_c: 980,
    thermal_conductivity_w_mk: 10.4,
    specific_heat_j_gk: 0.46,
    thermal_expansion_ppm_k: 12.3,
    melting_point_c: 1315,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 80,
    tags: ["aerospace", "high-temp", "nickel-alloy", "nasa", "turbine-blade"],
    source: "NASA TPSX",
    source_url: "https://tpsx.arc.nasa.gov/",
    standards: ["AMS 5545", "AMS 5399"]
  },
  {
    id: "inconel_718",
    name: "Inconel 718 (UNS N07718)",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.19,
    tensile_strength_mpa: 1375,
    yield_strength_mpa: 1100,
    elastic_modulus_gpa: 211,
    max_service_temp_c: 700,
    thermal_conductivity_w_mk: 11.4,
    specific_heat_j_gk: 0.435,
    thermal_expansion_ppm_k: 13,
    melting_point_c: 1336,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 50,
    tags: ["aerospace", "turbine", "additive-lpbf", "high-strength", "nickel-alloy"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["AMS 5662", "AMS 5664", "ASTM B637", "UNS N07718"]
  },
  {
    id: "inconel_738lc",
    name: "Inconel 738LC",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.11,
    tensile_strength_mpa: 1090,
    yield_strength_mpa: 950,
    elastic_modulus_gpa: 200,
    max_service_temp_c: 980,
    thermal_conductivity_w_mk: 11,
    specific_heat_j_gk: 0.46,
    thermal_expansion_ppm_k: 12.1,
    melting_point_c: 1315,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 90,
    tags: ["gas-turbine", "blade", "high-temp", "nickel-alloy", "DS-casting"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["AMS 5376"]
  },
  {
    id: "waspaloy",
    name: "Waspaloy (UNS N07001)",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.19,
    tensile_strength_mpa: 1275,
    yield_strength_mpa: 795,
    elastic_modulus_gpa: 213,
    max_service_temp_c: 980,
    thermal_conductivity_w_mk: 10.2,
    specific_heat_j_gk: 0.43,
    thermal_expansion_ppm_k: 12.6,
    melting_point_c: 1330,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 85,
    tags: ["aerospace", "turbine-disk", "high-temp", "nickel-alloy"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["AMS 5544", "AMS 5709", "UNS N07001"]
  },
  {
    id: "mar_m247",
    name: "MAR-M 247 Nickel Superalloy",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.53,
    tensile_strength_mpa: 1000,
    yield_strength_mpa: 860,
    elastic_modulus_gpa: 200,
    max_service_temp_c: 1050,
    thermal_conductivity_w_mk: 10.6,
    specific_heat_j_gk: 0.46,
    thermal_expansion_ppm_k: 12.5,
    melting_point_c: 1330,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 110,
    tags: ["DS-casting", "turbine-blade", "high-temp", "nickel-alloy"],
    source: "NASA TPSX",
    source_url: "https://tpsx.arc.nasa.gov/",
    standards: ["AMS 5386"]
  },
  {
    id: "haynes_188",
    name: "Haynes 188 (Co-22Cr-22Ni-14W)",
    category: "Metal",
    subcategory: "Cobalt Superalloy",
    density_g_cm3: 9,
    tensile_strength_mpa: 945,
    yield_strength_mpa: 448,
    elastic_modulus_gpa: 232,
    max_service_temp_c: 1080,
    thermal_conductivity_w_mk: 10.5,
    specific_heat_j_gk: 0.42,
    thermal_expansion_ppm_k: 12.3,
    melting_point_c: 1330,
    corrosion_resistance: "excellent",
    machinability: "fair",
    cost_usd_kg: 70,
    tags: ["combustion", "high-temp", "cobalt-alloy", "aerospace"],
    source: "Haynes International datasheet / MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["AMS 5608", "UNS R30188"]
  },
  {
    id: "stellite_6",
    name: "Stellite 6 (Co-28Cr-4.5W)",
    category: "Metal",
    subcategory: "Cobalt Superalloy",
    density_g_cm3: 8.44,
    tensile_strength_mpa: 897,
    yield_strength_mpa: 655,
    elastic_modulus_gpa: 210,
    max_service_temp_c: 900,
    thermal_conductivity_w_mk: 14.7,
    specific_heat_j_gk: 0.42,
    thermal_expansion_ppm_k: 12.5,
    melting_point_c: 1285,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 65,
    tags: ["wear-resistant", "valve", "cobalt-alloy", "hard-facing"],
    source: "Kennametal / MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["AMS 5387", "UNS R30006"]
  },
  {
    id: "ti6al4v_elt",
    name: "Ti-6Al-4V ELI (Grade 23)",
    category: "Metal",
    subcategory: "Titanium Alloy",
    density_g_cm3: 4.43,
    tensile_strength_mpa: 860,
    yield_strength_mpa: 795,
    elastic_modulus_gpa: 114,
    max_service_temp_c: 315,
    thermal_conductivity_w_mk: 6.7,
    thermal_expansion_ppm_k: 8.6,
    melting_point_c: 1660,
    corrosion_resistance: "excellent",
    machinability: "fair",
    cost_usd_kg: 45,
    biocompatible: true,
    tags: ["biomedical", "implant", "aerospace", "additive-lpbf"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["ASTM F136", "AMS 4956"]
  },
  {
    id: "ti3al2.5v",
    name: "Ti-3Al-2.5V (Grade 9)",
    category: "Metal",
    subcategory: "Titanium Alloy",
    density_g_cm3: 4.48,
    tensile_strength_mpa: 620,
    yield_strength_mpa: 520,
    elastic_modulus_gpa: 107,
    max_service_temp_c: 290,
    thermal_conductivity_w_mk: 7.5,
    thermal_expansion_ppm_k: 9,
    melting_point_c: 1650,
    corrosion_resistance: "excellent",
    machinability: "good",
    cost_usd_kg: 28,
    tags: ["tubing", "bicycle", "aerospace", "lightweight"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["AMS 4944", "ASTM B338"]
  },
  {
    id: "cp_ti_gr2",
    name: "CP Titanium Grade 2",
    category: "Metal",
    subcategory: "Titanium Alloy",
    density_g_cm3: 4.51,
    tensile_strength_mpa: 345,
    yield_strength_mpa: 275,
    elastic_modulus_gpa: 103,
    max_service_temp_c: 260,
    thermal_conductivity_w_mk: 16.4,
    thermal_expansion_ppm_k: 8.6,
    melting_point_c: 1668,
    corrosion_resistance: "excellent",
    machinability: "good",
    cost_usd_kg: 22,
    biocompatible: true,
    tags: ["chemical-plant", "marine", "biomedical", "corrosion-resistant"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["ASTM B265 Gr2", "AMS 4902"]
  },
  {
    id: "ti5553",
    name: "Ti-5553 (Ti-5Al-5V-5Mo-3Cr)",
    category: "Metal",
    subcategory: "Titanium Alloy",
    density_g_cm3: 4.65,
    tensile_strength_mpa: 1200,
    yield_strength_mpa: 1100,
    elastic_modulus_gpa: 112,
    max_service_temp_c: 350,
    thermal_conductivity_w_mk: 6,
    thermal_expansion_ppm_k: 8.9,
    melting_point_c: 1650,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 60,
    tags: ["aerospace", "landing-gear", "high-strength", "boeing"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["AMS 4981"]
  },
  {
    id: "al7075_t6",
    name: "Aluminium 7075-T6",
    category: "Metal",
    subcategory: "Aluminium Alloy",
    density_g_cm3: 2.81,
    tensile_strength_mpa: 572,
    yield_strength_mpa: 503,
    elastic_modulus_gpa: 72,
    max_service_temp_c: 120,
    thermal_conductivity_w_mk: 130,
    thermal_expansion_ppm_k: 23.6,
    melting_point_c: 635,
    corrosion_resistance: "fair",
    machinability: "excellent",
    cost_usd_kg: 4.5,
    tags: ["aerospace", "structural", "high-strength", "machined"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["AMS 2770", "ASTM B209"]
  },
  {
    id: "al2024_t3",
    name: "Aluminium 2024-T3",
    category: "Metal",
    subcategory: "Aluminium Alloy",
    density_g_cm3: 2.78,
    tensile_strength_mpa: 483,
    yield_strength_mpa: 345,
    elastic_modulus_gpa: 73,
    max_service_temp_c: 150,
    thermal_conductivity_w_mk: 121,
    thermal_expansion_ppm_k: 23.2,
    melting_point_c: 638,
    corrosion_resistance: "fair",
    machinability: "excellent",
    cost_usd_kg: 4.2,
    tags: ["aerospace", "fuselage", "fatigue-resistant", "structural"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["AMS 2770", "MIL-A-8625"]
  },
  {
    id: "al6061_t6",
    name: "Aluminium 6061-T6",
    category: "Metal",
    subcategory: "Aluminium Alloy",
    density_g_cm3: 2.7,
    tensile_strength_mpa: 310,
    yield_strength_mpa: 276,
    elastic_modulus_gpa: 69,
    max_service_temp_c: 150,
    thermal_conductivity_w_mk: 167,
    thermal_expansion_ppm_k: 23.6,
    melting_point_c: 652,
    corrosion_resistance: "good",
    machinability: "excellent",
    cost_usd_kg: 2.5,
    tags: ["general-purpose", "structural", "weldable", "extrusion"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["AMS 2770", "ASTM B211"]
  },
  {
    id: "al_sic_mmc",
    name: "Al-SiC Metal Matrix Composite (20% SiC)",
    category: "Composite",
    subcategory: "Metal Matrix Composite",
    density_g_cm3: 2.9,
    tensile_strength_mpa: 420,
    yield_strength_mpa: 350,
    elastic_modulus_gpa: 110,
    max_service_temp_c: 250,
    thermal_conductivity_w_mk: 140,
    thermal_expansion_ppm_k: 14,
    melting_point_c: 650,
    corrosion_resistance: "good",
    machinability: "fair",
    cost_usd_kg: 25,
    tags: ["aerospace", "electronic-packaging", "high-modulus", "MMC"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/"
  },
  {
    id: "m2_hss",
    name: "M2 High Speed Steel",
    category: "Metal",
    subcategory: "Tool Steel",
    density_g_cm3: 8.16,
    tensile_strength_mpa: 900,
    yield_strength_mpa: 700,
    elastic_modulus_gpa: 210,
    max_service_temp_c: 600,
    thermal_conductivity_w_mk: 19,
    thermal_expansion_ppm_k: 11.1,
    melting_point_c: 1430,
    corrosion_resistance: "fair",
    machinability: "poor",
    cost_usd_kg: 8,
    tags: ["cutting-tool", "drill", "machining", "high-hardness"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["AISI M2", "AMS 6282"]
  },
  {
    id: "h13_tool",
    name: "H13 Hot Work Tool Steel",
    category: "Metal",
    subcategory: "Tool Steel",
    density_g_cm3: 7.8,
    tensile_strength_mpa: 1380,
    yield_strength_mpa: 1200,
    elastic_modulus_gpa: 215,
    max_service_temp_c: 600,
    thermal_conductivity_w_mk: 24.3,
    thermal_expansion_ppm_k: 11.5,
    melting_point_c: 1450,
    corrosion_resistance: "fair",
    machinability: "fair",
    cost_usd_kg: 7,
    tags: ["die-casting", "extrusion-die", "hot-work", "additive-lpbf"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["AISI H13", "DIN 1.2344"]
  },
  {
    id: "sic_cvd",
    name: "Silicon Carbide CVD (β-SiC)",
    category: "Ceramic",
    subcategory: "Non-Oxide Ceramic",
    density_g_cm3: 3.21,
    tensile_strength_mpa: 450,
    elastic_modulus_gpa: 460,
    max_service_temp_c: 1650,
    thermal_conductivity_w_mk: 120,
    thermal_expansion_ppm_k: 4,
    melting_point_c: 2730,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 200,
    tags: ["semiconductor", "mirror", "high-temp", "aerospace", "nuclear"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/"
  },
  {
    id: "bn_hex",
    name: "Hexagonal Boron Nitride (h-BN)",
    category: "Ceramic",
    subcategory: "Non-Oxide Ceramic",
    density_g_cm3: 2.1,
    tensile_strength_mpa: 60,
    elastic_modulus_gpa: 25,
    max_service_temp_c: 1000,
    thermal_conductivity_w_mk: 30,
    thermal_expansion_ppm_k: 1,
    melting_point_c: 2973,
    corrosion_resistance: "excellent",
    machinability: "excellent",
    cost_usd_kg: 150,
    tags: ["lubricant", "crucible", "machinable-ceramic", "thermal-interface"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/"
  },
  {
    id: "sic_cmc",
    name: "SiC/SiC Ceramic Matrix Composite",
    category: "Composite",
    subcategory: "Ceramic Matrix Composite",
    density_g_cm3: 2.7,
    tensile_strength_mpa: 350,
    elastic_modulus_gpa: 230,
    max_service_temp_c: 1315,
    thermal_conductivity_w_mk: 10,
    thermal_expansion_ppm_k: 4.5,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 3000,
    tags: ["turbine", "aerospace", "high-temp", "CMC", "next-gen"],
    source: "NASA TPSX",
    source_url: "https://tpsx.arc.nasa.gov/"
  },
  {
    id: "nitinol_55",
    name: "Nitinol 55 (NiTi, Ni-55%)",
    category: "Metal",
    subcategory: "Shape Memory Alloy",
    density_g_cm3: 6.45,
    tensile_strength_mpa: 895,
    yield_strength_mpa: 195,
    elastic_modulus_gpa: 83,
    max_service_temp_c: 100,
    thermal_conductivity_w_mk: 8.6,
    thermal_expansion_ppm_k: 11,
    melting_point_c: 1310,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 300,
    biocompatible: true,
    tags: ["actuator", "medical", "stent", "SMA", "superelastic"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["ASTM F2063"]
  },
  {
    id: "invar_36",
    name: "Invar 36 (Fe-36Ni)",
    category: "Metal",
    subcategory: "Low-Expansion Alloy",
    density_g_cm3: 8,
    tensile_strength_mpa: 485,
    yield_strength_mpa: 276,
    elastic_modulus_gpa: 148,
    max_service_temp_c: 200,
    thermal_conductivity_w_mk: 10.5,
    thermal_expansion_ppm_k: 1.2,
    melting_point_c: 1427,
    corrosion_resistance: "good",
    machinability: "fair",
    cost_usd_kg: 18,
    tags: ["low-expansion", "precision-instrument", "tooling", "mold"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["ASTM F1684", "UNS K93600"]
  },
  {
    id: "cfrp_ud_t700",
    name: "CFRP Unidirectional (Toray T700)",
    category: "Composite",
    subcategory: "Carbon Fibre Reinforced Polymer",
    density_g_cm3: 1.54,
    tensile_strength_mpa: 2550,
    elastic_modulus_gpa: 135,
    max_service_temp_c: 120,
    thermal_conductivity_w_mk: 5,
    thermal_expansion_ppm_k: -0.4,
    corrosion_resistance: "excellent",
    machinability: "fair",
    cost_usd_kg: 90,
    tags: ["aerospace", "structural", "high-modulus", "UD-prepreg"],
    source: "Toray datasheet / MatWeb",
    source_url: "https://www.matweb.com/"
  },
  {
    id: "cfrp_woven_t300",
    name: "CFRP Woven (Toray T300/Epoxy)",
    category: "Composite",
    subcategory: "Carbon Fibre Reinforced Polymer",
    density_g_cm3: 1.6,
    tensile_strength_mpa: 600,
    elastic_modulus_gpa: 70,
    max_service_temp_c: 120,
    thermal_conductivity_w_mk: 3,
    thermal_expansion_ppm_k: 1.5,
    corrosion_resistance: "excellent",
    machinability: "fair",
    cost_usd_kg: 60,
    tags: ["automotive", "sporting-goods", "structural", "woven"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/"
  },
  {
    id: "haynes_282",
    name: "Haynes 282",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.28,
    tensile_strength_mpa: 1034,
    yield_strength_mpa: 621,
    elastic_modulus_gpa: 224,
    max_service_temp_c: 930,
    thermal_conductivity_w_mk: 11.2,
    thermal_expansion_ppm_k: 13.2,
    melting_point_c: 1338,
    corrosion_resistance: "excellent",
    machinability: "fair",
    cost_usd_kg: 68,
    tags: ["aerospace", "weldable", "high-temp", "nickel-alloy"],
    source: "Haynes / MatWeb",
    source_url: "https://www.matweb.com/"
  },
  {
    id: "inconel_x750",
    name: "Inconel X-750",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.28,
    tensile_strength_mpa: 1170,
    yield_strength_mpa: 790,
    elastic_modulus_gpa: 214,
    max_service_temp_c: 815,
    thermal_conductivity_w_mk: 11.7,
    thermal_expansion_ppm_k: 12.6,
    melting_point_c: 1393,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 52,
    tags: ["spring", "aerospace", "fastener", "nickel-alloy"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/"
  },
  {
    id: "rene_80",
    name: "René 80",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.69,
    tensile_strength_mpa: 1100,
    yield_strength_mpa: 900,
    elastic_modulus_gpa: 213,
    max_service_temp_c: 980,
    thermal_conductivity_w_mk: 10.8,
    thermal_expansion_ppm_k: 13,
    melting_point_c: 1320,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 95,
    tags: ["turbine-blade", "cast", "high-temp", "nickel-alloy"],
    source: "NASA TPSX",
    source_url: "https://tpsx.arc.nasa.gov/"
  },
  {
    id: "udimet_720li",
    name: "Udimet 720Li",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.17,
    tensile_strength_mpa: 1450,
    yield_strength_mpa: 1105,
    elastic_modulus_gpa: 220,
    max_service_temp_c: 700,
    thermal_conductivity_w_mk: 11.1,
    thermal_expansion_ppm_k: 13,
    melting_point_c: 1325,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 88,
    tags: ["turbine-disk", "aerospace", "high-strength", "nickel-alloy"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/"
  },
  {
    id: "mp35n",
    name: "MP35N (Co-Ni-Cr-Mo)",
    category: "Metal",
    subcategory: "Cobalt-Nickel Alloy",
    density_g_cm3: 8.43,
    tensile_strength_mpa: 1790,
    yield_strength_mpa: 1550,
    elastic_modulus_gpa: 234,
    max_service_temp_c: 454,
    thermal_conductivity_w_mk: 12.5,
    thermal_expansion_ppm_k: 12.8,
    melting_point_c: 1440,
    corrosion_resistance: "excellent",
    machinability: "fair",
    cost_usd_kg: 140,
    tags: ["medical", "spring", "high-strength", "corrosion-resistant"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/"
  },
  {
    id: "cocrmo_f75",
    name: "CoCrMo Alloy (ASTM F75)",
    category: "Metal",
    subcategory: "Cobalt Alloy",
    density_g_cm3: 8.3,
    tensile_strength_mpa: 655,
    yield_strength_mpa: 450,
    elastic_modulus_gpa: 210,
    max_service_temp_c: 500,
    thermal_conductivity_w_mk: 14,
    thermal_expansion_ppm_k: 14,
    melting_point_c: 1390,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 95,
    biocompatible: true,
    tags: ["biomedical", "implant", "wear-resistant", "cobalt-alloy"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["ASTM F75"]
  },
  {
    id: "duplex_2205",
    name: "Duplex Stainless Steel 2205",
    category: "Metal",
    subcategory: "Duplex Stainless",
    density_g_cm3: 7.8,
    tensile_strength_mpa: 620,
    yield_strength_mpa: 450,
    elastic_modulus_gpa: 200,
    max_service_temp_c: 315,
    thermal_conductivity_w_mk: 19,
    thermal_expansion_ppm_k: 13.7,
    melting_point_c: 1420,
    corrosion_resistance: "excellent",
    machinability: "fair",
    cost_usd_kg: 4.8,
    tags: ["marine", "chemical", "duplex", "corrosion-resistant"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/",
    standards: ["UNS S32205", "ASTM A240"]
  },
  {
    id: "alsi10mg",
    name: "AlSi10Mg",
    category: "Metal",
    subcategory: "Aluminium Alloy",
    density_g_cm3: 2.67,
    tensile_strength_mpa: 430,
    yield_strength_mpa: 230,
    elastic_modulus_gpa: 70,
    max_service_temp_c: 200,
    thermal_conductivity_w_mk: 150,
    thermal_expansion_ppm_k: 21.5,
    melting_point_c: 595,
    corrosion_resistance: "good",
    machinability: "good",
    cost_usd_kg: 12,
    tags: ["additive-lpbf", "lightweight", "casting", "aerospace"],
    source: "MatWeb",
    source_url: "https://www.matweb.com/"
  }
].map(curatedMaterial);

function main() {
  const existing = readJson(SOURCE).map(withDefaults);
  const combined = deduplicateById([...existing, ...additions]).sort((left, right) =>
    left.id.localeCompare(right.id)
  );

  const curated = combined
    .filter((material) => material.source_kind !== "mp")
    .sort((left, right) => left.id.localeCompare(right.id));
  const mp = combined
    .filter((material) => material.source_kind === "mp")
    .sort((left, right) => left.id.localeCompare(right.id));

  writeJson(CURATED_OUTPUT, curated);
  writeJson(MP_OUTPUT, mp);

  console.log(`Curated entries: ${curated.length}`);
  console.log(`MP entries:      ${mp.length}`);
  console.log(`Total entries:   ${combined.length}`);
}

main();
