import { Material } from "@/types";

import { handCuratedDB } from "@/lib/hand-curated-db";
import { mpMaterialsDB } from "@/lib/mp-materials-generated";

function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function mergeDatabases(
  primary: Material[],
  secondary: Material[]
): Material[] {
  const primaryNames = new Set(primary.map((material) => normaliseName(material.name)));
  const unique = secondary.filter(
    (material) => !primaryNames.has(normaliseName(material.name))
  );
  return [...primary, ...unique];
}

export const materialsDB: Material[] = mergeDatabases(handCuratedDB, mpMaterialsDB);

export default materialsDB;
