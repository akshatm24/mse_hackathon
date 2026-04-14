import type { Material } from "@/types";

export const ENGINEERING_SOURCE_KINDS = ["curated", "hardcoded", "validated"] as const;

function normaliseName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function qualityRank(material: Material) {
  switch (material.data_quality) {
    case "validated":
      return 4;
    case "hardcoded-cited":
      return 3;
    case "scraped":
      return 2;
    case "experimental":
      return 1;
    default:
      return 0;
  }
}

export function engineeringMaterials(all: Material[]): Material[] {
  const filtered = all.filter(
    (material) =>
      ENGINEERING_SOURCE_KINDS.includes((material.source_kind ?? "") as (typeof ENGINEERING_SOURCE_KINDS)[number]) &&
      !material.name.endsWith("(MP)") &&
      !material.id.endsWith("_mp")
  );

  const byName = new Map<string, Material>();
  for (const material of filtered) {
    const key = normaliseName(material.name);
    const current = byName.get(key);
    if (!current) {
      byName.set(key, material);
      continue;
    }

    const currentRank = qualityRank(current);
    const nextRank = qualityRank(material);
    if ((material.source_url && !current.source_url) || nextRank > currentRank) {
      byName.set(key, material);
    }
  }

  return Array.from(byName.values());
}

export function mpCompounds(all: Material[]): Material[] {
  return all.filter(
    (material) => material.source_kind === "mp" || material.name.endsWith("(MP)")
  );
}
