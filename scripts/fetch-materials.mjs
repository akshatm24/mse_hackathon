import { mkdirSync, writeFileSync } from "fs";

const MP_KEY = process.env.MATERIALS_PROJECT_API_KEY;
const BASE = "https://api.materialsproject.org";

if (!MP_KEY) {
  throw new Error("Set MATERIALS_PROJECT_API_KEY");
}

const TARGET_FORMULAS = [
  "Fe",
  "Ni",
  "Co",
  "Cr",
  "Cu",
  "Al",
  "Ti",
  "W",
  "Mo",
  "Nb",
  "Ta",
  "V",
  "Zr",
  "Hf",
  "Re",
  "Ir",
  "Pt",
  "Ag",
  "Au",
  "Pd",
  "Pb",
  "Sn",
  "Zn",
  "Mg",
  "Be",
  "NiAl",
  "TiAl",
  "Ti3Al",
  "Ni3Al",
  "FeAl",
  "Fe3Al",
  "TiNi",
  "CuZn",
  "Cu3Au",
  "NiTi",
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
];

const SUMMARY_FIELDS = [
  "material_id",
  "formula_pretty",
  "density",
  "symmetry",
  "band_gap",
  "is_metal",
  "theoretical",
  "deprecated",
  "energy_above_hull",
  "bulk_modulus",
  "shear_modulus",
  "universal_anisotropy"
].join(",");

const ELASTICITY_FIELDS = [
  "material_id",
  "bulk_modulus",
  "shear_modulus",
  "universal_anisotropy"
].join(",");

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "X-API-KEY": MP_KEY,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.json();
}

async function fetchBatch(formulas) {
  const formulaStr = encodeURIComponent(formulas.join(","));
  const url =
    `${BASE}/materials/summary/?formula=${formulaStr}` +
    `&_fields=${encodeURIComponent(SUMMARY_FIELDS)}` +
    "&_per_page=1000&deprecated=false";

  try {
    const json = await fetchJson(url);
    return json.data ?? [];
  } catch (error) {
    console.warn(`Batch fetch failed for ${formulas.join(", ")}. Falling back to single queries.`);
    const collected = [];

    for (const formula of formulas) {
      const singleUrl =
        `${BASE}/materials/summary/?formula=${encodeURIComponent(formula)}` +
        `&_fields=${encodeURIComponent(SUMMARY_FIELDS)}` +
        "&_per_page=1000&deprecated=false";

      try {
        const json = await fetchJson(singleUrl);
        collected.push(...(json.data ?? []));
      } catch (singleError) {
        console.error(`Skipping formula ${formula}:`, singleError.message);
      }

      await sleep(150);
    }

    return collected;
  }
}

async function fetchElasticityBatch(materialIds) {
  if (materialIds.length === 0) {
    return [];
  }

  const url =
    `${BASE}/materials/elasticity/?material_ids=${encodeURIComponent(materialIds.join(","))}` +
    `&_fields=${encodeURIComponent(ELASTICITY_FIELDS)}` +
    "&_per_page=1000";

  try {
    const json = await fetchJson(url);
    return json.data ?? [];
  } catch (error) {
    console.error(
      `Elasticity batch fetch failed for ${materialIds.length} materials:`,
      error.message
    );
    return [];
  }
}

const materialsById = new Map();

for (let index = 0; index < TARGET_FORMULAS.length; index += 10) {
  const batch = TARGET_FORMULAS.slice(index, index + 10);
  console.log(`Fetching batch ${Math.floor(index / 10) + 1}: ${batch.join(", ")}`);
  const results = await fetchBatch(batch);

  for (const material of results) {
    if (material?.material_id) {
      materialsById.set(material.material_id, material);
    }
  }

  await sleep(250);
}

const missingElasticityIds = Array.from(materialsById.values())
  .filter((material) => material.material_id && (!material.bulk_modulus || !material.shear_modulus))
  .map((material) => material.material_id);

for (let index = 0; index < missingElasticityIds.length; index += 50) {
  const batchIds = missingElasticityIds.slice(index, index + 50);
  const elasticEntries = await fetchElasticityBatch(batchIds);

  for (const elastic of elasticEntries) {
    const material = materialsById.get(elastic.material_id);
    if (!material) {
      continue;
    }

    material.bulk_modulus = elastic.bulk_modulus ?? material.bulk_modulus ?? null;
    material.shear_modulus = elastic.shear_modulus ?? material.shear_modulus ?? null;
    material.universal_anisotropy =
      elastic.universal_anisotropy ?? material.universal_anisotropy ?? null;
  }

  await sleep(250);
}

const allMaterials = Array.from(materialsById.values()).sort((left, right) => {
  const formulaCompare = (left.formula_pretty ?? "").localeCompare(right.formula_pretty ?? "");
  if (formulaCompare !== 0) {
    return formulaCompare;
  }

  return (left.energy_above_hull ?? Number.POSITIVE_INFINITY) -
    (right.energy_above_hull ?? Number.POSITIVE_INFINITY);
});

mkdirSync("scripts", { recursive: true });
writeFileSync("scripts/mp-materials-raw.json", `${JSON.stringify(allMaterials, null, 2)}\n`);
console.log(`Saved ${allMaterials.length} Materials Project entries`);
