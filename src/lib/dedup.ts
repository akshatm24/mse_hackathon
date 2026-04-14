import type { Material } from "@/types";

const QUALITY_RANK: Record<string, number> = {
  validated: 5,
  "hardcoded-cited": 4,
  scraped: 3,
  experimental: 2,
  estimated: 1,
  "mp-calculated": 0
};

function qualityRank(material: Pick<Material, "data_quality">) {
  return QUALITY_RANK[material.data_quality ?? "experimental"] ?? 0;
}

export function deduplicateById<T extends Material>(materials: T[]): T[] {
  const seen = new Map<string, T>();

  for (const material of materials) {
    const existing = seen.get(material.id);
    if (!existing) {
      seen.set(material.id, material);
      continue;
    }

    const nextRank = qualityRank(material);
    const currentRank = qualityRank(existing);
    if ((material.source_url && !existing.source_url) || nextRank > currentRank) {
      seen.set(material.id, material);
    }
  }

  return Array.from(seen.values());
}
