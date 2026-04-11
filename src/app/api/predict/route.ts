import { NextRequest, NextResponse } from "next/server";

import { retrieveRelevantMaterials } from "@/lib/rag";
import { materialsDB } from "@/lib/materials-db";
import type { Material } from "@/types";

function normaliseFormula(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
}

function buildPredictionExplanation(
  formula: string,
  context: string,
  winner: Material,
  exactMatch: boolean
) {
  const matchType = exactMatch
    ? `An exact database match was found for ${formula}.`
    : `No exact database match was found for ${formula}, so the predictor selected the closest engineering analogue in the expanded materials corpus.`;

  const applicationContext = context
    ? ` For the stated use case (${context}),`
    : " For the stated use case,";

  return (
    `${matchType}${applicationContext} ${winner.name} is the strongest starting point. ` +
    `It brings ${winner.tensile_strength_mpa} MPa tensile strength, a maximum service temperature of ` +
    `${winner.max_service_temp_c}°C, density of ${winner.density_g_cm3} g/cm³, and an estimated ` +
    `cost of $${winner.cost_usd_kg}/kg. ` +
    `Treat this as a shortlist recommendation rather than a substitute for phase-diagram validation, ` +
    `heat-treatment selection, or experimental qualification.`
  );
}

function exactFormulaMatch(formula: string): Material | undefined {
  const normalised = normaliseFormula(formula);

  return materialsDB.find((material) => {
    const formulaPretty = material.formula_pretty
      ? normaliseFormula(material.formula_pretty)
      : "";
    const nameBase = normaliseFormula(material.name.replace(/\s*\([^)]*\).*$/, ""));

    return formulaPretty === normalised || nameBase === normalised;
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { formula?: string; context?: string };
    const formula = body.formula?.trim();
    const context = body.context?.trim() ?? "";

    if (!formula) {
      return NextResponse.json({ error: "formula is required" }, { status: 400 });
    }

    const exact = exactFormulaMatch(formula);
    const retrieved = await retrieveRelevantMaterials(`${formula}. ${context}`, 5);
    const winner = exact ?? retrieved[0] ?? null;

    if (!winner) {
      return NextResponse.json(
        { error: "No matching alloy candidates were found." },
        { status: 404 }
      );
    }

    const alternatives = retrieved
      .filter((material) => material.id !== winner.id)
      .slice(0, 3);

    return NextResponse.json({
      winner,
      alternatives,
      explanation: buildPredictionExplanation(formula, context, winner, Boolean(exact))
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prediction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
