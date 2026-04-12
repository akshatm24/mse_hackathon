import type { Material, RankedMaterial } from "@/types";

// Convert a material to a rich text string for lightweight RAG scoring.
function toText(m: Material): string {
  const parts = [
    m.name,
    m.category,
    m.subcategory,
    `service temperature ${m.max_service_temp_c} celsius`,
    `tensile strength ${m.tensile_strength_mpa} MPa`,
    `density ${m.density_g_cm3} grams per cubic centimetre`,
    `cost ${m.cost_usd_kg} USD per kilogram`,
    `corrosion ${m.corrosion_resistance}`,
    m.printability_fdm !== "n/a" ? `printability ${m.printability_fdm}` : "not printable",
    m.tags.join(" ")
  ];

  return parts.join(". ");
}

// Zero-dependency lexical similarity keeps serverless latency low and
// guarantees RAG never becomes a second opaque ranking engine.
function keywordSim(query: string, text: string): number {
  const qWords = new Set(
    query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
  );
  const tWords = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

  if (qWords.size === 0) {
    return 0;
  }

  let hits = 0;
  for (const word of tWords) {
    if (qWords.has(word)) {
      hits += 1;
      continue;
    }

    for (const qWord of qWords) {
      if (
        word.length > 3 &&
        qWord.length > 3 &&
        (word.includes(qWord) || qWord.includes(word))
      ) {
        hits += 0.5;
      }
    }
  }

  return hits / qWords.size;
}

// Intent scoring only re-orders candidates that have already been accepted
// by the deterministic scorer. It never introduces outside materials.
function intentScore(query: string, material: Material): number {
  const q = query.toLowerCase();
  let score = 0;

  if (/cheap|budget|affordable|low cost|inexpensive|economical/.test(q)) {
    score += Math.max(0, 1 - material.cost_usd_kg / 1000);
  }

  if (/heat|hot|temp|warp|melt|furnace|motor|engine|thermal/.test(q)) {
    score += Math.min(1, material.max_service_temp_c / 1000);
  }

  if (/light|lightweight|drone|aircraft|aerospace|weight|density/.test(q)) {
    score += Math.max(0, 1 - material.density_g_cm3 / 20);
  }

  if (/strong|strength|load|structural|tensile|mpa|stiff/.test(q)) {
    score += Math.min(1, material.tensile_strength_mpa / 2000);
  }

  if (/3d print|fdm|filament|print|nozzle/.test(q)) {
    if (material.printability_fdm === "excellent") {
      score += 1;
    } else if (material.printability_fdm === "good") {
      score += 0.6;
    } else if (material.printability_fdm === "fair") {
      score += 0.2;
    } else {
      score -= 0.5;
    }
  }

  if (/marine|seawater|acid|corros|rust|ocean|chemical/.test(q)) {
    const corrosionMap: Record<Material["corrosion_resistance"], number> = {
      excellent: 1,
      good: 0.7,
      fair: 0.4,
      poor: 0
    };
    score += corrosionMap[material.corrosion_resistance] ?? 0;
  }

  return score;
}

// RAG for recommendations: retrieve only from the scored shortlist so the
// explanation can never drift away from the cards shown to the user.
export async function retrieveFromCandidates(
  query: string,
  candidates: RankedMaterial[],
  topK: number = 5
): Promise<RankedMaterial[]> {
  if (candidates.length === 0) {
    return [];
  }

  if (candidates.length <= topK) {
    return candidates;
  }

  try {
    const candidateOrder = new Map(candidates.map((material, index) => [material.id, index]));

    const scored = candidates.map((material) => {
      const text = toText(material);
      const keyword = keywordSim(query, text);
      const intent = intentScore(query, material);
      const normalScore = material.score / 100;
      const combined = keyword * 0.35 + intent * 0.35 + normalScore * 0.3;

      return { material, combined };
    });

    const selected = scored
      .sort((left, right) => right.combined - left.combined)
      .slice(0, topK)
      .map((entry) => entry.material);

    // Always keep the scoring winner in the explanation set so the first
    // paragraph matches the top card shown in the UI.
    if (!selected.some((material) => material.id === candidates[0].id)) {
      selected.pop();
      selected.unshift(candidates[0]);
    }

    return selected.sort(
      (left, right) =>
        (candidateOrder.get(left.id) ?? Number.POSITIVE_INFINITY) -
        (candidateOrder.get(right.id) ?? Number.POSITIVE_INFINITY)
    );
  } catch {
    return candidates.slice(0, topK);
  }
}

// Semantic search for the DB explorer intentionally searches the full DB.
export async function searchDatabase(
  query: string,
  db: Material[],
  topK: number = 15
): Promise<Material[]> {
  const scored = db.map((material) => ({
    material,
    score: keywordSim(query, toText(material)) + intentScore(query, material) * 0.5
  }));

  return scored
    .sort((left, right) => right.score - left.score)
    .slice(0, topK)
    .map((entry) => entry.material);
}
