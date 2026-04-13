export interface Material {
  id: string;
  name: string;
  category: "Metal" | "Polymer" | "Ceramic" | "Composite" | "Solder";
  subcategory: string;
  density_g_cm3: number | null;
  tensile_strength_mpa: number | null;
  yield_strength_mpa: number | null;
  elastic_modulus_gpa: number | null;
  hardness_vickers: number | null;
  hardness_rockwell_c?: number | null;
  hardness_brinell?: number | null;
  elongation_pct?: number | null;
  thermal_conductivity_w_mk: number | null;
  specific_heat_j_gk: number | null;
  melting_point_c: number | null;
  glass_transition_c: number | null;
  max_service_temp_c: number | null;
  thermal_expansion_ppm_k: number | null;
  electrical_resistivity_ohm_m: number | null;
  flexural_strength_mpa?: number | null;
  compressive_strength_mpa?: number | null;
  poissons_ratio?: number | null;
  fracture_toughness_mpa_m05?: number | null;
  corrosion_resistance: "excellent" | "good" | "fair" | "poor" | null;
  machinability: "excellent" | "good" | "fair" | "poor" | "n/a";
  printability_fdm: "excellent" | "good" | "fair" | "poor" | "n/a";
  cost_usd_kg: number | null;
  tags: string[];
  data_source: string;
  source?: string | string[];
  source_url?: string | null;
  scrape_url?: string | null;
  data_quality?:
    | "validated"
    | "curated"
    | "experimental"
    | "scraped"
    | "hardcoded-cited"
    | "estimated"
    | "mp-calculated";
  source_kind?:
    | "curated"
    | "hardcoded"
    | "validated"
    | "mp"
    | "materials-project";
  formula_pretty?: string;
  material_id?: string;
  energy_above_hull?: number | null;
  band_gap_eV?: number | null;
  is_stable?: boolean;
  standards?: string[];
  data_enriched_from_mp?: boolean;
  biocompatible?: boolean;
  magnetic?: boolean;
  fdm_printable?: boolean;
}

export interface UserConstraints {
  maxTemperature_c?: number;
  minTensileStrength_mpa?: number;
  maxDensity_g_cm3?: number;
  maxCost_usd_kg?: number;
  maxElectricalResistivity_ohm_m?: number;
  minElectricalResistivity_ohm_m?: number;
  minThermalConductivity_w_mk?: number;
  maxThermalConductivity_w_mk?: number;
  maxThermalExpansion_ppm_k?: number;
  corrosionRequired?: "excellent" | "good" | "fair";
  electricallyConductive?: boolean;
  thermallyConductive?: boolean;
  needsFDMPrintability?: boolean;
  requiresFatigueWarning?: boolean;
  priorityWeights: {
    strength: number;
    thermal: number;
    weight: number;
    cost: number;
    corrosion: number;
  };
  _negatedAxes?: string[];
  rawQuery: string;
}

export interface RankedMaterial extends Material {
  score: number;
  matchReason: string;
  warnings?: string[];
  normalizedScores: {
    thermal: number;
    strength: number;
    weight: number;
    cost: number;
    corrosion: number;
  };
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
  ragMaterials?: string[];
  warnings?: string[];
}

export interface PredictorResponse {
  winner: Material;
  alternatives: Material[];
  explanation: string;
  method: "exact-match" | "hybrid-screening" | "analog-fallback";
  confidence: number;
  warnings: string[];
  predictedProperties?: {
    density_g_cm3: number;
    tensile_strength_mpa: number;
    elastic_modulus_gpa: number;
    thermal_conductivity_w_mk?: number;
    thermal_expansion_ppm_k: number;
    electrical_resistivity_ohm_m: number;
    cost_usd_kg: number;
  };
  nearestAnalogs?: Material[];
  predictedCategory?: Material["category"];
}

export interface PredictorMatchResponse {
  parsedFormula: string;
  elementFractions: Record<string, number>;
  compound: Material;
  analogue: Material;
  alternatives: Material[];
  explanation: string;
  confidence: number;
}
