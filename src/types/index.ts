export interface Material {
  id: string;
  name: string;
  category: "Metal" | "Polymer" | "Ceramic" | "Composite" | "Solder";
  subcategory: string;
  density_g_cm3: number;
  tensile_strength_mpa: number;
  yield_strength_mpa: number;
  elastic_modulus_gpa: number;
  hardness_vickers: number | null;
  thermal_conductivity_w_mk: number;
  specific_heat_j_gk: number;
  melting_point_c: number | null;
  glass_transition_c: number | null;
  max_service_temp_c: number;
  thermal_expansion_ppm_k: number;
  electrical_resistivity_ohm_m: number;
  corrosion_resistance: "excellent" | "good" | "fair" | "poor";
  machinability: "excellent" | "good" | "fair" | "poor" | "n/a";
  printability_fdm: "excellent" | "good" | "fair" | "poor" | "n/a";
  cost_usd_kg: number;
  tags: string[];
  data_source: string;
}

export interface UserConstraints {
  maxTemperature_c?: number;
  minTensileStrength_mpa?: number;
  maxDensity_g_cm3?: number;
  maxCost_usd_kg?: number;
  corrosionRequired?: "excellent" | "good" | "fair";
  electricallyConductive?: boolean;
  electricallyInsulating?: boolean;
  thermallyConductive?: boolean;
  needsFDMPrintability?: boolean;
  preferredCategories?: Material["category"][];
  semanticTags?: string[];
  priorityWeights: {
    strength: number;
    thermal: number;
    weight: number;
    cost: number;
    corrosion: number;
  };
  rawQuery: string;
}

export interface RankedMaterial extends Material {
  score: number;
  matchReason: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RecommendResponse {
  rankedMaterials: RankedMaterial[];
  llmExplanation: string;
  inferredConstraints: UserConstraints;
  clarifications: string;
  matchCount?: number;
}

export interface CompositionFraction {
  element: string;
  fraction: number;
}

export interface PredictedAnalog {
  name: string;
  formula: string;
  category: Material["category"];
  similarity: number;
  source: string;
}

export interface NovelMaterialPrediction {
  inputComposition: string;
  normalizedFormula: string;
  parsedComposition: CompositionFraction[];
  predictedCategory: Material["category"];
  confidence: number;
  predictedProperties: {
    density_g_cm3: number;
    tensile_strength_mpa: number;
    elastic_modulus_gpa: number;
    thermal_conductivity_w_mk: number;
    max_service_temp_c: number;
    electrical_resistivity_ohm_m: number;
    corrosion_resistance: Material["corrosion_resistance"];
  };
  nearestAnalogs: PredictedAnalog[];
  explanation: string;
}
