import { curatedMaterialsDB, materialsDB } from "@/lib/materials-db";
import { makeitfromDB } from "@/lib/makeitfrom-materials";
import { mpMaterialsDB } from "@/lib/mp-materials-generated";

export const ALL_MATERIALS = materialsDB;
export const ENGINEERING_MATERIALS = materialsDB;
export const MP_COMPOUNDS = mpMaterialsDB;
export const CURATED_MATERIALS = curatedMaterialsDB;
export const MP_RAW_MATERIALS = mpMaterialsDB;
export const MAKEITFROM_MATERIALS = makeitfromDB;

if (process.env.NODE_ENV === "development") {
  console.log(`[DB] Curated shortlist: ${curatedMaterialsDB.length}`);
  console.log(`[DB] MakeItFrom: ${makeitfromDB.length}`);
  console.log(`[DB] MP cleaned: ${mpMaterialsDB.length}`);
  console.log(`[DB] Total merged: ${materialsDB.length}`);
}
