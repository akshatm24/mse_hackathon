import type { Material } from "@/types";

type Corrosion = Material["corrosion_resistance"];
type Machinability = Material["machinability"];
type Printability = Material["printability_fdm"];

type MaterialSeed = Omit<
  Material,
  | "id"
  | "name"
  | "category"
  | "subcategory"
  | "density_g_cm3"
  | "tensile_strength_mpa"
  | "yield_strength_mpa"
  | "elastic_modulus_gpa"
  | "hardness_vickers"
  | "thermal_conductivity_w_mk"
  | "specific_heat_j_gk"
  | "melting_point_c"
  | "glass_transition_c"
  | "max_service_temp_c"
  | "thermal_expansion_ppm_k"
  | "electrical_resistivity_ohm_m"
  | "corrosion_resistance"
  | "machinability"
  | "printability_fdm"
  | "cost_usd_kg"
  | "tags"
  | "data_source"
> & {
  id: string;
  name: string;
  category: Material["category"];
  subcategory: string;
  density_g_cm3: number;
  tensile_strength_mpa: number;
  yield_strength_mpa?: number;
  elastic_modulus_gpa: number;
  hardness_vickers: number | null;
  thermal_conductivity_w_mk: number;
  specific_heat_j_gk: number;
  melting_point_c: number | null;
  glass_transition_c: number | null;
  max_service_temp_c: number;
  thermal_expansion_ppm_k: number;
  electrical_resistivity_ohm_m: number;
  corrosion_resistance: Corrosion;
  machinability: Machinability;
  printability_fdm: Printability;
  cost_usd_kg: number;
  tags: string[];
  data_source: string;
};

type MetalFamilySeed = {
  subcategory: string;
  density_g_cm3: number;
  elastic_modulus_gpa: number;
  thermal_conductivity_w_mk: number;
  specific_heat_j_gk: number;
  melting_point_c: number;
  max_service_temp_c: number;
  thermal_expansion_ppm_k: number;
  electrical_resistivity_ohm_m: number;
  corrosion_resistance: Corrosion;
  machinability: Machinability;
  cost_usd_kg: number;
  tags: string[];
  data_source: string;
};

type MetalVariant = {
  id: string;
  name: string;
  tensile_strength_mpa: number;
  yield_strength_mpa?: number;
  hardness_vickers: number | null;
  density_g_cm3?: number;
  elastic_modulus_gpa?: number;
  thermal_conductivity_w_mk?: number;
  specific_heat_j_gk?: number;
  melting_point_c?: number;
  max_service_temp_c?: number;
  thermal_expansion_ppm_k?: number;
  electrical_resistivity_ohm_m?: number;
  corrosion_resistance?: Corrosion;
  machinability?: Machinability;
  cost_usd_kg?: number;
  tags?: string[];
  data_source?: string;
};

type PolymerSeed = {
  subcategory: string;
  density_g_cm3: number;
  tensile_strength_mpa: number;
  yield_strength_mpa?: number;
  elastic_modulus_gpa: number;
  thermal_conductivity_w_mk: number;
  specific_heat_j_gk: number;
  glass_transition_c: number | null;
  max_service_temp_c: number;
  thermal_expansion_ppm_k: number;
  electrical_resistivity_ohm_m: number;
  corrosion_resistance: Corrosion;
  machinability: Machinability;
  printability_fdm: Printability;
  cost_usd_kg: number;
  tags: string[];
  data_source: string;
};

type PolymerVariant = {
  id: string;
  name: string;
  subcategory?: string;
  density_g_cm3?: number;
  tensile_strength_mpa?: number;
  yield_strength_mpa?: number;
  elastic_modulus_gpa?: number;
  thermal_conductivity_w_mk?: number;
  specific_heat_j_gk?: number;
  glass_transition_c?: number | null;
  max_service_temp_c?: number;
  thermal_expansion_ppm_k?: number;
  electrical_resistivity_ohm_m?: number;
  corrosion_resistance?: Corrosion;
  machinability?: Machinability;
  printability_fdm?: Printability;
  cost_usd_kg?: number;
  tags?: string[];
  data_source?: string;
};

type CeramicSeed = {
  subcategory: string;
  density_g_cm3: number;
  elastic_modulus_gpa: number;
  thermal_conductivity_w_mk: number;
  specific_heat_j_gk: number;
  melting_point_c: number;
  max_service_temp_c: number;
  thermal_expansion_ppm_k: number;
  electrical_resistivity_ohm_m: number;
  corrosion_resistance: Corrosion;
  cost_usd_kg: number;
  tags: string[];
  data_source: string;
};

type CeramicVariant = {
  id: string;
  name: string;
  subcategory?: string;
  density_g_cm3?: number;
  tensile_strength_mpa: number;
  elastic_modulus_gpa?: number;
  hardness_vickers: number | null;
  thermal_conductivity_w_mk?: number;
  specific_heat_j_gk?: number;
  melting_point_c?: number;
  max_service_temp_c?: number;
  thermal_expansion_ppm_k?: number;
  electrical_resistivity_ohm_m?: number;
  corrosion_resistance?: Corrosion;
  cost_usd_kg?: number;
  tags?: string[];
  data_source?: string;
};

type CompositeSeed = {
  subcategory: string;
  density_g_cm3: number;
  elastic_modulus_gpa: number;
  thermal_conductivity_w_mk: number;
  specific_heat_j_gk: number;
  glass_transition_c: number | null;
  max_service_temp_c: number;
  thermal_expansion_ppm_k: number;
  electrical_resistivity_ohm_m: number;
  corrosion_resistance: Corrosion;
  machinability: Machinability;
  cost_usd_kg: number;
  tags: string[];
  data_source: string;
};

type CompositeVariant = {
  id: string;
  name: string;
  subcategory?: string;
  density_g_cm3?: number;
  tensile_strength_mpa: number;
  elastic_modulus_gpa?: number;
  thermal_conductivity_w_mk?: number;
  specific_heat_j_gk?: number;
  glass_transition_c?: number | null;
  max_service_temp_c?: number;
  thermal_expansion_ppm_k?: number;
  electrical_resistivity_ohm_m?: number;
  corrosion_resistance?: Corrosion;
  machinability?: Machinability;
  cost_usd_kg?: number;
  tags?: string[];
  data_source?: string;
};

function buildMaterial(seed: MaterialSeed): Material {
  return {
    ...seed,
    yield_strength_mpa:
      seed.yield_strength_mpa ?? Math.round(seed.tensile_strength_mpa * 0.72),
    source_kind: "curated"
  };
}

function metal(seed: MaterialSeed): Material {
  return buildMaterial(seed);
}

function polymer(seed: MaterialSeed): Material {
  return buildMaterial(seed);
}

function ceramic(seed: MaterialSeed): Material {
  return buildMaterial(seed);
}

function composite(seed: MaterialSeed): Material {
  return buildMaterial(seed);
}

function createMetalSeries(base: MetalFamilySeed, variants: MetalVariant[]): Material[] {
  return variants.map((variant) =>
    metal({
      id: variant.id,
      name: variant.name,
      category: "Metal",
      subcategory: base.subcategory,
      density_g_cm3: variant.density_g_cm3 ?? base.density_g_cm3,
      tensile_strength_mpa: variant.tensile_strength_mpa,
      yield_strength_mpa:
        variant.yield_strength_mpa ?? Math.round(variant.tensile_strength_mpa * 0.72),
      elastic_modulus_gpa: variant.elastic_modulus_gpa ?? base.elastic_modulus_gpa,
      hardness_vickers: variant.hardness_vickers,
      thermal_conductivity_w_mk:
        variant.thermal_conductivity_w_mk ?? base.thermal_conductivity_w_mk,
      specific_heat_j_gk: variant.specific_heat_j_gk ?? base.specific_heat_j_gk,
      melting_point_c: variant.melting_point_c ?? base.melting_point_c,
      glass_transition_c: null,
      max_service_temp_c: variant.max_service_temp_c ?? base.max_service_temp_c,
      thermal_expansion_ppm_k:
        variant.thermal_expansion_ppm_k ?? base.thermal_expansion_ppm_k,
      electrical_resistivity_ohm_m:
        variant.electrical_resistivity_ohm_m ?? base.electrical_resistivity_ohm_m,
      corrosion_resistance: variant.corrosion_resistance ?? base.corrosion_resistance,
      machinability: variant.machinability ?? base.machinability,
      printability_fdm: "n/a",
      cost_usd_kg: variant.cost_usd_kg ?? base.cost_usd_kg,
      tags: [...base.tags, ...(variant.tags ?? [])],
      data_source: variant.data_source ?? base.data_source
    })
  );
}

function createPolymerSeries(base: PolymerSeed, variants: PolymerVariant[]): Material[] {
  return variants.map((variant) =>
    polymer({
      id: variant.id,
      name: variant.name,
      category: "Polymer",
      subcategory: variant.subcategory ?? base.subcategory,
      density_g_cm3: variant.density_g_cm3 ?? base.density_g_cm3,
      tensile_strength_mpa: variant.tensile_strength_mpa ?? base.tensile_strength_mpa,
      yield_strength_mpa:
        variant.yield_strength_mpa ??
        base.yield_strength_mpa ??
        Math.round((variant.tensile_strength_mpa ?? base.tensile_strength_mpa) * 0.85),
      elastic_modulus_gpa: variant.elastic_modulus_gpa ?? base.elastic_modulus_gpa,
      hardness_vickers: null,
      thermal_conductivity_w_mk:
        variant.thermal_conductivity_w_mk ?? base.thermal_conductivity_w_mk,
      specific_heat_j_gk: variant.specific_heat_j_gk ?? base.specific_heat_j_gk,
      melting_point_c: null,
      glass_transition_c:
        variant.glass_transition_c === undefined
          ? base.glass_transition_c
          : variant.glass_transition_c,
      max_service_temp_c: variant.max_service_temp_c ?? base.max_service_temp_c,
      thermal_expansion_ppm_k:
        variant.thermal_expansion_ppm_k ?? base.thermal_expansion_ppm_k,
      electrical_resistivity_ohm_m:
        variant.electrical_resistivity_ohm_m ?? base.electrical_resistivity_ohm_m,
      corrosion_resistance: variant.corrosion_resistance ?? base.corrosion_resistance,
      machinability: variant.machinability ?? base.machinability,
      printability_fdm: variant.printability_fdm ?? base.printability_fdm,
      cost_usd_kg: variant.cost_usd_kg ?? base.cost_usd_kg,
      tags: [...base.tags, ...(variant.tags ?? [])],
      data_source: variant.data_source ?? base.data_source
    })
  );
}

function createCeramicSeries(base: CeramicSeed, variants: CeramicVariant[]): Material[] {
  return variants.map((variant) =>
    ceramic({
      id: variant.id,
      name: variant.name,
      category: "Ceramic",
      subcategory: variant.subcategory ?? base.subcategory,
      density_g_cm3: variant.density_g_cm3 ?? base.density_g_cm3,
      tensile_strength_mpa: variant.tensile_strength_mpa,
      yield_strength_mpa: variant.tensile_strength_mpa,
      elastic_modulus_gpa: variant.elastic_modulus_gpa ?? base.elastic_modulus_gpa,
      hardness_vickers: variant.hardness_vickers,
      thermal_conductivity_w_mk:
        variant.thermal_conductivity_w_mk ?? base.thermal_conductivity_w_mk,
      specific_heat_j_gk: variant.specific_heat_j_gk ?? base.specific_heat_j_gk,
      melting_point_c: variant.melting_point_c ?? base.melting_point_c,
      glass_transition_c: null,
      max_service_temp_c: variant.max_service_temp_c ?? base.max_service_temp_c,
      thermal_expansion_ppm_k:
        variant.thermal_expansion_ppm_k ?? base.thermal_expansion_ppm_k,
      electrical_resistivity_ohm_m:
        variant.electrical_resistivity_ohm_m ?? base.electrical_resistivity_ohm_m,
      corrosion_resistance: variant.corrosion_resistance ?? base.corrosion_resistance,
      machinability: "poor",
      printability_fdm: "n/a",
      cost_usd_kg: variant.cost_usd_kg ?? base.cost_usd_kg,
      tags: [...base.tags, ...(variant.tags ?? [])],
      data_source: variant.data_source ?? base.data_source
    })
  );
}

function createCompositeSeries(base: CompositeSeed, variants: CompositeVariant[]): Material[] {
  return variants.map((variant) =>
    composite({
      id: variant.id,
      name: variant.name,
      category: "Composite",
      subcategory: variant.subcategory ?? base.subcategory,
      density_g_cm3: variant.density_g_cm3 ?? base.density_g_cm3,
      tensile_strength_mpa: variant.tensile_strength_mpa,
      yield_strength_mpa: variant.tensile_strength_mpa,
      elastic_modulus_gpa: variant.elastic_modulus_gpa ?? base.elastic_modulus_gpa,
      hardness_vickers: null,
      thermal_conductivity_w_mk:
        variant.thermal_conductivity_w_mk ?? base.thermal_conductivity_w_mk,
      specific_heat_j_gk: variant.specific_heat_j_gk ?? base.specific_heat_j_gk,
      melting_point_c: null,
      glass_transition_c:
        variant.glass_transition_c === undefined
          ? base.glass_transition_c
          : variant.glass_transition_c,
      max_service_temp_c: variant.max_service_temp_c ?? base.max_service_temp_c,
      thermal_expansion_ppm_k:
        variant.thermal_expansion_ppm_k ?? base.thermal_expansion_ppm_k,
      electrical_resistivity_ohm_m:
        variant.electrical_resistivity_ohm_m ?? base.electrical_resistivity_ohm_m,
      corrosion_resistance: variant.corrosion_resistance ?? base.corrosion_resistance,
      machinability: variant.machinability ?? base.machinability,
      printability_fdm: "n/a",
      cost_usd_kg: variant.cost_usd_kg ?? base.cost_usd_kg,
      tags: [...base.tags, ...(variant.tags ?? [])],
      data_source: variant.data_source ?? base.data_source
    })
  );
}

const requestedAdditionalMaterials: Material[] = [
  metal({
    id: "ss304",
    name: "Stainless Steel 304",
    category: "Metal",
    subcategory: "Austenitic Stainless",
    density_g_cm3: 8,
    tensile_strength_mpa: 505,
    yield_strength_mpa: 215,
    elastic_modulus_gpa: 193,
    hardness_vickers: 201,
    thermal_conductivity_w_mk: 16.2,
    specific_heat_j_gk: 0.5,
    melting_point_c: 1400,
    glass_transition_c: null,
    max_service_temp_c: 870,
    thermal_expansion_ppm_k: 17.2,
    electrical_resistivity_ohm_m: 7.2e-7,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 3,
    tags: ["kitchen", "food-grade", "general-purpose", "cheap-ss"],
    data_source: "ASM Handbook Vol 1"
  }),
  metal({
    id: "ss430",
    name: "Stainless Steel 430",
    category: "Metal",
    subcategory: "Ferritic Stainless",
    density_g_cm3: 7.8,
    tensile_strength_mpa: 483,
    yield_strength_mpa: 310,
    elastic_modulus_gpa: 200,
    hardness_vickers: 185,
    thermal_conductivity_w_mk: 26.1,
    specific_heat_j_gk: 0.46,
    melting_point_c: 1425,
    glass_transition_c: null,
    max_service_temp_c: 815,
    thermal_expansion_ppm_k: 10.4,
    electrical_resistivity_ohm_m: 6e-7,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 2.8,
    tags: ["appliances", "automotive-trim", "ferritic"],
    data_source: "ASM Handbook Vol 1"
  }),
  metal({
    id: "ss17_4ph",
    name: "Stainless Steel 17-4 PH",
    category: "Metal",
    subcategory: "Precipitation Hardened SS",
    density_g_cm3: 7.78,
    tensile_strength_mpa: 1310,
    yield_strength_mpa: 1170,
    elastic_modulus_gpa: 197,
    hardness_vickers: 375,
    thermal_conductivity_w_mk: 17.9,
    specific_heat_j_gk: 0.5,
    melting_point_c: 1404,
    glass_transition_c: null,
    max_service_temp_c: 315,
    thermal_expansion_ppm_k: 10.8,
    electrical_resistivity_ohm_m: 7.8e-7,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 7.5,
    tags: ["aerospace", "oil-gas", "high-strength", "am-powder"],
    data_source: "ASM Handbook Vol 1"
  }),
  metal({
    id: "duplex2205",
    name: "Duplex Stainless 2205",
    category: "Metal",
    subcategory: "Duplex Stainless",
    density_g_cm3: 7.82,
    tensile_strength_mpa: 655,
    yield_strength_mpa: 448,
    elastic_modulus_gpa: 200,
    hardness_vickers: 290,
    thermal_conductivity_w_mk: 19,
    specific_heat_j_gk: 0.5,
    melting_point_c: 1350,
    glass_transition_c: null,
    max_service_temp_c: 300,
    thermal_expansion_ppm_k: 13.5,
    electrical_resistivity_ohm_m: 8.5e-7,
    corrosion_resistance: "excellent",
    machinability: "fair",
    printability_fdm: "n/a",
    cost_usd_kg: 5.5,
    tags: ["offshore", "desalination", "chemical", "pressure-vessel"],
    data_source: "Outokumpu datasheet"
  }),
  metal({
    id: "hadfield",
    name: "Hadfield Manganese Steel",
    category: "Metal",
    subcategory: "Austenitic Mn Steel",
    density_g_cm3: 7.8,
    tensile_strength_mpa: 900,
    yield_strength_mpa: 380,
    elastic_modulus_gpa: 200,
    hardness_vickers: 200,
    thermal_conductivity_w_mk: 14,
    specific_heat_j_gk: 0.5,
    melting_point_c: 1400,
    glass_transition_c: null,
    max_service_temp_c: 250,
    thermal_expansion_ppm_k: 17,
    electrical_resistivity_ohm_m: 6e-7,
    corrosion_resistance: "poor",
    machinability: "poor",
    printability_fdm: "n/a",
    cost_usd_kg: 1.5,
    tags: ["mining", "crushing", "work-hardening", "impact"],
    data_source: "ASM Handbook Vol 1"
  }),
  metal({
    id: "a36",
    name: "HSLA Steel A36",
    category: "Metal",
    subcategory: "Structural Steel",
    density_g_cm3: 7.85,
    tensile_strength_mpa: 400,
    yield_strength_mpa: 250,
    elastic_modulus_gpa: 200,
    hardness_vickers: 119,
    thermal_conductivity_w_mk: 51.9,
    specific_heat_j_gk: 0.49,
    melting_point_c: 1425,
    glass_transition_c: null,
    max_service_temp_c: 340,
    thermal_expansion_ppm_k: 11.7,
    electrical_resistivity_ohm_m: 1.7e-7,
    corrosion_resistance: "poor",
    machinability: "excellent",
    printability_fdm: "n/a",
    cost_usd_kg: 0.7,
    tags: ["construction", "bridges", "cheapest-structural", "a36"],
    data_source: "ASTM A36"
  }),
  metal({
    id: "4140steel",
    name: "Alloy Steel 4140",
    category: "Metal",
    subcategory: "Chromoly Steel",
    density_g_cm3: 7.85,
    tensile_strength_mpa: 1020,
    yield_strength_mpa: 655,
    elastic_modulus_gpa: 205,
    hardness_vickers: 302,
    thermal_conductivity_w_mk: 42.7,
    specific_heat_j_gk: 0.47,
    melting_point_c: 1416,
    glass_transition_c: null,
    max_service_temp_c: 400,
    thermal_expansion_ppm_k: 12.3,
    electrical_resistivity_ohm_m: 2.2e-7,
    corrosion_resistance: "poor",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 1.2,
    tags: ["shafts", "gears", "oil-gas", "structural"],
    data_source: "ASM Handbook Vol 1"
  }),
  metal({
    id: "4340steel",
    name: "Alloy Steel 4340",
    category: "Metal",
    subcategory: "Nickel-Chromoly Steel",
    density_g_cm3: 7.85,
    tensile_strength_mpa: 1470,
    yield_strength_mpa: 1370,
    elastic_modulus_gpa: 205,
    hardness_vickers: 444,
    thermal_conductivity_w_mk: 44.5,
    specific_heat_j_gk: 0.47,
    melting_point_c: 1416,
    glass_transition_c: null,
    max_service_temp_c: 400,
    thermal_expansion_ppm_k: 12.3,
    electrical_resistivity_ohm_m: 2.4e-7,
    corrosion_resistance: "poor",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 1.8,
    tags: ["aerospace", "landing-gear", "high-strength-steel"],
    data_source: "ASM Handbook Vol 1"
  }),
  metal({
    id: "al5052",
    name: "Aluminum 5052-H32",
    category: "Metal",
    subcategory: "Aluminum Alloy",
    density_g_cm3: 2.68,
    tensile_strength_mpa: 228,
    yield_strength_mpa: 193,
    elastic_modulus_gpa: 70.3,
    hardness_vickers: 60,
    thermal_conductivity_w_mk: 138,
    specific_heat_j_gk: 0.88,
    melting_point_c: 607,
    glass_transition_c: null,
    max_service_temp_c: 65,
    thermal_expansion_ppm_k: 23.8,
    electrical_resistivity_ohm_m: 4.98e-8,
    corrosion_resistance: "excellent",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 2.8,
    tags: ["marine", "sheet-metal", "fuel-tanks", "hvac", "cryogenic"],
    data_source: "ASM Handbook Vol 2"
  }),
  metal({
    id: "al5083",
    name: "Aluminum 5083-H116",
    category: "Metal",
    subcategory: "Aluminum Alloy",
    density_g_cm3: 2.66,
    tensile_strength_mpa: 317,
    yield_strength_mpa: 228,
    elastic_modulus_gpa: 70.3,
    hardness_vickers: 75,
    thermal_conductivity_w_mk: 121,
    specific_heat_j_gk: 0.9,
    melting_point_c: 591,
    glass_transition_c: null,
    max_service_temp_c: 65,
    thermal_expansion_ppm_k: 23.8,
    electrical_resistivity_ohm_m: 5.9e-8,
    corrosion_resistance: "excellent",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 3.2,
    tags: ["marine", "cryogenic", "lng-tank", "shipbuilding"],
    data_source: "ASM Handbook Vol 2"
  }),
  metal({
    id: "al2219",
    name: "Aluminum 2219-T87",
    category: "Metal",
    subcategory: "Aluminum Alloy",
    density_g_cm3: 2.84,
    tensile_strength_mpa: 476,
    yield_strength_mpa: 393,
    elastic_modulus_gpa: 73.8,
    hardness_vickers: 130,
    thermal_conductivity_w_mk: 121,
    specific_heat_j_gk: 0.864,
    melting_point_c: 643,
    glass_transition_c: null,
    max_service_temp_c: 175,
    thermal_expansion_ppm_k: 22.3,
    electrical_resistivity_ohm_m: 5.8e-8,
    corrosion_resistance: "fair",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 5.5,
    tags: ["aerospace", "cryogenic", "rocket-tank", "weldable"],
    data_source: "ASM Handbook Vol 2"
  }),
  metal({
    id: "al3003",
    name: "Aluminum 3003-H14",
    category: "Metal",
    subcategory: "Aluminum Alloy",
    density_g_cm3: 2.73,
    tensile_strength_mpa: 150,
    yield_strength_mpa: 145,
    elastic_modulus_gpa: 68.9,
    hardness_vickers: 40,
    thermal_conductivity_w_mk: 163,
    specific_heat_j_gk: 0.893,
    melting_point_c: 654,
    glass_transition_c: null,
    max_service_temp_c: 100,
    thermal_expansion_ppm_k: 23.2,
    electrical_resistivity_ohm_m: 3.45e-8,
    corrosion_resistance: "excellent",
    machinability: "excellent",
    printability_fdm: "n/a",
    cost_usd_kg: 2.2,
    tags: ["heat-exchanger", "cookware", "chemical-equipment"],
    data_source: "ASM Handbook Vol 2"
  }),
  metal({
    id: "cupronickel",
    name: "Cupronickel 90/10",
    category: "Metal",
    subcategory: "Copper-Nickel Alloy",
    density_g_cm3: 8.94,
    tensile_strength_mpa: 300,
    yield_strength_mpa: 110,
    elastic_modulus_gpa: 135,
    hardness_vickers: 75,
    thermal_conductivity_w_mk: 45,
    specific_heat_j_gk: 0.377,
    melting_point_c: 1100,
    glass_transition_c: null,
    max_service_temp_c: 250,
    thermal_expansion_ppm_k: 17.1,
    electrical_resistivity_ohm_m: 1.9e-7,
    corrosion_resistance: "excellent",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 12,
    tags: ["marine", "heat-exchanger", "seawater", "condenser"],
    data_source: "CDA Copper Development Association"
  }),
  metal({
    id: "phosphor_bronze",
    name: "Phosphor Bronze C510",
    category: "Metal",
    subcategory: "Tin Bronze",
    density_g_cm3: 8.86,
    tensile_strength_mpa: 455,
    yield_strength_mpa: 380,
    elastic_modulus_gpa: 110,
    hardness_vickers: 135,
    thermal_conductivity_w_mk: 84,
    specific_heat_j_gk: 0.38,
    melting_point_c: 1000,
    glass_transition_c: null,
    max_service_temp_c: 150,
    thermal_expansion_ppm_k: 17.8,
    electrical_resistivity_ohm_m: 9e-8,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 11,
    tags: ["springs", "connectors", "bearings", "fatigue"],
    data_source: "CDA"
  }),
  metal({
    id: "inconel625",
    name: "Inconel 625",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.44,
    tensile_strength_mpa: 930,
    yield_strength_mpa: 517,
    elastic_modulus_gpa: 207,
    hardness_vickers: 250,
    thermal_conductivity_w_mk: 9.8,
    specific_heat_j_gk: 0.41,
    melting_point_c: 1350,
    glass_transition_c: null,
    max_service_temp_c: 980,
    thermal_expansion_ppm_k: 12.8,
    electrical_resistivity_ohm_m: 1.29e-6,
    corrosion_resistance: "excellent",
    machinability: "poor",
    printability_fdm: "n/a",
    cost_usd_kg: 50,
    tags: ["aerospace", "marine", "chemical", "am-powder"],
    data_source: "Special Metals datasheet"
  }),
  metal({
    id: "haynes230",
    name: "Haynes 230",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.97,
    tensile_strength_mpa: 800,
    yield_strength_mpa: 400,
    elastic_modulus_gpa: 211,
    hardness_vickers: 200,
    thermal_conductivity_w_mk: 8.9,
    specific_heat_j_gk: 0.39,
    melting_point_c: 1301,
    glass_transition_c: null,
    max_service_temp_c: 1150,
    thermal_expansion_ppm_k: 12.8,
    electrical_resistivity_ohm_m: 1.25e-6,
    corrosion_resistance: "excellent",
    machinability: "poor",
    printability_fdm: "n/a",
    cost_usd_kg: 85,
    tags: ["combustion", "chemical", "high-temp", "oxidation"],
    data_source: "Haynes International datasheet"
  }),
  metal({
    id: "rene41",
    name: "Rene 41",
    category: "Metal",
    subcategory: "Nickel Superalloy",
    density_g_cm3: 8.25,
    tensile_strength_mpa: 1420,
    yield_strength_mpa: 1060,
    elastic_modulus_gpa: 219,
    hardness_vickers: 390,
    thermal_conductivity_w_mk: 9.8,
    specific_heat_j_gk: 0.42,
    melting_point_c: 1315,
    glass_transition_c: null,
    max_service_temp_c: 980,
    thermal_expansion_ppm_k: 13.1,
    electrical_resistivity_ohm_m: 1.24e-6,
    corrosion_resistance: "excellent",
    machinability: "poor",
    printability_fdm: "n/a",
    cost_usd_kg: 100,
    tags: ["aerospace", "turbine", "high-temp", "jet-engine"],
    data_source: "Special Metals datasheet"
  }),
  metal({
    id: "ti_beta21s",
    name: "Ti-15Mo Beta 21S",
    category: "Metal",
    subcategory: "Beta Titanium Alloy",
    density_g_cm3: 4.94,
    tensile_strength_mpa: 1000,
    yield_strength_mpa: 970,
    elastic_modulus_gpa: 100,
    hardness_vickers: 320,
    thermal_conductivity_w_mk: 8.5,
    specific_heat_j_gk: 0.53,
    melting_point_c: 1650,
    glass_transition_c: null,
    max_service_temp_c: 315,
    thermal_expansion_ppm_k: 7.4,
    electrical_resistivity_ohm_m: 1.9e-6,
    corrosion_resistance: "excellent",
    machinability: "fair",
    printability_fdm: "n/a",
    cost_usd_kg: 80,
    tags: ["aerospace", "biomedical", "high-strength-ti"],
    data_source: "TIMET datasheet"
  }),
  metal({
    id: "ti_cp4",
    name: "Titanium Grade 4 (CP)",
    category: "Metal",
    subcategory: "Pure Titanium",
    density_g_cm3: 4.51,
    tensile_strength_mpa: 550,
    yield_strength_mpa: 480,
    elastic_modulus_gpa: 104,
    hardness_vickers: 200,
    thermal_conductivity_w_mk: 16.4,
    specific_heat_j_gk: 0.528,
    melting_point_c: 1668,
    glass_transition_c: null,
    max_service_temp_c: 260,
    thermal_expansion_ppm_k: 8.6,
    electrical_resistivity_ohm_m: 5.8e-7,
    corrosion_resistance: "excellent",
    machinability: "fair",
    printability_fdm: "n/a",
    cost_usd_kg: 28,
    tags: ["chemical", "marine", "industrial", "high-purity"],
    data_source: "ASTM B265"
  }),
  polymer({
    id: "pa6",
    name: "Nylon PA6",
    category: "Polymer",
    subcategory: "Polyamide",
    density_g_cm3: 1.13,
    tensile_strength_mpa: 70,
    yield_strength_mpa: 60,
    elastic_modulus_gpa: 2.7,
    hardness_vickers: null,
    thermal_conductivity_w_mk: 0.25,
    specific_heat_j_gk: 1.6,
    melting_point_c: null,
    glass_transition_c: 50,
    max_service_temp_c: 110,
    thermal_expansion_ppm_k: 85,
    electrical_resistivity_ohm_m: 1e13,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "fair",
    cost_usd_kg: 3,
    tags: ["gears", "bearings", "automotive", "cheap-nylon"],
    data_source: "MatWeb"
  }),
  polymer({
    id: "pa66",
    name: "Nylon PA66",
    category: "Polymer",
    subcategory: "Polyamide",
    density_g_cm3: 1.14,
    tensile_strength_mpa: 82,
    yield_strength_mpa: 75,
    elastic_modulus_gpa: 3,
    hardness_vickers: null,
    thermal_conductivity_w_mk: 0.26,
    specific_heat_j_gk: 1.67,
    melting_point_c: null,
    glass_transition_c: 70,
    max_service_temp_c: 130,
    thermal_expansion_ppm_k: 80,
    electrical_resistivity_ohm_m: 1e13,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "fair",
    cost_usd_kg: 4,
    tags: ["gears", "bearings", "automotive"],
    data_source: "MatWeb"
  }),
  polymer({
    id: "pbt",
    name: "PBT (Polybutylene Terephthalate)",
    category: "Polymer",
    subcategory: "Thermoplastic Polyester",
    density_g_cm3: 1.31,
    tensile_strength_mpa: 56,
    yield_strength_mpa: 52,
    elastic_modulus_gpa: 2.6,
    hardness_vickers: null,
    thermal_conductivity_w_mk: 0.21,
    specific_heat_j_gk: 1.25,
    melting_point_c: null,
    glass_transition_c: 50,
    max_service_temp_c: 120,
    thermal_expansion_ppm_k: 70,
    electrical_resistivity_ohm_m: 1e14,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "poor",
    cost_usd_kg: 4,
    tags: ["connector", "automotive", "electrical"],
    data_source: "MatWeb"
  }),
  polymer({
    id: "pvc",
    name: "PVC (Polyvinyl Chloride)",
    category: "Polymer",
    subcategory: "Thermoplastic",
    density_g_cm3: 1.4,
    tensile_strength_mpa: 50,
    yield_strength_mpa: 45,
    elastic_modulus_gpa: 3,
    hardness_vickers: null,
    thermal_conductivity_w_mk: 0.19,
    specific_heat_j_gk: 0.9,
    melting_point_c: null,
    glass_transition_c: 80,
    max_service_temp_c: 60,
    thermal_expansion_ppm_k: 80,
    electrical_resistivity_ohm_m: 1e13,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "poor",
    cost_usd_kg: 1,
    tags: ["piping", "cable-insulation", "construction", "cheap"],
    data_source: "MatWeb"
  }),
  polymer({
    id: "polystyrene",
    name: "Polystyrene (PS)",
    category: "Polymer",
    subcategory: "Thermoplastic",
    density_g_cm3: 1.05,
    tensile_strength_mpa: 45,
    yield_strength_mpa: 40,
    elastic_modulus_gpa: 3,
    hardness_vickers: null,
    thermal_conductivity_w_mk: 0.14,
    specific_heat_j_gk: 1.3,
    melting_point_c: null,
    glass_transition_c: 100,
    max_service_temp_c: 70,
    thermal_expansion_ppm_k: 70,
    electrical_resistivity_ohm_m: 1e16,
    corrosion_resistance: "good",
    machinability: "excellent",
    printability_fdm: "poor",
    cost_usd_kg: 1.2,
    tags: ["packaging", "display", "insulation", "cheapest-rigid"],
    data_source: "MatWeb"
  }),
  polymer({
    id: "polyimide",
    name: "Polyimide (PI / Kapton)",
    category: "Polymer",
    subcategory: "High-Perf Thermoset Film",
    density_g_cm3: 1.42,
    tensile_strength_mpa: 170,
    yield_strength_mpa: 150,
    elastic_modulus_gpa: 2.5,
    hardness_vickers: null,
    thermal_conductivity_w_mk: 0.12,
    specific_heat_j_gk: 1.09,
    melting_point_c: null,
    glass_transition_c: 360,
    max_service_temp_c: 400,
    thermal_expansion_ppm_k: 20,
    electrical_resistivity_ohm_m: 1e17,
    corrosion_resistance: "excellent",
    machinability: "good",
    printability_fdm: "poor",
    cost_usd_kg: 100,
    tags: ["pcb-flex", "space", "insulation", "high-temp"],
    data_source: "DuPont Kapton datasheet"
  }),
  polymer({
    id: "silicone",
    name: "Silicone Rubber (LSR)",
    category: "Polymer",
    subcategory: "Elastomer",
    density_g_cm3: 1.2,
    tensile_strength_mpa: 8,
    yield_strength_mpa: 3,
    elastic_modulus_gpa: 0.005,
    hardness_vickers: null,
    thermal_conductivity_w_mk: 0.25,
    specific_heat_j_gk: 1.46,
    melting_point_c: null,
    glass_transition_c: -123,
    max_service_temp_c: 200,
    thermal_expansion_ppm_k: 300,
    electrical_resistivity_ohm_m: 1e13,
    corrosion_resistance: "excellent",
    machinability: "poor",
    printability_fdm: "poor",
    cost_usd_kg: 15,
    tags: ["seals", "gaskets", "medical", "food-contact", "flexible"],
    data_source: "Dow Corning datasheet"
  }),
  polymer({
    id: "lcp",
    name: "LCP (Liquid Crystal Polymer)",
    category: "Polymer",
    subcategory: "High-Perf Thermoplastic",
    density_g_cm3: 1.41,
    tensile_strength_mpa: 180,
    yield_strength_mpa: 165,
    elastic_modulus_gpa: 9,
    hardness_vickers: null,
    thermal_conductivity_w_mk: 0.28,
    specific_heat_j_gk: 1.18,
    melting_point_c: null,
    glass_transition_c: 280,
    max_service_temp_c: 240,
    thermal_expansion_ppm_k: 3,
    electrical_resistivity_ohm_m: 1e15,
    corrosion_resistance: "excellent",
    machinability: "good",
    printability_fdm: "poor",
    cost_usd_kg: 30,
    tags: ["electronics", "connector", "pcb", "low-warpage"],
    data_source: "Celanese Vectra datasheet"
  }),
  composite({
    id: "cfrp_woven",
    name: "CFRP Woven 0/90",
    category: "Composite",
    subcategory: "Carbon Fiber Woven",
    density_g_cm3: 1.55,
    tensile_strength_mpa: 600,
    yield_strength_mpa: 600,
    elastic_modulus_gpa: 70,
    hardness_vickers: null,
    thermal_conductivity_w_mk: 5,
    specific_heat_j_gk: 0.84,
    melting_point_c: null,
    glass_transition_c: 120,
    max_service_temp_c: 150,
    thermal_expansion_ppm_k: 3,
    electrical_resistivity_ohm_m: 1.5e-4,
    corrosion_resistance: "excellent",
    machinability: "fair",
    printability_fdm: "n/a",
    cost_usd_kg: 60,
    tags: ["aerospace", "quasi-isotropic", "panel", "woven"],
    data_source: "Hexcel datasheet"
  }),
  composite({
    id: "basalt_epoxy",
    name: "Basalt Fiber / Epoxy",
    category: "Composite",
    subcategory: "Natural Fiber Composite",
    density_g_cm3: 1.9,
    tensile_strength_mpa: 480,
    yield_strength_mpa: 480,
    elastic_modulus_gpa: 25,
    hardness_vickers: null,
    thermal_conductivity_w_mk: 0.4,
    specific_heat_j_gk: 1,
    melting_point_c: null,
    glass_transition_c: 120,
    max_service_temp_c: 120,
    thermal_expansion_ppm_k: 8,
    electrical_resistivity_ohm_m: 1e11,
    corrosion_resistance: "excellent",
    machinability: "fair",
    printability_fdm: "n/a",
    cost_usd_kg: 20,
    tags: ["eco-friendly", "infrastructure", "basalt", "green"],
    data_source: "MatWeb"
  }),
  composite({
    id: "epoxy_resin",
    name: "Epoxy Resin (cured)",
    category: "Composite",
    subcategory: "Thermoset",
    density_g_cm3: 1.25,
    tensile_strength_mpa: 65,
    yield_strength_mpa: 60,
    elastic_modulus_gpa: 3.5,
    hardness_vickers: null,
    thermal_conductivity_w_mk: 0.21,
    specific_heat_j_gk: 1.05,
    melting_point_c: null,
    glass_transition_c: 120,
    max_service_temp_c: 130,
    thermal_expansion_ppm_k: 60,
    electrical_resistivity_ohm_m: 1e14,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 8,
    tags: ["adhesive", "composite-matrix", "insulation"],
    data_source: "MatWeb"
  }),
  metal({
    id: "snbi42",
    name: "Sn58Bi42 Low-Temp Solder",
    category: "Solder",
    subcategory: "Tin-Bismuth",
    density_g_cm3: 8.56,
    tensile_strength_mpa: 58,
    yield_strength_mpa: 40,
    elastic_modulus_gpa: 42,
    hardness_vickers: 22,
    thermal_conductivity_w_mk: 19,
    specific_heat_j_gk: 0.21,
    melting_point_c: 138,
    glass_transition_c: null,
    max_service_temp_c: 80,
    thermal_expansion_ppm_k: 15,
    electrical_resistivity_ohm_m: 3.3e-7,
    corrosion_resistance: "fair",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 30,
    tags: ["low-temp", "lead-free", "heat-sensitive", "solder"],
    data_source: "Alpha Assembly Solutions datasheet"
  }),
  metal({
    id: "inbi57",
    name: "In57Bi43 Ultra Low-Temp Solder",
    category: "Solder",
    subcategory: "Indium-Bismuth",
    density_g_cm3: 7.99,
    tensile_strength_mpa: 12,
    yield_strength_mpa: 8,
    elastic_modulus_gpa: 20,
    hardness_vickers: 8,
    thermal_conductivity_w_mk: 21,
    specific_heat_j_gk: 0.22,
    melting_point_c: 72,
    glass_transition_c: null,
    max_service_temp_c: 50,
    thermal_expansion_ppm_k: 20,
    electrical_resistivity_ohm_m: 2.9e-7,
    corrosion_resistance: "fair",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 350,
    tags: ["cryogenic", "ultra-low-temp", "bonding", "solder"],
    data_source: "Indium Corporation datasheet"
  }),
  metal({
    id: "sn96ag4",
    name: "Sn96Ag4 Silver Solder",
    category: "Solder",
    subcategory: "Tin-Silver",
    density_g_cm3: 7.4,
    tensile_strength_mpa: 55,
    yield_strength_mpa: 42,
    elastic_modulus_gpa: 50,
    hardness_vickers: 18,
    thermal_conductivity_w_mk: 57,
    specific_heat_j_gk: 0.23,
    melting_point_c: 221,
    glass_transition_c: null,
    max_service_temp_c: 130,
    thermal_expansion_ppm_k: 22,
    electrical_resistivity_ohm_m: 1.2e-7,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 40,
    tags: ["lead-free", "plumbing", "electronics", "rohs", "solder"],
    data_source: "MatWeb"
  }),
  metal({
    id: "nibr2",
    name: "Nickel Braze BNi-2",
    category: "Solder",
    subcategory: "Nickel Braze Alloy",
    density_g_cm3: 7.7,
    tensile_strength_mpa: 620,
    yield_strength_mpa: 450,
    elastic_modulus_gpa: 165,
    hardness_vickers: 200,
    thermal_conductivity_w_mk: 14,
    specific_heat_j_gk: 0.44,
    melting_point_c: 1000,
    glass_transition_c: null,
    max_service_temp_c: 900,
    thermal_expansion_ppm_k: 13,
    electrical_resistivity_ohm_m: 1.1e-6,
    corrosion_resistance: "excellent",
    machinability: "fair",
    printability_fdm: "n/a",
    cost_usd_kg: 120,
    tags: ["aerospace-braze", "vacuum-braze", "high-temp", "solder"],
    data_source: "Wall Colmonoy datasheet"
  })
];

const structuralSteelVariants = createMetalSeries(
  {
    subcategory: "Structural / Carbon Steel",
    density_g_cm3: 7.85,
    elastic_modulus_gpa: 205,
    thermal_conductivity_w_mk: 48,
    specific_heat_j_gk: 0.49,
    melting_point_c: 1510,
    max_service_temp_c: 400,
    thermal_expansion_ppm_k: 11.8,
    electrical_resistivity_ohm_m: 1.8e-7,
    corrosion_resistance: "poor",
    machinability: "good",
    cost_usd_kg: 1.1,
    tags: ["steel", "structural", "load-bearing"],
    data_source: "ASM Handbook Vol 1 family data"
  },
  [
    { id: "steel_1018_annealed", name: "Carbon Steel 1018 Annealed", tensile_strength_mpa: 440, yield_strength_mpa: 370, hardness_vickers: 126, machinability: "excellent", cost_usd_kg: 0.95, tags: ["general-purpose", "machining"] },
    { id: "steel_1018_cold_drawn", name: "Carbon Steel 1018 Cold Drawn", tensile_strength_mpa: 490, yield_strength_mpa: 415, hardness_vickers: 145, machinability: "excellent", cost_usd_kg: 1.05, tags: ["shafts", "machining"] },
    { id: "steel_1020_hot_rolled", name: "Carbon Steel 1020 Hot Rolled", tensile_strength_mpa: 420, yield_strength_mpa: 350, hardness_vickers: 121, machinability: "excellent", cost_usd_kg: 0.9, tags: ["general-purpose", "low-cost"] },
    { id: "steel_1020_cold_drawn", name: "Carbon Steel 1020 Cold Drawn", tensile_strength_mpa: 470, yield_strength_mpa: 395, hardness_vickers: 137, machinability: "excellent", cost_usd_kg: 1, tags: ["general-purpose", "machining"] },
    { id: "steel_1045_normalized", name: "Carbon Steel 1045 Normalized", tensile_strength_mpa: 620, yield_strength_mpa: 530, hardness_vickers: 180, machinability: "good", cost_usd_kg: 1.05, tags: ["shafts", "gears"] },
    { id: "steel_1045_qt", name: "Carbon Steel 1045 Q&T", tensile_strength_mpa: 760, yield_strength_mpa: 620, hardness_vickers: 220, machinability: "good", cost_usd_kg: 1.15, tags: ["shafts", "heat-treated"] },
    { id: "steel_1050_spheroidized", name: "Carbon Steel 1050 Spheroidized", tensile_strength_mpa: 690, yield_strength_mpa: 585, hardness_vickers: 205, machinability: "good", cost_usd_kg: 1.1, tags: ["springs", "wire"] },
    { id: "steel_1075_spring", name: "Carbon Steel 1075 Spring Temper", tensile_strength_mpa: 980, yield_strength_mpa: 860, hardness_vickers: 295, machinability: "fair", cost_usd_kg: 1.25, tags: ["spring", "fatigue"] },
    { id: "steel_1095_annealed", name: "Carbon Steel 1095 Annealed", tensile_strength_mpa: 690, yield_strength_mpa: 540, hardness_vickers: 210, machinability: "fair", cost_usd_kg: 1.2, tags: ["blade", "wear"] },
    { id: "steel_1095_spring", name: "Carbon Steel 1095 Spring Temper", tensile_strength_mpa: 1120, yield_strength_mpa: 980, hardness_vickers: 340, machinability: "fair", cost_usd_kg: 1.35, tags: ["spring", "wear"] },
    { id: "steel_4130_normalized", name: "Chromoly 4130 Normalized", tensile_strength_mpa: 670, yield_strength_mpa: 435, hardness_vickers: 197, machinability: "good", cost_usd_kg: 1.6, tags: ["airframe", "tubing"] },
    { id: "steel_4130_qt", name: "Chromoly 4130 Q&T", tensile_strength_mpa: 980, yield_strength_mpa: 850, hardness_vickers: 285, machinability: "good", cost_usd_kg: 1.8, tags: ["airframe", "roll-cage"] },
    { id: "steel_4140_annealed", name: "Alloy Steel 4140 Annealed", tensile_strength_mpa: 655, yield_strength_mpa: 415, hardness_vickers: 197, machinability: "good", cost_usd_kg: 1.15, tags: ["gears", "shafts"] },
    { id: "steel_4140_qt", name: "Alloy Steel 4140 Q&T", tensile_strength_mpa: 1080, yield_strength_mpa: 930, hardness_vickers: 320, machinability: "good", cost_usd_kg: 1.3, tags: ["gears", "shafts", "fatigue"] },
    { id: "steel_4340_annealed", name: "Alloy Steel 4340 Annealed", tensile_strength_mpa: 745, yield_strength_mpa: 470, hardness_vickers: 217, machinability: "good", cost_usd_kg: 1.55, tags: ["landing-gear", "forging"] },
    { id: "steel_4340_qt", name: "Alloy Steel 4340 Q&T", tensile_strength_mpa: 1420, yield_strength_mpa: 1240, hardness_vickers: 410, machinability: "good", cost_usd_kg: 1.9, tags: ["aerospace", "high-strength"] },
    { id: "steel_8620_carburized", name: "Alloy Steel 8620 Carburized", tensile_strength_mpa: 920, yield_strength_mpa: 680, hardness_vickers: 260, machinability: "good", cost_usd_kg: 1.35, tags: ["gears", "case-hardening"] },
    { id: "steel_9310_carburized", name: "Alloy Steel 9310 Carburized", tensile_strength_mpa: 1010, yield_strength_mpa: 820, hardness_vickers: 300, machinability: "good", cost_usd_kg: 1.8, tags: ["aerospace", "gearbox"] }
  ]
);

const castIronVariants = createMetalSeries(
  {
    subcategory: "Cast Iron",
    density_g_cm3: 7.15,
    elastic_modulus_gpa: 150,
    thermal_conductivity_w_mk: 40,
    specific_heat_j_gk: 0.46,
    melting_point_c: 1200,
    max_service_temp_c: 450,
    thermal_expansion_ppm_k: 10.8,
    electrical_resistivity_ohm_m: 8e-7,
    corrosion_resistance: "fair",
    machinability: "excellent",
    cost_usd_kg: 0.95,
    tags: ["cast", "damping"],
    data_source: "ASM Handbook Vol 1 family data"
  },
  [
    { id: "grey_cast_iron_class_30", name: "Grey Cast Iron Class 30", tensile_strength_mpa: 220, yield_strength_mpa: 220, hardness_vickers: 190, machinability: "excellent", cost_usd_kg: 0.8, tags: ["engine-block", "cheap"] },
    { id: "grey_cast_iron_class_40", name: "Grey Cast Iron Class 40", tensile_strength_mpa: 275, yield_strength_mpa: 275, hardness_vickers: 215, machinability: "excellent", cost_usd_kg: 0.88, tags: ["machine-base", "damping"] },
    { id: "ductile_iron_65_45_12", name: "Ductile Iron 65-45-12", tensile_strength_mpa: 448, yield_strength_mpa: 310, hardness_vickers: 170, machinability: "good", cost_usd_kg: 1.05, tags: ["pressure-pipe", "pump"] },
    { id: "ductile_iron_80_55_06", name: "Ductile Iron 80-55-06", tensile_strength_mpa: 552, yield_strength_mpa: 379, hardness_vickers: 195, machinability: "good", cost_usd_kg: 1.12, tags: ["automotive", "gear"] },
    { id: "aductile_iron_1050", name: "Austempered Ductile Iron 1050", tensile_strength_mpa: 1050, yield_strength_mpa: 850, hardness_vickers: 320, machinability: "fair", cost_usd_kg: 1.6, tags: ["wear", "fatigue"] },
    { id: "ni_hard_1", name: "Ni-Hard 1 White Cast Iron", tensile_strength_mpa: 350, yield_strength_mpa: 350, hardness_vickers: 520, machinability: "poor", cost_usd_kg: 1.7, tags: ["abrasion", "mining"] },
    { id: "malleable_iron_blackheart", name: "Blackheart Malleable Iron", tensile_strength_mpa: 370, yield_strength_mpa: 250, hardness_vickers: 145, machinability: "good", cost_usd_kg: 1.05, tags: ["fittings", "automotive"] },
    { id: "compacted_graphite_iron", name: "Compacted Graphite Iron", tensile_strength_mpa: 420, yield_strength_mpa: 300, hardness_vickers: 185, machinability: "good", cost_usd_kg: 1.15, tags: ["diesel", "engine-block"] }
  ]
);

const stainlessVariants = createMetalSeries(
  {
    subcategory: "Stainless Steel",
    density_g_cm3: 7.9,
    elastic_modulus_gpa: 195,
    thermal_conductivity_w_mk: 18,
    specific_heat_j_gk: 0.5,
    melting_point_c: 1400,
    max_service_temp_c: 850,
    thermal_expansion_ppm_k: 15,
    electrical_resistivity_ohm_m: 7.5e-7,
    corrosion_resistance: "good",
    machinability: "good",
    cost_usd_kg: 4.2,
    tags: ["stainless", "corrosion-resistant"],
    data_source: "ASM Handbook Vol 1 family data"
  },
  [
    { id: "ss_303", name: "Stainless Steel 303", tensile_strength_mpa: 620, yield_strength_mpa: 240, hardness_vickers: 180, thermal_conductivity_w_mk: 16.3, machinability: "excellent", cost_usd_kg: 4.1, tags: ["machining"] },
    { id: "ss_304l", name: "Stainless Steel 304L", tensile_strength_mpa: 485, yield_strength_mpa: 170, hardness_vickers: 180, corrosion_resistance: "good", cost_usd_kg: 3.2, tags: ["welded", "cryogenic"] },
    { id: "ss_316", name: "Stainless Steel 316", tensile_strength_mpa: 580, yield_strength_mpa: 290, hardness_vickers: 215, corrosion_resistance: "excellent", cost_usd_kg: 4.6, tags: ["marine", "chemical"] },
    { id: "ss_316l_plate", name: "Stainless Steel 316L Plate", tensile_strength_mpa: 520, yield_strength_mpa: 210, hardness_vickers: 217, corrosion_resistance: "excellent", cost_usd_kg: 4.2, tags: ["marine", "cryogenic", "medical"] },
    { id: "ss_321", name: "Stainless Steel 321", tensile_strength_mpa: 515, yield_strength_mpa: 205, hardness_vickers: 200, max_service_temp_c: 900, cost_usd_kg: 4.5, tags: ["stabilized", "aerospace"] },
    { id: "ss_347", name: "Stainless Steel 347", tensile_strength_mpa: 515, yield_strength_mpa: 205, hardness_vickers: 200, max_service_temp_c: 900, cost_usd_kg: 4.8, tags: ["stabilized", "welded"] },
    { id: "ss_410", name: "Stainless Steel 410", tensile_strength_mpa: 480, yield_strength_mpa: 275, hardness_vickers: 185, thermal_conductivity_w_mk: 24.9, corrosion_resistance: "fair", cost_usd_kg: 3.3, tags: ["martensitic"] },
    { id: "ss_416", name: "Stainless Steel 416", tensile_strength_mpa: 520, yield_strength_mpa: 275, hardness_vickers: 195, thermal_conductivity_w_mk: 24.9, corrosion_resistance: "fair", machinability: "excellent", cost_usd_kg: 3.5, tags: ["free-machining"] },
    { id: "ss_420", name: "Stainless Steel 420 Hardened", tensile_strength_mpa: 760, yield_strength_mpa: 520, hardness_vickers: 250, corrosion_resistance: "fair", machinability: "good", cost_usd_kg: 3.8, tags: ["cutlery", "wear"] },
    { id: "ss_431", name: "Stainless Steel 431", tensile_strength_mpa: 860, yield_strength_mpa: 655, hardness_vickers: 270, corrosion_resistance: "good", cost_usd_kg: 4.2, tags: ["shafts", "marine"] },
    { id: "ss_440c", name: "Stainless Steel 440C", tensile_strength_mpa: 760, yield_strength_mpa: 450, hardness_vickers: 600, corrosion_resistance: "fair", machinability: "fair", cost_usd_kg: 5.2, tags: ["bearings", "wear"] },
    { id: "duplex_2507", name: "Super Duplex 2507", tensile_strength_mpa: 795, yield_strength_mpa: 550, hardness_vickers: 305, corrosion_resistance: "excellent", cost_usd_kg: 7.2, tags: ["offshore", "seawater"] },
    { id: "alloy_904l", name: "Stainless Steel 904L", tensile_strength_mpa: 490, yield_strength_mpa: 220, hardness_vickers: 175, corrosion_resistance: "excellent", cost_usd_kg: 6.2, tags: ["acid", "chemical"] },
    { id: "alloy_254smo", name: "6Mo Stainless 254SMO", tensile_strength_mpa: 680, yield_strength_mpa: 300, hardness_vickers: 205, corrosion_resistance: "excellent", cost_usd_kg: 8.5, tags: ["seawater", "chloride"] },
    { id: "ss_15_5ph", name: "Stainless Steel 15-5 PH", tensile_strength_mpa: 1310, yield_strength_mpa: 1170, hardness_vickers: 385, corrosion_resistance: "good", cost_usd_kg: 7.2, tags: ["aerospace", "high-strength"] }
  ]
);

const toolSteelVariants = createMetalSeries(
  {
    subcategory: "Tool / Die Steel",
    density_g_cm3: 7.78,
    elastic_modulus_gpa: 210,
    thermal_conductivity_w_mk: 28,
    specific_heat_j_gk: 0.46,
    melting_point_c: 1420,
    max_service_temp_c: 500,
    thermal_expansion_ppm_k: 11.2,
    electrical_resistivity_ohm_m: 7e-7,
    corrosion_resistance: "poor",
    machinability: "fair",
    cost_usd_kg: 4.5,
    tags: ["tool-steel", "wear"],
    data_source: "ASM Handbook Vol 1 family data"
  },
  [
    { id: "tool_a2", name: "Tool Steel A2", tensile_strength_mpa: 950, yield_strength_mpa: 760, hardness_vickers: 620, machinability: "fair", cost_usd_kg: 4.2, tags: ["cold-work", "die"] },
    { id: "tool_d2", name: "Tool Steel D2", tensile_strength_mpa: 980, yield_strength_mpa: 790, hardness_vickers: 760, machinability: "fair", cost_usd_kg: 5.4, tags: ["wear", "cold-work"] },
    { id: "tool_h13", name: "Tool Steel H13", tensile_strength_mpa: 1380, yield_strength_mpa: 1200, hardness_vickers: 540, machinability: "good", max_service_temp_c: 600, cost_usd_kg: 5, tags: ["hot-work", "die-casting"] },
    { id: "tool_m2", name: "High Speed Steel M2", tensile_strength_mpa: 1500, yield_strength_mpa: 1350, hardness_vickers: 820, machinability: "poor", cost_usd_kg: 8, tags: ["cutting-tool"] },
    { id: "tool_o1", name: "Tool Steel O1", tensile_strength_mpa: 880, yield_strength_mpa: 720, hardness_vickers: 650, machinability: "good", cost_usd_kg: 4.5, tags: ["oil-hardening"] },
    { id: "tool_p20", name: "Tool Steel P20", tensile_strength_mpa: 1030, yield_strength_mpa: 900, hardness_vickers: 330, machinability: "good", cost_usd_kg: 4.2, tags: ["mold", "pre-hardened"] },
    { id: "tool_s7", name: "Tool Steel S7", tensile_strength_mpa: 1600, yield_strength_mpa: 1420, hardness_vickers: 620, machinability: "fair", cost_usd_kg: 5.6, tags: ["shock-resistant"] },
    { id: "tool_l6", name: "Tool Steel L6", tensile_strength_mpa: 1160, yield_strength_mpa: 980, hardness_vickers: 420, machinability: "good", cost_usd_kg: 4.8, tags: ["saw-blade"] }
  ]
);

const aluminumVariants = createMetalSeries(
  {
    subcategory: "Aluminum Alloy",
    density_g_cm3: 2.75,
    elastic_modulus_gpa: 70,
    thermal_conductivity_w_mk: 155,
    specific_heat_j_gk: 0.9,
    melting_point_c: 640,
    max_service_temp_c: 140,
    thermal_expansion_ppm_k: 23.4,
    electrical_resistivity_ohm_m: 4.5e-8,
    corrosion_resistance: "good",
    machinability: "excellent",
    cost_usd_kg: 3.2,
    tags: ["aluminum", "lightweight"],
    data_source: "ASM Handbook Vol 2 family data"
  },
  [
    { id: "al_1100_h14", name: "Aluminum 1100-H14", tensile_strength_mpa: 110, yield_strength_mpa: 95, hardness_vickers: 28, thermal_conductivity_w_mk: 220, cost_usd_kg: 2.1, corrosion_resistance: "excellent", tags: ["electrical", "sheet"] },
    { id: "al_2014_t6", name: "Aluminum 2014-T6", tensile_strength_mpa: 483, yield_strength_mpa: 414, hardness_vickers: 135, cost_usd_kg: 4.6, corrosion_resistance: "fair", tags: ["aerospace", "forging"] },
    { id: "al_2017_t4", name: "Aluminum 2017-T4", tensile_strength_mpa: 425, yield_strength_mpa: 275, hardness_vickers: 115, cost_usd_kg: 4.4, corrosion_resistance: "fair", tags: ["fasteners"] },
    { id: "al_2024_t3", name: "Aluminum 2024-T3", tensile_strength_mpa: 470, yield_strength_mpa: 325, hardness_vickers: 120, cost_usd_kg: 4.8, corrosion_resistance: "fair", tags: ["airframe", "fatigue"] },
    { id: "al_2024_t351", name: "Aluminum 2024-T351", tensile_strength_mpa: 483, yield_strength_mpa: 345, hardness_vickers: 135, cost_usd_kg: 5, corrosion_resistance: "fair", tags: ["plate", "aerospace"] },
    { id: "al_2219_t62", name: "Aluminum 2219-T62", tensile_strength_mpa: 420, yield_strength_mpa: 290, hardness_vickers: 118, thermal_conductivity_w_mk: 125, cost_usd_kg: 5.2, corrosion_resistance: "fair", tags: ["cryogenic", "tankage"] },
    { id: "al_2618_t61", name: "Aluminum 2618-T61", tensile_strength_mpa: 440, yield_strength_mpa: 345, hardness_vickers: 132, max_service_temp_c: 200, cost_usd_kg: 5.8, corrosion_resistance: "fair", tags: ["piston", "high-temp"] },
    { id: "al_3003_h14", name: "Aluminum 3003-H14", tensile_strength_mpa: 145, yield_strength_mpa: 115, hardness_vickers: 42, thermal_conductivity_w_mk: 170, cost_usd_kg: 2.2, corrosion_resistance: "excellent", tags: ["cookware", "heat-exchanger"] },
    { id: "al_5052_h32", name: "Aluminum 5052-H32", tensile_strength_mpa: 228, yield_strength_mpa: 193, hardness_vickers: 60, thermal_conductivity_w_mk: 138, cost_usd_kg: 2.8, corrosion_resistance: "excellent", tags: ["marine", "sheet"] },
    { id: "al_5086_h116", name: "Aluminum 5086-H116", tensile_strength_mpa: 317, yield_strength_mpa: 228, hardness_vickers: 80, thermal_conductivity_w_mk: 117, cost_usd_kg: 3.1, corrosion_resistance: "excellent", tags: ["marine", "cryogenic"] },
    { id: "al_5454_h32", name: "Aluminum 5454-H32", tensile_strength_mpa: 255, yield_strength_mpa: 180, hardness_vickers: 68, thermal_conductivity_w_mk: 134, cost_usd_kg: 3, corrosion_resistance: "excellent", tags: ["pressure-vessel", "elevated-temp"] },
    { id: "al_5754_h22", name: "Aluminum 5754-H22", tensile_strength_mpa: 220, yield_strength_mpa: 115, hardness_vickers: 65, thermal_conductivity_w_mk: 140, cost_usd_kg: 2.9, corrosion_resistance: "excellent", tags: ["automotive", "sheet"] },
    { id: "al_6060_t66", name: "Aluminum 6060-T66", tensile_strength_mpa: 245, yield_strength_mpa: 200, hardness_vickers: 75, thermal_conductivity_w_mk: 200, cost_usd_kg: 2.7, tags: ["extrusion", "architectural"] },
    { id: "al_6061_o", name: "Aluminum 6061-O", tensile_strength_mpa: 124, yield_strength_mpa: 55, hardness_vickers: 30, thermal_conductivity_w_mk: 167, cost_usd_kg: 2.3, corrosion_resistance: "good", tags: ["formed", "weldable"] },
    { id: "al_6061_t651", name: "Aluminum 6061-T651", tensile_strength_mpa: 310, yield_strength_mpa: 276, hardness_vickers: 107, thermal_conductivity_w_mk: 167, cost_usd_kg: 2.6, tags: ["general-purpose", "machining"] },
    { id: "al_6063_t52", name: "Aluminum 6063-T52", tensile_strength_mpa: 186, yield_strength_mpa: 145, hardness_vickers: 60, thermal_conductivity_w_mk: 200, cost_usd_kg: 2.5, corrosion_resistance: "excellent", tags: ["extrusion", "architectural"] },
    { id: "al_6082_t6", name: "Aluminum 6082-T6", tensile_strength_mpa: 340, yield_strength_mpa: 290, hardness_vickers: 95, thermal_conductivity_w_mk: 180, cost_usd_kg: 3.2, tags: ["structural", "europe"] },
    { id: "al_7050_t7451", name: "Aluminum 7050-T7451", tensile_strength_mpa: 524, yield_strength_mpa: 455, hardness_vickers: 155, cost_usd_kg: 6.5, corrosion_resistance: "good", tags: ["aerospace", "plate"] },
    { id: "al_7075_o", name: "Aluminum 7075-O", tensile_strength_mpa: 228, yield_strength_mpa: 145, hardness_vickers: 60, thermal_conductivity_w_mk: 130, cost_usd_kg: 3.1, corrosion_resistance: "fair", tags: ["formed"] },
    { id: "al_7075_t73", name: "Aluminum 7075-T73", tensile_strength_mpa: 505, yield_strength_mpa: 435, hardness_vickers: 150, thermal_conductivity_w_mk: 130, cost_usd_kg: 3.8, corrosion_resistance: "good", tags: ["aerospace", "stress-corrosion"] },
    { id: "al_7475_t761", name: "Aluminum 7475-T761", tensile_strength_mpa: 524, yield_strength_mpa: 455, hardness_vickers: 150, cost_usd_kg: 7.2, corrosion_resistance: "good", tags: ["aerospace", "fracture-toughness"] },
    { id: "al_a356_t6", name: "Cast Aluminum A356-T6", tensile_strength_mpa: 310, yield_strength_mpa: 230, hardness_vickers: 90, thermal_conductivity_w_mk: 151, cost_usd_kg: 3.4, corrosion_resistance: "good", tags: ["cast", "wheel"] },
    { id: "al_a357_t6", name: "Cast Aluminum A357-T6", tensile_strength_mpa: 345, yield_strength_mpa: 255, hardness_vickers: 95, thermal_conductivity_w_mk: 150, cost_usd_kg: 3.8, corrosion_resistance: "good", tags: ["cast", "aerospace"] },
    { id: "al_319_t7", name: "Cast Aluminum 319-T7", tensile_strength_mpa: 260, yield_strength_mpa: 180, hardness_vickers: 85, thermal_conductivity_w_mk: 120, cost_usd_kg: 2.8, corrosion_resistance: "fair", tags: ["automotive", "engine"] },
    { id: "al_380_diecast", name: "Die Cast Aluminum 380", tensile_strength_mpa: 324, yield_strength_mpa: 160, hardness_vickers: 80, thermal_conductivity_w_mk: 96, cost_usd_kg: 2.6, corrosion_resistance: "fair", tags: ["die-cast", "housing"] },
    { id: "alsi10mg_am", name: "AlSi10Mg (AM)", tensile_strength_mpa: 450, yield_strength_mpa: 250, hardness_vickers: 135, thermal_conductivity_w_mk: 120, cost_usd_kg: 8.5, corrosion_resistance: "good", tags: ["am-powder", "3d-print-metal"] },
    { id: "alsi12_cast", name: "AlSi12 Cast Aluminum", tensile_strength_mpa: 220, yield_strength_mpa: 130, hardness_vickers: 70, thermal_conductivity_w_mk: 155, cost_usd_kg: 2.7, corrosion_resistance: "good", tags: ["casting", "automotive"] }
  ]
);

const copperVariants = createMetalSeries(
  {
    subcategory: "Copper Alloy",
    density_g_cm3: 8.75,
    elastic_modulus_gpa: 120,
    thermal_conductivity_w_mk: 150,
    specific_heat_j_gk: 0.39,
    melting_point_c: 1080,
    max_service_temp_c: 250,
    thermal_expansion_ppm_k: 17.5,
    electrical_resistivity_ohm_m: 8e-8,
    corrosion_resistance: "good",
    machinability: "good",
    cost_usd_kg: 9,
    tags: ["copper-alloy", "conductive"],
    data_source: "Copper Development Association family data"
  },
  [
    { id: "cu_c101", name: "OFE Copper C10100", tensile_strength_mpa: 220, yield_strength_mpa: 70, hardness_vickers: 45, thermal_conductivity_w_mk: 391, electrical_resistivity_ohm_m: 1.68e-8, cost_usd_kg: 9.5, machinability: "good", tags: ["electrical", "vacuum"] },
    { id: "cu_c102", name: "OF Copper C10200", tensile_strength_mpa: 205, yield_strength_mpa: 60, hardness_vickers: 42, thermal_conductivity_w_mk: 385, electrical_resistivity_ohm_m: 1.72e-8, cost_usd_kg: 8.8, tags: ["electrical", "cryogenic"] },
    { id: "cu_c145", name: "Tellurium Copper C14500", tensile_strength_mpa: 360, yield_strength_mpa: 310, hardness_vickers: 95, thermal_conductivity_w_mk: 290, electrical_resistivity_ohm_m: 2.2e-8, machinability: "excellent", cost_usd_kg: 11, tags: ["machining", "electrode"] },
    { id: "cu_be_c17510", name: "Copper Alloy C17510", tensile_strength_mpa: 1080, yield_strength_mpa: 930, hardness_vickers: 320, thermal_conductivity_w_mk: 180, electrical_resistivity_ohm_m: 3.8e-8, machinability: "good", cost_usd_kg: 120, tags: ["electrode", "spring"] },
    { id: "cucrzr", name: "CuCrZr", tensile_strength_mpa: 490, yield_strength_mpa: 360, hardness_vickers: 150, thermal_conductivity_w_mk: 320, electrical_resistivity_ohm_m: 2.2e-8, machinability: "good", cost_usd_kg: 18, tags: ["electrode", "high-heat"] },
    { id: "cunisil", name: "CuNiSi", tensile_strength_mpa: 780, yield_strength_mpa: 690, hardness_vickers: 220, thermal_conductivity_w_mk: 180, electrical_resistivity_ohm_m: 4.5e-8, machinability: "good", cost_usd_kg: 16, tags: ["connector", "spring"] },
    { id: "cupronickel_7030", name: "Cupronickel 70/30", tensile_strength_mpa: 380, yield_strength_mpa: 150, hardness_vickers: 95, thermal_conductivity_w_mk: 30, electrical_resistivity_ohm_m: 3.4e-7, corrosion_resistance: "excellent", cost_usd_kg: 14, tags: ["marine", "seawater"] },
    { id: "brass_c260", name: "Cartridge Brass C260", tensile_strength_mpa: 315, yield_strength_mpa: 95, hardness_vickers: 85, thermal_conductivity_w_mk: 120, electrical_resistivity_ohm_m: 6.5e-8, machinability: "good", cost_usd_kg: 6.5, tags: ["sheet", "deep-draw"] },
    { id: "brass_c464", name: "Naval Brass C464", tensile_strength_mpa: 455, yield_strength_mpa: 175, hardness_vickers: 115, thermal_conductivity_w_mk: 111, electrical_resistivity_ohm_m: 6.3e-8, corrosion_resistance: "excellent", cost_usd_kg: 7.5, tags: ["marine", "fittings"] },
    { id: "bronze_c521", name: "Phosphor Bronze C521", tensile_strength_mpa: 520, yield_strength_mpa: 420, hardness_vickers: 155, thermal_conductivity_w_mk: 75, electrical_resistivity_ohm_m: 8.8e-8, cost_usd_kg: 12, tags: ["spring", "connector"] },
    { id: "silicon_bronze_c655", name: "Silicon Bronze C655", tensile_strength_mpa: 520, yield_strength_mpa: 255, hardness_vickers: 145, thermal_conductivity_w_mk: 52, electrical_resistivity_ohm_m: 1.1e-7, corrosion_resistance: "excellent", cost_usd_kg: 10, tags: ["marine", "fastener"] },
    { id: "al_bronze_c954", name: "Aluminum Bronze C954", tensile_strength_mpa: 655, yield_strength_mpa: 260, hardness_vickers: 170, thermal_conductivity_w_mk: 46, electrical_resistivity_ohm_m: 1.3e-7, corrosion_resistance: "excellent", cost_usd_kg: 11, tags: ["bearing", "marine"] },
    { id: "ni_al_bronze_c630", name: "Nickel Aluminum Bronze C630", tensile_strength_mpa: 760, yield_strength_mpa: 455, hardness_vickers: 200, thermal_conductivity_w_mk: 41, electrical_resistivity_ohm_m: 1.15e-7, corrosion_resistance: "excellent", cost_usd_kg: 15, tags: ["marine", "propeller"] },
    { id: "copper_tungsten_7525", name: "Copper Tungsten 75/25", tensile_strength_mpa: 700, yield_strength_mpa: 650, hardness_vickers: 230, density_g_cm3: 14.5, elastic_modulus_gpa: 180, thermal_conductivity_w_mk: 220, electrical_resistivity_ohm_m: 3.2e-8, machinability: "fair", cost_usd_kg: 90, tags: ["electrode", "probe-tip", "arc-contact"] }
  ]
);

const nickelAndCobaltVariants = createMetalSeries(
  {
    subcategory: "Nickel / Cobalt Alloy",
    density_g_cm3: 8.5,
    elastic_modulus_gpa: 210,
    thermal_conductivity_w_mk: 12,
    specific_heat_j_gk: 0.43,
    melting_point_c: 1350,
    max_service_temp_c: 900,
    thermal_expansion_ppm_k: 13,
    electrical_resistivity_ohm_m: 1.2e-6,
    corrosion_resistance: "excellent",
    machinability: "poor",
    cost_usd_kg: 45,
    tags: ["superalloy", "high-temp"],
    data_source: "Manufacturer datasheet family data"
  },
  [
    { id: "inconel_600", name: "Inconel 600", tensile_strength_mpa: 655, yield_strength_mpa: 310, hardness_vickers: 190, max_service_temp_c: 980, cost_usd_kg: 32, tags: ["oxidation", "chemical"] },
    { id: "inconel_601", name: "Inconel 601", tensile_strength_mpa: 650, yield_strength_mpa: 300, hardness_vickers: 185, max_service_temp_c: 1100, cost_usd_kg: 36, tags: ["oxidation", "furnace"] },
    { id: "inconel_617", name: "Inconel 617", tensile_strength_mpa: 760, yield_strength_mpa: 330, hardness_vickers: 210, max_service_temp_c: 1090, cost_usd_kg: 70, tags: ["combustor", "high-temp"] },
    { id: "inconel_686", name: "Inconel 686", tensile_strength_mpa: 860, yield_strength_mpa: 520, hardness_vickers: 250, cost_usd_kg: 82, tags: ["acid", "wet-corrosion"] },
    { id: "inconel_x750", name: "Inconel X-750", tensile_strength_mpa: 1240, yield_strength_mpa: 860, hardness_vickers: 360, max_service_temp_c: 700, cost_usd_kg: 48, tags: ["spring", "aerospace"] },
    { id: "incoloy_800h", name: "Incoloy 800H", tensile_strength_mpa: 600, yield_strength_mpa: 235, hardness_vickers: 170, max_service_temp_c: 900, cost_usd_kg: 28, tags: ["petrochemical", "creep"] },
    { id: "incoloy_825", name: "Incoloy 825", tensile_strength_mpa: 585, yield_strength_mpa: 240, hardness_vickers: 165, cost_usd_kg: 35, tags: ["acid", "wet-corrosion"] },
    { id: "alloy_20", name: "Alloy 20", tensile_strength_mpa: 620, yield_strength_mpa: 275, hardness_vickers: 180, cost_usd_kg: 24, tags: ["sulfuric-acid", "pump"] },
    { id: "hastelloy_c22", name: "Hastelloy C-22", tensile_strength_mpa: 690, yield_strength_mpa: 310, hardness_vickers: 210, cost_usd_kg: 58, tags: ["acid", "chloride"] },
    { id: "hastelloy_x", name: "Hastelloy X", tensile_strength_mpa: 760, yield_strength_mpa: 345, hardness_vickers: 210, max_service_temp_c: 1100, cost_usd_kg: 64, tags: ["combustor", "oxidation"] },
    { id: "nimonic_80a", name: "Nimonic 80A", tensile_strength_mpa: 1240, yield_strength_mpa: 760, hardness_vickers: 355, max_service_temp_c: 815, cost_usd_kg: 72, tags: ["turbine", "aerospace"] },
    { id: "nimonic_90", name: "Nimonic 90", tensile_strength_mpa: 1320, yield_strength_mpa: 910, hardness_vickers: 385, max_service_temp_c: 920, cost_usd_kg: 78, tags: ["turbine", "aerospace"] },
    { id: "monel_k500", name: "Monel K-500", tensile_strength_mpa: 965, yield_strength_mpa: 690, hardness_vickers: 265, thermal_conductivity_w_mk: 16, electrical_resistivity_ohm_m: 6.2e-7, cost_usd_kg: 38, tags: ["marine", "shafts"] },
    { id: "stellite_6", name: "Stellite 6", tensile_strength_mpa: 960, yield_strength_mpa: 650, hardness_vickers: 520, density_g_cm3: 8.44, thermal_conductivity_w_mk: 14, electrical_resistivity_ohm_m: 8e-7, machinability: "poor", cost_usd_kg: 85, tags: ["wear", "valve"] },
    { id: "cocrmo_f75", name: "CoCrMo ASTM F75", tensile_strength_mpa: 930, yield_strength_mpa: 610, hardness_vickers: 340, density_g_cm3: 8.3, thermal_conductivity_w_mk: 14, electrical_resistivity_ohm_m: 8.5e-7, corrosion_resistance: "excellent", machinability: "fair", cost_usd_kg: 42, tags: ["biomedical", "implant"] }
  ]
);

const titaniumVariants = createMetalSeries(
  {
    subcategory: "Titanium Alloy",
    density_g_cm3: 4.5,
    elastic_modulus_gpa: 110,
    thermal_conductivity_w_mk: 7,
    specific_heat_j_gk: 0.53,
    melting_point_c: 1660,
    max_service_temp_c: 320,
    thermal_expansion_ppm_k: 8.7,
    electrical_resistivity_ohm_m: 1.6e-6,
    corrosion_resistance: "excellent",
    machinability: "fair",
    cost_usd_kg: 40,
    tags: ["titanium", "lightweight"],
    data_source: "TIMET and ASTM family data"
  },
  [
    { id: "ti_grade1", name: "Titanium Grade 1", tensile_strength_mpa: 240, yield_strength_mpa: 170, hardness_vickers: 120, thermal_conductivity_w_mk: 21, electrical_resistivity_ohm_m: 5.5e-7, cost_usd_kg: 22, tags: ["chemical", "corrosion"] },
    { id: "ti_grade2", name: "Titanium Grade 2", tensile_strength_mpa: 345, yield_strength_mpa: 275, hardness_vickers: 145, thermal_conductivity_w_mk: 17, electrical_resistivity_ohm_m: 5.7e-7, cost_usd_kg: 24, tags: ["chemical", "marine"] },
    { id: "ti_grade3", name: "Titanium Grade 3", tensile_strength_mpa: 450, yield_strength_mpa: 380, hardness_vickers: 180, thermal_conductivity_w_mk: 16.3, electrical_resistivity_ohm_m: 5.8e-7, cost_usd_kg: 26, tags: ["pressure-vessel"] },
    { id: "ti_grade4", name: "Titanium Grade 4", tensile_strength_mpa: 550, yield_strength_mpa: 480, hardness_vickers: 200, thermal_conductivity_w_mk: 16.4, electrical_resistivity_ohm_m: 5.8e-7, cost_usd_kg: 28, tags: ["implant", "chemical", "biomedical"] },
    { id: "ti_6al_4v_eli", name: "Ti-6Al-4V ELI", tensile_strength_mpa: 895, yield_strength_mpa: 825, hardness_vickers: 330, cost_usd_kg: 38, tags: ["biomedical", "implant"] },
    { id: "ti_6242", name: "Ti-6Al-2Sn-4Zr-2Mo", tensile_strength_mpa: 930, yield_strength_mpa: 860, hardness_vickers: 345, max_service_temp_c: 500, cost_usd_kg: 58, tags: ["compressor", "aerospace", "high-temp"] },
    { id: "ti_6246", name: "Ti-6Al-2Sn-4Zr-6Mo", tensile_strength_mpa: 1170, yield_strength_mpa: 1030, hardness_vickers: 365, max_service_temp_c: 400, cost_usd_kg: 62, tags: ["landing-gear", "aerospace"] },
    { id: "ti_3al_2_5v", name: "Ti-3Al-2.5V", tensile_strength_mpa: 620, yield_strength_mpa: 483, hardness_vickers: 215, cost_usd_kg: 32, tags: ["tubing", "aerospace"] },
    { id: "ti_10_2_3", name: "Ti-10V-2Fe-3Al", tensile_strength_mpa: 1170, yield_strength_mpa: 1100, hardness_vickers: 350, cost_usd_kg: 68, tags: ["landing-gear", "aerospace"] },
    { id: "ti_5553", name: "Ti-5Al-5V-5Mo-3Cr", tensile_strength_mpa: 1250, yield_strength_mpa: 1180, hardness_vickers: 360, cost_usd_kg: 72, tags: ["aerospace", "forging"] },
    { id: "ti_15_3_3_3", name: "Ti-15-3-3-3 Beta Titanium", tensile_strength_mpa: 1080, yield_strength_mpa: 980, hardness_vickers: 320, cost_usd_kg: 70, tags: ["spring", "aerospace"] },
    { id: "ti_6al_7nb", name: "Ti-6Al-7Nb", tensile_strength_mpa: 900, yield_strength_mpa: 820, hardness_vickers: 325, cost_usd_kg: 40, tags: ["biomedical", "implant"] },
    { id: "nitinol", name: "Nitinol (NiTi)", tensile_strength_mpa: 895, yield_strength_mpa: 690, hardness_vickers: 240, density_g_cm3: 6.45, elastic_modulus_gpa: 75, thermal_conductivity_w_mk: 18, electrical_resistivity_ohm_m: 8e-7, cost_usd_kg: 160, tags: ["shape-memory", "biomedical"] }
  ]
);

const magnesiumVariants = createMetalSeries(
  {
    subcategory: "Magnesium Alloy",
    density_g_cm3: 1.8,
    elastic_modulus_gpa: 45,
    thermal_conductivity_w_mk: 72,
    specific_heat_j_gk: 1.0,
    melting_point_c: 595,
    max_service_temp_c: 120,
    thermal_expansion_ppm_k: 26,
    electrical_resistivity_ohm_m: 9.5e-8,
    corrosion_resistance: "poor",
    machinability: "excellent",
    cost_usd_kg: 5.5,
    tags: ["magnesium", "lightweight"],
    data_source: "ASM Handbook Vol 2 family data"
  },
  [
    { id: "mg_az31b_sheet", name: "Magnesium AZ31B Sheet", tensile_strength_mpa: 260, yield_strength_mpa: 200, hardness_vickers: 65, cost_usd_kg: 4.8, tags: ["sheet", "drone"] },
    { id: "mg_az61a", name: "Magnesium AZ61A", tensile_strength_mpa: 320, yield_strength_mpa: 250, hardness_vickers: 78, cost_usd_kg: 5.2, tags: ["forging"] },
    { id: "mg_az80a", name: "Magnesium AZ80A", tensile_strength_mpa: 380, yield_strength_mpa: 260, hardness_vickers: 88, cost_usd_kg: 5.6, tags: ["forging", "strength"] },
    { id: "mg_we43", name: "Magnesium WE43", tensile_strength_mpa: 330, yield_strength_mpa: 240, hardness_vickers: 92, max_service_temp_c: 250, corrosion_resistance: "fair", cost_usd_kg: 18, tags: ["aerospace", "high-temp"] },
    { id: "mg_zk60a", name: "Magnesium ZK60A", tensile_strength_mpa: 320, yield_strength_mpa: 260, hardness_vickers: 85, cost_usd_kg: 6.5, tags: ["forging", "bike"] },
    { id: "mg_ae42", name: "Magnesium AE42", tensile_strength_mpa: 250, yield_strength_mpa: 160, hardness_vickers: 70, max_service_temp_c: 150, cost_usd_kg: 7.5, tags: ["automotive", "creep"] },
    { id: "mg_am60", name: "Magnesium AM60", tensile_strength_mpa: 230, yield_strength_mpa: 150, hardness_vickers: 63, cost_usd_kg: 4.2, tags: ["die-cast", "automotive"] },
    { id: "mg_qe22", name: "Magnesium QE22", tensile_strength_mpa: 280, yield_strength_mpa: 180, hardness_vickers: 76, max_service_temp_c: 200, cost_usd_kg: 14, tags: ["aerospace", "high-temp"] }
  ]
);

const lowMeltingMetalVariants = createMetalSeries(
  {
    subcategory: "Zinc / Low-Melting Alloy",
    density_g_cm3: 7,
    elastic_modulus_gpa: 90,
    thermal_conductivity_w_mk: 100,
    specific_heat_j_gk: 0.28,
    melting_point_c: 420,
    max_service_temp_c: 120,
    thermal_expansion_ppm_k: 23,
    electrical_resistivity_ohm_m: 8e-8,
    corrosion_resistance: "good",
    machinability: "good",
    cost_usd_kg: 3.5,
    tags: ["die-cast"],
    data_source: "MatWeb and manufacturer family data"
  },
  [
    { id: "zamak_2", name: "Zamak 2", tensile_strength_mpa: 359, yield_strength_mpa: 281, hardness_vickers: 100, density_g_cm3: 6.7, cost_usd_kg: 3.2, tags: ["die-cast", "hardware"] },
    { id: "zamak_3", name: "Zamak 3", tensile_strength_mpa: 283, yield_strength_mpa: 221, hardness_vickers: 82, density_g_cm3: 6.6, cost_usd_kg: 2.8, tags: ["die-cast", "consumer"] },
    { id: "zamak_5", name: "Zamak 5", tensile_strength_mpa: 328, yield_strength_mpa: 269, hardness_vickers: 91, density_g_cm3: 6.6, cost_usd_kg: 3.1, tags: ["die-cast", "hardware"] },
    { id: "zamak_7", name: "Zamak 7", tensile_strength_mpa: 280, yield_strength_mpa: 214, hardness_vickers: 80, density_g_cm3: 6.6, cost_usd_kg: 3.2, tags: ["die-cast", "surface-finish"] },
    { id: "lead_antimony_6", name: "Lead-Antimony 6%", tensile_strength_mpa: 27, yield_strength_mpa: 17, hardness_vickers: 12, density_g_cm3: 10.95, elastic_modulus_gpa: 16, thermal_conductivity_w_mk: 35, melting_point_c: 300, max_service_temp_c: 120, thermal_expansion_ppm_k: 29, electrical_resistivity_ohm_m: 2.2e-7, machinability: "good", cost_usd_kg: 2.5, tags: ["battery", "radiation"] },
    { id: "pure_indium", name: "Pure Indium", tensile_strength_mpa: 9, yield_strength_mpa: 5, hardness_vickers: 4, density_g_cm3: 7.31, elastic_modulus_gpa: 11, thermal_conductivity_w_mk: 82, melting_point_c: 157, max_service_temp_c: 90, thermal_expansion_ppm_k: 32, electrical_resistivity_ohm_m: 8.4e-8, machinability: "excellent", cost_usd_kg: 160, tags: ["seal", "cryogenic"] },
    { id: "pure_bismuth", name: "Pure Bismuth", tensile_strength_mpa: 20, yield_strength_mpa: 14, hardness_vickers: 18, density_g_cm3: 9.8, elastic_modulus_gpa: 32, thermal_conductivity_w_mk: 8, melting_point_c: 271, max_service_temp_c: 120, thermal_expansion_ppm_k: 13, electrical_resistivity_ohm_m: 1.2e-6, machinability: "good", cost_usd_kg: 5.5, tags: ["fusible", "radiation"] }
  ]
);

const polymerVariants = [
  ...createPolymerSeries(
    {
      subcategory: "Thermoplastic",
      density_g_cm3: 1.24,
      tensile_strength_mpa: 52,
      elastic_modulus_gpa: 2.1,
      thermal_conductivity_w_mk: 0.2,
      specific_heat_j_gk: 1.2,
      glass_transition_c: 60,
      max_service_temp_c: 75,
      thermal_expansion_ppm_k: 80,
      electrical_resistivity_ohm_m: 1e14,
      corrosion_resistance: "good",
      machinability: "good",
      printability_fdm: "good",
      cost_usd_kg: 2.2,
      tags: ["polymer"],
      data_source: "MatWeb family data"
    },
    [
      { id: "pla_tough", name: "PLA Tough", tensile_strength_mpa: 58, elastic_modulus_gpa: 2.8, glass_transition_c: 60, max_service_temp_c: 55, printability_fdm: "excellent", cost_usd_kg: 2.4, tags: ["3d-print", "easy-print"] },
      { id: "pla_cf", name: "PLA-CF", density_g_cm3: 1.3, tensile_strength_mpa: 70, elastic_modulus_gpa: 4.8, glass_transition_c: 60, max_service_temp_c: 60, printability_fdm: "good", cost_usd_kg: 3.6, tags: ["3d-print", "stiff"] },
      { id: "petg_filament", name: "PETG Filament", density_g_cm3: 1.27, tensile_strength_mpa: 50, elastic_modulus_gpa: 2.1, glass_transition_c: 85, max_service_temp_c: 85, printability_fdm: "excellent", cost_usd_kg: 2.7, tags: ["3d-print", "general-purpose"] },
      { id: "petg_cf", name: "PETG-CF", density_g_cm3: 1.32, tensile_strength_mpa: 62, elastic_modulus_gpa: 5.2, glass_transition_c: 85, max_service_temp_c: 90, printability_fdm: "good", cost_usd_kg: 4.2, tags: ["3d-print", "stiff"] },
      { id: "petg_gf", name: "PETG-GF", density_g_cm3: 1.34, tensile_strength_mpa: 64, elastic_modulus_gpa: 5.6, glass_transition_c: 85, max_service_temp_c: 92, printability_fdm: "good", cost_usd_kg: 3.9, tags: ["3d-print", "stiff"] },
      { id: "abs_hi", name: "ABS High Impact", density_g_cm3: 1.04, tensile_strength_mpa: 45, elastic_modulus_gpa: 2.1, glass_transition_c: 105, max_service_temp_c: 90, printability_fdm: "good", cost_usd_kg: 2.3, tags: ["3d-print", "impact"] },
      { id: "asa_uv", name: "ASA UV-Stable", density_g_cm3: 1.07, tensile_strength_mpa: 48, elastic_modulus_gpa: 2.2, glass_transition_c: 108, max_service_temp_c: 95, corrosion_resistance: "excellent", printability_fdm: "good", cost_usd_kg: 3.4, tags: ["outdoor", "3d-print"] },
      { id: "pc_natural", name: "Polycarbonate (PC)", density_g_cm3: 1.2, tensile_strength_mpa: 65, elastic_modulus_gpa: 2.4, glass_transition_c: 147, max_service_temp_c: 115, printability_fdm: "fair", cost_usd_kg: 4.8, tags: ["impact", "transparent"] },
      { id: "pc_abs_blend", name: "PC-ABS Blend", density_g_cm3: 1.12, tensile_strength_mpa: 50, elastic_modulus_gpa: 2.3, glass_transition_c: 125, max_service_temp_c: 105, printability_fdm: "fair", cost_usd_kg: 4.6, tags: ["electronics", "housing"] },
      { id: "pa11", name: "Nylon PA11", density_g_cm3: 1.04, tensile_strength_mpa: 50, elastic_modulus_gpa: 1.5, glass_transition_c: 45, max_service_temp_c: 95, printability_fdm: "good", cost_usd_kg: 8, tags: ["tough", "3d-print"] },
      { id: "pa12", name: "Nylon PA12", density_g_cm3: 1.01, tensile_strength_mpa: 48, elastic_modulus_gpa: 1.7, glass_transition_c: 50, max_service_temp_c: 100, printability_fdm: "good", cost_usd_kg: 7.5, tags: ["tough", "3d-print", "fatigue"] },
      { id: "pa12_cf", name: "Nylon PA12-CF", density_g_cm3: 1.15, tensile_strength_mpa: 76, elastic_modulus_gpa: 7.6, glass_transition_c: 50, max_service_temp_c: 110, printability_fdm: "good", cost_usd_kg: 11, tags: ["3d-print", "stiff"] },
      { id: "pa6_gf30", name: "PA6 GF30", density_g_cm3: 1.36, tensile_strength_mpa: 160, elastic_modulus_gpa: 7.5, glass_transition_c: 55, max_service_temp_c: 140, printability_fdm: "poor", cost_usd_kg: 5.5, tags: ["automotive", "structural"] },
      { id: "pps", name: "PPS", density_g_cm3: 1.35, tensile_strength_mpa: 70, elastic_modulus_gpa: 3.6, glass_transition_c: 90, max_service_temp_c: 220, printability_fdm: "poor", cost_usd_kg: 14, tags: ["chemical", "electrical"] },
      { id: "ppsu", name: "PPSU", density_g_cm3: 1.29, tensile_strength_mpa: 70, elastic_modulus_gpa: 2.4, glass_transition_c: 220, max_service_temp_c: 180, printability_fdm: "poor", cost_usd_kg: 22, tags: ["medical", "sterilization"] },
      { id: "pei", name: "PEI", density_g_cm3: 1.27, tensile_strength_mpa: 110, elastic_modulus_gpa: 3.2, glass_transition_c: 217, max_service_temp_c: 170, printability_fdm: "poor", cost_usd_kg: 25, tags: ["high-temp", "electrical"] },
      { id: "ultem9085", name: "ULTEM 9085", density_g_cm3: 1.34, tensile_strength_mpa: 69, elastic_modulus_gpa: 2.5, glass_transition_c: 186, max_service_temp_c: 153, printability_fdm: "fair", cost_usd_kg: 40, tags: ["aerospace", "fdm"] },
      { id: "ultem1010", name: "ULTEM 1010", density_g_cm3: 1.27, tensile_strength_mpa: 81, elastic_modulus_gpa: 3.2, glass_transition_c: 217, max_service_temp_c: 180, printability_fdm: "fair", cost_usd_kg: 55, tags: ["high-temp", "fdm"] },
      { id: "pekk", name: "PEKK", density_g_cm3: 1.3, tensile_strength_mpa: 95, elastic_modulus_gpa: 3.8, glass_transition_c: 160, max_service_temp_c: 170, printability_fdm: "fair", cost_usd_kg: 65, tags: ["high-temp", "fdm"] },
      { id: "peek_cf30", name: "PEEK CF30", density_g_cm3: 1.41, tensile_strength_mpa: 190, elastic_modulus_gpa: 18, glass_transition_c: 143, max_service_temp_c: 250, printability_fdm: "poor", cost_usd_kg: 85, tags: ["chemical", "structural"] },
      { id: "peek_gf30", name: "PEEK GF30", density_g_cm3: 1.51, tensile_strength_mpa: 170, elastic_modulus_gpa: 12, glass_transition_c: 143, max_service_temp_c: 250, printability_fdm: "poor", cost_usd_kg: 78, tags: ["chemical", "structural"] },
      { id: "uhmwpe", name: "UHMWPE", density_g_cm3: 0.94, tensile_strength_mpa: 40, elastic_modulus_gpa: 0.8, glass_transition_c: -120, max_service_temp_c: 80, thermal_expansion_ppm_k: 150, electrical_resistivity_ohm_m: 1e15, machinability: "excellent", printability_fdm: "poor", cost_usd_kg: 4.5, tags: ["wear", "biomedical"] },
      { id: "hdpe", name: "HDPE", density_g_cm3: 0.96, tensile_strength_mpa: 32, elastic_modulus_gpa: 0.95, glass_transition_c: -120, max_service_temp_c: 80, thermal_expansion_ppm_k: 120, electrical_resistivity_ohm_m: 1e15, machinability: "excellent", printability_fdm: "fair", cost_usd_kg: 1.8, tags: ["chemical", "tank"] },
      { id: "pp_homo", name: "Polypropylene Homopolymer", density_g_cm3: 0.9, tensile_strength_mpa: 35, elastic_modulus_gpa: 1.6, glass_transition_c: -10, max_service_temp_c: 100, thermal_expansion_ppm_k: 110, electrical_resistivity_ohm_m: 1e16, printability_fdm: "fair", cost_usd_kg: 1.6, tags: ["chemical", "hinge"] },
      { id: "pvdf", name: "PVDF", density_g_cm3: 1.78, tensile_strength_mpa: 55, elastic_modulus_gpa: 2.2, glass_transition_c: -35, max_service_temp_c: 140, thermal_expansion_ppm_k: 90, electrical_resistivity_ohm_m: 1e14, corrosion_resistance: "excellent", printability_fdm: "poor", cost_usd_kg: 18, tags: ["chemical", "seals"] },
      { id: "pom_copolymer", name: "POM Copolymer", density_g_cm3: 1.41, tensile_strength_mpa: 62, elastic_modulus_gpa: 2.7, glass_transition_c: -60, max_service_temp_c: 105, thermal_expansion_ppm_k: 110, electrical_resistivity_ohm_m: 1e14, machinability: "excellent", printability_fdm: "fair", cost_usd_kg: 3.8, tags: ["gear", "machining"] },
      { id: "epdm", name: "EPDM Rubber", density_g_cm3: 1.15, tensile_strength_mpa: 10, elastic_modulus_gpa: 0.01, glass_transition_c: -50, max_service_temp_c: 140, thermal_expansion_ppm_k: 220, electrical_resistivity_ohm_m: 1e13, corrosion_resistance: "excellent", machinability: "poor", printability_fdm: "poor", cost_usd_kg: 4, tags: ["seal", "weather"] },
      { id: "nbr", name: "NBR Rubber", density_g_cm3: 1.0, tensile_strength_mpa: 12, elastic_modulus_gpa: 0.012, glass_transition_c: -25, max_service_temp_c: 100, thermal_expansion_ppm_k: 200, electrical_resistivity_ohm_m: 1e13, corrosion_resistance: "good", machinability: "poor", printability_fdm: "poor", cost_usd_kg: 3.8, tags: ["seal", "oil-resistant"] },
      { id: "fkm_viton", name: "FKM / Viton", density_g_cm3: 1.82, tensile_strength_mpa: 14, elastic_modulus_gpa: 0.015, glass_transition_c: -15, max_service_temp_c: 220, thermal_expansion_ppm_k: 180, electrical_resistivity_ohm_m: 1e13, corrosion_resistance: "excellent", machinability: "poor", printability_fdm: "poor", cost_usd_kg: 18, tags: ["seal", "chemical"] }
    ]
  )
];

const ceramicVariants = [
  ...createCeramicSeries(
    {
      subcategory: "Engineering Ceramic",
      density_g_cm3: 3.7,
      elastic_modulus_gpa: 300,
      thermal_conductivity_w_mk: 25,
      specific_heat_j_gk: 0.78,
      melting_point_c: 1800,
      max_service_temp_c: 1400,
      thermal_expansion_ppm_k: 7,
      electrical_resistivity_ohm_m: 1e10,
      corrosion_resistance: "excellent",
      cost_usd_kg: 45,
      tags: ["ceramic"],
      data_source: "Ceramic manufacturer and MatWeb family data"
    },
    [
      { id: "alumina_96", name: "Alumina 96%", tensile_strength_mpa: 300, elastic_modulus_gpa: 300, hardness_vickers: 1500, thermal_conductivity_w_mk: 24, max_service_temp_c: 1500, thermal_expansion_ppm_k: 7.4, electrical_resistivity_ohm_m: 1e12, cost_usd_kg: 12, tags: ["electrical-insulator", "substrate"] },
      { id: "alumina_99_5", name: "Alumina 99.5%", tensile_strength_mpa: 330, elastic_modulus_gpa: 370, hardness_vickers: 1700, thermal_conductivity_w_mk: 30, max_service_temp_c: 1600, thermal_expansion_ppm_k: 8.1, electrical_resistivity_ohm_m: 1e13, cost_usd_kg: 20, tags: ["electrical-insulator", "wear"] },
      { id: "zirconia_ytzp", name: "Y-TZP Zirconia", tensile_strength_mpa: 900, elastic_modulus_gpa: 205, hardness_vickers: 1250, thermal_conductivity_w_mk: 2.7, max_service_temp_c: 1000, thermal_expansion_ppm_k: 10.5, electrical_resistivity_ohm_m: 1e10, cost_usd_kg: 55, tags: ["tough-ceramic", "biomedical"] },
      { id: "zirconia_mgpsz", name: "Mg-PSZ Zirconia", tensile_strength_mpa: 650, elastic_modulus_gpa: 200, hardness_vickers: 1150, thermal_conductivity_w_mk: 2.5, max_service_temp_c: 1100, thermal_expansion_ppm_k: 10.5, electrical_resistivity_ohm_m: 1e10, cost_usd_kg: 52, tags: ["tough-ceramic", "wear"] },
      { id: "sic_sintered", name: "Sintered Silicon Carbide", tensile_strength_mpa: 380, elastic_modulus_gpa: 410, hardness_vickers: 2600, thermal_conductivity_w_mk: 120, max_service_temp_c: 1500, thermal_expansion_ppm_k: 4.3, electrical_resistivity_ohm_m: 1e2, cost_usd_kg: 32, tags: ["mechanical-seal", "wear"] },
      { id: "sic_reaction_bonded", name: "Reaction-Bonded SiC", tensile_strength_mpa: 250, elastic_modulus_gpa: 320, hardness_vickers: 2200, thermal_conductivity_w_mk: 40, max_service_temp_c: 1350, thermal_expansion_ppm_k: 4.5, electrical_resistivity_ohm_m: 1e3, cost_usd_kg: 22, tags: ["kiln", "wear"] },
      { id: "si3n4_hot_pressed", name: "Hot-Pressed Silicon Nitride", tensile_strength_mpa: 800, elastic_modulus_gpa: 310, hardness_vickers: 1550, thermal_conductivity_w_mk: 30, max_service_temp_c: 1200, thermal_expansion_ppm_k: 3.2, electrical_resistivity_ohm_m: 1e13, cost_usd_kg: 85, tags: ["bearing", "thermal-shock"] },
      { id: "aln_substrate", name: "Aluminum Nitride Substrate", tensile_strength_mpa: 260, elastic_modulus_gpa: 320, hardness_vickers: 1100, thermal_conductivity_w_mk: 170, max_service_temp_c: 1000, thermal_expansion_ppm_k: 4.6, electrical_resistivity_ohm_m: 1e13, cost_usd_kg: 78, tags: ["thermal-management", "electronics"] },
      { id: "bn_hot_pressed", name: "Hot-Pressed Boron Nitride", tensile_strength_mpa: 65, elastic_modulus_gpa: 60, hardness_vickers: 300, thermal_conductivity_w_mk: 30, max_service_temp_c: 900, thermal_expansion_ppm_k: 2.5, electrical_resistivity_ohm_m: 1e11, cost_usd_kg: 100, tags: ["electrical-insulator", "machinable"] },
      { id: "mullite", name: "Mullite Ceramic", tensile_strength_mpa: 170, elastic_modulus_gpa: 170, hardness_vickers: 900, thermal_conductivity_w_mk: 3, max_service_temp_c: 1500, thermal_expansion_ppm_k: 5.4, electrical_resistivity_ohm_m: 1e12, cost_usd_kg: 14, tags: ["kiln", "insulation"] },
      { id: "cordierite", name: "Cordierite", tensile_strength_mpa: 130, elastic_modulus_gpa: 135, hardness_vickers: 700, thermal_conductivity_w_mk: 3.5, max_service_temp_c: 1200, thermal_expansion_ppm_k: 2.2, electrical_resistivity_ohm_m: 1e12, cost_usd_kg: 10, tags: ["thermal-shock", "kiln"] },
      { id: "fused_silica", name: "Fused Silica", tensile_strength_mpa: 50, elastic_modulus_gpa: 72, hardness_vickers: 600, thermal_conductivity_w_mk: 1.4, max_service_temp_c: 1000, thermal_expansion_ppm_k: 0.5, electrical_resistivity_ohm_m: 1e14, cost_usd_kg: 18, tags: ["low-cte", "optical"] },
      { id: "macor", name: "Macor Glass Ceramic", tensile_strength_mpa: 94, elastic_modulus_gpa: 66, hardness_vickers: 250, thermal_conductivity_w_mk: 1.5, max_service_temp_c: 800, thermal_expansion_ppm_k: 9.3, electrical_resistivity_ohm_m: 1e13, cost_usd_kg: 55, tags: ["machinable", "electrical-insulator"] },
      { id: "wc_6co", name: "Tungsten Carbide 6Co", tensile_strength_mpa: 700, elastic_modulus_gpa: 600, hardness_vickers: 1750, thermal_conductivity_w_mk: 90, max_service_temp_c: 500, thermal_expansion_ppm_k: 5.2, electrical_resistivity_ohm_m: 2.2e-7, cost_usd_kg: 80, tags: ["wear", "cutting-tool", "conductive"] },
      { id: "wc_12co", name: "Tungsten Carbide 12Co", tensile_strength_mpa: 1100, elastic_modulus_gpa: 580, hardness_vickers: 1450, thermal_conductivity_w_mk: 80, max_service_temp_c: 500, thermal_expansion_ppm_k: 5.7, electrical_resistivity_ohm_m: 2.8e-7, cost_usd_kg: 74, tags: ["wear", "impact", "conductive"] },
      { id: "boron_carbide_hot_pressed", name: "Hot-Pressed Boron Carbide", tensile_strength_mpa: 300, elastic_modulus_gpa: 450, hardness_vickers: 3000, thermal_conductivity_w_mk: 30, max_service_temp_c: 720, thermal_expansion_ppm_k: 4.5, electrical_resistivity_ohm_m: 1e6, cost_usd_kg: 58, tags: ["armor", "wear"] },
      { id: "zirconium_diboride", name: "Zirconium Diboride", tensile_strength_mpa: 450, elastic_modulus_gpa: 490, hardness_vickers: 2200, thermal_conductivity_w_mk: 60, max_service_temp_c: 1800, thermal_expansion_ppm_k: 6.6, electrical_resistivity_ohm_m: 7.8e-8, cost_usd_kg: 300, tags: ["uhte", "conductive"] },
      { id: "hafnium_diboride", name: "Hafnium Diboride", tensile_strength_mpa: 460, elastic_modulus_gpa: 500, hardness_vickers: 2400, thermal_conductivity_w_mk: 90, max_service_temp_c: 2000, thermal_expansion_ppm_k: 6.9, electrical_resistivity_ohm_m: 8e-8, cost_usd_kg: 460, tags: ["uhte", "conductive"] }
    ]
  )
];

const compositeVariants = createCompositeSeries(
  {
    subcategory: "Fiber Composite",
    density_g_cm3: 1.6,
    elastic_modulus_gpa: 40,
    thermal_conductivity_w_mk: 0.5,
    specific_heat_j_gk: 0.9,
    glass_transition_c: 120,
    max_service_temp_c: 120,
    thermal_expansion_ppm_k: 8,
    electrical_resistivity_ohm_m: 1e10,
    corrosion_resistance: "excellent",
    machinability: "fair",
    cost_usd_kg: 25,
    tags: ["composite"],
    data_source: "Hexcel, Gurit, MatWeb family data"
  },
  [
    { id: "cfrp_ud", name: "CFRP Unidirectional", tensile_strength_mpa: 1100, elastic_modulus_gpa: 135, thermal_conductivity_w_mk: 6, electrical_resistivity_ohm_m: 8e-5, cost_usd_kg: 75, tags: ["aerospace", "lightweight"] },
    { id: "cfrp_quasi_iso", name: "CFRP Quasi-Isotropic Laminate", tensile_strength_mpa: 750, elastic_modulus_gpa: 65, thermal_conductivity_w_mk: 5, electrical_resistivity_ohm_m: 1.1e-4, cost_usd_kg: 62, tags: ["drone", "panel"] },
    { id: "cfrp_high_tg", name: "CFRP High-Tg Epoxy", tensile_strength_mpa: 720, elastic_modulus_gpa: 75, glass_transition_c: 180, max_service_temp_c: 160, cost_usd_kg: 70, tags: ["autoclave", "aerospace"] },
    { id: "gfrp_e_glass", name: "GFRP E-Glass / Epoxy", tensile_strength_mpa: 450, elastic_modulus_gpa: 24, thermal_conductivity_w_mk: 0.35, electrical_resistivity_ohm_m: 1e12, cost_usd_kg: 12, tags: ["marine", "insulating"] },
    { id: "gfrp_s_glass", name: "GFRP S-Glass / Epoxy", tensile_strength_mpa: 580, elastic_modulus_gpa: 30, thermal_conductivity_w_mk: 0.38, electrical_resistivity_ohm_m: 1e12, cost_usd_kg: 24, tags: ["aerospace", "lightweight"] },
    { id: "kevlar_epoxy", name: "Kevlar / Epoxy", tensile_strength_mpa: 500, elastic_modulus_gpa: 28, thermal_conductivity_w_mk: 0.25, electrical_resistivity_ohm_m: 1e12, cost_usd_kg: 38, tags: ["impact", "ballistic"] },
    { id: "carbon_carbon", name: "Carbon-Carbon Composite", tensile_strength_mpa: 180, elastic_modulus_gpa: 40, thermal_conductivity_w_mk: 18, glass_transition_c: null, max_service_temp_c: 2000, thermal_expansion_ppm_k: 1.5, electrical_resistivity_ohm_m: 1e-4, corrosion_resistance: "fair", cost_usd_kg: 280, tags: ["aerospace", "high-temp"] },
    { id: "fr4", name: "FR-4 Laminate", tensile_strength_mpa: 310, elastic_modulus_gpa: 22, thermal_conductivity_w_mk: 0.3, glass_transition_c: 135, max_service_temp_c: 130, thermal_expansion_ppm_k: 14, electrical_resistivity_ohm_m: 1e13, machinability: "good", cost_usd_kg: 9, tags: ["electronics", "insulator"] },
    { id: "g10", name: "G10 / Garolite", tensile_strength_mpa: 275, elastic_modulus_gpa: 19, thermal_conductivity_w_mk: 0.3, glass_transition_c: 130, max_service_temp_c: 130, thermal_expansion_ppm_k: 10, electrical_resistivity_ohm_m: 1e13, machinability: "good", cost_usd_kg: 14, tags: ["insulator", "fixture"] },
    { id: "smc_glass_polyester", name: "SMC Glass / Polyester", tensile_strength_mpa: 130, elastic_modulus_gpa: 10, thermal_conductivity_w_mk: 0.3, glass_transition_c: 130, max_service_temp_c: 120, electrical_resistivity_ohm_m: 1e12, machinability: "good", cost_usd_kg: 6, tags: ["automotive", "panel"] },
    { id: "gmt_pp_glass", name: "GMT PP / Glass", tensile_strength_mpa: 120, elastic_modulus_gpa: 8, thermal_conductivity_w_mk: 0.28, glass_transition_c: -10, max_service_temp_c: 100, electrical_resistivity_ohm_m: 1e12, machinability: "good", cost_usd_kg: 5.5, tags: ["automotive", "impact"] },
    { id: "sic_sic_cmc", name: "SiC/SiC CMC", tensile_strength_mpa: 280, elastic_modulus_gpa: 180, thermal_conductivity_w_mk: 8, glass_transition_c: null, max_service_temp_c: 1200, thermal_expansion_ppm_k: 4, electrical_resistivity_ohm_m: 1e3, corrosion_resistance: "excellent", cost_usd_kg: 420, tags: ["turbine", "high-temp"] }
  ]
);

const solderVariants: Material[] = [
  metal({
    id: "sac305_wire",
    name: "SAC305 Wire Solder",
    category: "Solder",
    subcategory: "Tin-Silver-Copper",
    density_g_cm3: 7.37,
    tensile_strength_mpa: 58,
    yield_strength_mpa: 43,
    elastic_modulus_gpa: 45,
    hardness_vickers: 17,
    thermal_conductivity_w_mk: 59,
    specific_heat_j_gk: 0.23,
    melting_point_c: 217,
    glass_transition_c: null,
    max_service_temp_c: 125,
    thermal_expansion_ppm_k: 22,
    electrical_resistivity_ohm_m: 1.38e-7,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 32,
    tags: ["lead-free", "electronics", "solder", "bga"],
    data_source: "Kester datasheet"
  }),
  metal({
    id: "sac387",
    name: "SAC387",
    category: "Solder",
    subcategory: "Tin-Silver-Copper",
    density_g_cm3: 7.38,
    tensile_strength_mpa: 60,
    yield_strength_mpa: 44,
    elastic_modulus_gpa: 46,
    hardness_vickers: 18,
    thermal_conductivity_w_mk: 58,
    specific_heat_j_gk: 0.23,
    melting_point_c: 217,
    glass_transition_c: null,
    max_service_temp_c: 125,
    thermal_expansion_ppm_k: 22,
    electrical_resistivity_ohm_m: 1.4e-7,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 35,
    tags: ["lead-free", "electronics", "solder", "bga"],
    data_source: "Indium Corporation datasheet"
  }),
  metal({
    id: "sn95sb5",
    name: "Sn95Sb5",
    category: "Solder",
    subcategory: "Tin-Antimony",
    density_g_cm3: 7.2,
    tensile_strength_mpa: 55,
    yield_strength_mpa: 42,
    elastic_modulus_gpa: 48,
    hardness_vickers: 21,
    thermal_conductivity_w_mk: 38,
    specific_heat_j_gk: 0.22,
    melting_point_c: 240,
    glass_transition_c: null,
    max_service_temp_c: 150,
    thermal_expansion_ppm_k: 20,
    electrical_resistivity_ohm_m: 1.4e-7,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 28,
    tags: ["lead-free", "high-temp", "electronics", "solder"],
    data_source: "MatWeb"
  }),
  metal({
    id: "sncu07",
    name: "Sn99.3Cu0.7",
    category: "Solder",
    subcategory: "Tin-Copper",
    density_g_cm3: 7.3,
    tensile_strength_mpa: 35,
    yield_strength_mpa: 28,
    elastic_modulus_gpa: 41,
    hardness_vickers: 12,
    thermal_conductivity_w_mk: 55,
    specific_heat_j_gk: 0.23,
    melting_point_c: 227,
    glass_transition_c: null,
    max_service_temp_c: 120,
    thermal_expansion_ppm_k: 23,
    electrical_resistivity_ohm_m: 1.45e-7,
    corrosion_resistance: "fair",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 14,
    tags: ["lead-free", "wave-solder", "solder"],
    data_source: "Kester datasheet"
  }),
  metal({
    id: "sn63pb37",
    name: "Sn63Pb37",
    category: "Solder",
    subcategory: "Tin-Lead",
    density_g_cm3: 8.4,
    tensile_strength_mpa: 49,
    yield_strength_mpa: 37,
    elastic_modulus_gpa: 43,
    hardness_vickers: 13,
    thermal_conductivity_w_mk: 50,
    specific_heat_j_gk: 0.16,
    melting_point_c: 183,
    glass_transition_c: null,
    max_service_temp_c: 110,
    thermal_expansion_ppm_k: 24,
    electrical_resistivity_ohm_m: 1.35e-7,
    corrosion_resistance: "fair",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 18,
    tags: ["legacy", "electronics", "solder"],
    data_source: "MatWeb"
  }),
  metal({
    id: "sn42bi57ag1",
    name: "Sn42Bi57Ag1",
    category: "Solder",
    subcategory: "Tin-Bismuth-Silver",
    density_g_cm3: 8.45,
    tensile_strength_mpa: 62,
    yield_strength_mpa: 45,
    elastic_modulus_gpa: 44,
    hardness_vickers: 24,
    thermal_conductivity_w_mk: 21,
    specific_heat_j_gk: 0.21,
    melting_point_c: 139,
    glass_transition_c: null,
    max_service_temp_c: 90,
    thermal_expansion_ppm_k: 16,
    electrical_resistivity_ohm_m: 2.9e-7,
    corrosion_resistance: "fair",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 38,
    tags: ["low-temp", "lead-free", "solder"],
    data_source: "Indium Corporation datasheet"
  }),
  metal({
    id: "ausn20",
    name: "Au80Sn20",
    category: "Solder",
    subcategory: "Gold-Tin",
    density_g_cm3: 14.5,
    tensile_strength_mpa: 275,
    yield_strength_mpa: 205,
    elastic_modulus_gpa: 68,
    hardness_vickers: 160,
    thermal_conductivity_w_mk: 57,
    specific_heat_j_gk: 0.14,
    melting_point_c: 280,
    glass_transition_c: null,
    max_service_temp_c: 220,
    thermal_expansion_ppm_k: 16,
    electrical_resistivity_ohm_m: 2.6e-7,
    corrosion_resistance: "excellent",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 1200,
    tags: ["hermetic", "high-reliability", "solder"],
    data_source: "Indium Corporation datasheet"
  }),
  metal({
    id: "bag7",
    name: "BAg-7 Silver Braze",
    category: "Solder",
    subcategory: "Silver Braze",
    density_g_cm3: 9.3,
    tensile_strength_mpa: 415,
    yield_strength_mpa: 310,
    elastic_modulus_gpa: 82,
    hardness_vickers: 120,
    thermal_conductivity_w_mk: 90,
    specific_heat_j_gk: 0.24,
    melting_point_c: 650,
    glass_transition_c: null,
    max_service_temp_c: 350,
    thermal_expansion_ppm_k: 19,
    electrical_resistivity_ohm_m: 9e-8,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 180,
    tags: ["braze", "joining", "solder"],
    data_source: "Lucas-Milhaupt datasheet"
  }),
  metal({
    id: "bcu_p6",
    name: "BCuP-6 Copper-Phosphorus Braze",
    category: "Solder",
    subcategory: "Copper Braze",
    density_g_cm3: 8.1,
    tensile_strength_mpa: 300,
    yield_strength_mpa: 240,
    elastic_modulus_gpa: 95,
    hardness_vickers: 90,
    thermal_conductivity_w_mk: 120,
    specific_heat_j_gk: 0.3,
    melting_point_c: 710,
    glass_transition_c: null,
    max_service_temp_c: 300,
    thermal_expansion_ppm_k: 18,
    electrical_resistivity_ohm_m: 1.1e-7,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 42,
    tags: ["braze", "copper-joining", "solder"],
    data_source: "Wall Colmonoy datasheet"
  }),
  metal({
    id: "al_si12_braze",
    name: "AlSi12 Aluminum Braze Filler",
    category: "Solder",
    subcategory: "Aluminum Braze",
    density_g_cm3: 2.65,
    tensile_strength_mpa: 160,
    yield_strength_mpa: 120,
    elastic_modulus_gpa: 70,
    hardness_vickers: 60,
    thermal_conductivity_w_mk: 130,
    specific_heat_j_gk: 0.88,
    melting_point_c: 577,
    glass_transition_c: null,
    max_service_temp_c: 180,
    thermal_expansion_ppm_k: 23,
    electrical_resistivity_ohm_m: 5e-8,
    corrosion_resistance: "good",
    machinability: "good",
    printability_fdm: "n/a",
    cost_usd_kg: 18,
    tags: ["braze", "heat-exchanger", "solder"],
    data_source: "Brazing filler datasheet"
  })
];

function createCommercialVariant(
  material: Material,
  suffix: string,
  idSuffix: string,
  tensileFactor: number,
  costFactor: number,
  extraTags: string[]
): Material {
  return {
    ...material,
    id: `${material.id}_${idSuffix}`,
    name: `${material.name} ${suffix}`,
    tensile_strength_mpa: Math.max(1, Math.round((material.tensile_strength_mpa ?? 1) * tensileFactor)),
    yield_strength_mpa: Math.max(1, Math.round((material.yield_strength_mpa ?? 1) * tensileFactor)),
    hardness_vickers:
      material.hardness_vickers === null
        ? null
        : Math.max(1, Math.round(material.hardness_vickers * tensileFactor)),
    cost_usd_kg: Math.round((material.cost_usd_kg ?? 1) * costFactor * 100) / 100,
    tags: [...material.tags, ...extraTags]
  };
}

const commercialFormVariantSeeds: Material[] = [
  ...structuralSteelVariants,
  ...castIronVariants,
  ...stainlessVariants,
  ...toolSteelVariants,
  ...aluminumVariants,
  ...copperVariants,
  ...nickelAndCobaltVariants,
  ...titaniumVariants,
  ...magnesiumVariants,
  ...polymerVariants,
  ...ceramicVariants,
  ...compositeVariants
];

const commercialFormVariants: Material[] = commercialFormVariantSeeds.flatMap((material) => {
  if (material.category === "Metal") {
    const variants = [
      createCommercialVariant(material, "Plate", "plate", 0.98, 1.05, ["plate-stock"])
    ];
    if (/steel|nickel|titanium|copper|bronze|brass|magnesium|inconel|hastelloy|monel/i.test(material.name)) {
      variants.push(
        createCommercialVariant(material, "Bar", "bar", 1.03, 1.08, ["bar-stock"])
      );
    }
    return variants;
  }

  if (material.category === "Polymer") {
    return [
      createCommercialVariant(
        material,
        "Injection Molding Grade",
        "im",
        1.02,
        1.08,
        ["injection-grade"]
      ),
      createCommercialVariant(
        material,
        "Extrusion Grade",
        "ext",
        0.98,
        1.05,
        ["extrusion-grade"]
      )
    ];
  }

  if (material.category === "Ceramic") {
    return [
      createCommercialVariant(
        material,
        "Substrate Grade",
        "substrate",
        0.97,
        1.06,
        ["substrate-grade"]
      )
    ];
  }

  if (material.category === "Composite") {
    return [
      createCommercialVariant(
        material,
        "Prepreg Laminate",
        "prepreg",
        1.04,
        1.12,
        ["prepreg"]
      )
    ];
  }

  return [];
});

export const additionalCuratedMaterials: Material[] = [
  ...requestedAdditionalMaterials,
  ...structuralSteelVariants,
  ...castIronVariants,
  ...stainlessVariants,
  ...toolSteelVariants,
  ...aluminumVariants,
  ...copperVariants,
  ...nickelAndCobaltVariants,
  ...titaniumVariants,
  ...magnesiumVariants,
  ...lowMeltingMetalVariants,
  ...polymerVariants,
  ...ceramicVariants,
  ...compositeVariants,
  ...solderVariants,
  ...commercialFormVariants
];

export default additionalCuratedMaterials;
