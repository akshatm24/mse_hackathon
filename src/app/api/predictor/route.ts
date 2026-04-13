import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

import { ENGINEERING_MATERIALS, MP_COMPOUNDS } from "@/data";
import {
  cosineSimilarity,
  elementKeywordScore,
  formulaForMaterial,
  normalizeFractions,
  parseFormulaFractionsLocal
} from "@/lib/formula";
import type { Material, PredictorMatchResponse } from "@/types";

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }

  return new GoogleGenerativeAI(key);
}

async function extractElementFractions(formula: string) {
  const fallback = parseFormulaFractionsLocal(formula);
  const client = getGeminiClient();

  if (!client) {
    return fallback;
  }

  try {
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
Return only valid JSON mapping element symbols to numeric composition parts for this alloy formula:
"${formula}"

Rules:
- Infer omitted balance content when the notation implies a balance element.
- Use only chemical symbols as keys.
- Do not include any prose or markdown.
Example output: {"Ni":40,"Co":20,"Cr":20,"Mo":10,"Ti":10}
`.trim();

    const response = await model.generateContent(prompt);
    const raw = response.response.text().trim();
    const clean = raw.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(clean);

    if (!parsed || typeof parsed !== "object") {
      return fallback;
    }

    const numeric = Object.fromEntries(
      Object.entries(parsed)
        .filter(
          ([key, value]) =>
            /^[A-Z][a-z]?$/.test(key) && typeof value === "number" && Number.isFinite(value)
        )
        .map(([key, value]) => [key, value])
    );

    const normalised = normalizeFractions(numeric as Record<string, number>);
    return Object.keys(normalised).length > 0 ? normalised : fallback;
  } catch {
    return fallback;
  }
}

function propertyDistance(left: Material, right: Material) {
  const keys = [
    "density_g_cm3",
    "tensile_strength_mpa",
    "elastic_modulus_gpa",
    "max_service_temp_c",
    "thermal_conductivity_w_mk",
    "cost_usd_kg"
  ] as const;

  let weight = 0;
  let score = 0;

  for (const key of keys) {
    const l = left[key];
    const r = right[key];
    if (typeof l !== "number" || typeof r !== "number") {
      continue;
    }

    const scale = Math.max(Math.abs(l), Math.abs(r), 1);
    score += 1 - Math.min(1, Math.abs(l - r) / scale);
    weight += 1;
  }

  return weight > 0 ? score / weight : 0;
}

function scoreAnalogue(compound: Material, material: Material, queryElements: string[]) {
  const categoryScore = compound.category === material.category ? 1 : 0.3;
  const propertyScore = propertyDistance(compound, material);
  const keywordScore = elementKeywordScore(material, queryElements);
  const tempBonus =
    typeof compound.max_service_temp_c === "number" &&
    typeof material.max_service_temp_c === "number" &&
    material.max_service_temp_c >= compound.max_service_temp_c * 0.55
      ? 1
      : 0;

  return propertyScore * 0.5 + keywordScore * 0.25 + categoryScore * 0.15 + tempBonus * 0.1;
}

function buildExplanation(formula: string, compound: Material, analogue: Material, similarity: number) {
  const similarityPct = Math.round(similarity * 100);
  return `${formula} most closely matches ${compound.name} in the Materials Project compound set. ${analogue.name} is the nearest engineering-grade analogue because it sits in the same design space for category and screened properties, including ${typeof analogue.max_service_temp_c === "number" ? `${analogue.max_service_temp_c}°C temperature capability` : "high-temperature service"} and ${typeof analogue.tensile_strength_mpa === "number" ? `${analogue.tensile_strength_mpa} MPa strength` : "comparable strength behavior"}. Treat this as a screening result: validate the final phase constitution, processing route, and datasheet before design release.`;
}

export async function GET(req: NextRequest) {
  try {
    const formula = req.nextUrl.searchParams.get("formula")?.trim();

    if (!formula) {
      return NextResponse.json({ error: "formula is required" }, { status: 400 });
    }

    const queryFractions = await extractElementFractions(formula);
    if (Object.keys(queryFractions).length === 0) {
      return NextResponse.json({ error: "Could not parse the requested formula." }, { status: 400 });
    }

    const compoundMatches = MP_COMPOUNDS.map((material) => {
      const materialFormula = formulaForMaterial(material);
      const fractions = materialFormula ? parseFormulaFractionsLocal(materialFormula) : {};
      return {
        material,
        similarity: cosineSimilarity(queryFractions, fractions)
      };
    })
      .filter((entry) => entry.similarity > 0)
      .sort((left, right) => {
        if (right.similarity !== left.similarity) {
          return right.similarity - left.similarity;
        }

        const leftHull = left.material.energy_above_hull ?? Number.POSITIVE_INFINITY;
        const rightHull = right.material.energy_above_hull ?? Number.POSITIVE_INFINITY;
        return leftHull - rightHull;
      });

    const compound = compoundMatches[0]?.material;
    if (!compound) {
      return NextResponse.json({ error: "No close Materials Project compound was found." }, { status: 404 });
    }

    const queryElements = Object.keys(queryFractions);
    const analogueMatches = ENGINEERING_MATERIALS.map((material) => ({
      material,
      score: scoreAnalogue(compound, material, queryElements)
    }))
      .sort((left, right) => right.score - left.score);

    const analogue = analogueMatches[0]?.material;
    if (!analogue) {
      return NextResponse.json({ error: "No engineering analogue was found." }, { status: 404 });
    }

    const response: PredictorMatchResponse = {
      parsedFormula: formula,
      elementFractions: queryFractions,
      compound,
      analogue,
      alternatives: analogueMatches.slice(1, 4).map((entry) => entry.material),
      explanation: buildExplanation(
        formula,
        compound,
        analogue,
        compoundMatches[0]?.similarity ?? 0
      ),
      confidence: Math.max(
        35,
        Math.min(
          95,
          Math.round(((compoundMatches[0]?.similarity ?? 0) * 0.65 + analogueMatches[0]?.score * 0.35) * 100)
        )
      )
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Prediction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
