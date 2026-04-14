import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const ALLOWED = new Set([
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
  "Ge",
  "Al2O3",
  "ZrO2",
  "SiC",
  "Si3N4",
  "AlN",
  "TiN",
  "TiC",
  "TiO2",
  "MgO",
  "BN",
  "TiB2",
  "ZrB2",
  "B4C",
  "WC",
  "ZrN",
  "HfO2",
  "CeO2",
  "Y2O3",
  "Cr2O3",
  "MoSi2",
  "Si",
  "GaAs",
  "GaN",
  "InP",
  "ZnO",
  "SnO2",
  "Ti3SiC2",
  "Ti3AlC2",
  "Ti2AlC",
  "Ti2AlN",
  "Cr2AlC",
  "V2AlC",
  "Nb2AlC"
]);

const filePath = resolve("src/lib/mp-materials-generated.ts");
let content = "";

try {
  content = readFileSync(filePath, "utf8");
} catch {
  console.log("No mp-materials-generated.ts found, skipping");
  process.exit(0);
}

const arrayMatch = content.match(/export const mpMaterialsDB:[^=]+=\s*(\[[\s\S]*?\]);(?:\s*export default[\s\S]*)?$/);
if (!arrayMatch) {
  console.error("Could not parse array from file");
  process.exit(1);
}

let materials = [];
try {
  materials = JSON.parse(arrayMatch[1]);
} catch (error) {
  console.error("JSON parse error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function extractFormula(name = "") {
  const cleaned = String(name).replace(/\s*\([^)]+\)/g, "").trim();
  const exactFormula = cleaned.match(/\b([A-Z][A-Za-z0-9]{0,9})\b$/)?.[1];
  if (exactFormula && ALLOWED.has(exactFormula)) {
    return exactFormula;
  }

  const anywhere = cleaned.match(/\b([A-Z][A-Za-z0-9]{0,9})\b/g) ?? [];
  return anywhere.find((token) => ALLOWED.has(token)) ?? cleaned;
}

function isMPEntry(material) {
  const source = String(material?.data_source ?? "").toLowerCase();
  return (
    String(material?.name ?? "").includes("(MP") ||
    source.includes("materials project") ||
    String(material?.id ?? "").startsWith("mp_") ||
    material?.source_kind === "materials-project" ||
    material?.source_kind === "mp"
  );
}

console.log(`Before cleanup: ${materials.length} materials`);

const cleaned = materials.filter((material) => {
  if (!isMPEntry(material)) {
    return true;
  }
  return ALLOWED.has(extractFormula(material.name));
});

console.log(`After whitelist filter: ${cleaned.length}`);

const seen = new Map();
for (const material of cleaned) {
  const formula = extractFormula(material.name);
  const current = seen.get(formula);
  if (
    !current ||
    (material.tensile_strength_mpa ?? 0) > (current.tensile_strength_mpa ?? 0)
  ) {
    seen.set(formula, material);
  }
}

const deduped = Array.from(seen.values());
console.log(`After dedup: ${deduped.length} unique materials`);

writeFileSync(
  filePath,
  `// AUTO-GENERATED - cleaned by scripts/cleanup-db.mjs\n` +
    `// Only real engineering materials kept\n` +
    `import type { Material } from "@/types";\n\n` +
    `export const mpMaterialsDB: Material[] = ${JSON.stringify(deduped, null, 2)};\n`
);

console.log("Cleaned src/lib/mp-materials-generated.ts");
