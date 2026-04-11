import { pipeline } from "@xenova/transformers";

import materialsDB from "./materials-db";
import type { Material } from "@/types";

const EMBEDDING_OPTIONS = {
  pooling: "mean",
  normalize: true
} as const;

// Singleton embedder — loaded once per serverless cold start
let embedder: Awaited<ReturnType<typeof pipeline>> | null = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

// Convert material to a rich text description for embedding
function materialToText(m: Material): string {
  return [
    m.name,
    m.formula_pretty ?? "",
    m.category,
    m.subcategory,
    `max service temperature ${m.max_service_temp_c} degrees celsius`,
    `tensile strength ${m.tensile_strength_mpa} MPa`,
    `density ${m.density_g_cm3} grams per cubic centimetre`,
    `cost ${m.cost_usd_kg} USD per kilogram`,
    `corrosion resistance ${m.corrosion_resistance}`,
    m.printability_fdm !== "n/a"
      ? `FDM printability ${m.printability_fdm}`
      : "not FDM printable",
    m.tags.join(" ")
  ]
    .filter(Boolean)
    .join(". ");
}

// Cosine similarity between two float32 arrays
function cosineSim(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
}

const materialVectorCache = new Map<string, number[]>();

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function lexicalScore(query: string, material: Material): number {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return 0;
  }

  const haystack = materialToText(material).toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    if (material.name.toLowerCase().includes(token)) score += 6;
    if (material.formula_pretty?.toLowerCase().includes(token)) score += 5;
    if (material.subcategory.toLowerCase().includes(token)) score += 3;
    if (material.category.toLowerCase().includes(token)) score += 2;
    if (material.tags.some((tag) => tag.toLowerCase().includes(token))) score += 4;
    if (haystack.includes(token)) score += 1;
  }

  if (haystack.includes(query.toLowerCase())) {
    score += 8;
  }

  return score;
}

function domainBoost(query: string, material: Material): number {
  const lower = query.toLowerCase();
  let boost = 0;

  if (
    lower.includes("marine") ||
    lower.includes("seawater") ||
    lower.includes("ocean") ||
    lower.includes("corrosion")
  ) {
    if (material.corrosion_resistance === "excellent") boost += 0.16;
    if (material.corrosion_resistance === "good") boost += 0.08;
    if (
      material.tags.some((tag) =>
        ["marine", "seawater", "chemical", "acid-resistant"].includes(tag.toLowerCase())
      )
    ) {
      boost += 0.22;
    }
    if (
      ["Hastelloy C-276", "Monel 400", "Stainless Steel 316L", "Titanium Grade 2 (CP)"].includes(
        material.name
      )
    ) {
      boost += 0.2;
    }
  }

  if (
    lower.includes("conductive") ||
    lower.includes("probe") ||
    lower.includes("electrical")
  ) {
    if (material.electrical_resistivity_ohm_m <= 1e-6) boost += 0.12;
    if (material.tags.some((tag) => tag.toLowerCase().includes("conduct"))) boost += 0.08;
  }

  if (
    lower.includes("3d print") ||
    lower.includes("fdm") ||
    lower.includes("filament")
  ) {
    if (material.printability_fdm === "excellent") boost += 0.18;
    if (material.printability_fdm === "good") boost += 0.1;
  }

  return boost;
}

function selectCandidatePool(query: string, candidateIds?: string[]): Material[] {
  if (candidateIds && candidateIds.length > 0) {
    const candidateSet = new Set(candidateIds);
    return materialsDB.filter((material) => candidateSet.has(material.id));
  }

  const ranked = materialsDB
    .map((material) => ({
      material,
      score: lexicalScore(query, material)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 80)
    .map((entry) => entry.material);

  return ranked.length > 0 ? ranked : materialsDB.slice(0, 80);
}

async function getMaterialVector(material: Material): Promise<number[]> {
  const cached = materialVectorCache.get(material.id);
  if (cached) {
    return cached;
  }

  const model = await getEmbedder();
  const output = await (model as any)(materialToText(material), EMBEDDING_OPTIONS);
  const vec = Array.from(output.data as Float32Array);
  materialVectorCache.set(material.id, vec);
  return vec;
}

// Main RAG retrieval function
// Returns top-k materials most relevant to the query
export async function retrieveRelevantMaterials(
  query: string,
  topK = 8,
  candidateIds?: string[]
): Promise<Material[]> {
  try {
    const model = await getEmbedder();
    const queryOut = await (model as any)(query, EMBEDDING_OPTIONS);
    const queryVec = Array.from(queryOut.data as Float32Array);
    const pool = selectCandidatePool(query, candidateIds);
    const scored = await Promise.all(
      pool.map(async (material) => ({
        material,
        sim:
          cosineSim(queryVec, await getMaterialVector(material)) +
          lexicalScore(query, material) / 100 +
          domainBoost(query, material)
      }))
    );

    return scored
      .sort((left, right) => right.sim - left.sim)
      .slice(0, topK)
      .map((entry) => entry.material);
  } catch (err) {
    console.error("RAG retrieval failed, returning first topK:", err);
    return materialsDB.slice(0, topK);
  }
}
