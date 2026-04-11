import { GoogleGenerativeAI } from "@google/generative-ai";

import { RankedMaterial, UserConstraints } from "@/types";
import { DEFAULT_PRIORITY_WEIGHTS, normalisePriorityWeights } from "@/lib/scoring";

export const GEMINI_MODEL = "gemini-2.0-flash";

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY not configured");
  }
  return new GoogleGenerativeAI(key);
}

const defaultWeights: UserConstraints["priorityWeights"] = {
  ...DEFAULT_PRIORITY_WEIGHTS
};

function heuristicExtract(query: string): UserConstraints {
  const q = query.toLowerCase();
  const weights = { ...defaultWeights };

  if (
    q.includes("heat") ||
    q.includes("temp") ||
    q.includes("hot") ||
    q.includes("warp") ||
    q.includes("melt")
  ) {
    weights.thermal = 0.4;
  }
  if (q.includes("light") || q.includes("weight") || q.includes("density")) {
    weights.weight = 0.35;
  }
  if (q.includes("strong") || q.includes("strength") || q.includes("load")) {
    weights.strength = 0.35;
  }
  if (q.includes("cheap") || q.includes("cost") || q.includes("budget")) {
    weights.cost = 0.35;
  }
  if (q.includes("corros") || q.includes("rust") || q.includes("marine")) {
    weights.corrosion = 0.35;
  }

  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  Object.keys(weights).forEach((key) => {
    (weights as Record<string, number>)[key] /= total;
  });

  const tempMatch = q.match(/(\d{2,4})\s*°?\s*c/);
  const needsFDM =
    q.includes("3d print") ||
    q.includes("fdm") ||
    q.includes("print") ||
    q.includes("desktop printer");

  return {
    maxTemperature_c: tempMatch ? parseInt(tempMatch[1], 10) : undefined,
    needsFDMPrintability: needsFDM || undefined,
    priorityWeights: normalisePriorityWeights(weights),
    rawQuery: query
  };
}

export async function extractConstraints(query: string): Promise<UserConstraints> {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are a materials science expert. Extract engineering
constraints from the user description. Return ONLY a valid JSON object with
this exact shape (omit any field you cannot infer):
{
  "maxTemperature_c": number,
  "minTensileStrength_mpa": number,
  "maxDensity_g_cm3": number,
  "maxCost_usd_kg": number,
  "corrosionRequired": "excellent"|"good"|"fair",
  "electricallyConductive": boolean,
  "thermallyConductive": boolean,
  "needsFDMPrintability": boolean,
  "priorityWeights": {
    "strength": number,
    "thermal": number,
    "weight": number,
    "cost": number,
    "corrosion": number
  }
}
Weights must sum to 1.0. No markdown, no text outside the JSON.
User description: ${query}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text
      .replace(/^```json\s*/, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(clean) as Partial<UserConstraints>;
    return {
      ...parsed,
      priorityWeights: normalisePriorityWeights(parsed.priorityWeights),
      rawQuery: query
    };
  } catch {
    return heuristicExtract(query);
  }
}

export async function generateExplanation(
  query: string,
  ranked: RankedMaterial[],
  history?: { role: string; parts: string }[]
): Promise<string> {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const materialsContext = ranked
      .slice(0, 5)
      .map(
        (m, index) =>
          `${index + 1}. ${m.name} (Score: ${m.score}/100) — ` +
          `Max temp: ${m.max_service_temp_c}°C, ` +
          `Tensile: ${m.tensile_strength_mpa} MPa, ` +
          `Density: ${m.density_g_cm3} g/cm³, ` +
          `Cost: $${m.cost_usd_kg}/kg`
      )
      .join("\n");

    const prompt = `You are a virtual materials scientist.
User's engineering problem: "${query}"
Top ranked materials:
${materialsContext}

Write 3 paragraphs (no bullet points):
1. Why the #1 material is recommended with specific property values.
2. Compare top 3 alternatives and when each would be preferred.
3. Important caveats or edge cases the engineer should know.`;

    const chat = model.startChat({
      history: (history || []).map((h) => ({
        role: h.role as "user" | "model",
        parts: [{ text: h.parts }]
      }))
    });
    const result = await chat.sendMessage(prompt);
    return result.response.text();
  } catch {
    const top = ranked[0];
    return (
      `Based on your requirements, ${top?.name ?? "the top candidate"} is recommended as the optimal material. ` +
      `It offers a maximum service temperature of ${top?.max_service_temp_c}°C, ` +
      `tensile strength of ${top?.tensile_strength_mpa} MPa, and density of ${top?.density_g_cm3} g/cm³ ` +
      `at approximately $${top?.cost_usd_kg}/kg. ` +
      "Consider the top 3 candidates carefully based on your specific operating conditions and budget constraints."
    );
  }
}
