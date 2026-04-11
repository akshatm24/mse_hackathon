import { NextResponse } from "next/server";

import { generateExplanation, extractConstraints } from "@/lib/gemini";
import { materialsDB } from "@/lib/materials-db";
import {
  buildDefaultConstraints,
  mergeConstraints,
  normalisePriorityWeights,
  scoreMaterials
} from "@/lib/scoring";
import { UserConstraints } from "@/types";

interface RecommendRequestBody {
  query?: string;
  history?: { role?: string; parts?: string }[];
  manualConstraints?: Partial<UserConstraints>;
}

function sanitiseHistory(
  history: RecommendRequestBody["history"]
): { role: "user" | "model"; parts: string }[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.flatMap((entry) => {
    if (!entry || typeof entry.parts !== "string") {
      return [];
    }

    if (entry.role !== "user" && entry.role !== "model") {
      return [];
    }

    return [{ role: entry.role, parts: entry.parts }];
  });
}

function sanitiseManualConstraints(value: unknown, rawQuery: string): Partial<UserConstraints> | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const manual = value as Partial<UserConstraints>;

  return {
    rawQuery,
    maxTemperature_c: typeof manual.maxTemperature_c === "number" ? manual.maxTemperature_c : undefined,
    minTensileStrength_mpa:
      typeof manual.minTensileStrength_mpa === "number" ? manual.minTensileStrength_mpa : undefined,
    maxDensity_g_cm3: typeof manual.maxDensity_g_cm3 === "number" ? manual.maxDensity_g_cm3 : undefined,
    maxCost_usd_kg: typeof manual.maxCost_usd_kg === "number" ? manual.maxCost_usd_kg : undefined,
    corrosionRequired:
      manual.corrosionRequired === "excellent" ||
      manual.corrosionRequired === "good" ||
      manual.corrosionRequired === "fair"
        ? manual.corrosionRequired
        : undefined,
    electricallyConductive:
      typeof manual.electricallyConductive === "boolean" ? manual.electricallyConductive : undefined,
    thermallyConductive:
      typeof manual.thermallyConductive === "boolean" ? manual.thermallyConductive : undefined,
    needsFDMPrintability:
      typeof manual.needsFDMPrintability === "boolean" ? manual.needsFDMPrintability : undefined,
    priorityWeights: normalisePriorityWeights(manual.priorityWeights)
  };
}

function buildManualQuery(manual?: Partial<UserConstraints>): string {
  if (!manual) {
    return "";
  }

  const details: string[] = [];

  if (manual.maxTemperature_c !== undefined) {
    details.push(`minimum service temperature ${manual.maxTemperature_c}°C`);
  }

  if (manual.minTensileStrength_mpa !== undefined) {
    details.push(`minimum tensile strength ${manual.minTensileStrength_mpa} MPa`);
  }

  if (manual.maxDensity_g_cm3 !== undefined) {
    details.push(`maximum density ${manual.maxDensity_g_cm3} g/cm³`);
  }

  if (manual.maxCost_usd_kg !== undefined) {
    details.push(`maximum cost $${manual.maxCost_usd_kg}/kg`);
  }

  if (manual.corrosionRequired) {
    details.push(`corrosion resistance at least ${manual.corrosionRequired}`);
  }

  if (manual.needsFDMPrintability) {
    details.push("must be suitable for FDM printing");
  }

  if (manual.electricallyConductive) {
    details.push("must be electrically conductive");
  }

  if (manual.thermallyConductive) {
    details.push("must be thermally conductive");
  }

  return details.length > 0
    ? `Manual engineering constraints: ${details.join(", ")}.`
    : "Manual engineering constraints provided without a natural-language query.";
}

function buildClarifications(
  constraints: UserConstraints,
  resultCount: number,
  usedManualOverrides: boolean,
  explanationMode: "llm" | "deterministic"
): string {
  const details: string[] = [];

  if (constraints.maxTemperature_c !== undefined) {
    details.push(`service temperature >= ${constraints.maxTemperature_c}°C`);
  }

  if (constraints.minTensileStrength_mpa !== undefined) {
    details.push(`tensile strength >= ${constraints.minTensileStrength_mpa} MPa`);
  }

  if (constraints.maxDensity_g_cm3 !== undefined) {
    details.push(`density <= ${constraints.maxDensity_g_cm3} g/cm³`);
  }

  if (constraints.maxCost_usd_kg !== undefined) {
    details.push(`cost <= $${constraints.maxCost_usd_kg}/kg`);
  }

  const filters = details.length > 0 ? details.join(", ") : "no explicit hard limits";
  const overrideText = usedManualOverrides
    ? "Manual filters were merged with the LLM interpretation."
    : "Filters were inferred from the natural-language query.";
  const resultText = resultCount === 0 ? "No materials survived the final hard filter." : `${resultCount} ranked candidates returned.`;
  const explanationText =
    explanationMode === "llm"
      ? "Gemini generated the technical explanation."
      : "Gemini explanation was unavailable, so a deterministic local summary was returned instead.";

  return `${overrideText} Deterministic scoring then ranked the embedded materials database using ${filters}. ${resultText} ${explanationText}`;
}

function buildDeterministicExplanation(
  query: string,
  constraints: UserConstraints,
  rankedMaterials: ReturnType<typeof scoreMaterials>
): string {
  const [first, second, third] = rankedMaterials;

  if (!first) {
    return "No materials survived the active hard filters. Relax the strictest limit, especially cost, density, temperature, or printability, and rerun the search to inspect near-miss candidates.";
  }

  const promptLabel = query.trim().length > 0 ? `for "${query.trim()}"` : "for the current engineering constraints";
  const firstParagraph = `${first.name} is the current best fit ${promptLabel} because it survives every active hard filter and then scores strongly on ${first.matchReason.toLowerCase()}`;
  const secondParagraph = second && third
    ? `${second.name} and ${third.name} are the nearest alternatives. ${second.name} changes the balance between service temperature, density, and cost, while ${third.name} remains useful when the trade space shifts toward corrosion resistance, manufacturability, or availability.`
    : `${first.name} stands out because the current constraint envelope narrows the feasible options to a small part of the embedded database.`;
  const activeLimits = [
    constraints.maxTemperature_c !== undefined ? `temperature >= ${constraints.maxTemperature_c}°C` : null,
    constraints.minTensileStrength_mpa !== undefined ? `tensile >= ${constraints.minTensileStrength_mpa} MPa` : null,
    constraints.maxDensity_g_cm3 !== undefined ? `density <= ${constraints.maxDensity_g_cm3} g/cm³` : null,
    constraints.maxCost_usd_kg !== undefined ? `cost <= $${constraints.maxCost_usd_kg}/kg` : null
  ]
    .filter((value): value is string => Boolean(value))
    .join(", ");
  const thirdParagraph = activeLimits
    ? `The ranking is based on the embedded dataset and the current limits of ${activeLimits}. Before procurement, validate secondary factors such as fatigue behavior, joining route, stock form availability, and environment-specific degradation.`
    : "The ranking is based on the embedded dataset alone, so validate secondary factors such as fatigue behavior, joining route, stock form availability, and environment-specific degradation before procurement.";

  return [firstParagraph, secondParagraph, thirdParagraph].join("\n\n");
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured. See README for setup." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as RecommendRequestBody;
    const rawQuery = typeof body.query === "string" ? body.query.trim() : "";
    const manualConstraints = sanitiseManualConstraints(body.manualConstraints, rawQuery);
    const query = rawQuery || buildManualQuery(manualConstraints);

    if (!query) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    const history = sanitiseHistory(body.history);
    const contextualQuery =
      rawQuery && history.length > 0
        ? `${history.filter((entry) => entry.role === "user").map((entry) => entry.parts).join("\n")}\n${rawQuery}`
        : rawQuery || query;

    const inferredConstraints = rawQuery
      ? await extractConstraints(contextualQuery)
      : buildDefaultConstraints(query);
    const mergedConstraints = mergeConstraints(
      { ...inferredConstraints, rawQuery: query },
      manualConstraints
    );
    const rankedMaterials = scoreMaterials(mergedConstraints, materialsDB);
    let llmExplanation = "";
    let explanationMode: "llm" | "deterministic" = "llm";

    try {
      llmExplanation = await generateExplanation(query, rankedMaterials.slice(0, 5), history);
    } catch {
      explanationMode = "deterministic";
      llmExplanation = buildDeterministicExplanation(query, mergedConstraints, rankedMaterials);
    }

    return NextResponse.json({
      rankedMaterials,
      llmExplanation,
      inferredConstraints: mergedConstraints,
      clarifications: buildClarifications(
        mergedConstraints,
        rankedMaterials.length,
        Boolean(manualConstraints),
        explanationMode
      )
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
