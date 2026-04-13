import materialsJson from "@/lib/materials-db.json";
import type { Material } from "@/types";

export const materialsDB = materialsJson as Material[];
export const materialCount = materialsDB.length;

export default materialsDB;
