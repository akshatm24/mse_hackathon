import { deduplicateById } from "@/lib/dedup";
import { engineeringMaterials, mpCompounds } from "@/lib/filterEngineering";
import type { Material } from "@/types";

import curatedMaterialsJson from "./materials.json";
import mpMaterialsJson from "./mp_materials.json";

const curatedMaterials = curatedMaterialsJson as Material[];
const mpMaterials = mpMaterialsJson as Material[];

const allMaterials = deduplicateById([...curatedMaterials, ...mpMaterials]).sort((left, right) =>
  left.id.localeCompare(right.id)
);

export const ENGINEERING_MATERIALS = engineeringMaterials(allMaterials);
export const MP_COMPOUNDS = mpCompounds(allMaterials);
export const ALL_MATERIALS = allMaterials;
export const materialCount = ALL_MATERIALS.length;

if (process.env.NODE_ENV === "development") {
  console.log(`[DB] Total: ${ALL_MATERIALS.length}`);
  console.log(`[DB] Engineering: ${ENGINEERING_MATERIALS.length}`);
  console.log(`[DB] MP compounds: ${MP_COMPOUNDS.length}`);
}

export default ALL_MATERIALS;
