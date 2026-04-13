import type { Material } from "@/types";

const QUALITY_RANK: Record<string, number> = {
  validated: 6,
  curated: 5,
  experimental: 4,
  "hardcoded-cited": 4,
  scraped: 3,
  estimated: 2,
  "mp-calculated": 1
};

function firstSource(source: Material["source"]) {
  if (Array.isArray(source)) {
    return source[0] ?? "";
  }

  return source ?? "";
}

function recordStrength(material: Material) {
  let score = 0;

  if (material.source_url) score += 8;
  if (material.scrape_url) score += 2;
  score += QUALITY_RANK[material.data_quality ?? "experimental"] ?? 0;
  if (material.source_kind === "curated") score += 2;
  if (material.source_kind === "hardcoded" || material.source_kind === "validated") score += 3;
  if (material.source_kind === "mp" || material.source_kind === "materials-project") score -= 1;
  if (firstSource(material.source).includes("MatWeb")) score += 1;

  return score;
}

export function deduplicateById<T extends Material>(materials: T[]): T[] {
  const seen = new Map<string, T>();

  for (const material of materials) {
    const existing = seen.get(material.id);

    if (!existing) {
      seen.set(material.id, material);
      continue;
    }

    const existingStrength = recordStrength(existing);
    const incomingStrength = recordStrength(material);

    if (incomingStrength > existingStrength) {
      seen.set(material.id, material);
    }
  }

  return Array.from(seen.values());
}
