import { NextRequest, NextResponse } from "next/server";

import { generateExplanation, extractConstraints } from "@/lib/gemini";
import materialsDB from "@/lib/materials-db";
import {
  filterMaterialsForConstraints,
  mergeConstraints,
  normalisePriorityWeights,
  scoreMaterials
} from "@/lib/scoring";
import { UserConstraints } from "@/types";

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
    priorityWeights: normalisePriorityWeights(manual.priorityWeights)
  };
}

function fallbackExplanation(query: string, rankedMaterials: ReturnType<typeof scoreMaterials>) {
  const top = rankedMaterials[0];
  return (
    `Based on your requirements, ${top?.name ?? "the top candidate"} is recommended as the optimal material for "${query}". ` +
    `It offers a maximum service temperature of ${top?.max_service_temp_c}°C, tensile strength of ${top?.tensile_strength_mpa} MPa, ` +
    `and density of ${top?.density_g_cm3} g/cm³ at approximately $${top?.cost_usd_kg}/kg. ` +
    "Compare the top three candidates against fabrication method, fatigue, and supply chain before final selection."
  );
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
  const allMatches = filterMaterialsForConstraints(mergedConstraints, materialsDB);
  const rankedMaterials = scoreMaterials(mergedConstraints, materialsDB);
  let llmExplanation = "";

  try {
    llmExplanation = await generateExplanation(query, rankedMaterials, history);
  } catch {
    llmExplanation = fallbackExplanation(query, rankedMaterials);
  }

  return {
    rankedMaterials,
    llmExplanation,
    inferredConstraints: mergedConstraints,
    clarifications: process.env.GEMINI_API_KEY
      ? "Constraints inferred from your description."
      : "Gemini key not configured, so local heuristics were used to infer constraints.",
    matchCount: allMatches.length
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
