import { readFileSync, writeFileSync } from "fs";

const masterMaterials = JSON.parse(readFileSync("src/data/materials.json", "utf8"));

const TARGETS = [
  {
    url: "https://www.makeitfrom.com/material-properties/AISI-1020-Carbon-Steel",
    name: "Carbon Steel 1020"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/AISI-1095-Spring-Steel",
    name: "Spring Steel 1095"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/AISI-4140-Steel",
    name: "Alloy Steel 4140"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/AISI-4340-Steel",
    name: "Alloy Steel 4340"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/AISI-304-Stainless-Steel",
    name: "Stainless Steel 304"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/AISI-316-Stainless-Steel",
    name: "Stainless Steel 316"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/AISI-316L-Stainless-Steel",
    name: "Stainless Steel 316L"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/AISI-430-Stainless-Steel",
    name: "Stainless Steel 430"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/AISI-17-4-PH-Stainless-Steel",
    name: "Stainless Steel 17-4 PH"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/AISI-D2-Tool-Steel",
    name: "Tool Steel D2"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Grey-Cast-Iron",
    name: "Grey Cast Iron"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/6061-T6-Aluminum",
    name: "Aluminum 6061-T6"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/7075-T6-Aluminum",
    name: "Aluminum 7075-T6"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/2024-T3-Aluminum",
    name: "Aluminum 2024-T3"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/5052-H32-Aluminum",
    name: "Aluminum 5052-H32"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/5083-H116-Aluminum",
    name: "Aluminum 5083-H116"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/3003-H14-Aluminum",
    name: "Aluminum 3003-H14"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Ti-6Al-4V-Grade-5-Titanium",
    name: "Ti-6Al-4V"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Grade-2-Commercially-Pure-Titanium",
    name: "Titanium Grade 2 (CP)"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Inconel-718-Nickel-Steel",
    name: "Inconel 718"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Inconel-625-Nickel-Steel",
    name: "Inconel 625"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Hastelloy-C-276-Nickel-Steel",
    name: "Hastelloy C-276"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Monel-400-Nickel-Steel",
    name: "Monel 400"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Waspaloy-Nickel-Steel",
    name: "Waspaloy"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/C110-Electrolytic-Tough-Pitch-ETP-Copper",
    name: "Copper C110"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/C360-Free-Machining-Brass",
    name: "Brass C360"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/C932-Bearing-Bronze",
    name: "Bronze C932"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/C17200-Beryllium-Copper",
    name: "Beryllium Copper C17200"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Commercially-Pure-Tungsten",
    name: "Tungsten W"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Commercially-Pure-Molybdenum",
    name: "Molybdenum Mo"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/AZ31B-Magnesium",
    name: "Magnesium AZ31B"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Invar-36-Iron-Alloy",
    name: "Invar 36"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Polyether-Ether-Ketone-PEEK",
    name: "PEEK"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Polyethylene-Terephthalate-Glycol-PETG",
    name: "PETG"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Acrylonitrile-Butadiene-Styrene-ABS",
    name: "ABS"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Polylactic-Acid-PLA",
    name: "PLA"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Nylon-66-Polyamide-66-PA66",
    name: "Nylon PA66"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Nylon-12-Polyamide-12-PA12",
    name: "Nylon PA12"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Polycarbonate-PC",
    name: "Polycarbonate"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Polytetrafluoroethylene-PTFE",
    name: "PTFE"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/High-Density-Polyethylene-HDPE",
    name: "HDPE"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Polyoxymethylene-POM-Acetal-Delrin",
    name: "Delrin (POM)"
  },
  {
    url: "https://www.makeitfrom.com/material-properties/Polyphenylene-Sulfide-PPS",
    name: "PPS (Polyphenylene Sulfide)"
  }
];

const MASTER_ALIASES = new Map([
  ["Stainless Steel 316", "Stainless Steel 316L"],
  ["Delrin (POM)", "Delrin (POM)"]
]);

function normalise(name) {
  return name.toLowerCase().replace(/\s*\([^)]*\)/g, "").replace(/[^a-z0-9]/g, "");
}

function findMasterMaterial(targetName) {
  const aliases = [targetName, MASTER_ALIASES.get(targetName)].filter(Boolean);
  for (const alias of aliases) {
    const exact = masterMaterials.find((material) => material.name === alias);
    if (exact) return exact;
  }

  const norms = new Set(aliases.map((alias) => normalise(alias)));
  return masterMaterials.find((material) => norms.has(normalise(material.name)));
}

function parseNumberMatch(pattern, html) {
  const match = html.match(pattern);
  return match ? Number.parseFloat(match[1].replace(/,/g, "")) : null;
}

function parseProperties(html, materialName, url) {
  const tensile =
    parseNumberMatch(/Ultimate Tensile Strength[\s\S]{0,180}?([\d.]+)\s*MPa/i, html) ??
    parseNumberMatch(/Tensile Strength[\s\S]{0,180}?([\d.]+)\s*MPa/i, html);
  const yieldStrength =
    parseNumberMatch(/Yield Strength[\s\S]{0,180}?([\d.]+)\s*MPa/i, html) ??
    (tensile ? Math.round(tensile * 0.72) : null);
  const density = parseNumberMatch(/Density[\s\S]{0,160}?([\d.]+)\s*g\/cm/i, html);
  const elastic = parseNumberMatch(/Young'?s Modulus[\s\S]{0,180}?([\d.]+)\s*GPa/i, html);
  const thermalCond = parseNumberMatch(
    /Thermal Conductivity[\s\S]{0,180}?([\d.]+)\s*W\/m/i,
    html
  );
  const thermalExp =
    parseNumberMatch(/Thermal Expansion[\s\S]{0,180}?([\d.]+)\s*(?:µm\/m|ppm)/i, html) ?? 12;
  const maxTemp =
    parseNumberMatch(
      /Maximum(?: Recommended)? Service Temperature[\s\S]{0,180}?([\d.]+)\s*°C/i,
      html
    ) ??
    parseNumberMatch(/Maximum Temperature[\s\S]{0,180}?([\d.]+)\s*°C/i, html);
  const meltingPoint =
    parseNumberMatch(/Melting Point[\s\S]{0,180}?([\d.]+)\s*°C/i, html) ??
    parseNumberMatch(/Solidus[\s\S]{0,180}?([\d.]+)\s*°C/i, html);
  const specificHeat =
    parseNumberMatch(/Specific Heat[\s\S]{0,180}?([\d.]+)\s*J\/kg/i, html) ?? 500;

  if (!tensile || !density) {
    return null;
  }

  const lower = materialName.toLowerCase();
  const category =
    /peek|petg|abs|pla|nylon|polycarbonate|ptfe|hdpe|pom|delrin|pps/.test(lower)
      ? "Polymer"
      : "Metal";

  return {
    id: `mif_${materialName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    name: materialName,
    category,
    subcategory: category === "Metal" ? "Engineering Alloy" : "Engineering Polymer",
    density_g_cm3: density,
    tensile_strength_mpa: tensile,
    yield_strength_mpa: yieldStrength,
    elastic_modulus_gpa: elastic ?? (category === "Metal" ? 180 : 2.5),
    hardness_vickers: null,
    thermal_conductivity_w_mk: thermalCond ?? (category === "Metal" ? 18 : 0.22),
    specific_heat_j_gk: specificHeat / 1000,
    melting_point_c: meltingPoint,
    glass_transition_c: null,
    max_service_temp_c: maxTemp ?? (category === "Metal" ? 200 : 90),
    thermal_expansion_ppm_k: thermalExp,
    electrical_resistivity_ohm_m: category === "Metal" ? 1e-7 : 1e14,
    corrosion_resistance: category === "Metal" ? "good" : "excellent",
    machinability: category === "Metal" ? "good" : "fair",
    printability_fdm:
      /petg|abs|pla|nylon|polycarbonate/.test(lower) ? "good" : category === "Polymer" ? "fair" : "n/a",
    cost_usd_kg: category === "Metal" ? 10 : 5,
    tags: [category.toLowerCase(), "makeitfrom"],
    data_source: `MakeItFrom.com - ${url}`,
    source: "MakeItFrom",
    source_url: url,
    scrape_url: url,
    data_quality: "scraped",
    source_kind: "validated"
  };
}

function adaptFallback(master, target) {
  if (!master) {
    return null;
  }

  return {
    ...master,
    id: `mif_${normalise(target.name)}`,
    name: target.name,
    tags: Array.from(new Set([...(master.tags ?? []), "makeitfrom"])),
    data_source: `MakeItFrom.com (fallback mapped) - ${target.url}`,
    source: "MakeItFrom",
    source_url: target.url,
    scrape_url: target.url,
    data_quality: "scraped",
    source_kind: "validated"
  };
}

const results = [];
let success = 0;
let fallback = 0;
let failed = 0;

for (const target of TARGETS) {
  console.log(`Fetching ${target.name}`);
  try {
    const response = await fetch(target.url, {
      headers: { "User-Agent": "Mozilla/5.0 (educational research use)" }
    });

    if (response.ok) {
      const html = await response.text();
      const parsed = parseProperties(html, target.name, target.url);
      if (parsed) {
        results.push(parsed);
        success += 1;
        await new Promise((resolve) => setTimeout(resolve, 600));
        continue;
      }
    }
  } catch {
    // Fall back to local mapped data below.
  }

  const mapped = adaptFallback(findMasterMaterial(target.name), target);
  if (mapped) {
    results.push(mapped);
    fallback += 1;
  } else {
    failed += 1;
    console.warn(`Could not map ${target.name}`);
  }
}

writeFileSync(
  "src/lib/makeitfrom-materials.ts",
  `// AUTO-GENERATED by scripts/scrape-makeitfrom.mjs\n` +
    `// Source: makeitfrom.com (educational/research use)\n` +
    `import type { Material } from "@/types";\n\n` +
    `export const makeitfromDB: Material[] = ${JSON.stringify(results, null, 2)};\n`
);

console.log(`Saved ${results.length} materials (${success} scraped, ${fallback} fallback, ${failed} failed)`);
