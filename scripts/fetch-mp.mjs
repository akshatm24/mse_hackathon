import axios from "axios";

import {
  MP_RAW_PATH,
  sleep,
  writeJson,
  isEngineeringRelevantEntry
} from "./lib/pipeline-utils.mjs";

const API_KEY = process.env.MATERIALS_PROJECT_API_KEY;
if (!API_KEY) {
  console.error("MATERIALS_PROJECT_API_KEY is required.");
  process.exit(1);
}

const client = axios.create({
  baseURL: "https://api.materialsproject.org",
  headers: {
    "X-API-KEY": API_KEY,
    "User-Agent": "SmartAlloySelectorResearch/1.0 (academic-hackathon)"
  },
  timeout: 60000
});

const SUMMARY_FIELDS = [
  "material_id",
  "formula_pretty",
  "density",
  "band_gap",
  "is_metal",
  "theoretical",
  "energy_above_hull",
  "nelements",
  "elements"
].join(",");

const ELASTICITY_FIELDS = [
  "material_id",
  "bulk_modulus",
  "shear_modulus",
  "elastic_anisotropy"
].join(",");

async function fetchSummaryPages(label, baseParams, batchSize, maxEnergy) {
  const kept = [];
  let rawCount = 0;
  let skip = 0;

  while (true) {
    console.log(`[fetch-mp] ${label} page skip=${skip}`);
    const response = await client.get("/materials/summary/", {
      params: {
        ...baseParams,
        _limit: batchSize,
        _skip: skip,
        _fields: SUMMARY_FIELDS
      }
    });

    const page = response.data?.data ?? [];
    rawCount += page.length;

    if (page.length === 0) {
      break;
    }

    kept.push(
      ...page.filter((entry) =>
        isEngineeringRelevantEntry(
          {
            ...entry,
            energy_above_hull:
              typeof entry.energy_above_hull === "number" &&
              entry.energy_above_hull <= maxEnergy
                ? entry.energy_above_hull
                : entry.energy_above_hull
          },
          maxEnergy
        )
      )
    );

    skip += batchSize;
    await sleep(500);
  }

  return { rawCount, kept };
}

async function fetchElasticity(materialIds) {
  const elasticMap = new Map();

  for (let index = 0; index < materialIds.length; index += 20) {
    const batch = materialIds.slice(index, index + 20);
    console.log(`[fetch-mp] elasticity batch ${index / 20 + 1} / ${Math.ceil(materialIds.length / 20)}`);
    const response = await client.get("/materials/elasticity/", {
      params: {
        material_ids: batch.join(","),
        _fields: ELASTICITY_FIELDS,
        _limit: 1000
      }
    });

    for (const entry of response.data?.data ?? []) {
      elasticMap.set(entry.material_id, entry);
    }

    await sleep(200);
  }

  return elasticMap;
}

function deduplicateByFormula(entries) {
  const byFormula = new Map();

  for (const entry of entries) {
    const formula = entry.formula_pretty;
    const current = byFormula.get(formula);

    if (!current) {
      byFormula.set(formula, entry);
      continue;
    }

    const currentEnergy =
      typeof current.energy_above_hull === "number" ? current.energy_above_hull : Number.POSITIVE_INFINITY;
    const nextEnergy =
      typeof entry.energy_above_hull === "number" ? entry.energy_above_hull : Number.POSITIVE_INFINITY;

    if (nextEnergy < currentEnergy) {
      byFormula.set(formula, entry);
      continue;
    }

    const currentHasElasticity = Boolean(current.bulk_modulus || current.shear_modulus);
    const nextHasElasticity = Boolean(entry.bulk_modulus || entry.shear_modulus);
    if (nextEnergy === currentEnergy && nextHasElasticity && !currentHasElasticity) {
      byFormula.set(formula, entry);
    }
  }

  return [...byFormula.values()];
}

async function main() {
  const metals = await fetchSummaryPages(
    "stable-metals",
    {
      is_metal: true,
      theoretical: false,
      energy_above_hull_min: 0,
      energy_above_hull_max: 0.025
    },
    1000,
    0.025
  );

  const ceramics = await fetchSummaryPages(
    "stable-non-metals",
    {
      is_metal: false,
      theoretical: false,
      energy_above_hull_min: 0,
      energy_above_hull_max: 0.025
    },
    1000,
    0.025
  );

  const metastable = await fetchSummaryPages(
    "metastable",
    {
      theoretical: false,
      energy_above_hull_min: 0.025,
      energy_above_hull_max: 0.05,
      nelements_min: 1,
      nelements_max: 3
    },
    500,
    0.05
  );

  const combined = [...metals.kept, ...ceramics.kept, ...metastable.kept];
  const materialIds = [...new Set(combined.map((entry) => entry.material_id))];
  const elasticMap = await fetchElasticity(materialIds);

  const withElasticity = combined.map((entry) => {
    const elasticity = elasticMap.get(entry.material_id);
    return {
      ...entry,
      bulk_modulus: elasticity?.bulk_modulus ?? null,
      shear_modulus: elasticity?.shear_modulus ?? null,
      elastic_anisotropy:
        typeof elasticity?.elastic_anisotropy === "number"
          ? elasticity.elastic_anisotropy
          : null
    };
  });

  const unique = deduplicateByFormula(withElasticity);
  const payload = {
    _meta: {
      fetched_at: new Date().toISOString(),
      total_before_filter: metals.rawCount + ceramics.rawCount + metastable.rawCount,
      total_after_filter: combined.length
    },
    data: unique
  };

  writeJson(MP_RAW_PATH, payload);

  const elasticityCount = unique.filter(
    (entry) => entry.bulk_modulus?.vrh || entry.shear_modulus?.vrh
  ).length;

  console.log(`Metals fetched:     ${metals.rawCount} raw -> ${metals.kept.length} after filter`);
  console.log(`Ceramics fetched:   ${ceramics.rawCount} raw -> ${ceramics.kept.length} after filter`);
  console.log(`Metastable:         ${metastable.rawCount} raw -> ${metastable.kept.length} after filter`);
  console.log(`Total unique:       ${unique.length}`);
  console.log(`With elasticity:    ${elasticityCount}`);
  console.log(`Written:            ${MP_RAW_PATH}`);
}

main().catch((error) => {
  console.error("[fetch-mp] failed", error?.response?.data ?? error);
  process.exit(1);
});
