import { NextRequest, NextResponse } from "next/server";

import { materialsDB } from "@/lib/materials-db";
import { searchDatabase } from "@/lib/rag";
import type { Material, PredictorResponse } from "@/types";

type ParsedComponent = {
  element: string;
  amount: number;
  fraction: number;
};

type ParsedComposition = {
  formula: string;
  mode: "stoichiometric" | "percentage";
  components: ParsedComponent[];
};

type PredictedProperties = NonNullable<PredictorResponse["predictedProperties"]>;
type DistanceKey =
  | "density_g_cm3"
  | "tensile_strength_mpa"
  | "elastic_modulus_gpa"
  | "thermal_expansion_ppm_k"
  | "electrical_resistivity_ohm_m"
  | "cost_usd_kg";

const ELEMENT_REFERENCE_HINTS: Record<string, string[]> = {
  Ag: ["Silver Ag", "Sn96Ag4 Silver Solder"],
  Al: ["Aluminum (pure)", "Aluminum 6061-T6", "Aluminum 2024-T3"],
  Au: ["Gold Au", "Gold-Tin AuSn20"],
  Be: ["Beryllium Be", "Beryllium Copper C17200"],
  Co: ["Cobalt Co"],
  Cr: ["Chromium Cr", "Stainless Steel 430"],
  Cu: ["Copper (pure)", "ETP Copper C11000", "Copper C110"],
  Fe: ["Iron Fe", "Carbon Steel 1020"],
  Ge: ["Germanium Ge"],
  Hf: ["Hafnium Hf"],
  Mg: ["Magnesium (pure)", "Magnesium AZ31B"],
  Mo: ["Molybdenum Mo"],
  Nb: ["Niobium Nb"],
  Ni: ["Nickel (pure)", "Nickel 200"],
  Pd: ["Palladium Pd"],
  Pt: ["Platinum Pt"],
  Re: ["Rhenium Re"],
  Rh: ["Rhodium Rh"],
  Ru: ["Ruthenium Ru"],
  Si: ["Silicon Si"],
  Sn: ["Tin Sn", "Sn63Pb37 Solder"],
  Ta: ["Tantalum Ta"],
  Ti: ["Titanium (pure)", "Titanium Grade 2 (CP)"],
  V: ["Vanadium V"],
  W: ["Tungsten W"],
  Zn: ["Zinc Zn"],
  Zr: ["Zirconium Zr"],
  B: ["Boron Carbide B4C (MP)", "Boron Nitride BN (MP)"],
  C: ["Tungsten Carbide WC (MP)", "Boron Carbide B4C (MP)"],
  N: ["Silicon Nitride Si3N4", "Aluminum Nitride AlN (MP)"],
  O: ["Alumina Al2O3", "Zirconia ZrO2 (MP)"]
};

const METALLIC_ELEMENTS = new Set([
  "Ag",
  "Al",
  "Au",
  "Be",
  "Bi",
  "Co",
  "Cr",
  "Cu",
  "Fe",
  "Ga",
  "Hf",
  "In",
  "Ir",
  "La",
  "Mg",
  "Mn",
  "Mo",
  "Nb",
  "Ni",
  "Os",
  "Pb",
  "Pd",
  "Pt",
  "Re",
  "Rh",
  "Ru",
  "Sc",
  "Sn",
  "Ta",
  "Ti",
  "V",
  "W",
  "Y",
  "Zn",
  "Zr"
]);

const CERAMIC_FORMERS = new Set(["B", "C", "N", "O", "P", "S", "Se", "Si", "Te"]);
const NONLINEAR_FORMULAS = new Map<string, string>([
  ["NiTi", "NiTi is a shape-memory alloy, so a linear rule-of-mixtures estimate is only a screening approximation."],
  ["Ni3Al", "Ni3Al is an intermetallic with ordered phases that deviate strongly from linear mixing."],
  ["NiAl", "NiAl is an intermetallic; ordered bonding means the screening estimate should be treated cautiously."],
  ["TiAl", "TiAl is an intermetallic and its actual properties depend strongly on phase constitution and processing."],
  ["Ti3Al", "Ti3Al is an intermetallic and should not be trusted to follow linear property mixing."],
  ["Ti3SiC2", "MAX phases have layered bonding and do not behave like simple rule-of-mixtures alloys."],
  ["Ti3AlC2", "MAX phases have layered bonding and do not behave like simple rule-of-mixtures alloys."],
  ["Ti2AlC", "MAX phases have layered bonding and do not behave like simple rule-of-mixtures alloys."],
  ["Cr2AlC", "MAX phases have layered bonding and do not behave like simple rule-of-mixtures alloys."],
  ["Al2O3", "Ceramic oxide systems are highly phase-sensitive, so composition-only screening should be verified experimentally."]
]);

function normaliseToken(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
}

function formatFormula(formula: string) {
  return formula.replace(/\s+/g, "");
}

function parsePercentageComposition(input: string): ParsedComposition | null {
  const compact = input.replace(/\s+/g, "");

  if (/^[A-Z][a-z]?(?:-\d+(?:\.\d+)?[A-Z][a-z]?)+$/.test(compact)) {
    const [base, ...rest] = compact.split("-");
    const components = rest
      .map((chunk) => chunk.match(/^(\d+(?:\.\d+)?)([A-Z][a-z]?)$/))
      .filter(Boolean)
      .map((match) => ({ element: match![2], amount: Number.parseFloat(match![1]) }));
    const total = components.reduce((sum, component) => sum + component.amount, 0);
    const baseAmount = Math.max(0, 100 - total);
    const full = [{ element: base, amount: baseAmount }, ...components];
    return {
      formula: compact,
      mode: "percentage",
      components: full.map((component) => ({
        ...component,
        fraction: component.amount / 100
      }))
    };
  }

  const percentMatches = Array.from(input.matchAll(/(\d+(?:\.\d+)?)\s*%?\s*([A-Z][a-z]?)/g));
  if (percentMatches.length > 0) {
    const components = percentMatches.map((match) => ({
      element: match[2],
      amount: Number.parseFloat(match[1])
    }));
    const explicit = components.reduce((sum, component) => sum + component.amount, 0);
    const balance = input.match(/([A-Z][a-z]?)\s*(?:bal|balance)/i);
    if (balance) {
      components.unshift({
        element: balance[1],
        amount: Math.max(0, 100 - explicit)
      });
    }
    const total = components.reduce((sum, component) => sum + component.amount, 0);
    if (total > 0) {
      return {
        formula: compact,
        mode: "percentage",
        components: components.map((component) => ({
          ...component,
          fraction: component.amount / total
        }))
      };
    }
  }

  return null;
}

function parseComposition(input: string): ParsedComposition | null {
  const percentage = parsePercentageComposition(input);
  if (percentage) {
    return percentage;
  }

  const formula = formatFormula(input);
  if (!formula) {
    return null;
  }

  const matches = Array.from(formula.matchAll(/([A-Z][a-z]?)(\d*(?:\.\d+)?)/g));
  if (matches.length === 0) {
    return null;
  }

  const reconstructed = matches.map((match) => `${match[1]}${match[2]}`).join("");
  if (reconstructed !== formula) {
    return null;
  }

  const amounts = matches.map((match) => {
    const raw = match[2];
    const amount = raw ? Number.parseFloat(raw) : 1;
    return Number.isFinite(amount) && amount > 0 ? amount : 1;
  });

  const total = amounts.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return null;
  }

  const mode = total > 10 ? "percentage" : "stoichiometric";
  const components = matches.map((match, index) => ({
    element: match[1],
    amount: amounts[index],
    fraction: amounts[index] / total
  }));

  return { formula, mode, components };
}

function inferCategory(parsed: ParsedComposition): Material["category"] {
  const elements = parsed.components.map((component) => component.element);
  const allMetallic = elements.every((element) => METALLIC_ELEMENTS.has(element));
  const ceramicLike = elements.some((element) => CERAMIC_FORMERS.has(element));

  if (allMetallic) {
    return "Metal";
  }

  if (ceramicLike) {
    return "Ceramic";
  }

  return "Metal";
}

function exactFormulaMatch(formula: string): Material | undefined {
  const normalised = normaliseToken(formula);

  return materialsDB.find((material) => {
    const nameBase = normaliseToken(material.name.replace(/\s*\([^)]*\)\s*/g, ""));
    const formulaPretty = material.formula_pretty
      ? normaliseToken(material.formula_pretty)
      : "";

    return (
      formulaPretty === normalised ||
      nameBase === normalised ||
      nameBase.endsWith(normalised)
    );
  });
}

function findReferenceMaterial(symbol: string): Material | undefined {
  const preferredNames = ELEMENT_REFERENCE_HINTS[symbol] ?? [];
  const normalisedNames = preferredNames.map(normaliseToken);

  return (
    materialsDB.find((material) => {
      const materialName = normaliseToken(material.name);
      const formulaPretty = material.formula_pretty
        ? normaliseToken(material.formula_pretty)
        : "";

      return (
        formulaPretty === normaliseToken(symbol) ||
        normalisedNames.some((candidate) => materialName.includes(candidate))
      );
    }) ??
    materialsDB.find((material) => {
      const formulaPretty = material.formula_pretty
        ? normaliseToken(material.formula_pretty)
        : "";
      return formulaPretty === normaliseToken(symbol);
    })
  );
}

function buildPredictedProperties(parsed: ParsedComposition): PredictedProperties | null {
  const references = parsed.components.map((component) => ({
    component,
    reference: findReferenceMaterial(component.element)
  }));

  if (references.some((entry) => !entry.reference)) {
    return null;
  }

  return references.reduce<PredictedProperties>(
    (accumulator, entry) => {
      const reference = entry.reference as Material;
      const fraction = entry.component.fraction;

      accumulator.density_g_cm3 += (reference.density_g_cm3 ?? 0) * fraction;
      accumulator.tensile_strength_mpa += (reference.tensile_strength_mpa ?? 0) * fraction;
      accumulator.elastic_modulus_gpa += (reference.elastic_modulus_gpa ?? 0) * fraction;
      accumulator.thermal_expansion_ppm_k += (reference.thermal_expansion_ppm_k ?? 0) * fraction;
      accumulator.electrical_resistivity_ohm_m +=
        (reference.electrical_resistivity_ohm_m ?? 0) * fraction;
      accumulator.cost_usd_kg += (reference.cost_usd_kg ?? 0) * fraction;
      if (reference.thermal_conductivity_w_mk && reference.thermal_conductivity_w_mk > 0) {
        accumulator.thermal_conductivity_w_mk =
          (accumulator.thermal_conductivity_w_mk ?? 1) *
          reference.thermal_conductivity_w_mk ** fraction;
      }

      return accumulator;
    },
    {
      density_g_cm3: 0,
      tensile_strength_mpa: 0,
      elastic_modulus_gpa: 0,
      thermal_conductivity_w_mk: 1,
      thermal_expansion_ppm_k: 0,
      electrical_resistivity_ohm_m: 0,
      cost_usd_kg: 0
    }
  );
}

function rangeFor(
  values: Array<number | null>,
  fallback: number
): { min: number; max: number } {
  const filtered = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (filtered.length === 0) {
    return { min: 0, max: fallback };
  }
  const min = Math.min(...filtered);
  const max = Math.max(...filtered);
  return min === max ? { min, max: min + fallback } : { min, max };
}

function normalisedDistance(
  predicted: PredictedProperties,
  material: Material,
  ranges: Record<DistanceKey, { min: number; max: number }>
) {
  const weights: Record<DistanceKey, number> = {
    density_g_cm3: 0.2,
    tensile_strength_mpa: 0.24,
    elastic_modulus_gpa: 0.18,
    thermal_expansion_ppm_k: 0.14,
    electrical_resistivity_ohm_m: 0.12,
    cost_usd_kg: 0.12
  };

  const entries: Array<[DistanceKey, number, number | null]> = [
    ["density_g_cm3", predicted.density_g_cm3, material.density_g_cm3],
    ["tensile_strength_mpa", predicted.tensile_strength_mpa, material.tensile_strength_mpa],
    ["elastic_modulus_gpa", predicted.elastic_modulus_gpa, material.elastic_modulus_gpa],
    ["thermal_expansion_ppm_k", predicted.thermal_expansion_ppm_k, material.thermal_expansion_ppm_k],
    [
      "electrical_resistivity_ohm_m",
      predicted.electrical_resistivity_ohm_m,
      material.electrical_resistivity_ohm_m
    ],
    ["cost_usd_kg", predicted.cost_usd_kg, material.cost_usd_kg]
  ];

  const sum = entries.reduce((accumulator, [key, left, right]) => {
    if (right === null) {
      return accumulator + weights[key];
    }
    const range = ranges[key].max - ranges[key].min || 1;
    const delta = (left - right) / range;
    return accumulator + weights[key] * delta * delta;
  }, 0);

  return Math.sqrt(sum);
}

function buildRanges(pool: Material[]) {
  return {
    density_g_cm3: rangeFor(pool.map((material) => material.density_g_cm3), 1),
    tensile_strength_mpa: rangeFor(pool.map((material) => material.tensile_strength_mpa), 10),
    elastic_modulus_gpa: rangeFor(pool.map((material) => material.elastic_modulus_gpa), 5),
    thermal_expansion_ppm_k: rangeFor(
      pool.map((material) => material.thermal_expansion_ppm_k),
      1
    ),
    electrical_resistivity_ohm_m: rangeFor(
      pool.map((material) => material.electrical_resistivity_ohm_m),
      1e-8
    ),
    cost_usd_kg: rangeFor(pool.map((material) => material.cost_usd_kg), 1)
  };
}

function buildWarnings(parsed: ParsedComposition | null, exact: Material | undefined) {
  const warnings: string[] = [];

  if (!parsed) {
    warnings.push(
      "The formula could not be parsed cleanly, so the predictor is relying on analogue search rather than composition screening."
    );
    return warnings;
  }

  const formulaKey = parsed.formula;
  const nonlinear = NONLINEAR_FORMULAS.get(formulaKey);
  if (nonlinear) {
    warnings.push(nonlinear);
  }

  if (parsed.components.length > 3) {
    warnings.push(
      "More-than-ternary compositions are strongly microstructure-dependent, so this result is only a screening guide."
    );
  }

  if (parsed.components.some((component) => CERAMIC_FORMERS.has(component.element))) {
    warnings.push(
      "Ceramic and ceramic-forming systems can deviate strongly from linear property mixing because phase constitution dominates the final properties."
    );
  }

  if (exact?.source_kind === "materials-project") {
    warnings.push(
      "The exact match comes from Materials Project-derived data, so procurement-grade behavior should still be checked against experimental datasheets."
    );
  }

  return warnings;
}

function buildConfidence(method: PredictorResponse["method"], distance?: number, warnings = 0) {
  if (method === "exact-match") {
    return Math.max(75, 96 - warnings * 4);
  }

  if (method === "hybrid-screening") {
    const raw = 92 - (distance ?? 1) * 38 - warnings * 6;
    return Math.max(35, Math.min(90, Math.round(raw)));
  }

  const raw = 68 - warnings * 8;
  return Math.max(25, Math.min(65, Math.round(raw)));
}

function buildExplanation(
  formula: string,
  context: string,
  winner: Material,
  method: PredictorResponse["method"],
  warnings: string[],
  predictedProperties?: PredictedProperties
) {
  const show = (value: number | null | undefined, suffix = "", digits = 0) =>
    typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : "—";

  const methodText =
    method === "exact-match"
      ? `An exact database match was found for ${formula}.`
      : method === "hybrid-screening"
        ? `No exact database match was found for ${formula}, so the predictor estimated screening-level properties from the composition and then selected the nearest engineering analogue.`
        : `No exact match or complete composition estimate was available for ${formula}, so the predictor fell back to the closest engineering analogue from the database.`;

  const contextText = context ? ` For the stated use case (${context}),` : " For the stated use case,";
  const predictedText = predictedProperties
    ? ` The screening estimate is approximately ${predictedProperties.density_g_cm3.toFixed(2)} g/cm³ density, ${Math.round(predictedProperties.tensile_strength_mpa)} MPa tensile strength, ${predictedProperties.elastic_modulus_gpa.toFixed(1)} GPa modulus, ${predictedProperties.thermal_expansion_ppm_k.toFixed(1)} ppm/K thermal expansion, ${predictedProperties.thermal_conductivity_w_mk ? `${predictedProperties.thermal_conductivity_w_mk.toFixed(1)} W/m·K thermal conductivity, ` : ""}and $${predictedProperties.cost_usd_kg.toFixed(2)}/kg cost.`
    : "";
  const warningText = warnings.length > 0 ? ` ${warnings.join(" ")}` : "";

  return (
    `${methodText}${contextText} ${winner.name} is the strongest starting point. ` +
    `It offers ${show(winner.tensile_strength_mpa, " MPa")} tensile strength, ${show(winner.max_service_temp_c, "°C")} service temperature, ` +
    `${show(winner.density_g_cm3, " g/cm³", 2)} density, ${show(winner.thermal_expansion_ppm_k, " ppm/K", 1)} thermal expansion, and ` +
    `$${show(winner.cost_usd_kg, "", 2)}/kg estimated cost.` +
    predictedText +
    ` Treat this as screening-level guidance and confirm the phase constitution, processing route, and grade-specific datasheet before design release.` +
    warningText
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { formula?: string; context?: string };
    const formula = body.formula?.trim();
    const context = body.context?.trim() ?? "";

    if (!formula) {
      return NextResponse.json({ error: "formula is required" }, { status: 400 });
    }

    const parsed = parseComposition(formula);
    const exact = exactFormulaMatch(formula);
    const warnings = buildWarnings(parsed, exact);

    if (exact) {
      const nearby = await searchDatabase(`${formula}. ${context}`, materialsDB, 5);
      const alternatives = nearby.filter((material) => material.id !== exact.id).slice(0, 3);
      const payload: PredictorResponse = {
        winner: exact,
        alternatives,
        explanation: buildExplanation(formula, context, exact, "exact-match", warnings),
        method: "exact-match",
        confidence: buildConfidence("exact-match", undefined, warnings.length),
        warnings,
        nearestAnalogs: nearby.filter((material) => material.id !== exact.id).slice(0, 5),
        predictedCategory: exact.category
      };

      return NextResponse.json(payload);
    }

    const predictedProperties = parsed ? buildPredictedProperties(parsed) : null;

    if (!predictedProperties) {
      const fallback = await searchDatabase(`${formula}. ${context}`, materialsDB, 5);
      const winner = fallback[0];

      if (!winner) {
        return NextResponse.json({ error: "No matching alloy candidates were found." }, { status: 404 });
      }

      const payload: PredictorResponse = {
        winner,
        alternatives: fallback.slice(1, 4),
        explanation: buildExplanation(
          formula,
          context,
          winner,
          "analog-fallback",
          warnings
        ),
        method: "analog-fallback",
        confidence: buildConfidence("analog-fallback", undefined, warnings.length),
        warnings,
        nearestAnalogs: fallback,
        predictedCategory: parsed ? inferCategory(parsed) : winner.category
      };

      return NextResponse.json(payload);
    }

    const predictedCategory = inferCategory(parsed as ParsedComposition);
    const candidatePool = materialsDB.filter((material) => material.category === predictedCategory);
    const searchPool = candidatePool.length >= 5 ? candidatePool : materialsDB;
    const ranges = buildRanges(searchPool);

    const nearby = searchPool
      .map((material) => ({
        material,
        distance: normalisedDistance(predictedProperties, material, ranges)
      }))
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 5);

    const winner = nearby[0]?.material;
    if (!winner) {
      return NextResponse.json({ error: "No matching alloy candidates were found." }, { status: 404 });
    }

    const payload: PredictorResponse = {
      winner,
      alternatives: nearby.slice(1, 4).map((entry) => entry.material),
      explanation: buildExplanation(
        formula,
        context,
        winner,
        "hybrid-screening",
        warnings,
        predictedProperties
      ),
      method: "hybrid-screening",
      confidence: buildConfidence(
        "hybrid-screening",
        nearby[0]?.distance,
        warnings.length
      ),
      warnings,
      predictedProperties,
      nearestAnalogs: nearby.map((entry) => entry.material),
      predictedCategory
    };

    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prediction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
