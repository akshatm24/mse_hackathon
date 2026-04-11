import { GoogleGenerativeAI } from "@google/generative-ai";

import { RankedMaterial, UserConstraints } from "@/types";
import { inferQueryIntent } from "@/lib/query-intent";
import { normalisePriorityWeights } from "@/lib/weights";

type Axis = "cost" | "thermal" | "weight" | "strength" | "corrosion";

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY not set");
  }
  return new GoogleGenerativeAI(key);
}

function countSignalHits(query: string) {
  const { axisHits } = inferQueryIntent(query);

  return {
    cost: axisHits.cost,
    thermal: axisHits.thermal,
    weight: axisHits.weight,
    strength: axisHits.strength,
    corrosion: axisHits.corrosion
  };
}

function repairPriorityWeights(
  query: string,
  parsedWeights: Partial<UserConstraints["priorityWeights"]> | undefined,
  fallbackWeights: UserConstraints["priorityWeights"]
): UserConstraints["priorityWeights"] {
  const normalised = normalisePriorityWeights(parsedWeights);
  const hits = countSignalHits(query);
  const entries = Object.entries(hits).sort((left, right) => right[1] - left[1]) as [
    Axis,
    number
  ][];
  const [topAxis, topCount] = entries[0];
  const [secondAxis, secondCount] = entries[1];

  if (topCount === 0) {
    return normalised;
  }

  const strongMinimums: Record<Axis, number> = {
    cost: 0.6,
    thermal: 0.6,
    weight: 0.6,
    strength: 0.6,
    corrosion: 0.6
  };

  if (entries.some(([axis, count]) => count > 0 && normalised[axis] >= strongMinimums[axis])) {
    return normalised;
  }

  if (topCount >= 1 && secondCount >= 1 && secondCount >= topCount * 0.5) {
    if (normalised[topAxis] < 0.45 || normalised[secondAxis] < 0.25) {
      return fallbackWeights;
    }
    return normalised;
  }

  if (normalised[topAxis] < strongMinimums[topAxis]) {
    return fallbackWeights;
  }

  return normalised;
}

export function heuristicExtract(query: string): UserConstraints {
  const q = query.toLowerCase();
  const profile = inferQueryIntent(query);

  const hits = profile.axisHits;

  const sorted = Object.entries(hits).sort((left, right) => right[1] - left[1]);
  const [topAxis, topCount] = sorted[0];
  const [, secondCount] = sorted[1];
  const secondAxis = sorted[1]?.[0];

  let weights: UserConstraints["priorityWeights"] = {
    strength: 0.28,
    cost: 0.28,
    thermal: 0.18,
    weight: 0.18,
    corrosion: 0.08
  };

  if (topCount >= 1) {
    const dominant = {
      strength: 0.08,
      cost: 0.08,
      thermal: 0.08,
      weight: 0.08,
      corrosion: 0.08
    };
    (dominant as Record<string, number>)[topAxis] = 0.65;
    const others = Object.keys(dominant).filter((key) => key !== topAxis);
    const each = (1 - 0.65) / others.length;
    others.forEach((key) => {
      (dominant as Record<string, number>)[key] = each;
    });
    weights = dominant;
  }

  if (topCount >= 1 && secondAxis && secondCount >= 1 && secondCount >= topCount * 0.5) {
    const paired = {
      strength: 0.05,
      cost: 0.05,
      thermal: 0.05,
      weight: 0.05,
      corrosion: 0.05
    };
    const shouldFavorWeight =
      secondAxis === "weight" &&
      /\blight(?:weight)?\b|\blow[- ]density\b/i.test(query);
    const primaryAxis = shouldFavorWeight ? secondAxis : topAxis;
    const secondaryAxis = shouldFavorWeight ? topAxis : secondAxis;

    (paired as Record<string, number>)[primaryAxis] = 0.5;
    (paired as Record<string, number>)[secondaryAxis] = 0.3;
    const others = Object.keys(paired).filter(
      (key) => key !== primaryAxis && key !== secondaryAxis
    );
    const each = (1 - 0.5 - 0.3) / others.length;
    others.forEach((key) => {
      (paired as Record<string, number>)[key] = each;
    });
    weights = paired;
  }

  if (topAxis === "cost" && topCount >= 1 && secondCount === 0) {
    weights = {
      thermal: 0.025,
      strength: 0.025,
      weight: 0.025,
      cost: 0.9,
      corrosion: 0.025
    };
  }

  const tempMatch = q.match(/(\d{2,4})\s*(?:°?\s*c\b|celsius|degrees?\s*c)/i);
  const contextTemp = q.includes("motor")
    ? 85
    : q.includes("oven")
      ? 200
      : q.includes("furnace")
        ? 500
        : q.includes("autoclave")
          ? 135
          : q.includes("cryogen")
            ? -50
            : q.includes("reflow")
              ? 260
              : undefined;

  const budgetMatch = q.match(
    /(?:under|less than|below|max|budget[^\d]*)\s*\$?\s*(\d+)/i
  );

  const needsFDM = profile.wantsFDM;
  const practicalFdmQuery = profile.practicalFdm;
  const needsConductive = profile.wantsElectricalConductivity;
  const needsInsulating = profile.wantsElectricalInsulation;
  const needsThermalConductive = profile.wantsThermalConductivity;

  const corrosionRequired =
    q.includes("highly corrosive") || q.includes("strong acid")
      ? ("excellent" as const)
      : profile.wantsAcidResistance
        ? ("excellent" as const)
        : profile.wantsMarine ||
            profile.wantsOutdoor ||
            q.includes("corrosion resist")
        ? ("good" as const)
        : undefined;

  const maxCost =
    practicalFdmQuery && (tempMatch ? parseInt(tempMatch[1], 10) : contextTemp ?? 0) <= 120
      ? budgetMatch
        ? Math.min(parseFloat(budgetMatch[1]), 80)
        : 80
      : budgetMatch
        ? parseFloat(budgetMatch[1])
        : undefined;

  if (practicalFdmQuery) {
    const hasThermalContext =
      topAxis === "thermal" || tempMatch !== null || contextTemp !== undefined;

    weights = hasThermalContext
      ? {
          thermal: 0.35,
          strength: 0.25,
          weight: 0.15,
          cost: 0.2,
          corrosion: 0.05
        }
      : {
          thermal: 0.15,
          strength: 0.35,
          weight: 0.2,
          cost: 0.25,
          corrosion: 0.05
        };
  }

  return {
    maxTemperature_c: tempMatch ? parseInt(tempMatch[1], 10) : contextTemp,
    maxCost_usd_kg: maxCost,
    needsFDMPrintability: needsFDM || undefined,
    electricallyConductive: needsConductive || undefined,
    electricallyInsulating: needsInsulating || undefined,
    thermallyConductive: needsThermalConductive || undefined,
    corrosionRequired,
    priorityWeights: normalisePriorityWeights(weights),
    rawQuery: query
  };
}

export async function extractConstraints(
  query: string
): Promise<UserConstraints> {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json"
      }
    });
    const prompt = `You are a materials science expert.
Read the user's engineering query carefully.
Extract constraints and return ONLY valid JSON — no markdown,
no backticks, no text before or after the JSON object.

CRITICAL WEIGHT RULES — violating these makes the app useless:
- If user says "cheap", "budget", "affordable", "low cost",
  "inexpensive", "cheapest", "least cost", "lowest cost",
  "minimum cost", "lowest price" → cost weight MUST be >= 0.60
- If user says "lightweight", "low density", "drone", "aircraft"
  → weight weight MUST be >= 0.60
- If user says "strong", "high strength", "structural", "load"
  → strength weight MUST be >= 0.60
- If user says "heat resistant", "high temperature", "motor",
  "furnace", "reflow" → thermal weight MUST be >= 0.60
- If user says "marine", "seawater", "acid", "corrosion"
  → corrosion weight MUST be >= 0.60
- If user says "metal", "alloy", "steel" do not treat polymer,
  ceramic, or composite materials as a better semantic match.
- If user says "plastic", "polymer" do not treat metals or
  ceramics as a better semantic match.
- If user says "3D print", "FDM", "filament" then
  needsFDMPrintability MUST be true.
- If user says "conductive", "current", "probe", "electrode",
  "connector", "contact" then electricallyConductive MUST be true.
- If user says "insulator", "insulating", "dielectric",
  "non-conductive" then electricallyInsulating MUST be true.
- If user says "thermally conductive", "heat sink",
  "heat spreader" then thermallyConductive MUST be true.
- NEVER use balanced weights (all 0.20) unless the user gave
  absolutely NO priority signal whatsoever.
- Weights MUST sum to exactly 1.0.

Also extract maxCost_usd_kg if user mentions a budget:
  "under $10/kg" → maxCost_usd_kg: 10
  "less than $5 per kg" → maxCost_usd_kg: 5
  "budget under $50" → maxCost_usd_kg: 50

JSON schema (omit fields you cannot infer):
{
  "maxTemperature_c": number,
  "minTensileStrength_mpa": number,
  "maxDensity_g_cm3": number,
  "maxCost_usd_kg": number,
  "corrosionRequired": "excellent"|"good"|"fair",
  "electricallyConductive": boolean,
  "electricallyInsulating": boolean,
  "thermallyConductive": boolean,
  "needsFDMPrintability": boolean,
  "priorityWeights": {
    "thermal": number,
    "strength": number,
    "weight": number,
    "cost": number,
    "corrosion": number
  }
}

User query: ${query}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(clean) as Partial<UserConstraints>;
    const fallback = heuristicExtract(query);
    const profile = inferQueryIntent(query);

    return {
      ...fallback,
      ...parsed,
      needsFDMPrintability:
        profile.wantsFDM ? true : parsed.needsFDMPrintability ?? fallback.needsFDMPrintability,
      electricallyConductive:
        profile.wantsElectricalConductivity
          ? true
          : parsed.electricallyConductive ?? fallback.electricallyConductive,
      electricallyInsulating:
        profile.wantsElectricalInsulation
          ? true
          : parsed.electricallyInsulating ?? fallback.electricallyInsulating,
      thermallyConductive:
        profile.wantsThermalConductivity
          ? true
          : parsed.thermallyConductive ?? fallback.thermallyConductive,
      priorityWeights: repairPriorityWeights(
        query,
        parsed.priorityWeights,
        fallback.priorityWeights
      ),
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
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
    });
    const ctx = ranked
      .slice(0, 5)
      .map(
        (material, index) =>
          `${index + 1}. ${material.name} — Score ${material.score}/100 | ` +
          `Max service temp: ${material.max_service_temp_c}°C | ` +
          `Tensile: ${material.tensile_strength_mpa} MPa | ` +
          `Density: ${material.density_g_cm3} g/cm³ | ` +
          `Cost: $${material.cost_usd_kg}/kg | ` +
          `Category: ${material.category}`
      )
      .join("\n");

    const prompt =
      `You are a virtual materials scientist advising an engineer.\n` +
      `Problem: "${query}"\nRanked candidates:\n${ctx}\n\n` +
      `Write exactly 3 paragraphs with NO bullet points:\n` +
      `1. Why #1 is recommended — cite specific property values.\n` +
      `2. Compare #1 vs #2 vs #3 — when would each be preferred?\n` +
      `3. Important caveats the engineer must know before ordering.`;

    const chat = model.startChat({
      history: (history ?? []).map((message) => ({
        role: message.role as "user" | "model",
        parts: [{ text: message.parts }]
      }))
    });
    const res = await chat.sendMessage(prompt);
    return res.response.text();
  } catch {
    const top = ranked[0];
    if (!top) {
      return "No materials matched your constraints.";
    }
    return (
      `Based on your requirements, ${top.name} is the top recommendation with a score of ${top.score}/100. ` +
      `It offers a maximum service temperature of ${top.max_service_temp_c}°C, tensile strength of ` +
      `${top.tensile_strength_mpa} MPa, density of ${top.density_g_cm3} g/cm³, and costs approximately ` +
      `$${top.cost_usd_kg}/kg. The AI explanation is unavailable (Gemini quota exceeded) but the deterministic scoring ` +
      "above is fully reliable."
    );
  }
}
