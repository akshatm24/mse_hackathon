import { Material } from "@/types";

type Axis = "cost" | "thermal" | "weight" | "strength" | "corrosion";

type CategoryIntent = {
  exclude: Material["category"][];
  includeOnly?: Material["category"][];
  excludeIds?: string[];
};

export type QueryIntentProfile = {
  axisHits: Record<Axis, number>;
  categoryIntent: CategoryIntent;
  wantsFDM: boolean;
  practicalFdm: boolean;
  wantsElectricalConductivity: boolean;
  wantsElectricalInsulation: boolean;
  wantsThermalConductivity: boolean;
  wantsMachinability: boolean;
  wantsHardness: boolean;
  wantsBiocompatible: boolean;
  wantsOutdoor: boolean;
  wantsMarine: boolean;
  wantsAcidResistance: boolean;
  wantsElectronics: boolean;
  wantsProbe: boolean;
  wantsStructural: boolean;
  relevanceTerms: string[];
};

const AXIS_PATTERNS: Record<Axis, RegExp[]> = {
  cost: [
    /\bcheap(?:er|est)?\b/i,
    /\bbudget\b/i,
    /\baffordable\b/i,
    /\binexpensive\b/i,
    /\beconom(?:ical|y)\b/i,
    /\blow[- ]cost\b/i,
    /\blow[- ]price\b/i,
    /\bleast[- ]expensive\b/i,
    /\bleast[- ]cost\b/i,
    /\blowest[- ]cost\b/i,
    /\blowest[- ]price\b/i,
    /\bminimum[- ]cost\b/i,
    /\bminimum[- ]price\b/i,
    /\bcost[- ]effective\b/i,
    /\bsave money\b/i,
    /\blow[- ]budget\b/i,
    /\bfrugal\b/i,
    /\bbargain\b/i,
    /\bvalue\b/i,
    /\bprice point\b/i,
    /\bunder\s*\$?\s*\d+/i,
    /\bless than\s*\$?\s*\d+/i
  ],
  thermal: [
    /\bheat(?: resistant)?\b/i,
    /\bthermal\b/i,
    /\btemperature\b/i,
    /\btemp\b/i,
    /\bwarp\b/i,
    /\bmelt\b/i,
    /\bmotor\b/i,
    /\bengine\b/i,
    /\bfurnace\b/i,
    /\boven\b/i,
    /\breflow\b/i,
    /\bautoclave\b/i,
    /\bservice temp\b/i,
    /\bthermal cycling\b/i,
    /\bhigh[- ]temperature\b/i,
    /\bhigh[- ]temp\b/i,
    /\bfire\b/i,
    /\b\d{2,4}\s*(?:°?\s*c\b|celsius\b|degrees?\s*c\b)/i
  ],
  weight: [
    /\blight(?:weight)?\b/i,
    /\blow[- ]weight\b/i,
    /\blow[- ]density\b/i,
    /\blow[- ]mass\b/i,
    /\bdrone\b/i,
    /\baircraft\b/i,
    /\baerospace\b/i,
    /\bportable\b/i,
    /\bwearable\b/i,
    /\brocket\b/i,
    /\bsatellite\b/i,
    /\bweight saving\b/i,
    /\bmass reduction\b/i,
    /\bgrams?\b/i
  ],
  strength: [
    /\bstrong(?:er|est)?\b/i,
    /\bstrength\b/i,
    /\bload(?: bearing)?\b/i,
    /\bstress\b/i,
    /\bforce\b/i,
    /\bstructural\b/i,
    /\bbearing\b/i,
    /\bhigh[- ]strength\b/i,
    /\btensile\b/i,
    /\byield\b/i,
    /\bmpa\b/i,
    /\bgpa\b/i,
    /\bstiff\b/i,
    /\brigid\b/i,
    /\btough\b/i,
    /\bsupport\b/i,
    /\bwithstand\b/i,
    /\bdurable\b/i,
    /\brobust\b/i,
    /\bbracket\b/i,
    /\bframe\b/i,
    /\bhousing\b/i,
    /\bhard(?:ness)?\b/i,
    /\bwear\b/i,
    /\btool(?:ing)?\b/i
  ],
  corrosion: [
    /\bcorros(?:ion|ive)\b/i,
    /\brust\b/i,
    /\bmarine\b/i,
    /\bseawater\b/i,
    /\bsaltwater\b/i,
    /\bocean\b/i,
    /\bacid\b/i,
    /\bchemical\b/i,
    /\boxidat\w*\b/i,
    /\boutdoor\b/i,
    /\bweather(?:proof| resistant)?\b/i,
    /\bwet\b/i,
    /\bmoisture\b/i,
    /\bhumid\b/i,
    /\bsalt\b/i
  ]
};

const CATEGORY_PATTERNS: Record<Material["category"], RegExp[]> = {
  Metal: [
    /\bmetal\b/i,
    /\balloy\b/i,
    /\bsteel\b/i,
    /\bstainless\b/i,
    /\btitan(?:ium)?\b/i,
    /\balumin(?:um|ium)\b/i,
    /\bcopper\b/i,
    /\bbrass\b/i,
    /\bbronze\b/i,
    /\bnickel\b/i,
    /\bmagnesium\b/i
  ],
  Polymer: [
    /\bplastic\b/i,
    /\bpolymer\b/i,
    /\bthermoplastic\b/i,
    /\bpla\b/i,
    /\bpetg\b/i,
    /\bnylon\b/i,
    /\babs\b/i,
    /\basa\b/i,
    /\bpeek\b/i,
    /\bpekk\b/i,
    /\bpps\b/i
  ],
  Ceramic: [
    /\bceramic\b/i,
    /\balumina\b/i,
    /\bzirconia\b/i,
    /\bcarbide\b/i,
    /\bnitride\b/i,
    /\boxide\b/i
  ],
  Composite: [
    /\bcomposite\b/i,
    /\bcarbon fiber\b/i,
    /\bcarbon fibre\b/i,
    /\bcfrp\b/i,
    /\bgfrp\b/i,
    /\bkevlar\b/i,
    /\bglass fiber\b/i,
    /\bfiber reinforced\b/i
  ],
  Solder: [
    /\bsolder\b/i,
    /\breflow\b/i,
    /\bbga\b/i,
    /\bpcb\b/i,
    /\bsac305\b/i,
    /\bsn63pb37\b/i
  ]
};

const FLAG_PATTERNS = {
  fdm: [
    /\b3d[- ]print(?:ed|ing)?\b/i,
    /\bfdm\b/i,
    /\bfused deposition\b/i,
    /\bfilament\b/i,
    /\bdesktop printer\b/i,
    /\bnozzle\b/i,
    /\bpla\b/i,
    /\bpetg\b/i
  ],
  conductive: [
    /\belectrically conductive\b/i,
    /\belectrical conductivity\b/i,
    /\bconduct(?:ive|ivity)\b/i,
    /\bcurrent\b/i,
    /\belectrode\b/i,
    /\bcontact\b/i,
    /\bbusbar\b/i,
    /\bconnector\b/i,
    /\bcircuit\b/i,
    /\bprobe\b/i,
    /\bpcb\b/i
  ],
  insulating: [
    /\belectrical insulat(?:or|ing|ion)\b/i,
    /\binsulat(?:or|ing|ion)\b/i,
    /\bdielectric\b/i,
    /\bnon[- ]conduct(?:ive|ing)\b/i,
    /\bnot conductive\b/i
  ],
  thermallyConductive: [
    /\bthermally conductive\b/i,
    /\bthermal conductivity\b/i,
    /\bheat sink\b/i,
    /\bheat spreader\b/i,
    /\bconduct heat\b/i,
    /\bheat dissipation\b/i
  ],
  machinable: [
    /\bmachin(?:able|ing)\b/i,
    /\bmachine easily\b/i,
    /\bmilling\b/i,
    /\blathe\b/i,
    /\bturning\b/i
  ],
  hardness: [
    /\bhard(?:ness)?\b/i,
    /\bwear resistant\b/i,
    /\bwear\b/i,
    /\babras(?:ion|ive)\b/i,
    /\btool(?:ing)?\b/i,
    /\bcutting\b/i,
    /\bdies?\b/i
  ],
  biocompatible: [
    /\bbiocompat(?:ible|ibility)\b/i,
    /\bimplant\b/i,
    /\bmedical\b/i,
    /\bbiomedical\b/i,
    /\bdental\b/i
  ],
  outdoor: [
    /\boutdoor\b/i,
    /\bweather\b/i,
    /\buv\b/i,
    /\bsunlight\b/i
  ],
  marine: [
    /\bmarine\b/i,
    /\bseawater\b/i,
    /\bsaltwater\b/i,
    /\bocean\b/i
  ],
  acid: [
    /\bacid\b/i,
    /\bchemical\b/i,
    /\bcorros(?:ion|ive)\b/i
  ],
  electronics: [
    /\belectronics?\b/i,
    /\bpcb\b/i,
    /\breflow\b/i,
    /\bbga\b/i,
    /\bsolder\b/i,
    /\brohs\b/i
  ],
  probe: [
    /\bprobe(?: tip)?\b/i,
    /\bcontact\b/i,
    /\belectrode\b/i
  ],
  structural: [
    /\bbracket\b/i,
    /\bframe\b/i,
    /\bhousing\b/i,
    /\bstructural\b/i,
    /\bload(?: bearing)?\b/i,
    /\bsupport\b/i
  ],
  highSpecFdm: [
    /\baerospace\b/i,
    /\bautoclave\b/i,
    /\bmedical\b/i,
    /\bsteril/i,
    /\bflame\b/i,
    /\bhigh[- ]temp(?:erature)?\b/i
  ]
} as const;

function countMatches(query: string, patterns: readonly RegExp[]): number {
  return patterns.filter((pattern) => pattern.test(query)).length;
}

function hasMatch(query: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(query));
}

function addTerms(target: Set<string>, terms: string[]) {
  terms.forEach((term) => target.add(term));
}

export function inferQueryIntent(query: string): QueryIntentProfile {
  const axisHits = {
    cost: countMatches(query, AXIS_PATTERNS.cost),
    thermal: countMatches(query, AXIS_PATTERNS.thermal),
    weight: countMatches(query, AXIS_PATTERNS.weight),
    strength: countMatches(query, AXIS_PATTERNS.strength),
    corrosion: countMatches(query, AXIS_PATTERNS.corrosion)
  };

  const wantsFDM = hasMatch(query, FLAG_PATTERNS.fdm);
  const practicalFdm = wantsFDM && !hasMatch(query, FLAG_PATTERNS.highSpecFdm);
  const wantsElectricalInsulation = hasMatch(query, FLAG_PATTERNS.insulating);
  const explicitConductivity = hasMatch(query, FLAG_PATTERNS.conductive);
  const wantsElectricalConductivity =
    explicitConductivity &&
    (!wantsElectricalInsulation || /\belectrically conductive\b/i.test(query));

  const wantsThermalConductivity = hasMatch(query, FLAG_PATTERNS.thermallyConductive);
  const wantsMachinability = hasMatch(query, FLAG_PATTERNS.machinable);
  const wantsHardness = hasMatch(query, FLAG_PATTERNS.hardness);
  const wantsBiocompatible = hasMatch(query, FLAG_PATTERNS.biocompatible);
  const wantsOutdoor = hasMatch(query, FLAG_PATTERNS.outdoor);
  const wantsMarine = hasMatch(query, FLAG_PATTERNS.marine);
  const wantsAcidResistance = hasMatch(query, FLAG_PATTERNS.acid);
  const wantsElectronics = hasMatch(query, FLAG_PATTERNS.electronics);
  const wantsProbe = hasMatch(query, FLAG_PATTERNS.probe);
  const wantsStructural = hasMatch(query, FLAG_PATTERNS.structural);

  let categoryIntent: CategoryIntent = { exclude: [] };

  if (hasMatch(query, CATEGORY_PATTERNS.Solder)) {
    categoryIntent = {
      exclude: [],
      includeOnly: ["Solder"]
    };
  } else if (wantsFDM) {
    categoryIntent = {
      exclude: [],
      includeOnly: ["Polymer"],
      excludeIds: practicalFdm
        ? [
            "peek",
            "pekk",
            "ultem9085",
            "ultem1010",
            "pps",
            "polycarbonate",
            "delrin_pom"
          ]
        : undefined
    };
  } else if (hasMatch(query, CATEGORY_PATTERNS.Polymer)) {
    categoryIntent = {
      exclude: [],
      includeOnly: ["Polymer"]
    };
  } else if (hasMatch(query, CATEGORY_PATTERNS.Metal)) {
    categoryIntent = {
      exclude: [],
      includeOnly: ["Metal"]
    };
  } else if (hasMatch(query, CATEGORY_PATTERNS.Composite)) {
    categoryIntent = {
      exclude: [],
      includeOnly: ["Composite"]
    };
  } else if (hasMatch(query, CATEGORY_PATTERNS.Ceramic)) {
    categoryIntent = {
      exclude: [],
      includeOnly: ["Ceramic"]
    };
  }

  const relevanceTerms = new Set<string>();

  if (wantsFDM) {
    addTerms(relevanceTerms, ["3d-printing", "fused-deposition", "additive"]);
  }
  if (wantsMarine) {
    addTerms(relevanceTerms, ["marine", "seawater"]);
  }
  if (wantsAcidResistance) {
    addTerms(relevanceTerms, ["chemical", "acid-resistant", "corrosion-resistant"]);
  }
  if (wantsOutdoor) {
    addTerms(relevanceTerms, ["outdoor", "uv-resistant", "weather"]);
  }
  if (wantsProbe) {
    addTerms(relevanceTerms, ["probe-tip", "electrical", "conductive", "connectors"]);
  }
  if (wantsElectronics) {
    addTerms(relevanceTerms, ["electronics", "pcb", "rohs", "solder"]);
  }
  if (wantsBiocompatible) {
    addTerms(relevanceTerms, ["biomedical", "medical", "dental", "implant"]);
  }
  if (wantsMachinability) {
    addTerms(relevanceTerms, ["machining", "precision-parts"]);
  }
  if (wantsHardness) {
    addTerms(relevanceTerms, ["wear-resistant", "tooling", "cutting-tools", "dies"]);
  }
  if (wantsStructural) {
    addTerms(relevanceTerms, ["structural", "general-purpose", "high-strength"]);
  }
  if (wantsThermalConductivity) {
    addTerms(relevanceTerms, ["thermal", "thermal-management"]);
  }

  return {
    axisHits,
    categoryIntent,
    wantsFDM,
    practicalFdm,
    wantsElectricalConductivity,
    wantsElectricalInsulation,
    wantsThermalConductivity,
    wantsMachinability,
    wantsHardness,
    wantsBiocompatible,
    wantsOutdoor,
    wantsMarine,
    wantsAcidResistance,
    wantsElectronics,
    wantsProbe,
    wantsStructural,
    relevanceTerms: [...relevanceTerms]
  };
}

