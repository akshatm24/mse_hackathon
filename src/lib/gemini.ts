import { GoogleGenerativeAI } from "@google/generative-ai";

import { NovelMaterialPrediction, RankedMaterial, UserConstraints } from "@/types";
import { inferQueryIntent } from "@/lib/query-intent";
import { normalisePriorityWeights } from "@/lib/weights";

type Axis = "cost" | "thermal" | "weight" | "strength" | "corrosion";
const ALLOWED_CATEGORIES = new Set(["Metal", "Polymer", "Ceramic", "Composite", "Solder"]);

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
    `Based on your requirements, ${top.name} is the recommended material with a ` +
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
            : q.includes("reflow")
              ? 260
              : undefined;

  const budgetMatch = q.match(
    /(?:under|less than|below|max|budget[^\d]*)\s*\$?\s*(\d+)/i
  );

  let maxCost = Number.isFinite(parsedBudget) ? parsedBudget : undefined;
  if (aggressiveBudget && !isSolderAssembly) {
    maxCost = Math.min(maxCost ?? Infinity, 2);
  }

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

  if (
    /\bsolder\b/i.test(query) &&
    /\breflow\b|\belectronics?\b|\bpcb\b/i.test(query) &&
    !/\bgold\b|\bhermetic\b|\bhigh[- ]reliability\b|\baerospace\b/i.test(query)
  ) {
    weights = {
      thermal: 0.4,
      strength: 0.05,
      weight: 0.05,
      cost: 0.4,
      corrosion: 0.1
    };
  }

  return {
    maxTemperature_c: tempMatch ? parseInt(tempMatch[1], 10) : contextTemp,
    maxCost_usd_kg: maxCost,
    needsFDMPrintability: needsFDM || undefined,
    electricallyConductive: needsConductive || undefined,
    electricallyInsulating: needsInsulating || undefined,
    thermallyConductive: needsThermalConductive || undefined,
    preferredCategories: profile.categoryIntent.includeOnly,
    semanticTags: semanticTagsFromProfile(profile),
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
- Use preferredCategories when the user clearly asks for a family:
  "metal" -> ["Metal"], "plastic"/"polymer" -> ["Polymer"],
  "ceramic" -> ["Ceramic"], "composite"/"carbon fiber" -> ["Composite"],
  "solder" -> ["Solder"]
- Use semanticTags for application meaning, for example:
  ["marine"], ["electronics"], ["probe"], ["machinable"],
  ["biocompatible"], ["wear-resistant"], ["outdoor"]
- NEVER use balanced weights (all 0.20) unless the user gave
  absolutely NO priority signal whatsoever.
- Weights MUST sum to exactly 1.0.

Few-shot examples:
User: "acid resistant metal for chemical line"
JSON:
{"corrosionRequired":"excellent","preferredCategories":["Metal"],"semanticTags":["chemical","acid","corrosion"],"priorityWeights":{"thermal":0.05,"strength":0.05,"weight":0.05,"cost":0.05,"corrosion":0.8}}

User: "3d printed plastic bracket for a motor at 85C"
JSON:
{"maxTemperature_c":85,"needsFDMPrintability":true,"preferredCategories":["Polymer"],"semanticTags":["fdm","3d-printing","structural"],"priorityWeights":{"thermal":0.35,"strength":0.25,"weight":0.15,"cost":0.2,"corrosion":0.05}}

User: "machinable conductive metal for probe contact"
JSON:
{"electricallyConductive":true,"preferredCategories":["Metal"],"semanticTags":["machinable","probe","conductive"],"priorityWeights":{"thermal":0.1,"strength":0.3,"weight":0.05,"cost":0.45,"corrosion":0.1}}

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
  "preferredCategories": ["Metal"|"Polymer"|"Ceramic"|"Composite"|"Solder"],
  "semanticTags": string[],
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
    return { ...parsed, rawQuery: query } as UserConstraints;
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
    // If the remote model does not return, explain the shortlist locally
    // using the ranked materials data we already have.
    return generateLocalExplanation(query, ranked);
  }
}

export async function generateNovelPredictionExplanation(
  composition: string,
  prediction: Omit<NovelMaterialPrediction, "explanation">
): Promise<string> {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
    });

    const analogs = prediction.nearestAnalogs
      .map(
        (analog, index) =>
          `${index + 1}. ${analog.formula} (${analog.category}) similarity ${Math.round(
            analog.similarity * 100
          )}%`
      )
      .join("\n");

    const prompt =
      `You are a materials scientist explaining a screening-level property prediction.\n` +
      `Composition: ${composition}\n` +
      `Predicted category: ${prediction.predictedCategory}\n` +
      `Confidence: ${prediction.confidence}%\n` +
      `Predicted properties:\n` +
      `- Density: ${prediction.predictedProperties.density_g_cm3} g/cm^3\n` +
      `- Tensile strength: ${prediction.predictedProperties.tensile_strength_mpa} MPa\n` +
      `- Elastic modulus: ${prediction.predictedProperties.elastic_modulus_gpa} GPa\n` +
      `- Thermal conductivity: ${prediction.predictedProperties.thermal_conductivity_w_mk} W/mK\n` +
      `- Max service temperature: ${prediction.predictedProperties.max_service_temp_c} C\n` +
      `- Electrical resistivity: ${prediction.predictedProperties.electrical_resistivity_ohm_m} ohm-m\n` +
      `- Corrosion resistance: ${prediction.predictedProperties.corrosion_resistance}\n` +
      `Nearest analogs:\n${analogs}\n\n` +
      `Write exactly 2 short paragraphs with no bullet points. ` +
      `Paragraph 1: what this chemistry most likely behaves like. ` +
      `Paragraph 2: why the result should be treated as a screening estimate and what to validate next.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return (
      `${composition} is predicted as a ${prediction.predictedCategory.toLowerCase()}-leaning chemistry with ` +
      `${prediction.predictedProperties.tensile_strength_mpa} MPa tensile strength, ` +
      `${prediction.predictedProperties.thermal_conductivity_w_mk.toFixed(1)} W/m.K thermal conductivity, and ` +
      `${prediction.predictedProperties.max_service_temp_c} C service temperature. ` +
      `This estimate comes from nearby chemistries such as ${prediction.nearestAnalogs
        .slice(0, 2)
        .map((analog) => analog.formula)
        .join(" and ")}, so it should be used for screening rather than final design.`
    );
  }
}
