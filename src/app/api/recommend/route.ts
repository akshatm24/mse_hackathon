import { NextRequest, NextResponse } from "next/server";

import { generateExplanation, extractConstraints } from "@/lib/gemini";
import materialsDB from "@/lib/materials-db";
import { retrieveRelevantMaterials } from "@/lib/rag";
import { scoreMaterials } from "@/lib/scoring";
import { RankedMaterial, UserConstraints } from "@/types";

const ALLOWED_CATEGORIES = new Set(["Metal", "Polymer", "Ceramic", "Composite", "Solder"]);

function sanitiseManualConstraints(value: unknown): Partial<UserConstraints> | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const manual = value as Partial<UserConstraints>;

  return {
    maxTemperature_c:
      typeof manual.maxTemperature_c === "number" ? manual.maxTemperature_c : undefined,
    minTensileStrength_mpa:
      typeof manual.minTensileStrength_mpa === "number"
        ? manual.minTensileStrength_mpa
        : undefined,
    maxDensity_g_cm3:
      typeof manual.maxDensity_g_cm3 === "number" ? manual.maxDensity_g_cm3 : undefined,
    maxCost_usd_kg:
      typeof manual.maxCost_usd_kg === "number" ? manual.maxCost_usd_kg : undefined,
    corrosionRequired:
      manual.corrosionRequired === "excellent" ||
      manual.corrosionRequired === "good" ||
      manual.corrosionRequired === "fair"
        ? manual.corrosionRequired
        : undefined,
    electricallyConductive:
      typeof manual.electricallyConductive === "boolean"
        ? manual.electricallyConductive
        : undefined,
    electricallyInsulating:
      typeof manual.electricallyInsulating === "boolean"
        ? manual.electricallyInsulating
        : undefined,
    thermallyConductive:
      typeof manual.thermallyConductive === "boolean"
        ? manual.thermallyConductive
        : undefined,
    needsFDMPrintability:
      typeof manual.needsFDMPrintability === "boolean"
        ? manual.needsFDMPrintability
        : undefined,
    preferredCategories: Array.isArray(manual.preferredCategories)
      ? manual.preferredCategories.filter((entry): entry is NonNullable<UserConstraints["preferredCategories"]>[number] =>
          typeof entry === "string" && ALLOWED_CATEGORIES.has(entry)
        )
      : undefined,
    semanticTags: Array.isArray(manual.semanticTags)
      ? manual.semanticTags.filter((entry): entry is string => typeof entry === "string")
      : undefined,
    priorityWeights: manual.priorityWeights
      ? normalisePriorityWeights(manual.priorityWeights)
      : undefined
  };
}

function mergeConstraints(
  base: UserConstraints,
  overrides?: Partial<UserConstraints>
): UserConstraints {
  if (!overrides) {
    return base;
  }

  return {
    maxTemperature_c: overrides.maxTemperature_c ?? base.maxTemperature_c,
    minTensileStrength_mpa:
      overrides.minTensileStrength_mpa ?? base.minTensileStrength_mpa,
    maxDensity_g_cm3: overrides.maxDensity_g_cm3 ?? base.maxDensity_g_cm3,
    maxCost_usd_kg: overrides.maxCost_usd_kg ?? base.maxCost_usd_kg,
    corrosionRequired: overrides.corrosionRequired ?? base.corrosionRequired,
    electricallyConductive:
      overrides.electricallyConductive ?? base.electricallyConductive,
    electricallyInsulating:
      overrides.electricallyInsulating ?? base.electricallyInsulating,
    thermallyConductive:
      overrides.thermallyConductive ?? base.thermallyConductive,
    needsFDMPrintability:
      overrides.needsFDMPrintability ?? base.needsFDMPrintability,
    preferredCategories: overrides.preferredCategories ?? base.preferredCategories,
    semanticTags: overrides.semanticTags ?? base.semanticTags,
    priorityWeights: overrides.priorityWeights ?? base.priorityWeights,
    rawQuery: overrides.rawQuery ?? base.rawQuery
  };
}

async function buildRecommendationResponse({
  query,
  history,
  manualConstraints
}: {
  query: string;
  history?: { role: string; parts: string }[];
  manualConstraints?: Partial<UserConstraints>;
}) {
  const constraints = await extractConstraints(query);
  const mergedConstraints = mergeConstraints(
    constraints,
    manualConstraints ? { ...manualConstraints, rawQuery: query } : undefined
  );
  const rankedMaterials = scoreMaterials(mergedConstraints, materialsDB);
  const topCandidateIds = rankedMaterials.slice(0, 10).map((material) => material.id);
  const ragBaseMaterials = await retrieveRelevantMaterials(query, 8, topCandidateIds);
  const rankedById = new Map(rankedMaterials.map((material) => [material.id, material]));
  const ragMaterials = ragBaseMaterials
    .map((material) => rankedById.get(material.id))
    .filter(Boolean) as RankedMaterial[];
  const explanationMaterials =
    ragMaterials.length > 0 ? ragMaterials : rankedMaterials.slice(0, 8);
  const llmExplanation = await generateExplanation(query, explanationMaterials, history);

  return {
    rankedMaterials,
    llmExplanation,
    inferredConstraints: mergedConstraints,
    clarifications: process.env.GEMINI_API_KEY
      ? "Constraints inferred from your description."
      : "Constraints inferred from your description using local engineering heuristics.",
    matchCount: rankedMaterials.length,
    ragRetrieved: explanationMaterials.map((material) => material.name)
  };
}

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query");

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const data = await buildRecommendationResponse({ query });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      query: string;
      history?: { role: string; parts: string }[];
      manualConstraints?: Partial<UserConstraints>;
    };

    const { query, history } = body;
    const manualConstraints = sanitiseManualConstraints(body.manualConstraints);

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const data = await buildRecommendationResponse({
      query,
      history,
      manualConstraints
    });

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
