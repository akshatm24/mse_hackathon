import { NextRequest, NextResponse } from "next/server";

import { extractConstraints, generateExplanation } from "@/lib/gemini";
import { materialsDB } from "@/lib/materials-db";
import { retrieveFromCandidates } from "@/lib/rag";
import { scoreMaterials } from "@/lib/scoring";
import type { UserConstraints } from "@/types";

function normaliseWeights(
  weights?: Partial<UserConstraints["priorityWeights"]>
): UserConstraints["priorityWeights"] | undefined {
  if (!weights) {
    return undefined;
  }

  const merged = {
    thermal: weights.thermal ?? 0,
    strength: weights.strength ?? 0,
    weight: weights.weight ?? 0,
    cost: weights.cost ?? 0,
    corrosion: weights.corrosion ?? 0
  };
  const total =
    merged.thermal +
    merged.strength +
    merged.weight +
    merged.cost +
    merged.corrosion;

  if (total <= 0) {
    return undefined;
  }

  return {
    thermal: merged.thermal / total,
    strength: merged.strength / total,
    weight: merged.weight / total,
    cost: merged.cost / total,
    corrosion: merged.corrosion / total
  };
}

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
    thermallyConductive:
      typeof manual.thermallyConductive === "boolean"
        ? manual.thermallyConductive
        : undefined,
    needsFDMPrintability:
      typeof manual.needsFDMPrintability === "boolean"
        ? manual.needsFDMPrintability
        : undefined,
    priorityWeights: normaliseWeights(manual.priorityWeights)
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
    thermallyConductive:
      overrides.thermallyConductive ?? base.thermallyConductive,
    needsFDMPrintability:
      overrides.needsFDMPrintability ?? base.needsFDMPrintability,
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
  // Step 1: extract intent and weights from the natural-language query.
  const constraints = await extractConstraints(query);
  const effectiveConstraints = mergeConstraints(
    constraints,
    manualConstraints ? { ...manualConstraints, rawQuery: query } : undefined
  );

  // Step 2: score the entire database. This is the single source of truth.
  const rankedMaterials = scoreMaterials(effectiveConstraints, materialsDB);

  // Step 3: RAG only re-orders the scored shortlist for explanation context.
  const ragContext = await retrieveFromCandidates(query, rankedMaterials.slice(0, 10), 5);

  // Step 4: explain the same shortlisted materials the user can see below.
  const llmExplanation = await generateExplanation(query, ragContext, history);

  return {
    rankedMaterials,
    llmExplanation,
    inferredConstraints: effectiveConstraints,
    clarifications: "Constraints auto-detected from your query.",
    matchCount: rankedMaterials.length,
    ragMaterials: ragContext.map((material) => material.name)
  };
}

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query");

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const data = await buildRecommendationResponse({ query: query.trim() });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    console.error("recommend error:", message);
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

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const data = await buildRecommendationResponse({
      query: query.trim(),
      history,
      manualConstraints: sanitiseManualConstraints(body.manualConstraints)
    });

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error";
    console.error("recommend error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
