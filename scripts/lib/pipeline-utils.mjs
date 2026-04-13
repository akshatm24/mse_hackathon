import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const BASELINE_DB_PATH = path.join(ROOT, "scripts", "baseline-materials.json");
export const APP_DB_PATH = path.join(ROOT, "src", "lib", "materials-db.json");
export const MP_RAW_PATH = path.join(ROOT, "scripts", "mp-materials-raw.json");
export const MP_PROCESSED_PATH = path.join(ROOT, "scripts", "mp-processed.json");
export const SCRAPE_DIR = path.join(ROOT, "scripts", "scrape");
export const SCRAPED_MERGED_PATH = path.join(ROOT, "scripts", "scraped-materials-merged.json");
export const HARDCODED_PATH = path.join(ROOT, "scripts", "hardcoded-materials.json");

export const USER_AGENT =
  "SmartAlloySelectorResearch/1.0 (academic-hackathon)";

export function ensureDir(targetPath) {
  mkdirSync(targetPath, { recursive: true });
}

export function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

export function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function safeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function round(value, digits = 3) {
  if (!Number.isFinite(value)) {
    return null;
  }
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function maybeRound(value, digits = 3) {
  const num = safeNumber(value);
  return num === null ? null : round(num, digits);
}

export function slugify(value) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function normalizeName(value) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function uniqueStrings(values) {
  return [...new Set((values ?? []).filter(Boolean))];
}

export const BANNED_ELEMENTS = new Set([
  "Po",
  "Tc",
  "Pm",
  "At",
  "Ra",
  "Ac",
  "Pa",
  "U",
  "Np",
  "Pu",
  "Am",
  "Cm",
  "Bk",
  "Cf",
  "Es",
  "Fm",
  "Md",
  "No",
  "Lr",
  "Rf",
  "Db",
  "Sg",
  "Bh",
  "Hs",
  "Mt",
  "Ds",
  "Rg",
  "Cn",
  "Fr"
]);

export const ELEMENT_NAMES = {
  Ag: "Silver",
  Al: "Aluminum",
  As: "Arsenic",
  Au: "Gold",
  B: "Boron",
  Ba: "Barium",
  Be: "Beryllium",
  Bi: "Bismuth",
  C: "Carbon",
  Ca: "Calcium",
  Cd: "Cadmium",
  Ce: "Cerium",
  Co: "Cobalt",
  Cr: "Chromium",
  Cu: "Copper",
  Dy: "Dysprosium",
  Er: "Erbium",
  F: "Fluorine",
  Fe: "Iron",
  Ga: "Gallium",
  Gd: "Gadolinium",
  Ge: "Germanium",
  H: "Hydrogen",
  Hf: "Hafnium",
  In: "Indium",
  Ir: "Iridium",
  K: "Potassium",
  La: "Lanthanum",
  Li: "Lithium",
  Lu: "Lutetium",
  Mg: "Magnesium",
  Mn: "Manganese",
  Mo: "Molybdenum",
  N: "Nitrogen",
  Na: "Sodium",
  Nb: "Niobium",
  Nd: "Neodymium",
  Ni: "Nickel",
  O: "Oxygen",
  Os: "Osmium",
  P: "Phosphorus",
  Pb: "Lead",
  Pd: "Palladium",
  Pt: "Platinum",
  Re: "Rhenium",
  Rh: "Rhodium",
  Ru: "Ruthenium",
  S: "Sulfur",
  Sc: "Scandium",
  Se: "Selenium",
  Si: "Silicon",
  Sm: "Samarium",
  Sn: "Tin",
  Sr: "Strontium",
  Ta: "Tantalum",
  Tb: "Terbium",
  Te: "Tellurium",
  Ti: "Titanium",
  V: "Vanadium",
  W: "Tungsten",
  Y: "Yttrium",
  Yb: "Ytterbium",
  Zn: "Zinc",
  Zr: "Zirconium"
};

export const ELEMENT_DATA = {
  Ag: { thermalConductivity: 429, costPerKg: 900, meltingPointC: 962, resistivity: 1.6e-8 },
  Al: { thermalConductivity: 237, costPerKg: 2.5, meltingPointC: 660, resistivity: 2.7e-8 },
  Au: { thermalConductivity: 317, costPerKg: 62000, meltingPointC: 1064, resistivity: 2.4e-8 },
  Ba: { costPerKg: 3.5 },
  Be: { thermalConductivity: 200, costPerKg: 857, meltingPointC: 1287, resistivity: 4e-8 },
  Bi: { thermalConductivity: 8, costPerKg: 6.5, meltingPointC: 271, resistivity: 1.2e-6 },
  Ca: { costPerKg: 2 },
  Ce: { costPerKg: 2 },
  Co: { thermalConductivity: 100, costPerKg: 30, meltingPointC: 1495, resistivity: 6.2e-8 },
  Cr: { thermalConductivity: 94, costPerKg: 10, meltingPointC: 1907, resistivity: 1.3e-7 },
  Cu: { thermalConductivity: 401, costPerKg: 9, meltingPointC: 1085, resistivity: 1.7e-8 },
  Dy: { costPerKg: 257 },
  Er: { costPerKg: 26 },
  Fe: { thermalConductivity: 22, costPerKg: 0.5, meltingPointC: 1538, resistivity: 1e-7 },
  Ga: { thermalConductivity: 41, costPerKg: 222, meltingPointC: 30, resistivity: 1.4e-7 },
  Gd: { costPerKg: 28 },
  Ge: { thermalConductivity: 60, costPerKg: 1000, meltingPointC: 938, resistivity: 4.6e-1 },
  Hf: { thermalConductivity: 23, costPerKg: 900, meltingPointC: 2233, resistivity: 3.3e-7 },
  In: { thermalConductivity: 82, costPerKg: 167, meltingPointC: 157, resistivity: 8.4e-8 },
  Ir: { thermalConductivity: 147, costPerKg: 52000, meltingPointC: 2446 },
  K: { costPerKg: 2.5 },
  La: { costPerKg: 2 },
  Li: { costPerKg: 15 },
  Lu: { costPerKg: 700 },
  Mg: { thermalConductivity: 156, costPerKg: 2, meltingPointC: 650, resistivity: 4.4e-8 },
  Mn: { thermalConductivity: 7.8, costPerKg: 2, meltingPointC: 1246 },
  Mo: { thermalConductivity: 138, costPerKg: 40, meltingPointC: 2623, resistivity: 5.3e-8 },
  Na: { costPerKg: 2.5 },
  Nb: { thermalConductivity: 54, costPerKg: 42, meltingPointC: 2477, resistivity: 1.5e-7 },
  Nd: { costPerKg: 70 },
  Ni: { thermalConductivity: 91, costPerKg: 14, meltingPointC: 1455, resistivity: 6.9e-8 },
  Os: { thermalConductivity: 88, costPerKg: 12000, meltingPointC: 3033 },
  Pb: { thermalConductivity: 35, costPerKg: 2.2, meltingPointC: 327, resistivity: 2.2e-7 },
  Pd: { thermalConductivity: 72, costPerKg: 49000, meltingPointC: 1555, resistivity: 1.1e-7 },
  Pt: { thermalConductivity: 72, costPerKg: 31000, meltingPointC: 1768, resistivity: 1.1e-7 },
  Re: { thermalConductivity: 48, costPerKg: 3500, meltingPointC: 3186, resistivity: 1.9e-7 },
  Rh: { thermalConductivity: 150, costPerKg: 147000, meltingPointC: 1964 },
  Ru: { thermalConductivity: 117, costPerKg: 14000, meltingPointC: 2334 },
  Sc: { thermalConductivity: 16, costPerKg: 3500, meltingPointC: 1541 },
  Si: { thermalConductivity: 149, costPerKg: 2, meltingPointC: 1414, resistivity: 6.4e-2 },
  Sm: { costPerKg: 14 },
  Sn: { thermalConductivity: 67, costPerKg: 25, meltingPointC: 232, resistivity: 1.1e-7 },
  Sr: { costPerKg: 4 },
  Ta: { thermalConductivity: 57, costPerKg: 152, meltingPointC: 3017, resistivity: 1.3e-7 },
  Tb: { costPerKg: 850 },
  Ti: { thermalConductivity: 22, costPerKg: 11, meltingPointC: 1668, resistivity: 4.2e-7 },
  V: { thermalConductivity: 31, costPerKg: 29, meltingPointC: 1910, resistivity: 2e-7 },
  W: { thermalConductivity: 173, costPerKg: 35, meltingPointC: 3422, resistivity: 5.3e-8 },
  Y: { thermalConductivity: 17, costPerKg: 31, meltingPointC: 1522 },
  Yb: { costPerKg: 7.5 },
  Zn: { thermalConductivity: 116, costPerKg: 2.5, meltingPointC: 420, resistivity: 5.9e-8 },
  Zr: { thermalConductivity: 23, costPerKg: 37, meltingPointC: 1855, resistivity: 4e-7 }
};

export const COMPOUND_DATA = {
  Al2O3: { name: "Alumina", thermalConductivity: 30, meltingPointC: 2072, category: "Ceramic" },
  SiC: { name: "Silicon Carbide", thermalConductivity: 120, meltingPointC: 2830, category: "Ceramic" },
  Si3N4: { name: "Silicon Nitride", thermalConductivity: 30, meltingPointC: 1900, category: "Ceramic" },
  AlN: { name: "Aluminum Nitride", thermalConductivity: 180, meltingPointC: 2200, category: "Ceramic" },
  TiN: { name: "Titanium Nitride", thermalConductivity: 29, meltingPointC: 2950, category: "Ceramic" },
  TiC: { name: "Titanium Carbide", thermalConductivity: 21, meltingPointC: 3160, category: "Ceramic" },
  WC: { name: "Tungsten Carbide", thermalConductivity: 110, meltingPointC: 2870, category: "Ceramic" },
  ZrO2: { name: "Zirconia", thermalConductivity: 2, meltingPointC: 2715, category: "Ceramic" },
  MgO: { name: "Magnesia", thermalConductivity: 60, meltingPointC: 2852, category: "Ceramic" },
  BN: { name: "Boron Nitride", thermalConductivity: 30, meltingPointC: 2973, category: "Ceramic" },
  TiB2: { name: "Titanium Diboride", thermalConductivity: 60, meltingPointC: 3225, category: "Ceramic" },
  ZrB2: { name: "Zirconium Diboride", thermalConductivity: 60, meltingPointC: 3245, category: "Ceramic" },
  B4C: { name: "Boron Carbide", thermalConductivity: 35, meltingPointC: 2763, category: "Ceramic" },
  GaAs: { name: "Gallium Arsenide", category: "Ceramic" },
  InP: { name: "Indium Phosphide", category: "Ceramic" },
  GaN: { name: "Gallium Nitride", category: "Ceramic" },
  InN: { name: "Indium Nitride", category: "Ceramic" },
  GaP: { name: "Gallium Phosphide", category: "Ceramic" },
  InAs: { name: "Indium Arsenide", category: "Ceramic" },
  ZnSe: { name: "Zinc Selenide", category: "Ceramic" },
  ZnS: { name: "Zinc Sulfide", category: "Ceramic" },
  CdTe: { name: "Cadmium Telluride", category: "Ceramic" },
  CdS: { name: "Cadmium Sulfide", category: "Ceramic" },
  CdSe: { name: "Cadmium Selenide", category: "Ceramic" },
  ZnTe: { name: "Zinc Telluride", category: "Ceramic" },
  MgF2: { name: "Magnesium Fluoride", category: "Ceramic" },
  CaF2: { name: "Calcium Fluoride", category: "Ceramic" },
  LaF3: { name: "Lanthanum Fluoride", category: "Ceramic" },
  BaF2: { name: "Barium Fluoride", category: "Ceramic" },
  LiF: { name: "Lithium Fluoride", category: "Ceramic" },
  AlF3: { name: "Aluminum Fluoride", category: "Ceramic" },
  YF3: { name: "Yttrium Fluoride", category: "Ceramic" },
  NiAl: { name: "Nickel Aluminide", category: "Metal" },
  Ni3Al: { name: "Gamma-prime Nickel Superalloy Phase", category: "Metal" },
  TiAl: { name: "Gamma-TiAl Intermetallic", category: "Metal" },
  Ti3Al: { name: "Alpha-2 Titanium Aluminide", category: "Metal" },
  Cu3Au: { name: "Ordered CuAu Alloy", category: "Metal" },
  Fe3Pt: { name: "FePt Magnet", category: "Metal" },
  MoSi2: { name: "Molybdenum Disilicide", thermalConductivity: 52, category: "Ceramic" },
  WSi2: { name: "Tungsten Silicide", category: "Ceramic" },
  CoAl: { name: "Cobalt Aluminide", category: "Metal" },
  FeAl: { name: "Iron Aluminide", category: "Metal" },
  FeSi: { name: "Iron Silicide Thermoelectric", category: "Metal" },
  FeSi2: { name: "Iron Disilicide Thermoelectric", category: "Metal" },
  Mg2Si: { name: "Magnesium Silicide Thermoelectric", category: "Ceramic" },
  Mg2Sn: { name: "Magnesium Stannide", category: "Ceramic" },
  PbTe: { name: "Lead Telluride", category: "Ceramic" },
  Bi2Te3: { name: "Bismuth Telluride", category: "Ceramic" },
  SnTe: { name: "Tin Telluride", category: "Ceramic" },
  GeTe: { name: "Germanium Telluride", category: "Ceramic" },
  Cu2Se: { name: "Copper Selenide", category: "Ceramic" },
  CoSb3: { name: "Skutterudite", category: "Ceramic" },
  ZrNiSn: { name: "Half-Heusler Thermoelectric", category: "Metal" },
  NiTi: { name: "Nitinol", category: "Metal" },
  CuZn: { name: "Brass Family", category: "Metal" },
  CuSn: { name: "Bronze Family", category: "Metal" },
  CuNi: { name: "Cupronickel", category: "Metal" },
  FeNi: { name: "Invar/Permalloy Family", category: "Metal" },
  FeCo: { name: "Permendur", category: "Metal" },
  NiCo: { name: "Nickel-Cobalt Alloy", category: "Metal" },
  NiFe: { name: "Permalloy", category: "Metal" }
};

export const ENGINEERING_METALS = new Set([
  "Fe",
  "Ni",
  "Co",
  "Cr",
  "Cu",
  "Al",
  "Ti",
  "W",
  "Mo",
  "Nb",
  "Ta",
  "V",
  "Zr",
  "Hf",
  "Pt",
  "Au",
  "Ag",
  "Pd",
  "Re",
  "Pb",
  "Sn",
  "Zn",
  "Mg",
  "Be",
  "Bi",
  "In",
  "Ga",
  "Mn",
  "Si",
  "Ge",
  "Ru",
  "Ir",
  "Os",
  "Rh",
  "Sc",
  "Y",
  "Ca",
  "Ba",
  "Sr",
  "Li",
  "Na",
  "K"
]);

export const OXIDE_METALS = new Set([
  "Al",
  "Si",
  "Ti",
  "Zr",
  "Mg",
  "Ca",
  "Y",
  "Ce",
  "La",
  "Hf",
  "Cr",
  "Fe",
  "Ni",
  "Cu",
  "Mn",
  "Co",
  "W",
  "Mo",
  "Nb",
  "Ta",
  "V",
  "Ba",
  "Zn",
  "Sn",
  "Pb",
  "Bi",
  "Ga",
  "In",
  "Sc",
  "Lu",
  "Dy",
  "Er",
  "Nd",
  "Sm",
  "Gd",
  "Tb",
  "Yb"
]);

export const CARBIDE_METALS = new Set(["Ti", "W", "Si", "B", "Cr", "Mo", "Nb", "V", "Zr", "Hf", "Ta", "Fe", "Al", "Ca"]);
export const NITRIDE_METALS = new Set(["Ti", "Si", "Al", "B", "Cr", "Mo", "W", "Zr", "Hf", "Nb", "V", "Ga", "In", "Ge"]);
export const BORIDE_METALS = new Set(["Ti", "Zr", "Hf", "W", "Mo", "Cr", "Nb", "Ta", "V", "Al", "Mg", "La", "Ce", "Nd"]);
export const SILICIDE_METALS = new Set(["Mo", "W", "Ti", "Cr", "Nb", "Ta", "Re", "Fe", "Ni", "Co", "Mn"]);
export const FLUORIDE_METALS = new Set(["Mg", "Ca", "La", "Ba", "Li", "Al", "Y"]);
export const SEMICONDUCTOR_CATIONS = new Set(["Ga", "In", "Cd", "Zn"]);
export const SEMICONDUCTOR_ANIONS = new Set(["As", "P", "N", "S", "Se", "Te"]);
export const MAX_M_ELEMENTS = new Set(["Ti", "Cr", "V", "Nb", "Ta", "Zr"]);
export const MAX_A_ELEMENTS = new Set(["Al", "Si", "Sn", "Ge", "In"]);
export const MAX_X_ELEMENTS = new Set(["C", "N"]);

export function parseFormula(formula) {
  if (!formula) {
    return {};
  }

  const clean = formula.replace(/\s+/g, "").replace(/\[|\]/g, "");
  let index = 0;

  function parseNumber() {
    const match = clean.slice(index).match(/^(\d+(?:\.\d+)?)/);
    if (!match) {
      return 1;
    }
    index += match[1].length;
    return Number.parseFloat(match[1]);
  }

  function parseGroup() {
    const counts = {};

    while (index < clean.length) {
      const token = clean[index];

      if (token === "(") {
        index += 1;
        const inner = parseGroup();
        const multiplier = parseNumber();
        for (const [element, count] of Object.entries(inner)) {
          counts[element] = (counts[element] ?? 0) + count * multiplier;
        }
        continue;
      }

      if (token === ")") {
        index += 1;
        break;
      }

      if (token === "·" || token === ".") {
        index += 1;
        continue;
      }

      if (!/[A-Z]/.test(token)) {
        index += 1;
        continue;
      }

      let symbol = token;
      index += 1;
      if (/[a-z]/.test(clean[index] ?? "")) {
        symbol += clean[index];
        index += 1;
      }

      const count = parseNumber();
      counts[symbol] = (counts[symbol] ?? 0) + count;
    }

    return counts;
  }

  return parseGroup();
}

export function getDistinctElements(formula) {
  return Object.keys(parseFormula(formula));
}

function gcd(a, b) {
  return b < 1e-9 ? a : gcd(b, a % b);
}

export function reducedComposition(parsedFormula) {
  const entries = Object.entries(parsedFormula ?? {}).filter(([, count]) => count > 0);
  if (entries.length === 0) {
    return {};
  }

  const scaled = entries.map(([, count]) => Math.round(count * 1000));
  const divisor = scaled.reduce((acc, value) => gcd(acc, value), scaled[0]);
  const reduced = {};

  for (const [element, count] of entries) {
    reduced[element] = divisor > 0 ? Math.round((count * 1000) / divisor) : count;
  }

  return reduced;
}

export function compositionSignature(formula) {
  const reduced = reducedComposition(parseFormula(formula));
  return Object.entries(reduced)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([element, count]) => `${element}${count}`)
    .join("|");
}

export function isMaxPhase(formula) {
  const reduced = reducedComposition(parseFormula(formula));
  const elements = Object.keys(reduced);
  if (elements.length !== 3) {
    return false;
  }

  const sorted = Object.entries(reduced).sort(([, a], [, b]) => b - a);
  const [first, second, third] = sorted;
  const elementSet = new Set(elements);
  const m = elements.find((element) => MAX_M_ELEMENTS.has(element));
  const a = elements.find((element) => MAX_A_ELEMENTS.has(element));
  const x = elements.find((element) => MAX_X_ELEMENTS.has(element));

  if (!m || !a || !x) {
    return false;
  }

  if (!elementSet.has(m) || !elementSet.has(a) || !elementSet.has(x)) {
    return false;
  }

  const mCount = reduced[m];
  const aCount = reduced[a];
  const xCount = reduced[x];
  return aCount === 1 && (mCount === xCount + 1 || mCount * 2 === xCount + 2);
}

function onlyHasElements(parsedFormula, allowed) {
  return Object.keys(parsedFormula).every((element) => allowed.has(element));
}

function elementsWithout(parsedFormula, excluded) {
  return Object.keys(parsedFormula).filter((element) => element !== excluded);
}

export function detectEngineeringFamily(formula, parsedFormula, entry = {}) {
  const elements = Object.keys(parsedFormula);

  if (elements.length === 1 && ENGINEERING_METALS.has(elements[0])) {
    return "pure-metal";
  }

  if (isMaxPhase(formula)) {
    return "max-phase";
  }

  if (elements.includes("O") && onlyHasElements(parsedFormula, new Set([...OXIDE_METALS, "O"]))) {
    return "oxide";
  }

  if (elements.includes("C") && onlyHasElements(parsedFormula, new Set([...CARBIDE_METALS, "C"]))) {
    return "carbide";
  }

  if (elements.includes("N") && onlyHasElements(parsedFormula, new Set([...NITRIDE_METALS, "N"]))) {
    return "nitride";
  }

  if (elements.includes("B") && onlyHasElements(parsedFormula, new Set([...BORIDE_METALS, "B"]))) {
    return "boride";
  }

  if (elements.includes("Si") && onlyHasElements(parsedFormula, new Set([...SILICIDE_METALS, "Si"]))) {
    return "silicide";
  }

  if (elements.includes("F") && onlyHasElements(parsedFormula, new Set([...FLUORIDE_METALS, "F"]))) {
    return "fluoride";
  }

  const hasSemiCation = elements.some((element) => SEMICONDUCTOR_CATIONS.has(element));
  const hasSemiAnion = elements.some((element) => SEMICONDUCTOR_ANIONS.has(element));
  if (hasSemiCation && hasSemiAnion) {
    return "semiconductor";
  }

  const directKey = formula.replace(/\s+/g, "");
  if (COMPOUND_DATA[directKey]) {
    return "commercial-intermetallic";
  }

  const signature = compositionSignature(formula);
  const commercialSignature = Object.keys(COMPOUND_DATA).find(
    (key) => compositionSignature(key) === signature && COMPOUND_DATA[key].category === "Metal"
  );
  if (commercialSignature) {
    return "commercial-intermetallic";
  }

  if (entry.is_metal && elements.every((element) => ENGINEERING_METALS.has(element))) {
    return "intermetallic";
  }

  return null;
}

export function isEngineeringRelevantEntry(entry, maxEnergy = 0.025) {
  const energy = safeNumber(entry.energy_above_hull) ?? 999;
  const density = safeNumber(entry.density) ?? 0;
  const parsedFormula = parseFormula(entry.formula_pretty);
  const elements = Object.keys(parsedFormula);

  if (entry.theoretical === true) {
    return false;
  }
  if (energy > maxEnergy) {
    return false;
  }
  if (density <= 0.5) {
    return false;
  }
  if (elements.some((element) => BANNED_ELEMENTS.has(element))) {
    return false;
  }
  if (elements.length > 4) {
    return false;
  }

  return Boolean(detectEngineeringFamily(entry.formula_pretty, parsedFormula, entry));
}

export function categoryFromFormula(formula, isMetal) {
  const family = detectEngineeringFamily(formula, parseFormula(formula), { is_metal: isMetal });
  if (family === "pure-metal" || family === "commercial-intermetallic" || family === "intermetallic") {
    return "Metal";
  }
  return isMetal ? "Metal" : "Ceramic";
}

export function commercialNameForFormula(formula) {
  const direct = COMPOUND_DATA[formula.replace(/\s+/g, "")];
  if (direct?.name) {
    return direct.name;
  }

  const signature = compositionSignature(formula);
  const match = Object.entries(COMPOUND_DATA).find(([key]) => compositionSignature(key) === signature);
  return match?.[1]?.name ?? null;
}

export function elementCostWeighted(formula) {
  const parsed = parseFormula(formula);
  const entries = Object.entries(parsed);
  if (entries.length === 0) {
    return null;
  }

  let total = 0;
  let weight = 0;
  for (const [element, count] of entries) {
    const cost = ELEMENT_DATA[element]?.costPerKg;
    if (!Number.isFinite(cost)) {
      return null;
    }
    total += cost * count;
    weight += count;
  }

  if (weight <= 0) {
    return null;
  }

  return total / weight;
}

export function corrosionFromComposition(formula, family) {
  const parsed = parseFormula(formula);
  const entries = Object.entries(parsed);
  const totalAtoms = entries.reduce((sum, [, count]) => sum + count, 0) || 1;

  const fraction = (element) => (parsed[element] ?? 0) / totalAtoms;
  if (family === "oxide" || family === "nitride" || family === "fluoride") {
    return "excellent";
  }
  if (family === "carbide" || family === "boride") {
    return "good";
  }
  if (
    fraction("Ti") > 0 ||
    fraction("Zr") > 0 ||
    fraction("Ta") > 0 ||
    fraction("Pt") > 0 ||
    fraction("Au") > 0 ||
    fraction("Pd") > 0 ||
    fraction("Ir") > 0 ||
    fraction("Cr") > 0.2
  ) {
    return "excellent";
  }
  if (fraction("Cr") > 0.1) {
    return "good";
  }
  if (fraction("Fe") > 0.5 && Object.keys(parsed).length <= 2) {
    return "poor";
  }
  return "fair";
}

export function serviceTemperatureFromFormula(formula, family) {
  const direct = COMPOUND_DATA[formula.replace(/\s+/g, "")]?.meltingPointC;
  const parsed = parseFormula(formula);
  const elements = Object.keys(parsed);

  if (elements.length === 1) {
    const melt = ELEMENT_DATA[elements[0]]?.meltingPointC;
    return Number.isFinite(melt) ? round(melt * 0.5, 0) : null;
  }

  if (Number.isFinite(direct)) {
    if (family === "oxide") return round(direct * 0.7, 0);
    if (family === "carbide" || family === "nitride" || family === "boride") return round(direct * 0.6, 0);
    return round(direct * 0.5, 0);
  }

  return null;
}

export function conductivityFromFormula(formula) {
  const directKey = formula.replace(/\s+/g, "");
  if (Number.isFinite(COMPOUND_DATA[directKey]?.thermalConductivity)) {
    return COMPOUND_DATA[directKey].thermalConductivity;
  }

  const parsed = parseFormula(formula);
  const elements = Object.keys(parsed);
  if (elements.length === 1) {
    return ELEMENT_DATA[elements[0]]?.thermalConductivity ?? null;
  }

  return null;
}

export function resistivityFromFormula(formula, bandGap) {
  const parsed = parseFormula(formula);
  const elements = Object.keys(parsed);
  if (elements.length === 1) {
    return ELEMENT_DATA[elements[0]]?.resistivity ?? null;
  }

  if (typeof bandGap === "number" && bandGap > 4) {
    return null;
  }

  return null;
}

export function sourceKindFromSource(source) {
  const value = Array.isArray(source) ? source[0] : source;
  if (!value) return "curated";
  if (value === "MP") return "materials-project";
  return "curated";
}

export function normalizeMaterial(input) {
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    subcategory: input.subcategory ?? "",
    density_g_cm3: safeNumber(input.density_g_cm3),
    tensile_strength_mpa: safeNumber(input.tensile_strength_mpa),
    yield_strength_mpa: safeNumber(input.yield_strength_mpa),
    elastic_modulus_gpa: safeNumber(input.elastic_modulus_gpa),
    hardness_vickers: safeNumber(input.hardness_vickers),
    hardness_rockwell_c: safeNumber(input.hardness_rockwell_c),
    hardness_brinell: safeNumber(input.hardness_brinell),
    elongation_pct: safeNumber(input.elongation_pct),
    thermal_conductivity_w_mk: safeNumber(input.thermal_conductivity_w_mk),
    specific_heat_j_gk: safeNumber(input.specific_heat_j_gk),
    melting_point_c: safeNumber(input.melting_point_c),
    glass_transition_c: safeNumber(input.glass_transition_c),
    max_service_temp_c: safeNumber(input.max_service_temp_c),
    thermal_expansion_ppm_k: safeNumber(input.thermal_expansion_ppm_k),
    electrical_resistivity_ohm_m: safeNumber(input.electrical_resistivity_ohm_m),
    flexural_strength_mpa: safeNumber(input.flexural_strength_mpa),
    compressive_strength_mpa: safeNumber(input.compressive_strength_mpa),
    poissons_ratio: safeNumber(input.poissons_ratio),
    fracture_toughness_mpa_m05: safeNumber(input.fracture_toughness_mpa_m05),
    corrosion_resistance: input.corrosion_resistance ?? null,
    machinability: input.machinability ?? "n/a",
    printability_fdm: input.printability_fdm ?? "n/a",
    cost_usd_kg: safeNumber(input.cost_usd_kg),
    tags: uniqueStrings(input.tags),
    data_source: input.data_source ?? "",
    source: input.source ?? input.data_source ?? "Curated",
    source_url: input.source_url ?? null,
    scrape_url: input.scrape_url ?? null,
    data_quality: input.data_quality ?? "experimental",
    source_kind: input.source_kind ?? sourceKindFromSource(input.source),
    formula_pretty: input.formula_pretty ?? null,
    material_id: input.material_id ?? null,
    energy_above_hull: safeNumber(input.energy_above_hull),
    band_gap_eV: safeNumber(input.band_gap_eV),
    is_stable: typeof input.is_stable === "boolean" ? input.is_stable : undefined,
    standards: uniqueStrings(input.standards),
    data_enriched_from_mp: Boolean(input.data_enriched_from_mp),
    biocompatible: Boolean(input.biocompatible),
    magnetic: typeof input.magnetic === "boolean" ? input.magnetic : undefined,
    fdm_printable:
      typeof input.fdm_printable === "boolean"
        ? input.fdm_printable
        : input.printability_fdm && input.printability_fdm !== "n/a" && input.printability_fdm !== "poor"
  };
}

export function materialFormulaKey(material) {
  if (material.formula_pretty) {
    return material.formula_pretty.replace(/\s+/g, "");
  }

  const match = material.name.match(/\(([A-Z][A-Za-z0-9]+)\)/);
  return match ? match[1] : null;
}

export function mergeSources(existingSource, incomingSource) {
  const current = Array.isArray(existingSource) ? existingSource : existingSource ? [existingSource] : [];
  const next = Array.isArray(incomingSource) ? incomingSource : incomingSource ? [incomingSource] : [];
  const merged = uniqueStrings([...current, ...next]);
  return merged.length <= 1 ? merged[0] ?? null : merged;
}

export function countKnownCoreFields(material) {
  return [
    material.density_g_cm3,
    material.tensile_strength_mpa,
    material.yield_strength_mpa,
    material.elastic_modulus_gpa,
    material.thermal_conductivity_w_mk,
    material.max_service_temp_c,
    material.electrical_resistivity_ohm_m,
    material.cost_usd_kg
  ].filter((value) => value !== null && value !== undefined).length;
}

export function mergeMaterialRecords(base, incoming, options = {}) {
  const overwrite = options.overwrite === true;
  const merged = { ...base };

  for (const [key, value] of Object.entries(incoming)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    if (key === "tags" || key === "standards") {
      merged[key] = uniqueStrings([...(merged[key] ?? []), ...value]);
      continue;
    }

    if (key === "source") {
      merged.source = mergeSources(merged.source, value);
      continue;
    }

    if (key === "data_source") {
      merged.data_source = uniqueStrings(
        [merged.data_source, value].filter(Boolean).flatMap((entry) => String(entry).split(" | "))
      ).join(" | ");
      continue;
    }

    if (overwrite || merged[key] === null || merged[key] === undefined || merged[key] === "") {
      merged[key] = value;
    }
  }

  return normalizeMaterial(merged);
}

export const SOURCE_PRIORITY = {
  MatWeb: 5,
  Manufacturer: 4,
  SpecialMetals: 4,
  Haynes: 4,
  Carpenter: 4,
  ATI: 4,
  AZoM: 3,
  Wikipedia: 2,
  EngineeringToolbox: 1,
  NIST: 4,
  MP: 0
};

export function sourceRank(source) {
  const first = Array.isArray(source) ? source[0] : source;
  return SOURCE_PRIORITY[first] ?? 0;
}

export function pickPreferredMaterial(left, right) {
  const leftRank = sourceRank(left.source);
  const rightRank = sourceRank(right.source);
  if (leftRank !== rightRank) {
    return leftRank >= rightRank ? left : right;
  }
  return countKnownCoreFields(left) >= countKnownCoreFields(right) ? left : right;
}
