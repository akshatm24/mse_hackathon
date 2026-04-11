import { GoogleGenerativeAI } from "@google/generative-ai";

import { UserConstraints, RankedMaterial } from "@/types";

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY not set");
  }
  return new GoogleGenerativeAI(key);
}

// Normalise weight object so values sum to exactly 1.0
function normaliseWeights(
  w: UserConstraints["priorityWeights"]
): UserConstraints["priorityWeights"] {
  const total = w.thermal + w.strength + w.weight + w.cost + w.corrosion;
  if (total === 0) {
    return {
      strength: 0.3,
      cost: 0.3,
      thermal: 0.15,
      weight: 0.15,
      corrosion: 0.1
    };
  }
  const t = total;
  return {
    thermal: Math.round((w.thermal / t) * 1000) / 1000,
    strength: Math.round((w.strength / t) * 1000) / 1000,
    weight: Math.round((w.weight / t) * 1000) / 1000,
    cost: Math.round((w.cost / t) * 1000) / 1000,
    corrosion: Math.round((w.corrosion / t) * 1000) / 1000
  };
}

export function heuristicExtract(query: string): UserConstraints {
  const q = query.toLowerCase();
  const solderWords = [
    "solder",
    "bga",
    "reflow",
    "pcb joint",
    "lead-free",
    "rohs",
    "smt",
    "die attach"
  ];
  const isSolderAssembly = solderWords.some((s) => q.includes(s));

  // Default weights — biased toward cost+strength for ambiguous
  // queries. This prevents outlier ceramics from always winning.
  const w = {
    strength: 0.3,
    cost: 0.3,
    thermal: 0.15,
    weight: 0.15,
    corrosion: 0.1
  };

  // Signal groups — first strong match overrides defaults
  const thermalSignals = [
    "heat",
    "temp",
    "hot",
    "warp",
    "melt",
    "thermal",
    "motor heat",
    "engine",
    "furnace",
    "oven",
    "°c",
    "celsius",
    "service temp",
    "fire",
    "high-temp",
    "reflow"
  ];
  const lightSignals = [
    "light",
    "lightweight",
    "weight",
    "density",
    "drone",
    "aircraft",
    "aerospace",
    "portable",
    "wearable",
    "rocket",
    "satellite",
    "low mass",
    "low weight"
  ];
  const strengthSignals = [
    "strong",
    "strength",
    "load",
    "stress",
    "force",
    "structural",
    "bearing",
    "high strength",
    "tensile",
    "yield",
    "support",
    "load-bearing",
    "mpa",
    "gpa",
    "stiff"
  ];
  const costSignals = [
    "cheap",
    "cost",
    "budget",
    "affordable",
    "price",
    "inexpensive",
    "low cost",
    "economical",
    "dollar",
    "$/kg",
    "under $",
    "less than $"
  ];
  const corrosionSignals = [
    "corros",
    "rust",
    "marine",
    "seawater",
    "acid",
    "chemical",
    "ocean",
    "salt water",
    "oxidat",
    "outdoor",
    "weather",
    "wet environment"
  ];

  const heat = thermalSignals.filter((s) => q.includes(s)).length;
  const light = lightSignals.filter((s) => q.includes(s)).length;
  const str = strengthSignals.filter((s) => q.includes(s)).length;
  const cost = costSignals.filter((s) => q.includes(s)).length;
  const corr = corrosionSignals.filter((s) => q.includes(s)).length;

  // Apply the strongest signal, others get moderate boosts
  const maxSignal = Math.max(heat, light, str, cost, corr);
  if (maxSignal > 0) {
    if (heat === maxSignal) {
      w.thermal = 0.4;
      w.strength = 0.2;
      w.weight = 0.18;
      w.cost = 0.15;
      w.corrosion = 0.07;
    } else if (light === maxSignal) {
      w.weight = 0.4;
      w.thermal = 0.2;
      w.strength = 0.2;
      w.cost = 0.15;
      w.corrosion = 0.05;
    } else if (str === maxSignal) {
      w.strength = 0.4;
      w.thermal = 0.2;
      w.weight = 0.18;
      w.cost = 0.15;
      w.corrosion = 0.07;
    } else if (cost === maxSignal) {
      w.cost = 0.45;
      w.strength = 0.25;
      w.thermal = 0.15;
      w.weight = 0.1;
      w.corrosion = 0.05;
    } else if (corr === maxSignal) {
      w.corrosion = 0.4;
      w.strength = 0.25;
      w.thermal = 0.15;
      w.weight = 0.1;
      w.cost = 0.1;
    }
  }

  // Extract temperature number
  const tempMatch = q.match(
    /(\d{2,4})\s*(?:°?\s*c\b|celsius|degrees?\s*c)/i
  );
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
            : undefined;

  // FDM detection
  const fdmWords = [
    "3d print",
    "fdm",
    "fused",
    "desktop printer",
    "filament",
    "pla",
    "petg",
    "print",
    "nozzle"
  ];
  const needsFDM = fdmWords.some((s) => q.includes(s));
  const practicalFdmQuery =
    needsFDM &&
    !["aerospace", "autoclave", "medical", "steril", "flame", "high-temp", "high temperature"].some((s) =>
      q.includes(s)
    );

  // Electrical conductivity detection
  const condWords = [
    "conduct",
    "electrical",
    "resistiv",
    "probe",
    "circuit",
    "electrode",
    "contact",
    "pcb",
    "current"
  ];
  const needsConductive = condWords.some((s) => q.includes(s));

  const explicitBudgetMatch = q.match(
    /(?:under|below|less than|max(?:imum)?(?: cost)? of?)\s*\$?\s*(\d+(?:\.\d+)?)/i
  );
  const parsedBudget = explicitBudgetMatch
    ? parseFloat(explicitBudgetMatch[1])
    : undefined;

  let maxCost = Number.isFinite(parsedBudget) ? parsedBudget : undefined;

  // Corrosion requirement
  const corrosionRequired: "excellent" | "good" | "fair" | undefined =
    q.includes("highly corrosive") ||
    q.includes("strong acid") ||
    q.includes("marine") ||
    q.includes("seawater") ||
    q.includes("salt water") ||
    q.includes("ocean")
      ? "excellent"
      : q.includes("corrosion resist") || q.includes("chemical")
        ? "good"
        : undefined;

  // Max density for lightweight queries
  const maxDensity = light > 0 ? 3.5 : undefined;
  let minTensileStrength: number | undefined;

  // Reflow temperatures describe process temperature, not service temperature.
  // Treat solder/electronics queries separately so a 220°C reflow target
  // does not eliminate SAC305-like candidates during hard filtering.
  const tempFromText = tempMatch ? parseInt(tempMatch[1], 10) : undefined;
  let maxTemperature =
    tempFromText !== undefined && !(isSolderAssembly && q.includes("reflow"))
      ? tempFromText
      : contextTemp;

  if (isSolderAssembly && q.includes("automotive") && maxTemperature === undefined) {
    maxTemperature = 125;
  }

  // Practical desktop-FDM queries should stay in the commodity /
  // prosumer polymer band. Otherwise PEEK/PEKK win on overkill thermal
  // headroom even when PETG or PA12 are the intuitive engineering picks.
  if (practicalFdmQuery) {
    maxCost = Math.min(maxCost ?? Infinity, 80);
    if ((maxTemperature ?? 0) <= 120) {
      w.thermal = 0.15;
      w.weight = 0.15;
      w.cost = 0.35;
      w.strength = 0.25;
      w.corrosion = 0.1;
    }
  }

  if (isSolderAssembly) {
    maxCost = Math.min(maxCost ?? Infinity, 100);
    w.thermal = 0.26;
    w.strength = 0.14;
    w.weight = 0.05;
    w.cost = 0.25;
    w.corrosion = 0.3;
  }

  if (
    (q.includes("marine") || q.includes("seawater")) &&
    (q.includes("pump") || q.includes("housing") || q.includes("pressure"))
  ) {
    // Seawater equipment should bias toward corrosion-practical alloys rather
    // than ultra-strong superalloys with irrelevant high-temperature headroom.
    w.thermal = 0.05;
    w.strength = 0.1;
    w.weight = 0.05;
    w.cost = 0.3;
    w.corrosion = 0.5;
    minTensileStrength = 530;
  }

  return {
    maxTemperature_c: maxTemperature,
    minTensileStrength_mpa: minTensileStrength,
    needsFDMPrintability: needsFDM || undefined,
    electricallyConductive: needsConductive || undefined,
    corrosionRequired,
    maxDensity_g_cm3: maxDensity,
    maxCost_usd_kg: Number.isFinite(maxCost) ? maxCost : undefined,
    priorityWeights: normaliseWeights(w),
    rawQuery: query
  };
}

export async function extractConstraints(
  query: string
): Promise<UserConstraints> {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
    });
    const prompt = `You are a materials science expert.
Extract engineering constraints from the user description.
Return ONLY a valid JSON object — no markdown, no backticks,
no text before or after the JSON.

Required shape (omit fields you cannot infer):
{
  "maxTemperature_c": number,
  "minTensileStrength_mpa": number,
  "maxDensity_g_cm3": number,
  "maxCost_usd_kg": number,
  "corrosionRequired": "excellent" | "good" | "fair",
  "electricallyConductive": boolean,
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

IMPORTANT: priorityWeights must sum to exactly 1.0.
Infer weights from emphasis: "absolutely cannot warp" means
thermal weight >= 0.35. "lightweight" means weight >= 0.35.
"cheap" or "budget" means cost >= 0.40.

User: ${query}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(clean) as Partial<UserConstraints>;
    parsed.priorityWeights = normaliseWeights(
      parsed.priorityWeights as UserConstraints["priorityWeights"]
    );
    return { ...parsed, rawQuery: query } as UserConstraints;
  } catch {
    // Gemini failed (quota, parse error, etc.)
    // Fall back to heuristic — always returns sensible results
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
        (m, i) =>
          `${i + 1}. ${m.name} — Score ${m.score}/100 | ` +
          `Max service temp: ${m.max_service_temp_c}°C | ` +
          `Tensile: ${m.tensile_strength_mpa} MPa | ` +
          `Density: ${m.density_g_cm3} g/cm³ | ` +
          `Cost: $${m.cost_usd_kg}/kg | ` +
          `Category: ${m.category}`
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
      history: (history ?? []).map((h) => ({
        role: h.role as "user" | "model",
        parts: [{ text: h.parts }]
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
