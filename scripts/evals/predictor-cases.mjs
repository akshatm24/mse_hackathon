export const predictorCases = [
  {
    id: "exact-niti",
    formula: "NiTi",
    expectedMethod: "exact-match",
    expectedCategory: "Metal",
    minConfidence: 70,
    requireWarnings: true,
    acceptableWinners: ["Nitinol NiTi (MP)"]
  },
  {
    id: "exact-alumina",
    formula: "Al2O3",
    expectedMethod: "exact-match",
    expectedCategory: "Ceramic",
    minConfidence: 70,
    requireWarnings: true,
    acceptableWinners: ["Alumina Al2O3", "Alumina Al2O3 (MP)"]
  },
  {
    id: "exact-ti3sic2",
    formula: "Ti3SiC2",
    expectedMethod: "exact-match",
    expectedCategory: "Ceramic",
    minConfidence: 65,
    requireWarnings: true
  },
  {
    id: "hybrid-fe70ni30",
    formula: "Fe70Ni30",
    context: "low expansion precision alloy",
    expectedMethod: "hybrid-screening",
    expectedCategory: "Metal",
    minConfidence: 35,
    requirePredictedProperties: true,
    acceptableWinners: ["Invar 36", "Nickel 200", "Carbon Steel 1020"]
  },
  {
    id: "hybrid-cu60zn40",
    formula: "Cu60Zn40",
    context: "machinable conductive fitting",
    expectedMethod: "hybrid-screening",
    expectedCategory: "Metal",
    minConfidence: 35,
    requirePredictedProperties: true,
    acceptableWinners: ["Brass C360", "Phosphor Bronze C510", "ETP Copper C11000"]
  },
  {
    id: "hybrid-ni3al",
    formula: "Ni3Al",
    context: "high temperature intermetallic screening",
    expectedMethod: "hybrid-screening",
    expectedCategory: "Metal",
    minConfidence: 30,
    requirePredictedProperties: true,
    requireWarnings: true
  },
  {
    id: "hybrid-ti3al",
    formula: "Ti3Al",
    context: "lightweight aerospace intermetallic",
    expectedMethod: "hybrid-screening",
    expectedCategory: "Metal",
    minConfidence: 30,
    requirePredictedProperties: true,
    requireWarnings: true
  },
  {
    id: "hybrid-cuzn",
    formula: "Cu55Zn45",
    context: "electrical hardware",
    expectedMethod: "hybrid-screening",
    expectedCategory: "Metal",
    minConfidence: 35,
    requirePredictedProperties: true,
    acceptableWinners: ["Brass C360", "Phosphor Bronze C510", "ETP Copper C11000"]
  },
  {
    id: "hybrid-hea",
    formula: "Fe20Ni20Co20Cr20Mn20",
    context: "high entropy alloy concept screening",
    expectedMethod: "hybrid-screening",
    expectedCategory: "Metal",
    minConfidence: 25,
    requirePredictedProperties: true,
    requireWarnings: true
  },
  {
    id: "fallback-gaas",
    formula: "GaAs",
    context: "semiconductor substrate",
    expectedCategory: "Ceramic",
    minConfidence: 25
  },
  {
    id: "fallback-gan",
    formula: "GaN",
    context: "wide band gap electronics",
    expectedCategory: "Ceramic",
    minConfidence: 25
  },
  {
    id: "hybrid-wn",
    formula: "WN",
    context: "hard conductive nitride coating",
    expectedCategory: "Ceramic",
    minConfidence: 25,
    requireWarnings: true
  },
  {
    id: "hybrid-zrc",
    formula: "ZrC",
    context: "ultra high temperature ceramic",
    expectedCategory: "Ceramic",
    minConfidence: 25,
    requireWarnings: true
  },
  {
    id: "parse-spaced",
    formula: "Fe 70 Ni 30",
    context: "precision alloy",
    expectedMethod: "hybrid-screening",
    expectedCategory: "Metal",
    minConfidence: 30,
    requirePredictedProperties: true
  },
  {
    id: "fallback-unparsed",
    formula: "nickel titanium-ish",
    context: "shape memory wire",
    expectedMethod: "analog-fallback",
    expectedCategory: "Metal",
    minConfidence: 20,
    requireWarnings: true
  }
];

export default predictorCases;
