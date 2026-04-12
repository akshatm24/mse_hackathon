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

function validateAndCorrectWeights(
  constraints: UserConstraints
): UserConstraints {
  const weights = constraints.priorityWeights;
  const maxWeight = Math.max(...Object.values(weights));
  const isBalanced = maxWeight < 0.3;

  // If Gemini returns overly flat weights, fall back to the stronger
  // heuristic signal so obvious intents like "cheap" or "marine" still
  // produce intuitive rankings.
  if (!isBalanced) {
    return constraints;
  }

  const heuristic = heuristicExtract(constraints.rawQuery ?? "");
  const heuristicMax = Math.max(...Object.values(heuristic.priorityWeights));

  if (heuristicMax > maxWeight) {
    return {
      ...constraints,
      priorityWeights: heuristic.priorityWeights
    };
  }

  return constraints;
}

function generateLocalExplanation(
  query: string,
  ranked: RankedMaterial[]
): string {
  if (!ranked || ranked.length === 0) {
    return (
      "No materials matched your constraints. " +
      "Try relaxing the filters or rephrasing your query."
    );
  }

  const top = ranked[0];
  const second = ranked[1];
  const third = ranked[2];

  const para1 =
    `Based on your query, the top recommendation is ${top.name} with a ` +
    `match score of ${top.score}/100. ` +
    `It offers a maximum service temperature of ${top.max_service_temp_c}°C, ` +
    `tensile strength of ${top.tensile_strength_mpa} MPa, density of ` +
    `${top.density_g_cm3} g/cm³, and costs approximately ` +
    `$${top.cost_usd_kg}/kg. ` +
    `Its corrosion resistance is rated ${top.corrosion_resistance} ` +
    `and it falls in the ${top.subcategory} subcategory. ` +
    (top.printability_fdm !== "n/a"
      ? `FDM printability is ${top.printability_fdm}, ` +
        `making it ${
          top.printability_fdm === "excellent" || top.printability_fdm === "good"
            ? "suitable"
            : "challenging"
        } for desktop 3D printing. `
      : "It is not intended for FDM printing. ") +
    `This material was sourced from: ${top.data_source}.`;

  const para2 =
    second && third
      ? `Comparing the top three candidates: ${top.name} (score ${top.score}) leads on the ` +
        `highest-weighted properties for this query. ${second.name} (score ${second.score}) is the ` +
        `next best option — it offers ${second.max_service_temp_c}°C service temperature ` +
        `and ${second.tensile_strength_mpa} MPa tensile strength at $${second.cost_usd_kg}/kg, ` +
        `which may be preferred if ${
          second.density_g_cm3 < top.density_g_cm3
            ? "lower density is critical"
            : second.cost_usd_kg < top.cost_usd_kg
              ? "cost is the primary driver"
              : "its specific property profile better suits your geometry"
        }. ${third.name} (score ${third.score}) rounds out the shortlist at ` +
        `$${third.cost_usd_kg}/kg with ${third.tensile_strength_mpa} MPa tensile strength — ` +
        `consider it if ${
          third.corrosion_resistance === "excellent" &&
          top.corrosion_resistance !== "excellent"
            ? "corrosion resistance is more critical than initially stated"
            : third.cost_usd_kg < top.cost_usd_kg
              ? "budget constraints tighten"
              : "the application envelope changes"
        }.`
      : `Only ${top.name} strongly matched all stated constraints. ` +
        "Consider relaxing cost or temperature limits to see more alternatives.";

  const para3 =
    "Key caveats before ordering: all property values are at room temperature (20–25°C) " +
    "and may degrade at elevated service temperatures. Cost values are 2024 market approximations " +
    "and vary by supplier, grade, and quantity. " +
    (top.category === "Polymer"
      ? `For polymer components, confirm the glass transition temperature (${top.glass_transition_c}°C) is not exceeded under continuous load, as creep and deformation can occur below the nominal service limit. `
      : top.category === "Ceramic"
        ? "Ceramics are brittle — verify fracture toughness and thermal shock resistance for your geometry before finalising this selection. "
        : top.category === "Solder"
          ? "Confirm reflow profile compatibility and check RoHS compliance requirements for your application. "
          : "Verify the specific alloy grade and heat treatment condition matches your procurement specification. ") +
    "Run a secondary check against the full property sheet visible below before placing an order.";

  return [para1, para2, para3].join("\n\n");
}

export function heuristicExtract(query: string): UserConstraints {
  const q = query.toLowerCase();
  const aggressiveBudget =
    q.includes("cheapest") ||
    q.includes("lowest cost") ||
    q.includes("cheapest possible");
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
      w.cost = aggressiveBudget ? 0.8 : 0.65;
      w.strength = aggressiveBudget ? 0.1 : 0.15;
      w.thermal = 0.05;
      w.weight = aggressiveBudget ? 0.03 : 0.1;
      w.corrosion = aggressiveBudget ? 0.02 : 0.05;
    } else if (corr === maxSignal) {
      w.corrosion = 0.4;
      w.strength = 0.25;
      w.thermal = 0.15;
      w.weight = 0.1;
      w.cost = 0.1;
    }
  }

  if (
    q.includes("marine") ||
    q.includes("seawater") ||
    q.includes("salt water") ||
    q.includes("ocean")
  ) {
    w.corrosion = 0.55;
    w.strength = 0.2;
    w.thermal = 0.1;
    w.weight = 0.05;
    w.cost = 0.1;
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
  if (aggressiveBudget && !isSolderAssembly) {
    maxCost = Math.min(maxCost ?? Infinity, 2);
  }

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

  // For solder/reflow queries, the explicit temperature describes the process
  // envelope and is later compared against melting point rather than service
  // temperature. Keep the number so SAC305-like solders can still be filtered
  // against realistic reflow windows.
  const tempFromText = tempMatch ? parseInt(tempMatch[1], 10) : undefined;
  let maxTemperature = tempFromText ?? contextTemp;

  if (
    isSolderAssembly &&
    q.includes("automotive") &&
    tempFromText === undefined &&
    maxTemperature === undefined
  ) {
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
CRITICAL WEIGHT RULES:
- If the user says "cheapest", "lowest cost", or "cheapest possible",
  set cost weight >= 0.60.
- If the query is mainly about seawater or marine exposure,
  set corrosion weight >= 0.40.
- If the query is about 3D printing on a desktop printer,
  prefer practical printable polymers instead of ultra-premium materials
  unless the user explicitly asks for aerospace/high-temperature parts.

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
      (parsed.priorityWeights as UserConstraints["priorityWeights"]) ?? {
        thermal: 0.15,
        strength: 0.3,
        weight: 0.15,
        cost: 0.3,
        corrosion: 0.1
      }
    );
    return validateAndCorrectWeights({
      ...parsed,
      rawQuery: query
    } as UserConstraints);
  } catch {
    return validateAndCorrectWeights(heuristicExtract(query));
  }
}

export async function generateExplanation(
  query: string,
  ranked: RankedMaterial[],
  history?: { role: string; parts: string }[]
): Promise<string> {
  const localFallback = generateLocalExplanation(query, ranked);

  try {
    if (!process.env.GEMINI_API_KEY) {
      return localFallback;
    }

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
      `Begin your first paragraph with: "Based on your query, the top recommendation is [MATERIAL NAME]..."\n` +
      `Reference materials by exact name throughout. Do not use vague phrases like "the selected material".\n` +
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
    return localFallback;
  }
}
