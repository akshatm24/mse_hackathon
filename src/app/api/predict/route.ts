import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { materialsDB } from "@/lib/materials-db";

const ELEMENT_NAMES: Record<string, string> = {
  al: "aluminum",
  ag: "silver",
  au: "gold",
  c: "carbon",
  co: "cobalt",
  cr: "chromium",
  cu: "copper",
  fe: "iron",
  mn: "manganese",
  mo: "molybdenum",
  ni: "nickel",
  si: "silicon",
  sn: "tin",
  ti: "titanium",
  v: "vanadium",
  w: "tungsten",
  zn: "zinc"
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasToken(text: string, token: string) {
  return new RegExp(`(^|[^a-z])${escapeRegex(token)}([^a-z]|$)`).test(text);
}

function extractCompositionSignals(composition: string) {
  const symbols = Array.from(
    new Set((composition.match(/[A-Z][a-z]?/g) ?? []).map((token) => token.toLowerCase()))
  ).filter((token) => token in ELEMENT_NAMES);

  const words = Array.from(
    new Set(
      composition
        .toLowerCase()
        .replace(/[0-9.]/g, " ")
        .split(/[\s,/:-]+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 1)
    )
  );

  return {
    symbols,
    words
  };
}

async function buildPrediction(composition: string) {
  const cleaned = composition.trim();
  const signals = extractCompositionSignals(cleaned);
  const analogues = materialsDB
    .map((material) => {
      const text =
        `${material.name} ${material.subcategory} ${material.tags.join(" ")} ${material.formula_pretty ?? ""}`.toLowerCase();
      const matchedSymbols = signals.symbols.filter(
        (symbol) => hasToken(text, symbol) || text.includes(ELEMENT_NAMES[symbol])
      );
      const matchedWords = signals.words.filter((token) => text.includes(token));
      const extraElements = Object.entries(ELEMENT_NAMES).filter(
        ([symbol, name]) =>
          !signals.symbols.includes(symbol) && (hasToken(text, symbol) || text.includes(name))
      ).length;
      const familyBonus =
        matchedSymbols.length >= 2 && /alloy|steel|bronze|brass|nickel|copper|aluminum|titanium/.test(text)
          ? 0.4
          : 0;
      const score = matchedSymbols.length * 2.4 + matchedWords.length * 0.6 + familyBonus - extraElements * 0.35;
      return { material, score, matchedSymbols: matchedSymbols.length, extraElements };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (right.matchedSymbols !== left.matchedSymbols) {
        return right.matchedSymbols - left.matchedSymbols;
      }
      if (left.extraElements !== right.extraElements) {
        return left.extraElements - right.extraElements;
      }
      return (right.material.tensile_strength_mpa ?? 0) - (left.material.tensile_strength_mpa ?? 0);
    })
    .slice(0, 3)
    .map((entry) => entry.material);

  let prediction = "";
  let geminiUsed = false;

  if (process.env.GEMINI_API_KEY && analogues.length > 0) {
    try {
      const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
      const analogueContext = analogues
        .map(
          (material) =>
            `${material.name}: density ${material.density_g_cm3} g/cm³, tensile ${material.tensile_strength_mpa} MPa, max temp ${material.max_service_temp_c}°C, cost $${material.cost_usd_kg}/kg`
        )
        .join("\n");

      const prompt = `You are a materials scientist.\nA user wants to screen a novel composition: "${cleaned}".\n\nClosest known analogues from the database:\n${analogueContext}\n\nBased on the composition and these analogues, predict screening-level properties for "${cleaned}".\nWrite 2-3 paragraphs:\n1. Estimated properties (density, tensile strength, max service temperature) with reasoning based on composition\n2. Which closest analogue is most similar and why\n3. Key uncertainties and what experimental validation is needed\n\nBe specific with numbers. Label everything as estimated or predicted.`;

      const result = await model.generateContent(prompt);
      prediction = result.response.text().trim();
      geminiUsed = Boolean(prediction);
    } catch {
      geminiUsed = false;
    }
  }

  if (!prediction) {
    const closest = analogues[0];
    prediction = closest
      ? `Predicted screening-level analogue: ${closest.name}. Estimated behavior for ${cleaned} is around ${closest.density_g_cm3} g/cm³ density, ${closest.tensile_strength_mpa} MPa tensile strength, and ${closest.max_service_temp_c}°C service temperature because its composition most closely overlaps the elements and engineering role in the database.\n\nThis is a local estimate, not a measured dataset entry. Use it to decide whether the composition is worth synthesis, then validate phase stability, heat-treatment response, corrosion behavior, and room-to-service-temperature mechanical properties experimentally.`
      : `No close analogue was found for ${cleaned}. Try a more explicit composition such as Fe70Ni30, Cu-30Zn, or Ti-6Al-4V-2Sn so the predictor has a better screening anchor.`;
  }

  return {
    composition: cleaned,
    prediction,
    analogues,
    geminiUsed
  };
}

export async function GET(request: NextRequest) {
  try {
    const composition = request.nextUrl.searchParams.get("composition") ?? request.nextUrl.searchParams.get("formula");
    if (!composition?.trim()) {
      return NextResponse.json({ error: "composition required" }, { status: 400 });
    }

    return NextResponse.json(await buildPrediction(composition));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { composition } = (await request.json()) as { composition?: string };
    if (!composition?.trim()) {
      return NextResponse.json({ error: "composition required" }, { status: 400 });
    }

    return NextResponse.json(await buildPrediction(composition));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
