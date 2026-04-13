import { NextRequest, NextResponse } from "next/server";

import { ENGINEERING_MATERIALS } from "@/data";
import { deduplicateById } from "@/lib/dedup";
import { extractConstraints, generateExplanation, validateWeights } from "@/lib/gemini";
import { selectFromCandidates } from "@/lib/rag";
import { scoreMaterials } from "@/lib/scoring";
import type { UserConstraints } from "@/types";

function normaliseManualWeights(weights?: Partial<UserConstraints["priorityWeights"]>) {
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
    needsFDMPrintability:
      typeof manual.needsFDMPrintability === "boolean"
        ? manual.needsFDMPrintability
        : undefined,
    priorityWeights: normaliseManualWeights(manual.priorityWeights)
  };
}

function mergeConstraints(base: UserConstraints, manual?: Partial<UserConstraints>) {
  if (!manual) {
    return base;
  }

  return {
    ...base,
    ...manual,
    priorityWeights: manual.priorityWeights ?? base.priorityWeights,
    _negatedAxes: base._negatedAxes,
    rawQuery: base.rawQuery
  };
}

async function buildResponse(
  query: string,
  history?: { role: string; parts: string }[],
  manualConstraints?: Partial<UserConstraints>
) {
  let constraints = await extractConstraints(query);
  constraints = validateWeights(constraints);
  constraints = mergeConstraints(constraints, manualConstraints);

  const rankedMaterials = scoreMaterials(constraints, ENGINEERING_MATERIALS);
  const deduped = deduplicateById(rankedMaterials);
  const ragContext = selectFromCandidates(
    query,
    deduped.slice(0, 10),
    constraints._negatedAxes ?? [],
    5
  );
  const llmExplanation = await generateExplanation(query, deduped, history);

  return {
    rankedMaterials: deduped,
    llmExplanation,
    inferredConstraints: constraints,
    clarifications: "Constraints auto-detected from query.",
    matchCount: deduped.length,
    ragMaterials: ragContext.map((material) => material.name),
    warnings: Array.from(new Set(deduped.flatMap((material) => material.warnings ?? []))).slice(
      0,
      6
    )
  };
}

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query");
    if (!query?.trim()) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    const data = await buildResponse(query.trim());
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, history, manualConstraints } = (await req.json()) as {
      query: string;
      history?: { role: string; parts: string }[];
      manualConstraints?: Partial<UserConstraints>;
    };

    if (!query?.trim()) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    const data = await buildResponse(
      query.trim(),
      history,
      sanitiseManualConstraints(manualConstraints)
    );

    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
