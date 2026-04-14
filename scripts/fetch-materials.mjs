#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import process from "process";

const ROOT = process.cwd();
const RAW_OUTPUT = path.join(ROOT, "scripts", "mp-materials-raw.json");
const TS_OUTPUT = path.join(ROOT, "src", "lib", "mp-materials-generated.ts");
const API_URL = "https://api.materialsproject.org/materials/summary/";
const MP_FIELDS = [
  "material_id",
  "formula_pretty",
  "energy_above_hull",
  "density",
  "band_gap",
  "is_stable",
  "bulk_modulus",
  "shear_modulus",
  "symmetry"
].join(",");

const METAL_ELEMENTS = new Set([
  "Ag",
  "Al",
  "Au",
  "Ba",
  "Be",
  "Bi",
  "Ca",
  "Cd",
  "Ce",
  "Co",
  "Cr",
  "Cu",
  "Fe",
  "Ga",
  "Hf",
  "In",
  "Ir",
  "K",
  "La",
  "Li",
  "Mg",
  "Mn",
  "Mo",
  "Na",
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
  "Sr",
  "Ta",
  "Ti",
  "Tl",
  "V",
  "W",
  "Y",
  "Zn",
  "Zr"
]);

const NOBLE_METALS = new Set(["Ag", "Au", "Ir", "Os", "Pd", "Pt", "Rh", "Ru"]);
const REFRACTORY_METALS = new Set(["Hf", "Mo", "Nb", "Re", "Ta", "W", "Zr"]);
const PASSIVATING_METALS = new Set(["Al", "Cr", "Hf", "Nb", "Ni", "Ta", "Ti", "Zr"]);
const SOFT_METALS = new Set(["Ag", "Al", "Au", "Bi", "Cu", "Mg", "Pb", "Sn", "Tl", "Zn"]);
const SEMICONDUCTOR_FORMULAS = new Set([
  "AlAs",
  "AlSb",
  "CdS",
  "CdSe",
  "CdTe",
  "GaAs",
  "GaN",
  "GaP",
  "Ge",
  "InAs",
  "InP",
  "InSb",
  "PbS",
  "PbSe",
  "PbTe",
  "Si",
  "SnS",
  "SnSe",
  "ZnO",
  "ZnS",
  "ZnSe",
  "ZnTe"
]);
const MAX_PHASES = new Set([
  "Cr2AlC",
  "Nb2AlC",
  "Ta2AlC",
  "Ti2AlC",
  "Ti2AlN",
  "Ti3AlC2",
  "Ti3SiC2",
  "V2AlC"
]);
const CONDUCTIVE_CERAMICS = new Set([
  "B4C",
  "Cr3C2",
  "CrN",
  "HfB2",
  "HfC",
  "HfN",
  "Mo2C",
  "Mo2N",
  "MoB",
  "MoSi2",
  "Nb2AlC",
  "NbB2",
  "NbC",
  "NbN",
  "NbSi2",
  "Ta2AlC",
  "TaB2",
  "TaC",
  "TaN",
  "Ti2AlC",
  "Ti2AlN",
  "Ti3AlC2",
  "Ti3SiC2",
  "TiB2",
  "TiC",
  "TiN",
  "TiSi2",
  "V2AlC",
  "VB2",
  "VC",
  "VN",
  "W2C",
  "W2N",
  "WB",
  "WC",
  "WN",
  "WSi2",
  "ZrB2",
  "ZrC",
  "ZrN",
  "ZrSi2"
]);

const ELEMENT_COSTS = {
  Ag: 800,
  Al: 3,
  As: 5,
  Au: 62000,
  B: 30,
  Ba: 5,
  Be: 800,
  Bi: 15,
  C: 0.2,
  Ca: 0.5,
  Cd: 80,
  Ce: 8,
  Co: 35,
  Cr: 12,
  Cu: 8,
  Fe: 1,
  Ga: 300,
  Ge: 1500,
  Hf: 1200,
  In: 400,
  Ir: 45000,
  K: 1,
  La: 15,
  Li: 80,
  Mg: 3,
  Mn: 2,
  Mo: 40,
  N: 0.1,
  Na: 0.4,
  Nb: 60,
  Ni: 20,
  O: 0.05,
  Os: 90000,
  P: 3,
  Pb: 3,
  Pd: 20000,
  Pt: 30000,
  Re: 2200,
  Rh: 120000,
  Ru: 15000,
  S: 0.2,
  Sb: 15,
  Sc: 4500,
  Se: 30,
  Si: 2,
  Sn: 25,
  Sr: 3,
  Ta: 250,
  Te: 80,
  Ti: 25,
  Tl: 1000,
  V: 30,
  W: 55,
  Y: 60,
  Zn: 3,
  Zr: 60
};

const TARGET_FORMULAS = [
  "Ag",
  "Al",
  "Au",
  "Be",
  "Co",
  "Cr",
  "Cu",
  "Fe",
  "Ge",
  "Hf",
  "Ir",
  "Mg",
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
  "Si",
  "Sn",
  "Ta",
  "Ti",
  "V",
  "W",
  "Zn",
  "Zr",
  "Rh",
  "Ru",
  "Os",
  "Hf",
  "Sc",
  "Y",
  "La",
  "Ce",
  "Ga",
  "In",
  "Tl",
  "Bi",
  "Sb",
  "Te",
  "Se",
  "Cu3Au",
  "CuAu",
  "CuPd",
  "NiPd",
  "FePt",
  "CoPt",
  "Ti3Al",
  "TiAl",
  "TiAl3",
  "Ni3Fe",
  "Fe3Ni",
  "CoAl",
  "Co3Al",
  "MoSi2",
  "WSi2",
  "TiSi2",
  "ZrSi2",
  "NbSi2",
  "CrN",
  "TaN",
  "VN",
  "NbN",
  "HfN",
  "WN",
  "TiC",
  "ZrC",
  "HfC",
  "NbC",
  "TaC",
  "WC",
  "VC",
  "Mo2C",
  "MoSe2",
  "WS2",
  "MoS2",
  "WSe2",
  "Fe2O3",
  "Fe3O4",
  "NiO",
  "CoO",
  "MnO",
  "CuO",
  "SnO2",
  "ZnO",
  "Cr2O3",
  "V2O5",
  "WO3",
  "MoO3",
  "CeO2",
  "Y2O3",
  "La2O3",
  "HfO2",
  "Sc2O3",
  "In2O3",
  "Ga2O3",
  "Cr2N",
  "Mo2N",
  "W2N",
  "ScN",
  "SiC",
  "B4C",
  "Cr3C2",
  "W2C",
  "CrB2",
  "MoB",
  "WB",
  "NbB2",
  "TaB2",
  "VB2",
  "HfB2",
  "GaP",
  "InAs",
  "InSb",
  "AlAs",
  "AlSb",
  "ZnS",
  "ZnSe",
  "ZnTe",
  "CdS",
  "CdSe",
  "CdTe",
  "PbS",
  "PbSe",
  "PbTe",
  "SnS",
  "SnSe",
  "SrTiO3",
  "BaTiO3",
  "PbTiO3",
  "KNbO3",
  "LiNbO3",
  "LaAlO3",
  "YAlO3",
  "GdAlO3",
  "Ti3SiC2",
  "Ti3AlC2",
  "Ti2AlC",
  "Ti2AlN",
  "Cr2AlC",
  "V2AlC",
  "Nb2AlC",
  "Ta2AlC"
];

function series(elements, suffixes) {
  return elements.flatMap((element) => suffixes.map((suffix) => `${element}${suffix}`));
}

function loadEnvObject(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .reduce((acc, line) => {
      const [key, ...rest] = line.split("=");
      acc[key.trim()] = rest.join("=").trim();
      return acc;
    }, {});
}

function parseFormula(formula) {
  return [...formula.matchAll(/([A-Z][a-z]?)(\d*(?:\.\d+)?)?/g)]
    .map((match) => ({
      element: match[1],
      count: match[2] ? Number(match[2]) : 1
    }))
    .filter((entry) => entry.element);
}

function uniqueElements(formula) {
  return [...new Set(parseFormula(formula).map((entry) => entry.element))];
}

function isAlloyLikeFormula(formula) {
  const elements = uniqueElements(formula);
  return elements.length >= 2 && elements.every((element) => METAL_ELEMENTS.has(element));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sortObjectKeys(value) {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
  );
}

function buildTargetFormulaList() {
  const oxideElements = [
    "Al",
    "Ba",
    "Bi",
    "Ca",
    "Ce",
    "Co",
    "Cr",
    "Cu",
    "Fe",
    "Ga",
    "Hf",
    "In",
    "La",
    "Mg",
    "Mn",
    "Mo",
    "Nb",
    "Ni",
    "Pb",
    "Sc",
    "Sn",
    "Sr",
    "Ta",
    "Ti",
    "V",
    "W",
    "Y",
    "Zn",
    "Zr"
  ];
  const nitrideCarbideMetals = [
    "Al",
    "Cr",
    "Hf",
    "Mo",
    "Nb",
    "Sc",
    "Ta",
    "Ti",
    "V",
    "W",
    "Zr"
  ];
  const borideSilicideMetals = ["Cr", "Hf", "Mo", "Nb", "Ta", "Ti", "V", "W", "Zr"];

  return [
    ...TARGET_FORMULAS,
    ...series(oxideElements, ["O", "O2", "2O3", "3O4", "2O5"]),
    ...series(nitrideCarbideMetals, ["N", "2N", "N2", "2N3", "3N4"]),
    ...series(nitrideCarbideMetals, ["C", "2C", "C2", "2C3", "3C2"]),
    ...series(borideSilicideMetals, ["B", "B2", "2B", "2B3"]),
    ...series(borideSilicideMetals, ["Si", "Si2", "2Si", "5Si3"]),
    ...series(["Fe", "Ni", "Co", "Ti", "Zr", "Nb", "Ta"], ["P", "P2", "2P3"]),
    ...series(["Mo", "W", "Sn", "Pb", "Zn", "Cd"], ["S", "S2", "Se", "Se2", "Te", "Te2"]),
    ...[
      "Al3Sc",
      "Al3Ti",
      "AlNi",
      "AlCo",
      "AlLi",
      "CuSn",
      "CuZn",
      "FeCo",
      "FeV",
      "Mg2Si",
      "Nb3Sn",
      "NiCr",
      "NiMo",
      "TiCu",
      "TiFe",
      "TiNi3",
      "ZrCu",
      "ZrNi",
      "CaTiO3",
      "BaZrO3",
      "LaNiO3",
      "LaMnO3",
      "SrVO3",
      "SrZrO3",
      "CaMnO3",
      "Mo2GaC",
      "Nb4AlC3",
      "V4AlC3"
    ]
  ];
}

function classifyFormula(formula) {
  const elements = uniqueElements(formula);
  const has = (element) => elements.includes(element);
  const allMetal = elements.every((element) => METAL_ELEMENTS.has(element));

  if (MAX_PHASES.has(formula)) {
    return { category: "Ceramic", subcategory: "MAX Phase Ceramic" };
  }
  if (elements.length === 1) {
    if (METAL_ELEMENTS.has(elements[0])) {
      return { category: "Metal", subcategory: "Pure Metal" };
    }
    return { category: "Ceramic", subcategory: "Elemental Semiconductor" };
  }
  if (SEMICONDUCTOR_FORMULAS.has(formula)) {
    return { category: "Ceramic", subcategory: "Electronic Ceramic" };
  }
  if (has("O")) {
    return { category: "Ceramic", subcategory: "Oxide Ceramic" };
  }
  if (has("N")) {
    return { category: "Ceramic", subcategory: "Nitride Ceramic" };
  }
  if (has("C")) {
    return { category: "Ceramic", subcategory: "Carbide Ceramic" };
  }
  if (has("B")) {
    return { category: "Ceramic", subcategory: "Boride Ceramic" };
  }
  if (has("Si") && allMetal) {
    return { category: "Ceramic", subcategory: "Silicide Ceramic" };
  }
  if (has("P") || has("As") || has("S") || has("Se") || has("Te")) {
    return { category: "Ceramic", subcategory: "Functional Ceramic" };
  }
  if (allMetal) {
    return {
      category: "Metal",
      subcategory: elements.length === 2 ? "Intermetallic Alloy" : "Complex Intermetallic"
    };
  }
  return { category: "Ceramic", subcategory: "Advanced Inorganic Solid" };
}

function deriveYoungsModulus(doc, category) {
  const bulk = doc.bulk_modulus?.vrh;
  const shear = doc.shear_modulus?.vrh;

  if (typeof bulk === "number" && typeof shear === "number" && 3 * bulk + shear !== 0) {
    return clamp((9 * bulk * shear) / (3 * bulk + shear), 5, 700);
  }

  return category === "Metal" ? 120 : 220;
}

function inferMaxServiceTemp(formula, category, subcategory) {
  const elements = uniqueElements(formula);
  const primary = elements[0];

  if (category === "Metal") {
    if (subcategory === "Pure Metal") {
      if (primary === "W") return 2000;
      if (primary === "Mo") return 1600;
      if (primary === "Ta") return 1400;
      if (primary === "Nb") return 1200;
      if (primary === "Re") return 1500;
      if (primary === "Hf") return 1100;
      if (primary === "Zr") return 700;
      if (primary === "Ti") return 260;
      if (primary === "Ni") return 315;
      if (primary === "Cr") return 700;
      if (primary === "Co") return 600;
      if (primary === "Fe") return 400;
      if (primary === "Cu") return 200;
      if (primary === "Ag") return 180;
      if (primary === "Au") return 250;
      if (primary === "Al") return 150;
      if (primary === "Mg") return 150;
      if (primary === "Pb") return 90;
      if (primary === "Sn") return 120;
      if (primary === "Zn") return 100;
      return 300;
    }

    if (formula.includes("Al") && (formula.includes("Ti") || formula.includes("Ni"))) {
      return 850;
    }
    if (formula.includes("Si")) {
      return 1000;
    }
    return 650;
  }

  if (MAX_PHASES.has(formula)) return 1200;
  if (subcategory === "Oxide Ceramic") return 1400;
  if (subcategory === "Nitride Ceramic") return formula === "AlN" ? 1200 : 1600;
  if (subcategory === "Carbide Ceramic") return 1800;
  if (subcategory === "Boride Ceramic") return 1700;
  if (subcategory === "Silicide Ceramic") return 1200;
  if (subcategory === "Functional Ceramic") return 850;
  if (subcategory === "Electronic Ceramic") return 900;
  return 1000;
}

function inferThermalExpansion(formula, category, subcategory) {
  const elements = uniqueElements(formula);
  const primary = elements[0];

  if (category === "Metal") {
    if (REFRACTORY_METALS.has(primary)) return 5.5;
    if (["Ti", "Zr", "Hf"].includes(primary)) return 8.8;
    if (["Al", "Mg"].includes(primary)) return 24;
    if (["Cu", "Ag", "Au"].includes(primary)) return 17.5;
    return 12;
  }

  if (MAX_PHASES.has(formula)) return 8;
  if (subcategory === "Oxide Ceramic") return 8;
  if (subcategory === "Nitride Ceramic") return 4.5;
  if (subcategory === "Carbide Ceramic") return 4.8;
  if (subcategory === "Boride Ceramic") return 5.4;
  if (subcategory === "Silicide Ceramic") return 7;
  if (subcategory === "Functional Ceramic") return 10;
  return 6;
}

function inferThermalConductivity(formula, category, subcategory) {
  const elements = uniqueElements(formula);
  const primary = elements[0];

  if (category === "Metal") {
    if (["Ag", "Cu", "Au"].includes(primary)) return 220;
    if (["Al", "Mg"].includes(primary)) return 140;
    if (REFRACTORY_METALS.has(primary)) return 120;
    return 45;
  }

  if (MAX_PHASES.has(formula)) return 28;
  if (formula === "AlN") return 140;
  if (CONDUCTIVE_CERAMICS.has(formula)) return 55;
  if (subcategory === "Oxide Ceramic") return 12;
  if (subcategory === "Nitride Ceramic") return 35;
  if (subcategory === "Carbide Ceramic") return 40;
  if (subcategory === "Boride Ceramic") return 50;
  if (subcategory === "Silicide Ceramic") return 25;
  if (subcategory === "Electronic Ceramic") return 10;
  return 8;
}

function inferSpecificHeat(formula, category) {
  const primary = uniqueElements(formula)[0];

  if (category === "Metal") {
    if (["Al", "Mg"].includes(primary)) return 0.9;
    if (["Ti", "Zr", "Hf"].includes(primary)) return 0.52;
    if (REFRACTORY_METALS.has(primary)) return 0.25;
    return 0.45;
  }

  if (formula === "B4C") return 0.95;
  if (formula === "AlN") return 0.74;
  return 0.72;
}

function inferResistivity(formula, category, bandGap) {
  const primary = uniqueElements(formula)[0];

  if (category === "Metal") {
    if (NOBLE_METALS.has(primary)) return 3e-8;
    if (["Al", "Cu", "Mg", "Zn"].includes(primary)) return 6e-8;
    if (REFRACTORY_METALS.has(primary)) return 1.5e-7;
    return formula.length <= 2 ? 1e-7 : 8e-7;
  }

  if (CONDUCTIVE_CERAMICS.has(formula) || MAX_PHASES.has(formula)) {
    return clamp(5e-6 * (1 + Math.max(0, bandGap || 0)), 3e-7, 8e-5);
  }
  if ((bandGap ?? 0) > 2) return 1e10;
  if ((bandGap ?? 0) > 0.5) return 10;
  return 1e-3;
}

function inferCorrosion(formula, category) {
  const elements = uniqueElements(formula);

  if (category === "Ceramic") {
    return "excellent";
  }
  if (elements.some((element) => NOBLE_METALS.has(element))) {
    return "excellent";
  }
  if (elements.some((element) => PASSIVATING_METALS.has(element))) {
    return "good";
  }
  if (elements.some((element) => ["Mg", "Zn"].includes(element))) {
    return "poor";
  }
  return "fair";
}

function inferMachinability(formula, category, subcategory) {
  const primary = uniqueElements(formula)[0];

  if (category === "Ceramic") {
    return MAX_PHASES.has(formula) ? "fair" : "poor";
  }
  if (SOFT_METALS.has(primary)) return "excellent";
  if (REFRACTORY_METALS.has(primary)) return "poor";
  if (subcategory === "Complex Intermetallic") return "poor";
  return "good";
}

function inferCost(formula, category, subcategory) {
  const composition = parseFormula(formula);
  const totalAtoms = composition.reduce((sum, entry) => sum + entry.count, 0);
  const weightedAverage =
    composition.reduce((sum, entry) => {
      const unitCost = ELEMENT_COSTS[entry.element] ?? 50;
      return sum + unitCost * entry.count;
    }, 0) / Math.max(1, totalAtoms);

  let multiplier = 1.2;
  if (category === "Ceramic") multiplier = 4.5;
  if (subcategory === "Nitride Ceramic") multiplier = 5.5;
  if (subcategory === "Carbide Ceramic") multiplier = 6;
  if (subcategory === "Boride Ceramic") multiplier = 6.5;
  if (subcategory === "Silicide Ceramic") multiplier = 5;
  if (subcategory === "Functional Ceramic") multiplier = 4;
  if (subcategory === "Electronic Ceramic") multiplier = 5;
  if (MAX_PHASES.has(formula)) multiplier = 7;
  if (subcategory === "Intermetallic Alloy") multiplier = 1.8;
  if (subcategory === "Complex Intermetallic") multiplier = 2.2;

  return clamp(Number((weightedAverage * multiplier).toFixed(2)), 0.8, 65000);
}

function inferStrengths(formula, category, subcategory, elasticModulus) {
  if (category === "Metal") {
    const tensile = clamp(
      Math.round(elasticModulus * (subcategory === "Pure Metal" ? 3.2 : 4.2)),
      subcategory === "Pure Metal" ? 120 : 250,
      1900
    );
    const yieldStrength = clamp(
      Math.round(tensile * (subcategory === "Pure Metal" ? 0.6 : 0.75)),
      60,
      tensile
    );
    const hardness = clamp(
      Math.round(elasticModulus * (subcategory === "Pure Metal" ? 1.1 : 1.6)),
      35,
      620
    );
    return { tensile, yieldStrength, hardness };
  }

  const factor = MAX_PHASES.has(formula) ? 2.4 : CONDUCTIVE_CERAMICS.has(formula) ? 2.7 : 2.1;
  const tensile = clamp(Math.round(elasticModulus * factor), 120, 2000);
  const hardness = clamp(
    Math.round(
      elasticModulus *
        (["Boride Ceramic", "Carbide Ceramic"].includes(subcategory) ? 4.8 : 4.1)
    ),
    350,
    3200
  );
  return { tensile, yieldStrength: tensile, hardness };
}

function buildTags(formula, category, subcategory, isStable, symmetry) {
  const tags = [formula, category.toLowerCase(), subcategory.toLowerCase().replace(/\s+/g, "-")];

  if (isStable) tags.push("stable-phase");
  if (symmetry) tags.push(symmetry.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  if (MAX_PHASES.has(formula)) tags.push("max-phase");
  if (CONDUCTIVE_CERAMICS.has(formula)) tags.push("conductive-ceramic");
  if (SEMICONDUCTOR_FORMULAS.has(formula)) tags.push("semiconductor");

  return [...new Set(tags.filter(Boolean))];
}

function convertDocToMaterial(doc) {
  const formula = String(doc.formula_pretty || "").replace(/\s+/g, "");
  if (!formula) {
    return null;
  }

  if (!isAlloyLikeFormula(formula)) {
    return null;
  }

  const { category, subcategory } = classifyFormula(formula);
  const elasticModulus = deriveYoungsModulus(doc, category);
  const { tensile, yieldStrength, hardness } = inferStrengths(
    formula,
    category,
    subcategory,
    elasticModulus
  );
  const maxService = inferMaxServiceTemp(formula, category, subcategory);
  const density = clamp(Number(doc.density ?? 5), 0.5, 22);
  const bandGap = typeof doc.band_gap === "number" ? doc.band_gap : 0;

  return {
    id: String(doc.material_id || `mp_${formula}`).replace(/-/g, "_"),
    name: `${formula} (${doc.symmetry?.symbol || "phase"}, ${doc.material_id})`,
    category,
    subcategory,
    density_g_cm3: Number(density.toFixed(3)),
    tensile_strength_mpa: tensile,
    yield_strength_mpa: yieldStrength,
    elastic_modulus_gpa: Number(elasticModulus.toFixed(1)),
    hardness_vickers: Math.round(hardness),
    thermal_conductivity_w_mk: Number(
      inferThermalConductivity(formula, category, subcategory).toFixed(2)
    ),
    specific_heat_j_gk: Number(inferSpecificHeat(formula, category).toFixed(2)),
    melting_point_c: Math.round(
      clamp(
        category === "Metal" ? maxService * 1.6 + 500 : maxService * 1.35 + 700,
        200,
        3800
      )
    ),
    glass_transition_c: null,
    max_service_temp_c: Math.round(maxService),
    thermal_expansion_ppm_k: Number(
      inferThermalExpansion(formula, category, subcategory).toFixed(1)
    ),
    electrical_resistivity_ohm_m: inferResistivity(formula, category, bandGap),
    corrosion_resistance: inferCorrosion(formula, category),
    machinability: inferMachinability(formula, category, subcategory),
    printability_fdm: "n/a",
    cost_usd_kg: inferCost(formula, category, subcategory),
    tags: buildTags(formula, category, subcategory, Boolean(doc.is_stable), doc.symmetry?.symbol),
    data_source: "Materials Project API",
    source_kind: "materials-project",
    formula_pretty: formula,
    material_id: doc.material_id,
    energy_above_hull:
      typeof doc.energy_above_hull === "number" ? doc.energy_above_hull : null,
    band_gap_eV: typeof doc.band_gap === "number" ? doc.band_gap : null,
    is_stable: Boolean(doc.is_stable)
  };
}

async function fetchChemsys(chemsys, apiKey) {
  const url = new URL(API_URL);
  url.searchParams.set("chemsys", chemsys);
  url.searchParams.set("nelements", String(chemsys.split("-").length));
  url.searchParams.set("_limit", "1000");
  url.searchParams.set("_fields", MP_FIELDS);

  const response = await fetch(url, {
    headers: {
      "X-API-KEY": apiKey,
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Materials Project request failed for ${chemsys}: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data ?? [];
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let index = 0;

  const runners = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(runners);
  return results;
}

function buildOutputTs(materials) {
  return [
    'import { Material } from "@/types";',
    "",
    `export const mpMaterialsGenerated: Material[] = ${JSON.stringify(materials, null, 2)};`,
    "",
    "export default mpMaterialsGenerated;",
    ""
  ].join("\n");
}

async function main() {
  const env = {
    ...loadEnvObject(path.join(ROOT, ".env.local")),
    ...process.env
  };
  const apiKey = env.MATERIALS_PROJECT_API_KEY;

  if (!apiKey) {
    throw new Error("MATERIALS_PROJECT_API_KEY not found in environment or .env.local");
  }

  const targetFormulas = [...new Set(buildTargetFormulaList())].sort();
  const chemsysList = [...new Set(targetFormulas.map((formula) => uniqueElements(formula).sort().join("-")))]
    .filter(Boolean)
    .sort();

  console.log(`Fetching ${chemsysList.length} chemical systems from Materials Project...`);

  const systemResults = await mapWithConcurrency(chemsysList, 6, async (chemsys, index) => {
    const docs = await fetchChemsys(chemsys, apiKey);
    console.log(`[${index + 1}/${chemsysList.length}] ${chemsys} -> ${docs.length} entries`);
    return {
      chemsys,
      docs
    };
  });

  const rawDocs = systemResults.flatMap((entry) =>
    entry.docs.map((doc) => ({
      chemsys: entry.chemsys,
      ...sortObjectKeys(doc)
    }))
  );

  const materials = rawDocs
    .map((doc) => convertDocToMaterial(doc))
    .filter(Boolean)
    .sort((left, right) => {
      const leftFormula = left.formula_pretty ?? left.name;
      const rightFormula = right.formula_pretty ?? right.name;
      if (leftFormula === rightFormula) {
        return (left.energy_above_hull ?? 1e9) - (right.energy_above_hull ?? 1e9);
      }
      return leftFormula.localeCompare(rightFormula);
    });

  mkdirSync(path.dirname(RAW_OUTPUT), { recursive: true });
  mkdirSync(path.dirname(TS_OUTPUT), { recursive: true });
  writeFileSync(RAW_OUTPUT, JSON.stringify(rawDocs, null, 2));
  writeFileSync(TS_OUTPUT, buildOutputTs(materials));

  const uniqueFormulas = new Set(materials.map((material) => material.formula_pretty ?? material.name));
  console.log(`Saved ${materials.length} raw MP phase entries across ${uniqueFormulas.size} formulas.`);
  console.log(`Raw cache: ${RAW_OUTPUT}`);
  console.log(`Generated TS: ${TS_OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
