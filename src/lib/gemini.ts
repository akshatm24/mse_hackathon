import { GoogleGenerativeAI } from "@google/generative-ai";

import { RankedMaterial, UserConstraints } from "@/types";
import { buildDefaultConstraints, normalisePriorityWeights } from "@/lib/scoring";

const MODEL_NAME = "gemini-2.0-flash";

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured. See README for setup.");
  }

  return new GoogleGenerativeAI(apiKey);
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true") {
      return true;
    }
    if (lowered === "false") {
      return false;
    }
  }

  return undefined;
}

function toCorrosionLevel(value: unknown): UserConstraints["corrosionRequired"] {
  if (value === "excellent" || value === "good" || value === "fair") {
    return value;
  }

  return undefined;
}

function heuristicConstraintsFromQuery(rawQuery: string): UserConstraints {
  const fallback = buildDefaultConstraints(rawQuery);
  const lower = rawQuery.toLowerCase();

  const celsiusMatches = [...rawQuery.matchAll(/(-?\d+(?:\.\d+)?)\s*°?\s*c\b/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value));
  const mpaMatches = [...rawQuery.matchAll(/(\d+(?:\.\d+)?)\s*mpa\b/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value));

  const costMatch = rawQuery.match(
    /(?:under|below|less than|stay under|max(?:imum)?(?: cost)?|budget(?: of)?|target(?: cost)?(?: of)?)\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:\/\s*kg|per\s*kg|kg\b)/i
  );
  const densityMatch = rawQuery.match(
    /(?:under|below|less than|max(?:imum)?(?: density)?|density(?: below| under)?(?: of)?)\s*(\d+(?:\.\d+)?)\s*g\s*\/\s*cm(?:3|³)/i
  );

  const corrosionRequired: UserConstraints["corrosionRequired"] =
    /seawater|salt spray|marine|acid|chemical plant|chloride/i.test(rawQuery)
      ? "excellent"
      : /corrosion|humid|oxidation|rust/i.test(rawQuery)
        ? "good"
        : undefined;

  const weightHints = {
    strength: /high strength|high load|structural|fatigue|torque|stiff|load[- ]bearing|bracket/i.test(rawQuery) ? 30 : 0,
    thermal: /heat|thermal|temperature|hot|cryogenic|survive\s+\d+\s*°?\s*c/i.test(rawQuery) ? 30 : 0,
    weight: /lightweight|low mass|mass-sensitive|weight-sensitive|portable/i.test(rawQuery) ? 35 : 0,
    cost: /under\s*\$|below\s*\$|budget|low cost|cheap|affordable/i.test(rawQuery) ? 30 : 0,
    corrosion: /corrosion|humid|marine|salt|chemical|oxidation|rust/i.test(rawQuery) ? 30 : 0
  };

  return {
    rawQuery,
    maxTemperature_c: celsiusMatches.length > 0 ? Math.max(...celsiusMatches) : undefined,
    minTensileStrength_mpa:
      /tensile|strength|load|structural|fatigue|torque/i.test(rawQuery) && mpaMatches.length > 0
        ? Math.max(...mpaMatches)
        : undefined,
    maxDensity_g_cm3:
      densityMatch && Number.isFinite(Number(densityMatch[1]))
        ? Number(densityMatch[1])
        : /lightweight|low mass|mass-sensitive|weight-sensitive/i.test(rawQuery)
          ? 3
          : undefined,
    maxCost_usd_kg:
      costMatch && Number.isFinite(Number(costMatch[1])) ? Number(costMatch[1]) : undefined,
    corrosionRequired,
    electricallyConductive: /electrical|conductive|current|probe|busbar|connector/i.test(rawQuery) || undefined,
    thermallyConductive: /heat sink|heat spreader|thermal conductivity|dissipate heat|thermal interface/i.test(rawQuery) || undefined,
    needsFDMPrintability: /fdm|3d print|3d printed|printable|consumer printer/i.test(rawQuery) || undefined,
    priorityWeights: normalisePriorityWeights({
      strength: 20 + weightHints.strength,
      thermal: 20 + weightHints.thermal,
      weight: 20 + weightHints.weight,
      cost: 20 + weightHints.cost,
      corrosion: 20 + weightHints.corrosion
    })
  };
}

function parseConstraints(text: string, rawQuery: string): UserConstraints {
  try {
    const parsed: unknown = JSON.parse(stripJsonFence(text));

    if (!isRecord(parsed)) {
      return heuristicConstraintsFromQuery(rawQuery);
    }

    const priorityWeights = isRecord(parsed.priorityWeights)
      ? {
          strength: toOptionalNumber(parsed.priorityWeights.strength) ?? undefined,
          thermal: toOptionalNumber(parsed.priorityWeights.thermal) ?? undefined,
          weight: toOptionalNumber(parsed.priorityWeights.weight) ?? undefined,
          cost: toOptionalNumber(parsed.priorityWeights.cost) ?? undefined,
          corrosion: toOptionalNumber(parsed.priorityWeights.corrosion) ?? undefined
        }
      : undefined;

    return {
      rawQuery,
      maxTemperature_c: toOptionalNumber(parsed.maxTemperature_c),
      minTensileStrength_mpa: toOptionalNumber(parsed.minTensileStrength_mpa),
      maxDensity_g_cm3: toOptionalNumber(parsed.maxDensity_g_cm3),
      maxCost_usd_kg: toOptionalNumber(parsed.maxCost_usd_kg),
      corrosionRequired: toCorrosionLevel(parsed.corrosionRequired),
      electricallyConductive: toOptionalBoolean(parsed.electricallyConductive),
      thermallyConductive: toOptionalBoolean(parsed.thermallyConductive),
      needsFDMPrintability: toOptionalBoolean(parsed.needsFDMPrintability),
      priorityWeights: normalisePriorityWeights(priorityWeights),
    };
  } catch {
    return heuristicConstraintsFromQuery(rawQuery);
  }
}

export async function extractConstraints(userQuery: string): Promise<UserConstraints> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction:
      "You are a materials science expert. Extract engineering constraints from the user's description and return ONLY a valid JSON object matching the UserConstraints TypeScript interface. No markdown, no preamble, no backticks."
  });

  const prompt = [
    "User description:",
    userQuery,
    "",
    "If a value is not explicitly inferable, omit it.",
    "Always include rawQuery as the original user description.",
    "If the user does not express weighting preferences, return equal priorityWeights."
  ].join("\n");

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseConstraints(text, userQuery);
  } catch {
    return heuristicConstraintsFromQuery(userQuery);
  }
}

export async function generateExplanation(
  query: string,
  rankedMaterials: RankedMaterial[],
  history?: { role: "user" | "model"; parts: string }[]
): Promise<string> {
  if (rankedMaterials.length === 0) {
    return "No materials survived the active hard filters. Relax the most restrictive constraint, especially cost, density, or printability, and rerun the search to inspect near-miss candidates.";
  }

  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction:
      "You are a virtual materials scientist. You will receive a list of ranked engineering materials and the user's problem. Write 3–5 paragraphs: (1) top recommendation with technical reasoning, (2) comparison of the top 3 and their trade-offs, (3) any caveats or edge cases. Be precise but accessible. No bullet points."
  });

  const chat = model.startChat({
    history: (history ?? []).map((entry) => ({
      role: entry.role,
      parts: [{ text: entry.parts }]
    }))
  });

  const materialSummary = rankedMaterials.map((material) => ({
    name: material.name,
    category: material.category,
    score: material.score,
    tensile_strength_mpa: material.tensile_strength_mpa,
    max_service_temp_c: material.max_service_temp_c,
    density_g_cm3: material.density_g_cm3,
    thermal_conductivity_w_mk: material.thermal_conductivity_w_mk,
    electrical_resistivity_ohm_m: material.electrical_resistivity_ohm_m,
    cost_usd_kg: material.cost_usd_kg,
    corrosion_resistance: material.corrosion_resistance,
    machinability: material.machinability,
    printability_fdm: material.printability_fdm,
    matchReason: material.matchReason
  }));

  const prompt = [
    `User problem: ${query}`,
    "",
    "Ranked materials JSON:",
    JSON.stringify(materialSummary)
  ].join("\n");

  const result = await chat.sendMessage(prompt);
  return result.response.text().trim();
}
