import { readFileSync, writeFileSync } from "fs";

const RAW_PATH = "scripts/mp-materials-raw.json";
const OUTPUT_PATH = "src/lib/mp-materials-generated.ts";
const MAX_VARIANTS_PER_FORMULA = 4;

const PROPERTY_LOOKUP = {
  Fe: { k: 80, cost: 0.5, Tmax: 700, corr: "poor" },
  Ni: { k: 91, cost: 15, Tmax: 600, corr: "good" },
  Co: { k: 100, cost: 33, Tmax: 600, corr: "good" },
  Cr: { k: 94, cost: 10, Tmax: 800, corr: "good" },
  Cu: { k: 401, cost: 9, Tmax: 200, corr: "good" },
  Al: { k: 237, cost: 2, Tmax: 150, corr: "good" },
  Ti: { k: 22, cost: 20, Tmax: 350, corr: "excellent" },
  W: { k: 173, cost: 55, Tmax: 2000, corr: "good" },
  Mo: { k: 138, cost: 40, Tmax: 1600, corr: "fair" },
  Nb: { k: 54, cost: 40, Tmax: 1200, corr: "good" },
  Ta: { k: 57, cost: 150, Tmax: 1500, corr: "excellent" },
  V: { k: 31, cost: 35, Tmax: 500, corr: "fair" },
  Pt: { k: 71, cost: 31000, Tmax: 1400, corr: "excellent" },
  Ag: { k: 429, cost: 800, Tmax: 200, corr: "good" },
  Au: { k: 317, cost: 62000, Tmax: 800, corr: "excellent" },
  Pd: { k: 72, cost: 49000, Tmax: 500, corr: "excellent" },
  Sn: { k: 67, cost: 25, Tmax: 160, corr: "good" },
  Pb: { k: 35, cost: 2.2, Tmax: 150, corr: "good" },
  Zn: { k: 116, cost: 2.8, Tmax: 200, corr: "fair" },
  Mg: { k: 156, cost: 2.5, Tmax: 150, corr: "poor" },
  Zr: { k: 23, cost: 37, Tmax: 400, corr: "excellent" },
  Al2O3: { k: 30, cost: 15, Tmax: 1600, corr: "excellent" },
  ZrO2: { k: 2.7, cost: 50, Tmax: 2400, corr: "excellent" },
  SiC: { k: 120, cost: 30, Tmax: 1600, corr: "excellent" },
  Si3N4: { k: 30, cost: 80, Tmax: 1300, corr: "excellent" },
  AlN: { k: 180, cost: 80, Tmax: 1000, corr: "good" },
  TiO2: { k: 11.8, cost: 5, Tmax: 1600, corr: "excellent" },
  MgO: { k: 37, cost: 2, Tmax: 2000, corr: "excellent" },
  TiN: { k: 19, cost: 200, Tmax: 600, corr: "good" },
  TiB2: { k: 65, cost: 200, Tmax: 1000, corr: "good" },
  BN: { k: 30, cost: 100, Tmax: 900, corr: "excellent" },
  Si: { k: 148, cost: 3, Tmax: 250, corr: "good" },
  Ge: { k: 60, cost: 1000, Tmax: 300, corr: "good" },
  NiAl: { k: 76, cost: 25, Tmax: 1200, corr: "good" },
  TiAl: { k: 22, cost: 80, Tmax: 800, corr: "good" },
  NiTi: { k: 18, cost: 300, Tmax: 100, corr: "excellent" }
};

const CERAMIC_FORMULAS = new Set([
  "Al2O3",
  "ZrO2",
  "SiC",
  "Si3N4",
  "TiO2",
  "MgO",
  "CaO",
  "AlN",
  "TiN",
  "ZrN",
  "TiB2",
  "ZrB2",
  "HfB2",
  "BN",
  "MgAl2O4",
  "Al6Si2O13",
  "Si",
  "Ge",
  "GaAs",
  "InP",
  "GaN",
  "TiC",
  "WC",
  "B4C",
  "CrN",
  "NbN",
  "TaN",
  "VN",
  "HfN",
  "Mo2C",
  "SiO2",
  "Y2O3",
  "CeO2",
  "Cr2O3",
  "Fe2O3",
  "Fe3O4",
  "MoSi2",
  "WSi2",
  "GaP",
  "InAs",
  "ZnS",
  "CdTe",
  "SrTiO3",
  "BaTiO3"
]);

const RESISTIVITY_LOOKUP = {
  Fe: 9.7e-8,
  Ni: 6.9e-8,
  Co: 6.2e-8,
  Cr: 1.3e-7,
  Cu: 1.7e-8,
  Al: 2.7e-8,
  Ti: 4.2e-7,
  W: 5.6e-8,
  Mo: 5.3e-8,
  Nb: 1.5e-7,
  Ta: 1.3e-7,
  V: 2.0e-7,
  Pt: 1.1e-7,
  Ag: 1.6e-8,
  Au: 2.4e-8,
  Pd: 1.1e-7,
  Sn: 1.1e-7,
  Pb: 2.2e-7,
  Zn: 5.9e-8,
  Mg: 4.4e-8,
  Zr: 4.3e-7
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function positive(value) {
  return Number.isFinite(value) && value > 0 ? value : null;
}

function youngsModulusFromBulkShear(bulk, shear) {
  if (!positive(bulk) || !positive(shear)) {
    return null;
  }
  return (9 * bulk * shear) / (3 * bulk + shear);
}

function inferCategory(mp) {
  if (CERAMIC_FORMULAS.has(mp.formula_pretty) || !mp.is_metal) {
    return "Ceramic";
  }
  return "Metal";
}

function inferSubcategory(category, mp) {
  const crystal = mp.symmetry?.crystal_system ?? "Unknown";
  return `${crystal} ${category}`;
}

function estimateMeltingPoint(formula, category, lookup) {
  if (lookup?.Tmax) {
    return Math.round(lookup.Tmax / 0.4);
  }
  return category === "Metal" ? 1400 : 1800;
}

function estimateSpecificHeat(category) {
  return category === "Metal" ? 0.5 : 0.75;
}

function estimateThermalExpansion(category) {
  return category === "Metal" ? 12 : 6;
}

function estimateHardness(category, shearModulus, elasticModulus) {
  if (category === "Ceramic") {
    const base = positive(shearModulus) ? shearModulus * 3.4 : elasticModulus * 2.0;
    return Math.round(clamp(base, 180, 1600));
  }

  const base = positive(shearModulus) ? shearModulus * 1.6 : elasticModulus * 0.85;
  return Math.round(clamp(base, 40, 400));
}

function machinabilityFromHardness(hardness) {
  if (hardness < 150) {
    return "excellent";
  }
  if (hardness <= 300) {
    return "good";
  }
  if (hardness <= 500) {
    return "fair";
  }
  return "poor";
}

function estimateStrengths(category, hardness, elasticModulus) {
  if (category === "Ceramic") {
    const tensile = Math.round(clamp(hardness * 0.85, 120, elasticModulus * 2.2));
    const yieldStrength = Math.round(tensile * 0.85);
    return { tensile, yieldStrength };
  }

  const tensile = Math.round(clamp(hardness * 3.3, 120, elasticModulus * 3.8));
  const yieldStrength = Math.round(tensile * 0.7);
  return { tensile, yieldStrength };
}

function buildTags(mp, category) {
  const tags = new Set([
    mp.formula_pretty.toLowerCase(),
    category.toLowerCase(),
    (mp.symmetry?.crystal_system ?? "unknown").toLowerCase(),
    mp.is_metal ? "electrically-conductive" : "electrical-insulator"
  ]);

  if (mp.theoretical) {
    tags.add("theoretical");
  }
  if (Number.isFinite(mp.energy_above_hull) && mp.energy_above_hull === 0) {
    tags.add("stable");
  }

  return Array.from(tags);
}

function sortVariants(left, right) {
  const leftStable = Number.isFinite(left.energy_above_hull) ? left.energy_above_hull : 999;
  const rightStable = Number.isFinite(right.energy_above_hull) ? right.energy_above_hull : 999;

  if (leftStable !== rightStable) {
    return leftStable - rightStable;
  }

  if (left.theoretical !== right.theoretical) {
    return Number(left.theoretical) - Number(right.theoretical);
  }

  const leftModulus = positive(left.bulk_modulus?.vrh) ? 0 : 1;
  const rightModulus = positive(right.bulk_modulus?.vrh) ? 0 : 1;
  if (leftModulus !== rightModulus) {
    return leftModulus - rightModulus;
  }

  return (left.material_id ?? "").localeCompare(right.material_id ?? "");
}

const raw = JSON.parse(readFileSync(RAW_PATH, "utf8"));
const grouped = new Map();

for (const entry of raw) {
  if (!entry?.material_id || !entry?.formula_pretty || !positive(entry.density)) {
    continue;
  }

  const bucket = grouped.get(entry.formula_pretty) ?? [];
  bucket.push(entry);
  grouped.set(entry.formula_pretty, bucket);
}

const selected = Array.from(grouped.entries()).flatMap(([formula, entries]) =>
  entries.sort(sortVariants).slice(0, MAX_VARIANTS_PER_FORMULA).map((entry) => ({
    ...entry,
    formulaKey: formula
  }))
);

const variantCountByFormula = selected.reduce((acc, entry) => {
  acc.set(entry.formula_pretty, (acc.get(entry.formula_pretty) ?? 0) + 1);
  return acc;
}, new Map());

const mpMaterialsDB = selected.map((mp) => {
  const formula = mp.formula_pretty;
  const lookup = PROPERTY_LOOKUP[formula];
  const category = inferCategory(mp);

  const bulkModulus = positive(mp.bulk_modulus?.vrh);
  const shearModulus = positive(mp.shear_modulus?.vrh);
  const elasticModulus = Math.round(
    youngsModulusFromBulkShear(bulkModulus, shearModulus) ??
      (category === "Metal" ? 120 : 220)
  );
  const hardnessVickers = estimateHardness(category, shearModulus, elasticModulus);
  const { tensile, yieldStrength } = estimateStrengths(
    category,
    hardnessVickers,
    elasticModulus
  );
  const meltingPoint = estimateMeltingPoint(formula, category, lookup);
  const maxServiceTemp = lookup?.Tmax ?? Math.round(meltingPoint * 0.4);
  const variantLabel =
    (variantCountByFormula.get(formula) ?? 0) > 1
      ? ` (${mp.symmetry?.symbol ?? mp.symmetry?.crystal_system ?? "phase"}, ${mp.material_id})`
      : "";

  return {
    id: `mp_${slugify(mp.material_id)}`,
    name: `${formula}${variantLabel}`,
    category,
    subcategory: inferSubcategory(category, mp),
    density_g_cm3: Number(mp.density.toFixed(3)),
    tensile_strength_mpa: tensile,
    yield_strength_mpa: yieldStrength,
    elastic_modulus_gpa: elasticModulus,
    hardness_vickers: hardnessVickers,
    thermal_conductivity_w_mk: lookup?.k ?? 30,
    specific_heat_j_gk: estimateSpecificHeat(category),
    melting_point_c: meltingPoint,
    glass_transition_c: null,
    max_service_temp_c: maxServiceTemp,
    thermal_expansion_ppm_k: estimateThermalExpansion(category),
    electrical_resistivity_ohm_m: mp.is_metal
      ? RESISTIVITY_LOOKUP[formula] ?? 1e-7
      : 1e12,
    corrosion_resistance: lookup?.corr ?? "fair",
    machinability: machinabilityFromHardness(hardnessVickers),
    printability_fdm: "n/a",
    cost_usd_kg: lookup?.cost ?? 50,
    tags: buildTags(mp, category),
    data_source: `Materials Project API (${mp.material_id})`
  };
});

writeFileSync(
  OUTPUT_PATH,
  `import type { Material } from "@/types";\n\nexport const mpMaterialsDB: Material[] = ${JSON.stringify(
    mpMaterialsDB,
    null,
    2
  )};\n\nexport default mpMaterialsDB;\n`
);

console.log(`Generated ${mpMaterialsDB.length} processed Materials Project materials`);
