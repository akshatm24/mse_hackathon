import fs from "fs";
import path from "path";

const MP_API_KEY =
  process.env.MP_API_KEY ?? process.env.MATERIALS_PROJECT_API_KEY ?? "";
const BASE = "https://api.materialsproject.org";
const OUTPUT = path.join(process.cwd(), "src", "data", "mp_materials.json");

const FIELDS = [
  "material_id",
  "formula_pretty",
  "density",
  "band_gap",
  "energy_above_hull",
  "is_metal",
  "is_stable",
  "bulk_modulus",
  "shear_modulus",
  "elastic_anisotropy",
  "nelements",
  "elements"
].join(",");

async function fetchBatch(skip: number, limit = 100): Promise<any[]> {
  const url = `${BASE}/materials/summary/?_fields=${FIELDS}&_skip=${skip}&_limit=${limit}&deprecated=false`;
  const response = await fetch(url, {
    headers: { "X-API-KEY": MP_API_KEY }
  });

  if (!response.ok) {
    throw new Error(`MP API ${response.status}: ${await response.text()}`);
  }

  const json = await response.json();
  return json.data ?? [];
}

function inferCategory(entry: any) {
  return entry.is_metal ? "Metal" : "Ceramic";
}

function inferTemperature(entry: any) {
  const hull = typeof entry.energy_above_hull === "number" ? entry.energy_above_hull : 0.1;
  if (hull <= 0.01) return 1500;
  if (hull <= 0.03) return 1100;
  if (hull <= 0.05) return 850;
  return 650;
}

function estimateCost(entry: any) {
  const elements = entry.elements ?? [];
  if (elements.some((element: string) => ["Re", "Ru", "Ir", "Os", "Rh", "Pt", "Au", "Pd"].includes(element))) return 500;
  if (elements.some((element: string) => ["Ta", "W", "Hf"].includes(element))) return 80;
  if (elements.some((element: string) => ["Mo", "Nb", "Co"].includes(element))) return 40;
  if (elements.includes("Ni")) return 25;
  if (elements.includes("Ti")) return 20;
  if (elements.includes("Al")) return 5;
  if (elements.includes("Fe")) return 3;
  return 10;
}

function buildTags(entry: any) {
  const tags = ["mp-computed"];
  if ((entry.band_gap ?? 0) === 0) tags.push("metallic");
  if ((entry.band_gap ?? 0) > 2) tags.push("insulator");
  if (entry.nelements === 1) tags.push("elemental");
  if (entry.nelements === 2) tags.push("binary");
  if (entry.nelements === 3) tags.push("ternary");
  return tags;
}

function toMaterial(entry: any) {
  const shear = typeof entry.shear_modulus?.vrh === "number" ? entry.shear_modulus.vrh : null;
  const tensileEstimate = shear ? Math.round(shear * 2.6) : null;

  return {
    id: `mp_${String(entry.material_id).toLowerCase().replace(/[-/]/g, "_")}`,
    material_id: entry.material_id,
    name: `${entry.formula_pretty} (MP)`,
    formula_pretty: entry.formula_pretty,
    category: inferCategory(entry),
    subcategory: "Materials Project Compound",
    density_g_cm3: typeof entry.density === "number" ? Number(entry.density.toFixed(3)) : null,
    tensile_strength_mpa: tensileEstimate,
    yield_strength_mpa: null,
    elastic_modulus_gpa:
      typeof entry.bulk_modulus?.vrh === "number"
        ? Number((entry.bulk_modulus.vrh / 1000).toFixed(1))
        : null,
    hardness_vickers: null,
    max_service_temp_c: inferTemperature(entry),
    thermal_conductivity_w_mk: null,
    specific_heat_j_gk: null,
    thermal_expansion_ppm_k: null,
    melting_point_c: null,
    corrosion_resistance: "fair",
    machinability: "n/a",
    printability_fdm: "n/a",
    fdm_printable: false,
    cost_usd_kg: estimateCost(entry),
    tags: buildTags(entry),
    source: "Materials Project",
    data_source: "Materials Project",
    source_url: `https://next-gen.materialsproject.org/materials/${entry.material_id}`,
    scrape_url: null,
    source_kind: "mp",
    data_quality: "mp-calculated",
    energy_above_hull: entry.energy_above_hull ?? null,
    band_gap_eV: entry.band_gap ?? null,
    is_stable: Boolean(entry.is_stable),
    standards: [],
    data_enriched_from_mp: true,
    biocompatible: false
  };
}

async function main() {
  let existing: any[] = [];

  if (fs.existsSync(OUTPUT)) {
    existing = JSON.parse(fs.readFileSync(OUTPUT, "utf8"));
    console.log(`Loaded ${existing.length} existing MP entries.`);
  }

  if (existing.length >= 5000) {
    console.log("Already at or above 5000 MP entries. No top-up fetch required.");
    return;
  }

  if (!MP_API_KEY) {
    throw new Error("MP_API_KEY or MATERIALS_PROJECT_API_KEY is required.");
  }

  const existingIds = new Set(existing.map((material) => material.material_id));
  const collected = [...existing];
  let skip = 0;

  while (collected.length < 5000) {
    const batch = await fetchBatch(skip, 100);
    if (batch.length === 0) {
      break;
    }

    for (const entry of batch) {
      if (!existingIds.has(entry.material_id)) {
        collected.push(toMaterial(entry));
        existingIds.add(entry.material_id);
      }
    }

    skip += batch.length;
    console.log(`Fetched ${collected.length} MP entries...`);

    if (batch.length < 100) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  fs.writeFileSync(OUTPUT, `${JSON.stringify(collected, null, 2)}\n`, "utf8");
  console.log(`Saved ${collected.length} MP materials to ${OUTPUT}`);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
