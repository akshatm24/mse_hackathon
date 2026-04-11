import { handCuratedDB } from "@/lib/hand-curated-db";
import { mpMaterialsDB } from "@/lib/mp-materials-generated";
import { ELEMENTS } from "@/lib/periodic-table";
import { Material, NovelMaterialPrediction } from "@/types";

type ParsedComponent = {
  element: string;
  amount: number;
  fraction: number;
};

type TrainingRecord = {
  formula: string;
  key: string;
  components: ParsedComponent[];
  category: Material["category"];
  vector: number[];
  normalizedVector: number[];
  representative: Material;
  averagedProperties: {
    density_g_cm3: number;
    tensile_strength_mpa: number;
    elastic_modulus_gpa: number;
    thermal_conductivity_w_mk: number;
    max_service_temp_c: number;
    electrical_resistivity_ohm_m: number;
    corrosion_resistance: Material["corrosion_resistance"];
  };
};

const CORROSION_RANK = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1
} as const;

const CURATED_FORMULA_ALIASES: Record<string, string> = {
  ss316l: "Fe68Cr17Ni12Mo2",
  ti6al4v: "Ti90Al6V4",
  al6061t6: "Al98Mg1Si1",
  al7075t6: "Al88Zn6Mg3Cu2",
  brass_c360: "Cu60Zn40",
  bronze_c932: "Cu83Sn7Pb7Zn3",
  monel400: "Ni66Cu31",
  hastelloy_c276: "Ni57Mo16Cr15Fe6W4",
  beryllium_copper: "Cu98Be2",
  carbon_steel_1020: "Fe99C1",
  nitinol: "Ni50Ti50"
};

function round(value: number, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function parseCompositionInput(input: string): ParsedComponent[] {
  const cleaned = input.replace(/\s+/g, "").replace(/[%,-]/g, "");

  if (!cleaned) {
    throw new Error("Enter a composition like Fe70Ni30, NiTi, Al2O3, or CuZn.");
  }

  if (!/^[A-Za-z0-9.]+$/.test(cleaned)) {
    throw new Error("Only simple composition strings are supported right now.");
  }

  const matches = [...cleaned.matchAll(/([A-Z][a-z]?)(\d*\.?\d*)/g)];
  const reconstructed = matches.map((match) => match[0]).join("");

  if (matches.length === 0 || reconstructed !== cleaned) {
    throw new Error("Could not parse that composition. Try a compact formula like Fe70Ni30.");
  }

  const totals = new Map<string, number>();
  matches.forEach((match) => {
    const symbol = match[1];
    const amount = match[2] ? Number(match[2]) : 1;

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Each element amount must be a positive number.");
    }

    if (!ELEMENTS[symbol]) {
      throw new Error(`Element ${symbol} is not supported by the predictor yet.`);
    }

    totals.set(symbol, (totals.get(symbol) ?? 0) + amount);
  });

  const totalAmount = [...totals.values()].reduce((sum, value) => sum + value, 0);

  return [...totals.entries()]
    .map(([element, amount]) => ({
      element,
      amount,
      fraction: amount / totalAmount
    }))
    .sort((left, right) => left.element.localeCompare(right.element));
}

function formatNormalizedFormula(components: ParsedComponent[]) {
  return components
    .map((component) => `${component.element}${round(component.fraction * 100, 1)}`)
    .join("");
}

function canonicalKey(components: ParsedComponent[]) {
  return components
    .map((component) => `${component.element}:${round(component.fraction, 4)}`)
    .join("|");
}

function weightedMean(values: number[], weights: number[]) {
  const total = weights.reduce((sum, value) => sum + value, 0);
  return values.reduce((sum, value, index) => sum + value * weights[index], 0) / total;
}

function weightedStd(values: number[], weights: number[]) {
  const mean = weightedMean(values, weights);
  const variance =
    values.reduce((sum, value, index) => {
      const delta = value - mean;
      return sum + weights[index] * delta * delta;
    }, 0) / weights.reduce((sum, value) => sum + value, 0);
  return Math.sqrt(variance);
}

function descriptorVector(components: ParsedComponent[]) {
  const weights = components.map((component) => component.fraction);
  const atomicNumber = components.map((component) => ELEMENTS[component.element].atomicNumber);
  const atomicMass = components.map((component) => ELEMENTS[component.element].atomicMass);
  const radius = components.map((component) => ELEMENTS[component.element].atomicRadiusPm);
  const electronegativity = components.map(
    (component) => ELEMENTS[component.element].electronegativity
  );
  const meltingPoint = components.map((component) => ELEMENTS[component.element].meltingPointC);
  const density = components.map((component) => ELEMENTS[component.element].density_g_cm3);
  const thermalConductivity = components.map(
    (component) => ELEMENTS[component.element].thermalConductivity_w_mk
  );
  const valenceElectrons = components.map(
    (component) => ELEMENTS[component.element].valenceElectrons
  );
  const entropy = -weights.reduce((sum, weight) => sum + weight * Math.log(weight), 0);

  return [
    components.length,
    Math.max(...weights),
    entropy,
    weightedMean(atomicNumber, weights),
    weightedStd(atomicNumber, weights),
    weightedMean(atomicMass, weights),
    weightedStd(atomicMass, weights),
    weightedMean(radius, weights),
    weightedStd(radius, weights),
    weightedMean(electronegativity, weights),
    weightedStd(electronegativity, weights),
    weightedMean(meltingPoint, weights),
    weightedStd(meltingPoint, weights),
    weightedMean(density, weights),
    weightedStd(density, weights),
    weightedMean(thermalConductivity, weights),
    weightedStd(thermalConductivity, weights),
    weightedMean(valenceElectrons, weights),
    weightedStd(valenceElectrons, weights)
  ];
}

function baseFormulaFromMaterial(material: Material) {
  const match = material.name.match(/^([A-Z][A-Za-z0-9.]*)\s+\(/);
  return match?.[1];
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function corrosionFromAverageRank(samples: Material[]) {
  const avgRank = average(samples.map((sample) => CORROSION_RANK[sample.corrosion_resistance]));

  if (avgRank >= 3.5) {
    return "excellent";
  }
  if (avgRank >= 2.5) {
    return "good";
  }
  if (avgRank >= 1.5) {
    return "fair";
  }
  return "poor";
}

function majorityCategory(samples: Material[]) {
  const counts = new Map<Material["category"], number>();

  samples.forEach((sample) => {
    counts.set(sample.category, (counts.get(sample.category) ?? 0) + 1);
  });

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "Metal";
}

function buildTrainingRecords() {
  const grouped = new Map<string, { formula: string; components: ParsedComponent[]; samples: Material[] }>();

  [...mpMaterialsDB, ...handCuratedDB].forEach((material) => {
    const formula = CURATED_FORMULA_ALIASES[material.id] ?? baseFormulaFromMaterial(material);

    if (!formula) {
      return;
    }

    try {
      const components = parseCompositionInput(formula);
      const key = canonicalKey(components);
      const existing = grouped.get(key);

      if (existing) {
        existing.samples.push(material);
      } else {
        grouped.set(key, {
          formula,
          components,
          samples: [material]
        });
      }
    } catch {
      // Skip unsupported formulas like multi-phase blends or compositions with unsupported symbols.
    }
  });

  const rawRecords: Array<Omit<TrainingRecord, "normalizedVector">> = [...grouped.values()].map(
    (group) => {
    const vector = descriptorVector(group.components);
    const representative = group.samples[0];

    return {
      formula: group.formula,
      key: canonicalKey(group.components),
      components: group.components,
      category: majorityCategory(group.samples),
      vector,
      normalizedVector: vector,
      representative,
      averagedProperties: {
        density_g_cm3: average(group.samples.map((sample) => sample.density_g_cm3)),
        tensile_strength_mpa: average(group.samples.map((sample) => sample.tensile_strength_mpa)),
        elastic_modulus_gpa: average(group.samples.map((sample) => sample.elastic_modulus_gpa)),
        thermal_conductivity_w_mk: average(
          group.samples.map((sample) => sample.thermal_conductivity_w_mk)
        ),
        max_service_temp_c: average(group.samples.map((sample) => sample.max_service_temp_c)),
        electrical_resistivity_ohm_m: average(
          group.samples.map((sample) => sample.electrical_resistivity_ohm_m)
        ),
        corrosion_resistance: corrosionFromAverageRank(group.samples)
      }
    };
    }
  );

  const means = rawRecords[0]?.vector.map((_, index) =>
    average(rawRecords.map((record) => record.vector[index]))
  ) ?? [];
  const stds = rawRecords[0]?.vector.map((_, index) => {
    const mean = means[index];
    const variance =
      average(rawRecords.map((record) => {
        const delta = record.vector[index] - mean;
        return delta * delta;
      })) || 1;
    return Math.sqrt(variance) || 1;
  }) ?? [];

  return {
    records: rawRecords.map((record) => ({
      ...record,
      normalizedVector: record.vector.map((value, index) => (value - means[index]) / stds[index])
    })),
    means,
    stds
  };
}

const TRAINING_MODEL = buildTrainingRecords();

function distance(left: number[], right: number[]) {
  return Math.sqrt(
    left.reduce((sum, value, index) => {
      const delta = value - right[index];
      return sum + delta * delta;
    }, 0)
  );
}

function weightedAverage(values: number[], weights: number[]) {
  const total = weights.reduce((sum, value) => sum + value, 0);
  return values.reduce((sum, value, index) => sum + value * weights[index], 0) / total;
}

function weightedCategory(records: TrainingRecord[], weights: number[]) {
  const counts = new Map<Material["category"], number>();

  records.forEach((record, index) => {
    counts.set(record.category, (counts.get(record.category) ?? 0) + weights[index]);
  });

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "Metal";
}

function weightedCorrosion(records: TrainingRecord[], weights: number[]) {
  const avgRank = weightedAverage(
    records.map((record) => CORROSION_RANK[record.averagedProperties.corrosion_resistance]),
    weights
  );

  if (avgRank >= 3.5) {
    return "excellent";
  }
  if (avgRank >= 2.5) {
    return "good";
  }
  if (avgRank >= 1.5) {
    return "fair";
  }
  return "poor";
}

function chemistryHint(components: ParsedComponent[]): Material["category"] {
  const symbols = components.map((component) => component.element);
  const nonMetalCount = symbols.filter((symbol) => ["B", "C", "N", "O", "P", "Si", "As"].includes(symbol)).length;

  if (nonMetalCount === 0) {
    return "Metal";
  }

  if (nonMetalCount >= 1 && symbols.length <= 3) {
    return "Ceramic";
  }

  return "Metal";
}

function overlapScore(left: ParsedComponent[], right: ParsedComponent[]) {
  const leftMap = new Map(left.map((component) => [component.element, component.fraction]));
  const rightMap = new Map(right.map((component) => [component.element, component.fraction]));
  const allElements = new Set([...leftMap.keys(), ...rightMap.keys()]);
  const sharedElements = [...leftMap.keys()].filter((element) => rightMap.has(element));
  const sharedFraction = sharedElements.reduce(
    (sum, element) => sum + Math.min(leftMap.get(element) ?? 0, rightMap.get(element) ?? 0),
    0
  );
  const jaccard = sharedElements.length / allElements.size;
  const exactSet =
    left.length === right.length && sharedElements.length === left.length ? 1 : 0;

  return 0.55 * sharedFraction + 0.25 * jaccard + 0.2 * exactSet;
}

function fallbackExplanation(
  composition: string,
  prediction: Omit<NovelMaterialPrediction, "explanation">
) {
  const analogText = prediction.nearestAnalogs
    .slice(0, 2)
    .map((analog) => analog.formula)
    .join(" and ");

  return `${composition} is treated as a novel composition and estimated from nearby known chemistries such as ${analogText}. Use the predicted density, stiffness, conductivity, and service temperature as screening values only, then confirm with experiment or higher-fidelity simulation before design freeze.`;
}

export function predictNovelMaterial(
  composition: string
): Omit<NovelMaterialPrediction, "explanation"> {
  if (TRAINING_MODEL.records.length < 5) {
    throw new Error("The composition model is not available yet.");
  }

  const parsedComposition = parseCompositionInput(composition);
  const vector = descriptorVector(parsedComposition);
  const normalizedVector = vector.map(
    (value, index) => (value - TRAINING_MODEL.means[index]) / TRAINING_MODEL.stds[index]
  );
  const chemistryCategory = chemistryHint(parsedComposition);

  const nearest = TRAINING_MODEL.records
    .map((record) => ({
      record,
      distance: distance(normalizedVector, record.normalizedVector),
      overlap: overlapScore(parsedComposition, record.components)
    }))
    .sort((left, right) => {
      if (right.overlap !== left.overlap) {
        return right.overlap - left.overlap;
      }
      return left.distance - right.distance;
    })
    .slice(0, 6);

  const weights = nearest.map((entry) => {
    const chemistryBoost = entry.record.category === chemistryCategory ? 1.15 : 1;
    return (chemistryBoost + entry.overlap * 2.5) / (entry.distance * entry.distance + 0.2);
  });

  const records = nearest.map((entry) => entry.record);
  const predictedCategory = weightedCategory(records, weights);
  const avgDistance = weightedAverage(
    nearest.map((entry) => entry.distance),
    weights
  );
  const avgOverlap = weightedAverage(
    nearest.map((entry) => entry.overlap),
    weights
  );
  const elementPenalty = parsedComposition.some((component) => !ELEMENTS[component.element]) ? 15 : 0;
  const confidence = Math.max(
    35,
    Math.min(96, Math.round(75 + avgOverlap * 22 - avgDistance * 12 - elementPenalty))
  );

  return {
    inputComposition: composition,
    normalizedFormula: formatNormalizedFormula(parsedComposition),
    parsedComposition: parsedComposition.map((component) => ({
      element: component.element,
      fraction: round(component.fraction, 3)
    })),
    predictedCategory,
    confidence,
    predictedProperties: {
      density_g_cm3: round(weightedAverage(records.map((record) => record.averagedProperties.density_g_cm3), weights), 2),
      tensile_strength_mpa: Math.round(
        weightedAverage(records.map((record) => record.averagedProperties.tensile_strength_mpa), weights)
      ),
      elastic_modulus_gpa: round(
        weightedAverage(records.map((record) => record.averagedProperties.elastic_modulus_gpa), weights),
        1
      ),
      thermal_conductivity_w_mk: round(
        weightedAverage(
          records.map((record) => record.averagedProperties.thermal_conductivity_w_mk),
          weights
        ),
        1
      ),
      max_service_temp_c: Math.round(
        weightedAverage(records.map((record) => record.averagedProperties.max_service_temp_c), weights)
      ),
      electrical_resistivity_ohm_m: Number(
        weightedAverage(
          records.map((record) => record.averagedProperties.electrical_resistivity_ohm_m),
          weights
        ).toExponential(2)
      ),
      corrosion_resistance: weightedCorrosion(records, weights)
    },
    nearestAnalogs: nearest.slice(0, 3).map((entry) => ({
      name: entry.record.representative.name,
      formula: entry.record.formula,
      category: entry.record.category,
      similarity: round(Math.min(0.99, 0.45 + entry.overlap * 0.45 + 1 / (4 + entry.distance)), 3),
      source: entry.record.representative.data_source
    }))
  };
}

export function buildNovelPrediction(composition: string): NovelMaterialPrediction {
  const prediction = predictNovelMaterial(composition);

  return {
    ...prediction,
    explanation: fallbackExplanation(composition, prediction)
  };
}

export function fallbackNovelPredictionExplanation(
  composition: string,
  prediction: Omit<NovelMaterialPrediction, "explanation">
) {
  return fallbackExplanation(composition, prediction);
}
