import { Material, UserConstraints, RankedMaterial } from "@/types";

const CORROSION_RANK = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1
} as const;

// Clamp-safe min-max normalisation within a set
// Returns 1.0 when max===min (all equal = no penalty for anyone)
function norm(val: number, min: number, max: number): number {
  if (max === min) {
    return 1.0;
  }
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
}

// Log-scale normalisation — prevents $40,000 outlier from
// collapsing the cost axis for $1-$200 materials
function normLogCost(cost: number, allCosts: number[]): number {
  const logs = allCosts.map((c) => Math.log1p(c));
  const logVal = Math.log1p(cost);
  const logMin = Math.min(...logs);
  const logMax = Math.max(...logs);
  return norm(logVal, logMin, logMax);
}

// Infer which material categories the query implies.
// Category intent persists through ALL fallback passes.
function inferCategoryIntent(rawQuery: string): {
  exclude: Material["category"][];
  includeOnly?: Material["category"][];
  excludeIds?: string[];
} {
  const q = rawQuery.toLowerCase();
  const practicalFdm =
    ["3d print", "fdm", "filament", "printed part", "plastic bracket"].some((s) =>
      q.includes(s)
    ) &&
    !["aerospace", "autoclave", "medical", "steril", "high-temp", "high temperature"].some((s) =>
      q.includes(s)
    );

  const fdm = [
    "3d print",
    "fdm",
    "fused deposition",
    "filament",
    "desktop printer",
    "nozzle",
    "slicer",
    "pla",
    "petg",
    "abs",
    "plastic bracket",
    "printed part",
    "additive"
  ];
  const solder = [
    "solder",
    "bga",
    "reflow",
    "pcb joint",
    "braze",
    "flux",
    "tin-lead",
    "lead-free",
    "smt",
    "die attach",
    "eutectic",
    "intermetallic"
  ];
  const metal = [
    "weld",
    "forge",
    "cast iron",
    "machine shop",
    "alloy steel",
    "stainless",
    "aluminum alloy",
    "titanium alloy",
    "copper alloy",
    "metal bracket",
    "machined",
    "probe",
    "probe tip",
    "tips",
    "pellet",
    "pump",
    "housing",
    "pressure",
    "impeller",
    "valve",
    "shaft",
    "bracket"
  ];
  const polymer = [
    "plastic",
    "polymer",
    "thermoplastic",
    "elastomer",
    "rubber",
    "silicone",
    "resin",
    "nylon part",
    "acrylic"
  ];

  if (
    (q.includes("marine") || q.includes("seawater") || q.includes("salt water")) &&
    (q.includes("pump") || q.includes("housing") || q.includes("pressure"))
  ) {
    return {
      exclude: [],
      includeOnly: ["Metal"],
      // Marine pump hardware should stay inside corrosion-practical alloys.
      // Aerospace/high-temperature alloys are intentionally excluded unless
      // the query also asks for heat service because they otherwise dominate
      // on irrelevant thermal and strength extremes.
      excludeIds: ["inconel718", "waspaloy", "ti6al4v", "tungsten", "molybdenum"]
    };
  }

  if (fdm.some((s) => q.includes(s))) {
    return {
      exclude: [],
      includeOnly: ["Polymer"],
      // Keep standard/prosumer FDM queries in the practical polymer set.
      // Otherwise high-end engineering polymers win on overkill heat headroom
      // even when PETG/ASA/PA12 are the intuitive manufacturing choices.
      excludeIds: practicalFdm
        ? [
            "peek",
            "pekk",
            "ultem9085",
            "ultem1010",
            "pps",
            "delrin_pom",
            "polycarbonate"
          ]
        : undefined
    };
  }
  if (solder.some((s) => q.includes(s))) {
    const excludeIds =
      q.includes("lead-free") || q.includes("rohs") ? ["sn63pb37"] : undefined;
    return {
      exclude: [],
      includeOnly: ["Solder"],
      excludeIds
    };
  }
  if (polymer.some((s) => q.includes(s))) {
    return { exclude: [], includeOnly: ["Polymer"] };
  }
  if (metal.some((s) => q.includes(s))) {
    return { exclude: [], includeOnly: ["Metal"] };
  }

  // No clear signal: exclude nothing, let scoring decide
  return { exclude: [] };
}

function hardFilter(
  db: Material[],
  c: UserConstraints,
  intent: {
    exclude: Material["category"][];
    includeOnly?: Material["category"][];
    excludeIds?: string[];
  },
  opts: {
    relaxCost: boolean;
    relaxNumeric: boolean;
    ignoreCategory: boolean;
  }
): Material[] {
  const reqRank = c.corrosionRequired ? CORROSION_RANK[c.corrosionRequired] : 0;
  const costCap = opts.relaxCost
    ? (c.maxCost_usd_kg ?? Infinity) * 3
    : (c.maxCost_usd_kg ?? Infinity);

  return db.filter((m) => {
    // Category intent — only ignored in absolute last resort
    if (!opts.ignoreCategory) {
      if (intent.exclude.includes(m.category)) {
        return false;
      }
      if (intent.includeOnly && !intent.includeOnly.includes(m.category)) {
        return false;
      }
      if (intent.excludeIds?.includes(m.id)) {
        return false;
      }
    }

    // Numeric hard constraints
    if (!opts.relaxNumeric) {
      if (
        c.maxTemperature_c !== undefined &&
        m.max_service_temp_c < c.maxTemperature_c
      ) {
        return false;
      }
      if (
        c.minTensileStrength_mpa !== undefined &&
        m.tensile_strength_mpa < c.minTensileStrength_mpa
      ) {
        return false;
      }
      if (c.maxDensity_g_cm3 !== undefined && m.density_g_cm3 > c.maxDensity_g_cm3) {
        return false;
      }
    }

    // Cost — relaxed separately
    if (m.cost_usd_kg > costCap) {
      return false;
    }

    // Binary constraints — NEVER relaxed
    if (reqRank > 0 && CORROSION_RANK[m.corrosion_resistance] < reqRank) {
      return false;
    }
    if (
      c.needsFDMPrintability &&
      (m.printability_fdm === "n/a" || m.printability_fdm === "poor")
    ) {
      return false;
    }
    if (
      c.electricallyConductive &&
      m.electrical_resistivity_ohm_m > 1e-4
    ) {
      return false;
    }

    return true;
  });
}

function buildReason(
  m: Material,
  w: UserConstraints["priorityWeights"]
): string {
  const ranked = [
    { label: "thermal resistance", v: w.thermal },
    { label: "tensile strength", v: w.strength },
    { label: "low density", v: w.weight },
    { label: "cost efficiency", v: w.cost },
    { label: "corrosion resistance", v: w.corrosion }
  ].sort((a, b) => b.v - a.v);
  return `Top ${ranked[0].label} and ${ranked[1].label} within ${m.category.toLowerCase()} candidates.`;
}

export function scoreMaterials(
  constraints: UserConstraints,
  db: Material[]
): RankedMaterial[] {
  const intent = inferCategoryIntent(constraints.rawQuery ?? "");

  // Progressive fallback — category intent persists passes 1-3
  const passes = [
    { relaxCost: false, relaxNumeric: false, ignoreCategory: false },
    { relaxCost: true, relaxNumeric: false, ignoreCategory: false },
    { relaxCost: true, relaxNumeric: true, ignoreCategory: false },
    { relaxCost: true, relaxNumeric: true, ignoreCategory: true }
  ];

  let filtered: Material[] = [];
  for (const opts of passes) {
    filtered = hardFilter(db, constraints, intent, opts);
    if (filtered.length >= 3) {
      break;
    }
  }
  if (filtered.length === 0) {
    filtered = [...db];
  }

  // Compute ranges ONLY within filtered set
  // This is critical — do NOT use full DB ranges
  const temps = filtered.map((m) => m.max_service_temp_c);
  const strengths = filtered.map((m) => m.tensile_strength_mpa);
  const densities = filtered.map((m) => m.density_g_cm3);
  const costs = filtered.map((m) => m.cost_usd_kg);

  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const minS = Math.min(...strengths);
  const maxS = Math.max(...strengths);
  const minR = Math.min(...densities);
  const maxR = Math.max(...densities);

  const w = constraints.priorityWeights;

  // Validate weights sum to 1.0, fix floating point drift
  const wTotal = w.thermal + w.strength + w.weight + w.cost + w.corrosion;
  const wNorm = wTotal > 0 ? wTotal : 1;
  const wt = {
    thermal: w.thermal / wNorm,
    strength: w.strength / wNorm,
    weight: w.weight / wNorm,
    cost: w.cost / wNorm,
    corrosion: w.corrosion / wNorm
  };

  const scored = filtered.map((m) => {
    const thermal = norm(m.max_service_temp_c, minT, maxT);
    const strength = norm(m.tensile_strength_mpa, minS, maxS);
    const lightness = 1 - norm(m.density_g_cm3, minR, maxR);
    const costEff = 1 - normLogCost(m.cost_usd_kg, costs);
    const corrosion = CORROSION_RANK[m.corrosion_resistance] / 4;

    // Weighted sum — guaranteed [0, 1] because each term is [0,1]
    // and weights sum to 1.0
    const raw =
      wt.thermal * thermal +
      wt.strength * strength +
      wt.weight * lightness +
      wt.cost * costEff +
      wt.corrosion * corrosion;

    // Scale to [0, 100] and round to integer
    const score = Math.round(Math.min(100, Math.max(0, raw * 100)));

    return { ...m, score, matchReason: buildReason(m, wt) };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
