import type { Material } from "@/types";

export const ENGINEERING_SOURCE_KINDS = ["curated", "hardcoded", "validated"];

function isMpMaterial(material: Material) {
  const source = Array.isArray(material.source)
    ? material.source.join(" ")
    : material.source ?? "";

  return (
    material.source_kind === "mp" ||
    material.source_kind === "materials-project" ||
    material.name.endsWith("(MP)") ||
    material.id.endsWith("_mp") ||
    /materials project/i.test(source)
  );
}

export function engineeringMaterials(all: Material[]): Material[] {
  return all.filter(
    (material) =>
      ENGINEERING_SOURCE_KINDS.includes(material.source_kind ?? "") && !isMpMaterial(material)
  );
}

export function mpCompounds(all: Material[]): Material[] {
  return all.filter((material) => isMpMaterial(material));
}
