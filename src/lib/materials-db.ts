import masterMaterialsJson from "@/data/materials.json";

import { makeitfromDB } from "@/lib/makeitfrom-materials";
import { mpMaterialsDB } from "@/lib/mp-materials-generated";
import type { Material } from "@/types";

const masterMaterials = masterMaterialsJson as Material[];

const CURATED_PRIORITY_NAMES = [
  "Stainless Steel 316L",
  "Stainless Steel 304",
  "Stainless Steel 430",
  "Stainless Steel 410",
  "Stainless Steel 17-4 PH",
  "Duplex Stainless 2205",
  "HSLA Steel A36",
  "Carbon Steel 1020",
  "Spring Steel 1095",
  "Alloy Steel 4140",
  "Alloy Steel 4340",
  "Grey Cast Iron",
  "Tool Steel D2",
  "Maraging Steel 300",
  "Monel 400",
  "Hastelloy C-276",
  "Inconel 718",
  "Inconel 625",
  "Haynes 230",
  "Waspaloy",
  "Nickel 200",
  "Copper C110",
  "ETP Copper C11000",
  "Brass C360",
  "Bronze C932",
  "Beryllium Copper C17200",
  "Phosphor Bronze C510",
  "Cupronickel 90/10",
  "Tungsten W",
  "Molybdenum Mo",
  "Magnesium AZ31B",
  "Titanium Grade 2 (CP)",
  "Ti-6Al-4V",
  "Nitinol (NiTi 50-50)",
  "Invar 36",
  "Kovar (ASTM F15)",
  "MP35N",
  "Elgiloy / Phynox",
  "W-Cu 20",
  "PLA",
  "ABS",
  "PETG",
  "ASA",
  "Nylon PA12",
  "Nylon PA66",
  "Nylon PA6",
  "Polycarbonate",
  "PEEK",
  "PEKK",
  "Ultem 9085",
  "Ultem 1010",
  "PTFE",
  "HDPE",
  "Delrin (POM)",
  "TPU",
  "PPS (Polyphenylene Sulfide)",
  "PMMA (Acrylic)",
  "PVDF",
  "Polyimide (PI / Kapton)",
  "Silicone Rubber (LSR)",
  "UHMWPE",
  "PBT (Polybutylene Terephthalate)",
  "Polysulfone",
  "PEI (General Purpose)",
  "PPSU",
  "Alumina Al2O3",
  "Zirconia ZrO2",
  "Silicon Carbide SiC",
  "Silicon Nitride Si3N4",
  "Boron Nitride BN",
  "Tungsten Carbide WC-Co 6%",
  "Cordierite",
  "Macor Glass Ceramic",
  "Fused Silica",
  "Sialon (Si6-zAlzOzN8-z)",
  "Yttria-Stabilized Zirconia (YSZ)",
  "Hydroxyapatite (HA)",
  "CFRP (Carbon Fiber UD)",
  "CFRP Woven 0/90",
  "CFRP Quasi-Isotropic Laminate",
  "CFRP High-Tg Epoxy",
  "GFRP (Glass Fiber Epoxy)",
  "Kevlar/Epoxy",
  "Boron/Epoxy Composite",
  "Carbon-Carbon Composite",
  "FR-4 Laminate",
  "G10 / Garolite",
  "SiC/SiC Ceramic Matrix Composite",
  "Basalt Fiber / Epoxy",
  "SAC305 (Sn-Ag-Cu)",
  "SAC405 (Sn95.5Ag4Cu0.5)",
  "Sn96Ag4 Silver Solder",
  "Sn58Bi42 Low-Temp Solder",
  "In57Bi43 Low-Temp Solder",
  "Gold-Tin AuSn20",
  "Sn63Pb37 Solder",
  "Nickel Braze BNi-2",
  "Silver Braze BAg-7"
];

function normalise(name: string) {
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function qualityRank(material: Material) {
  switch (material.data_quality) {
    case "validated":
      return 5;
    case "hardcoded-cited":
      return 4;
    case "scraped":
      return 3;
    case "experimental":
      return 2;
    case "estimated":
      return 1;
    default:
      return 0;
  }
}

function completeness(material: Material) {
  return [
    material.tensile_strength_mpa,
    material.max_service_temp_c,
    material.cost_usd_kg,
    material.density_g_cm3,
    material.elastic_modulus_gpa,
    material.thermal_conductivity_w_mk
  ].filter((value) => typeof value === "number" && Number.isFinite(value)).length;
}

function dedupeByName(materials: Material[]) {
  const byName = new Map<string, Material>();

  for (const material of materials) {
    const key = normalise(material.name);
    const current = byName.get(key);
    if (!current) {
      byName.set(key, material);
      continue;
    }

    const nextRank = qualityRank(material);
    const currentRank = qualityRank(current);
    if (nextRank > currentRank) {
      byName.set(key, material);
      continue;
    }

    if (nextRank === currentRank) {
      const nextCompleteness = completeness(material);
      const currentCompleteness = completeness(current);
      if (
        nextCompleteness > currentCompleteness ||
        (material.source_url && !current.source_url)
      ) {
        byName.set(key, material);
      }
    }
  }

  return Array.from(byName.values());
}

function selectCuratedMaterials(): Material[] {
  const wanted = new Set(CURATED_PRIORITY_NAMES.map(normalise));
  const selected = masterMaterials.filter((material) => wanted.has(normalise(material.name)));
  const missing = CURATED_PRIORITY_NAMES.filter(
    (name) => !selected.some((material) => normalise(material.name) === normalise(name))
  );

  if (process.env.NODE_ENV === "development" && missing.length > 0) {
    console.warn("[materials-db] Missing curated records:", missing.join(", "));
  }

  return dedupeByName(selected);
}

function mergeDatabases(primary: Material[], ...secondaries: Material[][]) {
  const merged = [...primary];
  const existing = new Set(primary.map((material) => normalise(material.name)));

  for (const secondary of secondaries) {
    for (const material of secondary) {
      const key = normalise(material.name);
      if (existing.has(key)) {
        continue;
      }
      merged.push(material);
      existing.add(key);
    }
  }

  return merged;
}

export const curatedMaterialsDB = selectCuratedMaterials();

export const materialsDB: Material[] = dedupeByName(
  mergeDatabases(curatedMaterialsDB, makeitfromDB, mpMaterialsDB)
);

export const materialCount = materialsDB.length;

export default materialsDB;
