const groups = [
  {
    key: "cheap-general",
    expectedOneOf: ["Grey Cast Iron", "Carbon Steel 1020"],
    acceptableOneOf: ["HSLA Steel A36"],
    bannedTop3Categories: ["Ceramic", "Solder"],
    dominantWeight: "cost",
    minDominantWeight: 0.6,
    prompts: [
      "cheapest material possible",
      "give me the cheapest possible material",
      "lowest cost material with no special needs",
      "budget first material recommendation",
      "most economical material available",
      "I only care about low cost material",
      "pick the cheapest engineering material",
      "recommend the lowest cost option",
      "find a very cheap material",
      "absolute cheapest material"
    ]
  },
  {
    key: "cheap-structural",
    expectedOneOf: ["Carbon Steel 1020", "HSLA Steel A36", "Grey Cast Iron"],
    bannedTop3Categories: ["Ceramic", "Solder"],
    dominantWeight: "cost",
    minDominantWeight: 0.45,
    prompts: [
      "cheap structural metal bracket",
      "budget metal for a structural support",
      "low cost load bearing steel",
      "economical structural metal plate",
      "cheap metal for a machine frame",
      "affordable metal support bracket",
      "structural steel on a tight budget",
      "least expensive structural alloy",
      "budget friendly load bearing metal",
      "cheap structural member material"
    ]
  },
  {
    key: "fdm-motor",
    expectedOneOf: ["PETG", "ASA", "Nylon PA12"],
    bannedTop5Categories: ["Ceramic", "Solder"],
    dominantWeight: "thermal",
    minDominantWeight: 0.35,
    requiresWarning: true,
    prompts: [
      "lightweight 3D printed bracket for 85 degree motor heat",
      "3D printable motor bracket that should not warp at 85C",
      "desktop FDM bracket for motor heat around 85 celsius",
      "light FDM motor mount for 85 degree service",
      "3d printed plastic bracket for warm motor housing",
      "petg vs nylon style query for motor bracket heat",
      "lightweight printable bracket that cannot melt near an 85C motor",
      "desktop printed support beside an 85 degree motor",
      "fdm printable motor bracket with moderate heat",
      "motor heat bracket for standard desktop 3d printer"
    ]
  },
  {
    key: "fdm-outdoor",
    expectedOneOf: ["ASA", "PVDF", "PPS (Polyphenylene Sulfide)", "PEKK"],
    bannedTop5Categories: ["Ceramic", "Solder"],
    dominantWeight: "corrosion",
    minDominantWeight: 0.2,
    prompts: [
      "outdoor weather resistant plastic for enclosure",
      "UV stable printable polymer for outside use",
      "plastic for outdoor sunlight and rain",
      "outdoor 3D printed cover with weather exposure",
      "polymer for exterior use with UV and moisture",
      "printable outdoor bracket exposed to sun",
      "weatherproof thermoplastic for an outdoor part",
      "UV resistant polymer housing for field use",
      "plastic for outdoor sensor enclosure",
      "outside-use engineering polymer recommendation"
    ]
  },
  {
    key: "drone-frame",
    expectedOneOf: ["CFRP (Carbon Fiber UD)", "Magnesium AZ31B", "CFRP Woven 0/90"],
    acceptableOneOf: ["Boron/Epoxy Composite"],
    bannedTop5Categories: ["Ceramic", "Solder"],
    dominantWeight: "weight",
    minDominantWeight: 0.5,
    prompts: [
      "lightweight material for drone frame",
      "best low density material for a UAV frame",
      "very light structural material for quadcopter arms",
      "airframe material for a small drone",
      "low mass frame material for UAV structure",
      "drone chassis material with high stiffness and low weight",
      "lightweight frame material for multirotor",
      "aerospace style low density material for drone body",
      "strong but lightweight material for drone skeleton",
      "UAV frame material where density matters most"
    ]
  },
  {
    key: "marine-pump",
    expectedOneOf: ["Monel 400", "Hastelloy C-276", "Cupronickel 90/10"],
    bannedTop5Categories: ["Polymer", "Ceramic", "Composite", "Solder"],
    dominantWeight: "corrosion",
    minDominantWeight: 0.5,
    prompts: [
      "marine pump housing seawater",
      "pump housing for seawater service",
      "metal for a seawater pump body",
      "ocean water pump casing material",
      "corrosion resistant alloy for marine pump",
      "saltwater pump housing high pressure",
      "pump impeller housing in seawater environment",
      "marine fluid handling pump alloy",
      "seawater pump metal recommendation",
      "ocean-exposed pump housing material"
    ]
  },
  {
    key: "acid-chemical",
    expectedOneOf: ["Hastelloy C-276", "Titanium Grade 2 (CP)", "Monel 400"],
    bannedTop3Categories: ["Polymer", "Solder"],
    dominantWeight: "corrosion",
    minDominantWeight: 0.35,
    prompts: [
      "acid resistant metal",
      "chemical resistant alloy for corrosive liquid",
      "metal for strong acid exposure",
      "corrosion resistant alloy for wet chemical service",
      "alloy for aggressive chemical environment",
      "chemical pump alloy with high corrosion resistance",
      "metal for acidic process equipment",
      "corrosion proof metal for chemical plant",
      "alloy for acidic media and corrosion",
      "metal recommendation for corrosive chemical handling"
    ]
  },
  {
    key: "probe-tips",
    expectedOneOf: ["Tungsten W", "Beryllium Copper C17200"],
    acceptableOneOf: ["ETP Copper C11000", "Copper C110"],
    bannedTop5Categories: ["Polymer", "Ceramic", "Composite", "Solder"],
    dominantWeight: "strength",
    minDominantWeight: 0.25,
    prompts: [
      "4-point probe station tips for conductivity measurement",
      "electrically conductive probe tips for sintered copper cobalt pellets",
      "hard conductive probe tip material for repeated thermal cycling",
      "conductive probe contact material for 200C pellet testing",
      "probe tip alloy for electrical measurements at 200 celsius",
      "hard metal for contact probes on sintered pellets",
      "electrode tip material for conductivity test fixture",
      "conductive contact tip for hot pellet measurements",
      "measurement probe tip material with high conductivity and hardness",
      "4 point probe contact material for ceramic pellet testing"
    ]
  },
  {
    key: "conductive-contacts",
    expectedOneOf: ["ETP Copper C11000", "Beryllium Copper C17200", "Copper C110"],
    acceptableOneOf: ["Phosphor Bronze C510", "Brass C360"],
    bannedTop5Categories: ["Polymer", "Ceramic", "Composite"],
    dominantWeight: "strength",
    minDominantWeight: 0.2,
    prompts: [
      "electrically conductive connector spring material",
      "conductive contact alloy for electrical terminal",
      "low resistivity metal for current carrying contact",
      "electrical connector material with good conductivity",
      "conductive alloy for durable contacts",
      "contact material for electrical probes",
      "copper like material for connector pins",
      "conductive spring contact metal",
      "metal for low resistivity connector hardware",
      "best conductive contact material"
    ]
  },
  {
    key: "bga-solder",
    expectedOneOf: ["SAC305 (Sn-Ag-Cu)", "Sn96Ag4 Silver Solder", "Sn58Bi42 Low-Temp Solder"],
    bannedTop5Categories: ["Metal", "Polymer", "Ceramic", "Composite"],
    requiresWarning: true,
    prompts: [
      "lead free BGA solder for automotive electronics",
      "RoHS BGA solder with thermal cycling to 125C",
      "electronics solder joint for automotive BGA package",
      "lead free reflow solder below 260C for BGA",
      "solder alloy for package reliability and thermal cycling",
      "BGA package solder with expansion mismatch concerns",
      "automotive electronics solder recommendation",
      "lead free SMT solder for thermal cycling service",
      "BGA solder material under reflow and cycling",
      "package solder for automotive board assembly"
    ]
  },
  {
    key: "high-temp-insulator",
    expectedOneOf: ["Alumina Al2O3", "Silicon Nitride Si3N4", "Aluminum Nitride AlN (MP)"],
    bannedTop3Categories: ["Polymer", "Composite", "Solder"],
    dominantWeight: "thermal",
    minDominantWeight: 0.25,
    prompts: [
      "high temperature electrical insulator",
      "ceramic insulator for hot electronics",
      "electrical insulation material for high heat",
      "thermally stable insulating ceramic",
      "hot zone electrical insulation material",
      "insulating material with high service temperature",
      "ceramic insulator for furnace-adjacent hardware",
      "electrical insulator at elevated temperature",
      "high heat insulating ceramic recommendation",
      "electrical insulation for hot assembly"
    ]
  },
  {
    key: "thermal-insulation",
    expectedOneOf: ["Kevlar/Epoxy", "FR-4 370HR", "PTFE", "Polyimide PI"],
    acceptableOneOf: ["PMMA (Acrylic)", "PEEK", "PBT (Polybutylene Terephthalate)"],
    bannedTop5Categories: ["Metal", "Solder"],
    dominantWeight: "thermal",
    minDominantWeight: 0.35,
    prompts: [
      "low thermal conductivity material for heat insulation",
      "thermal barrier material with low thermal conductivity",
      "need less thermal conductivity and minimal heat transfer",
      "thermally insulating material for a heat shield",
      "material for insulation where low thermal conductivity matters"
    ]
  },
  {
    key: "electrical-insulator-heat-spreader",
    expectedOneOf: ["Silicon Nitride Si3N4", "Boron Nitride BN", "Alumina Al2O3"],
    acceptableOneOf: ["Sialon (Si6-zAlzOzN8-z)"],
    bannedTop3Categories: ["Metal", "Polymer", "Composite", "Solder"],
    dominantWeight: "thermal",
    minDominantWeight: 0.35,
    prompts: [
      "electrically insulating but thermally conductive material for hot electronics",
      "need electrical insulation with good thermal conductivity for a hot fixture",
      "ceramic heat spreader that stays electrically insulating",
      "thermally conductive electrical insulator for electronics packaging",
      "electrical insulator that can dissipate heat without becoming conductive"
    ]
  },
  {
    key: "underspecified",
    requireTopNameInExplanation: true,
    prompts: [
      "material please",
      "what should I use",
      "need a material recommendation",
      "best material",
      "help me choose a material",
      "I need something that works",
      "pick a material for me",
      "recommend something sensible",
      "I do not know what material to use",
      "general material suggestion"
    ]
  },
  {
    key: "gibberish",
    requireTopNameInExplanation: true,
    prompts: [
      "blorf zindle frame thingy hot-ish maybe",
      "need material for wobble gadget in ocean-ish vibes",
      "cheap but not too weird for a spinny doohickey",
      "glorp 3d thing near motor but also maybe not",
      "shiny conductive maybe maybe not bracket blob",
      "seawater-ish clamp thing but lightweight somehow",
      "BGA-ish package-y solder-y question stuff",
      "probe-y contact-y pellet-y hot metal-ish",
      "random polymerish cover maybe outdoors sorta",
      "mystery alloy for widget with unknown constraints"
    ]
  }
];

export const recommendationCases = groups.flatMap((group) =>
  group.prompts.map((query, index) => ({
    id: `${group.key}-${String(index + 1).padStart(2, "0")}`,
    group: group.key,
    query,
    expectedOneOf: group.expectedOneOf ?? [],
    acceptableOneOf: group.acceptableOneOf ?? [],
    bannedTop3Categories: group.bannedTop3Categories ?? [],
    bannedTop5Categories: group.bannedTop5Categories ?? [],
    dominantWeight: group.dominantWeight,
    minDominantWeight: group.minDominantWeight,
    requiresWarning: group.requiresWarning ?? false,
    requireTopNameInExplanation: group.requireTopNameInExplanation ?? true
  }))
);

export default recommendationCases;
