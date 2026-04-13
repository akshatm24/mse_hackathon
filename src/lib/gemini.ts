import { GoogleGenerativeAI } from "@google/generative-ai";

import type { RankedMaterial, UserConstraints } from "@/types";

const COST_SIGNALS = [
  "cheap",
  "cheapest",
  "budget",
  "affordable",
  "low cost",
  "inexpensive",
  "low price",
  "economical",
  "under $",
  "cost effective",
  "minimum cost",
  "save money",
  "frugal",
  "bargain",
  "low-cost",
  "price point",
  "least expensive",
  "economy"
];

const THERMAL_SIGNALS = [
  "heat",
  "hot",
  "temperature",
  "temp",
  "warp",
  "melt",
  "thermal",
  "motor",
  "engine",
  "furnace",
  "oven",
  "°c",
  "celsius",
  "degrees",
  "fire",
  "high temp",
  "heat resistant",
  "reflow",
  "autoclave",
  "thermal cycling",
  "elevated temp",
  "service temp"
];

const WEIGHT_SIGNALS = [
  "light",
  "lightweight",
  "low weight",
  "low density",
  "light weight",
  "drone",
  "aircraft",
  "aerospace",
  "portable",
  "wearable",
  "rocket",
  "satellite",
  "weight saving",
  "mass reduction",
  "low mass"
];

const STRENGTH_SIGNALS = [
  "strong",
  "high strength",
  "load",
  "structural",
  "tensile",
  "bearing",
  "stiff",
  "rigid",
  "tough",
  "load bearing",
  "withstand",
  "durable",
  "robust",
  "mpa",
  "gpa",
  "bracket",
  "support"
];

const CORROSION_SIGNALS = [
  "corros",
  "rust",
  "marine",
  "seawater",
  "acid",
  "chemical",
  "ocean",
  "salt",
  "oxidat",
  "outdoor",
  "weather",
  "wet",
  "moisture",
  "saltwater"
];

const FDM_SIGNALS = ["3d print", "3d printed", "fdm", "filament", "desktop printer", "slicer"];
const ELECTRICAL_SIGNALS = [
  "conduct",
  "electrical",
  "resistiv",
  "probe",
  "circuit",
  "electrode",
  "contact",
  "pcb",
  "conductive",
  "connector"
];
const THERMAL_CONDUCTIVITY_SIGNALS = [
  "thermal management",
  "heat sink",
  "heat spreader",
  "conduct heat",
  "conduct heat away",
  "dissipate heat",
  "draw heat away",
  "thermally conductive"
];
const THERMAL_INSULATION_SIGNALS = [
  "thermal insulator",
  "thermal barrier",
  "thermally insulating",
  "low thermal conductivity",
  "reduce heat transfer",
  "insulation"
];

type PriorityWeights = UserConstraints["priorityWeights"];

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY not set");
  }
  return new GoogleGenerativeAI(key);
}

function countHits(query: string, signals: string[]) {
  return signals.filter((signal) => query.includes(signal)).length;
}

function normaliseWeights(weights: PriorityWeights): PriorityWeights {
  const total =
    weights.thermal +
    weights.strength +
    weights.weight +
    weights.cost +
    weights.corrosion;

  if (total <= 0) {
    return {
      thermal: 0.18,
      strength: 0.28,
      weight: 0.18,
      cost: 0.28,
      corrosion: 0.08
    };
  }

  const thermal = Math.round((weights.thermal / total) * 1000) / 1000;
  const strength = Math.round((weights.strength / total) * 1000) / 1000;
  const weight = Math.round((weights.weight / total) * 1000) / 1000;
  const cost = Math.round((weights.cost / total) * 1000) / 1000;
  const corrosion = Math.max(0, 1 - thermal - strength - weight - cost);

  return {
    thermal,
    strength,
    weight,
    cost,
    corrosion: Math.round(corrosion * 1000) / 1000
  };
}

function hasAnySignal(query: string, signals: string[]) {
  return signals.some((signal) => query.includes(signal));
}

function parseNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function displayNumber(value: number | null | undefined, suffix = "", digits = 0) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }
  return `${value.toFixed(digits)}${suffix}`;
}

function detectNegatedAxes(query: string) {
  return {
    strength:
      /\blow\s+strength\b|\bweak(?:er)?\b|\bnot\s+strong\b|\bsoft\s+material\b|\bstrength\s+not\b|\bno\s+(?:load|stress|structural)\b|\blow\s+tensile\b|\blow\s+stiffness\b|\bflexible\b(?!.*rigid)|\bductile\b|\beasily\s+cut\b|\beasy\s+to\s+cut\b|\blow\s+hardness\b/.test(
        query
      ),
    thermal:
      /\blow\s+temp\b|\bcold\s+(?:env|environment|app|application|use)\b|\bcryogen|\bnot\s+hot\b|\broom\s+temp\s+only\b|\bno\s+heat\b|\bheat\s+not\s+(?:important|critical|needed)\b|\bambient\s+temp\b|\bminus\s+\d+\b|-\d+\s*°?\s*c\b|\bliquid\s+(?:nitrogen|helium)\b/.test(
        query
      ),
    weight:
      /\bheavy\b(?!\s+duty\s+load)|\bdense\b|\bweight\s+not\b|\bmass\s+not\b|\bnot\s+lightweight\b|\bdensity\s+not\b/.test(
        query
      ),
    cost:
      /\bcost\s+not\b|\bbudget\s+not\b|\bmoney\s+no\s+object\b|\bprice\s+irrelevant\b|\bexpensive\s+(?:is\s+)?(?:ok|fine)\b|\bperformance\s+over\s+cost\b|\bno\s+budget\b/.test(
        query
      ),
    corrosion:
      /\bindoor\b|\bdry\s+env\b|\bdry\s+environment\b|\bno\s+moisture\b|\bcorrosion\s+not\b|\bnot\s+exposed\b|\bprotected\s+from\b/.test(
        query
      )
  };
}

function chooseTemperature(query: string, isCryogenic: boolean) {
  const tempMatch = query.match(/(-?\d{2,4})\s*(?:°?\s*c\b|celsius|degrees?\s*c)/i);
  if (tempMatch) {
    return Number.parseInt(tempMatch[1], 10);
  }

  if (query.includes("motor")) return 85;
  if (query.includes("oven")) return 200;
  if (query.includes("furnace")) return 500;
  if (query.includes("autoclave")) return 135;
  if (isCryogenic) return 25;
  return undefined;
}

function chooseBudget(query: string) {
  const budgetMatch = query.match(
    /(?:under|less\s+than|below|max|budget[^\d]*)\s*\$?\s*(\d+(?:\.\d+)?)/i
  );
  return budgetMatch ? Number.parseFloat(budgetMatch[1]) : undefined;
}

function needsThermalConductivity(query: string) {
  return hasAnySignal(query, THERMAL_CONDUCTIVITY_SIGNALS);
}

function needsThermalInsulation(query: string) {
  return hasAnySignal(query, THERMAL_INSULATION_SIGNALS);
}

function generateLocalExplanation(query: string, ranked: RankedMaterial[]): string {
  if (!ranked?.length) {
    return "No materials matched. Try relaxing your filters.";
  }

  const [top, second, third] = ranked;

  const p1 =
    `Based on your requirements, ${top.name} is recommended with a match score of ${top.score}/100. ` +
    `Key properties: max service temperature ${displayNumber(top.max_service_temp_c, "°C")}, tensile strength ` +
    `${displayNumber(top.tensile_strength_mpa, " MPa")} , density ${displayNumber(top.density_g_cm3, " g/cm³", 2)}, and cost approximately ` +
    `$${displayNumber(top.cost_usd_kg, "", 2)}/kg. Corrosion resistance is rated ${top.corrosion_resistance ?? "unknown"}` +
    (top.printability_fdm !== "n/a"
      ? ` with ${top.printability_fdm} FDM printability.`
      : ".") +
    ` Source: ${top.data_source}.`;

  const p2 =
    second && third
      ? `Among the top candidates, ${top.name} leads overall. ${second.name} (${second.score}/100) offers ` +
        `${displayNumber(second.tensile_strength_mpa, " MPa")} at $${displayNumber(second.cost_usd_kg, "", 2)}/kg - preferred when ` +
        ((second.density_g_cm3 ?? Number.POSITIVE_INFINITY) < (top.density_g_cm3 ?? Number.POSITIVE_INFINITY)
          ? "minimum weight is the priority. "
          : (second.cost_usd_kg ?? Number.POSITIVE_INFINITY) < (top.cost_usd_kg ?? Number.POSITIVE_INFINITY)
            ? "cost is the main driver. "
            : "its properties better fit specific geometry. ") +
        `${third.name} (${third.score}/100) rounds the shortlist.`
      : `Only ${top.name} matched all stated constraints. Relax temperature or cost limits for more options.`;

  const p3 =
    `Engineering caveats: values are at room temperature and may degrade at elevated service temperatures. ` +
    `Cost estimates are 2024 market prices, varying by supplier and quantity. ` +
    (top.category === "Polymer"
      ? `For polymers, confirm glass transition temperature (${displayNumber(top.glass_transition_c, "°C")}) is not exceeded under sustained load - creep may occur below the nominal limit.`
      : top.category === "Ceramic"
        ? "Ceramics are brittle - verify fracture toughness and thermal shock resistance before finalising."
        : top.category === "Solder"
          ? "Confirm reflow profile and RoHS compliance."
          : "Verify alloy grade and heat treatment condition match your procurement specification.");

  return [p1, p2, p3].join("\n\n");
}

export function heuristicExtract(query: string): UserConstraints {
  const q = query.toLowerCase();
  const neg = detectNegatedAxes(q);
  const isCryogenic =
    /cryogen|liquid\s*nitrogen|liquid\s*helium|-196|-269|ultra\s*low\s*temp|deep\s*cold/.test(
      q
    );

  const hits = {
    cost: neg.cost ? 0 : countHits(q, COST_SIGNALS),
    thermal: neg.thermal
      ? 0
      : countHits(q, THERMAL_SIGNALS) +
        (needsThermalConductivity(q) || needsThermalInsulation(q) ? 2 : 0),
    weight: neg.weight ? 0 : countHits(q, WEIGHT_SIGNALS),
    strength: neg.strength ? 0 : countHits(q, STRENGTH_SIGNALS),
    corrosion: neg.corrosion ? 0 : countHits(q, CORROSION_SIGNALS)
  };

  const weights: PriorityWeights = {
    strength: 0.28,
    cost: 0.28,
    thermal: 0.18,
    weight: 0.18,
    corrosion: 0.08
  };

  for (const [axis, isNegated] of Object.entries(neg)) {
    if (isNegated) {
      weights[axis as keyof PriorityWeights] = 0.02;
    }
  }

  const sorted = Object.entries(hits).sort((a, b) => b[1] - a[1]);
  const [topAxis, topCount] = sorted[0] ?? ["strength", 0];
  const [secondAxis, secondCount] = sorted[1] ?? ["cost", 0];

  if (topCount >= 1) {
    for (const axis of Object.keys(weights) as Array<keyof PriorityWeights>) {
      if (!neg[axis]) {
        weights[axis] = 0.05;
      }
    }
    if (!neg[topAxis as keyof typeof neg]) {
      weights[topAxis as keyof PriorityWeights] = 0.65;
    }
    if (secondCount >= 1 && !neg[secondAxis as keyof typeof neg]) {
      weights[secondAxis as keyof PriorityWeights] = 0.2;
    }
  }

  if (isCryogenic) {
    Object.assign(
      weights,
      normaliseWeights({
        thermal: 0.02,
        strength: 0.45,
        weight: 0.3,
        cost: 0.15,
        corrosion: 0.08
      })
    );
  }

  if (/cost\s+not\s+important|expensive\s+ok|no\s+budget\s+limit/.test(q) && hits.strength > 0) {
    Object.assign(
      weights,
      normaliseWeights({
        thermal: 0.12,
        strength: 0.62,
        weight: 0.08,
        cost: 0.02,
        corrosion: 0.16
      })
    );
  }

  if (hasAnySignal(q, FDM_SIGNALS) && q.includes("motor")) {
    Object.assign(
      weights,
      normaliseWeights({
        thermal: 0.42,
        strength: 0.18,
        weight: 0.18,
        cost: 0.12,
        corrosion: 0.1
      })
    );
  }

  if (/marine|seawater|saltwater|salt water/.test(q)) {
    weights.corrosion = Math.max(weights.corrosion, 0.6);
    weights.cost = Math.min(weights.cost, 0.12);
    weights.weight = neg.weight ? 0.02 : Math.min(weights.weight, 0.1);
  }

  if (/machin/.test(q)) {
    weights.cost = Math.max(weights.cost, 0.2);
    weights.strength = Math.min(weights.strength, 0.24);
  }

  const needsFDM = hasAnySignal(q, FDM_SIGNALS);
  const needsConductive = hasAnySignal(q, ELECTRICAL_SIGNALS);
  const thermalManagement = needsThermalConductivity(q);
  const thermalInsulation = needsThermalInsulation(q);
  const budget = chooseBudget(q);
  const corrosionRequired =
    /highly\s+corrosive|strong\s+acid|concentrated\s+acid/.test(q)
      ? ("excellent" as const)
      : /marine|seawater|salt\s*water|corrosion\s+resist/.test(q)
        ? ("good" as const)
        : undefined;

  return {
    maxTemperature_c: chooseTemperature(q, isCryogenic),
    minTensileStrength_mpa:
      /load bearing|structural|strongest possible|high strength/.test(q) && !neg.strength
        ? 250
        : /probe tip|probe|electrode|contact/.test(q)
          ? 200
          : /biomedical|implant/.test(q)
            ? 450
            : undefined,
    maxDensity_g_cm3: hits.weight > 0 && !neg.weight ? 3.5 : undefined,
    maxCost_usd_kg: budget,
    maxElectricalResistivity_ohm_m:
      /probe|electrode|contact|connector|conductive|electrical/.test(q) ? 1e-4 : undefined,
    minElectricalResistivity_ohm_m:
      /electrical insulat|dielectric|electrically insulating|non-conductive/.test(q)
        ? 1e6
        : undefined,
    minThermalConductivity_w_mk: thermalManagement ? 20 : undefined,
    maxThermalConductivity_w_mk: thermalInsulation ? 5 : undefined,
    maxThermalExpansion_ppm_k: /bga|thermal cycling|expansion mismatch|package/.test(q)
      ? 20
      : undefined,
    corrosionRequired,
    electricallyConductive:
      /electrical insulat|dielectric|electrically insulating|non-conductive/.test(q)
        ? false
        : needsConductive || undefined,
    thermallyConductive: thermalInsulation ? false : thermalManagement || undefined,
    needsFDMPrintability: needsFDM || undefined,
    requiresFatigueWarning: /fatigue|cycling|vibration|bga/.test(q) || undefined,
    priorityWeights: normaliseWeights(weights),
    rawQuery: query,
    _negatedAxes: Object.entries(neg)
      .filter(([, value]) => value)
      .map(([axis]) => axis)
  };
}

export function validateWeights(constraints: UserConstraints): UserConstraints {
  const w = normaliseWeights(constraints.priorityWeights);
  const maxW = Math.max(...Object.values(w));
  if (maxW >= 0.3) {
    return { ...constraints, priorityWeights: w };
  }

  const heuristic = heuristicExtract(constraints.rawQuery ?? "");
  const heuristicMax = Math.max(...Object.values(heuristic.priorityWeights));
  if (heuristicMax > maxW) {
    return {
      ...constraints,
      priorityWeights: heuristic.priorityWeights,
      _negatedAxes: heuristic._negatedAxes
    };
  }

  return { ...constraints, priorityWeights: w };
}

export async function extractConstraints(query: string): Promise<UserConstraints> {
  const heuristic = heuristicExtract(query);

  try {
    if (!process.env.GEMINI_API_KEY) {
      return validateWeights(heuristic);
    }

    const model = getClient().getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `You are a materials science expert for
MET-QUEST'26. Extract engineering constraints from the query.
Return ONLY valid JSON. No markdown, no backticks, no extra text.

POSITIVE WEIGHT RULES (boost to >= 0.60):
  "cheap/budget/affordable/low cost" -> cost >= 0.60
  "lightweight/low density/drone/aircraft" -> weight >= 0.60
  "strong/structural/high strength/load bearing" -> strength >= 0.60
  "heat resistant/high temp/motor/furnace/thermal" -> thermal >= 0.60
  "marine/seawater/acid/corrosion resistant" -> corrosion >= 0.60

NEGATION RULES (set axis to 0.02-0.05):
  "low strength/weak/soft/flexible/ductile" -> strength = 0.02
  "cost not important/expensive ok/no budget limit" -> cost = 0.02
  "cryogenic/liquid nitrogen/cold environment" -> thermal = 0.02
    AND set maxTemperature_c to 25
  "heavy ok/weight not important" -> weight = 0.02
  "indoor/dry/corrosion not needed" -> corrosion = 0.02

CRYOGENIC SPECIAL CASE:
  User wants materials that survive -196C liquid nitrogen.
  Set maxTemperature_c: 25 (they only need room temp max).
  Set thermal weight: 0.02.
  Boost strength: 0.45, weight: 0.30, cost: 0.15.
  Good choices: Al 5083, 316L SS, PTFE, Invar, Cu alloys.

NEVER use balanced weights (0.20 each) unless no signal at all.
Weights MUST sum to exactly 1.0.

JSON schema (omit fields you cannot infer):
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
    "thermal": number, "strength": number,
    "weight": number, "cost": number, "corrosion": number
  }
}

User query: ${query}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const clean = raw.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(clean) as Partial<UserConstraints>;

    const merged: UserConstraints = {
      maxTemperature_c: parseNumber(parsed.maxTemperature_c) ?? heuristic.maxTemperature_c,
      minTensileStrength_mpa:
        parseNumber(parsed.minTensileStrength_mpa) ?? heuristic.minTensileStrength_mpa,
      maxDensity_g_cm3: parseNumber(parsed.maxDensity_g_cm3) ?? heuristic.maxDensity_g_cm3,
      maxCost_usd_kg: parseNumber(parsed.maxCost_usd_kg) ?? heuristic.maxCost_usd_kg,
      maxElectricalResistivity_ohm_m:
        parseNumber(parsed.maxElectricalResistivity_ohm_m) ??
        heuristic.maxElectricalResistivity_ohm_m,
      minElectricalResistivity_ohm_m:
        parseNumber(parsed.minElectricalResistivity_ohm_m) ??
        heuristic.minElectricalResistivity_ohm_m,
      minThermalConductivity_w_mk:
        parseNumber(parsed.minThermalConductivity_w_mk) ??
        heuristic.minThermalConductivity_w_mk,
      maxThermalConductivity_w_mk:
        parseNumber(parsed.maxThermalConductivity_w_mk) ??
        heuristic.maxThermalConductivity_w_mk,
      maxThermalExpansion_ppm_k:
        parseNumber(parsed.maxThermalExpansion_ppm_k) ?? heuristic.maxThermalExpansion_ppm_k,
      corrosionRequired:
        parsed.corrosionRequired === "excellent" ||
        parsed.corrosionRequired === "good" ||
        parsed.corrosionRequired === "fair"
          ? parsed.corrosionRequired
          : heuristic.corrosionRequired,
      electricallyConductive:
        parseBoolean(parsed.electricallyConductive) ?? heuristic.electricallyConductive,
      thermallyConductive:
        parseBoolean(parsed.thermallyConductive) ?? heuristic.thermallyConductive,
      needsFDMPrintability:
        parseBoolean(parsed.needsFDMPrintability) ?? heuristic.needsFDMPrintability,
      requiresFatigueWarning:
        parseBoolean(parsed.requiresFatigueWarning) ?? heuristic.requiresFatigueWarning,
      priorityWeights: normaliseWeights(
        (parsed.priorityWeights as PriorityWeights) ?? heuristic.priorityWeights
      ),
      rawQuery: query,
      _negatedAxes: heuristic._negatedAxes
    };

    return validateWeights(merged);
  } catch {
    return validateWeights(heuristic);
  }
}

export async function generateExplanation(
  query: string,
  ranked: RankedMaterial[],
  history?: { role: string; parts: string }[]
): Promise<string> {
  const localFallback = generateLocalExplanation(query, ranked);

  try {
    if (!process.env.GEMINI_API_KEY || ranked.length === 0) {
      return localFallback;
    }

    const top = ranked[0];
    if (!top) {
      return localFallback;
    }

    const model = getClient().getGenerativeModel({ model: "gemini-2.0-flash" });
    const runnersUp = ranked
      .slice(1, 4)
      .map((material) => `${material.name} (${material.score}/100)`)
      .join(", ");

    const prompt = `
You are an expert materials engineer advising an engineering student.

The query was: "${query}"
The top recommended material is: ${top.name} (overall score ${top.score}/100).

Key properties of ${top.name}:
- Max service temperature: ${displayNumber(top.max_service_temp_c, "°C")}
- Tensile strength: ${displayNumber(top.tensile_strength_mpa, " MPa")}
- Density: ${displayNumber(top.density_g_cm3, " g/cm³", 2)}
- Cost: $${displayNumber(top.cost_usd_kg, "", 2)}/kg
- Corrosion resistance: ${top.corrosion_resistance ?? "unknown"}
- FDM printable: ${top.fdm_printable ? "Yes" : "No"}
- Source: ${top.source}

Runners-up: ${runnersUp || "None"}

Write a 3-sentence explanation of why ${top.name} is the best fit for the query.
Name at least 2 specific property values. Mention one trade-off or caveat.
Do not use bullet points. Do not repeat the score number.
`.trim();

    const chat = model.startChat({
      history: (history ?? []).map((entry) => ({
        role: entry.role as "user" | "model",
        parts: [{ text: entry.parts }]
      }))
    });
    const response = await chat.sendMessage(prompt);
    const text = response.response.text().trim();
    return text || localFallback;
  } catch {
    return localFallback;
  }
}
