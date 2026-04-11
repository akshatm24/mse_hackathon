export type ElementDescriptor = {
  atomicNumber: number;
  atomicMass: number;
  atomicRadiusPm: number;
  electronegativity: number;
  meltingPointC: number;
  density_g_cm3: number;
  thermalConductivity_w_mk: number;
  valenceElectrons: number;
};

export const ELEMENTS: Record<string, ElementDescriptor> = {
  Ag: { atomicNumber: 47, atomicMass: 107.87, atomicRadiusPm: 160, electronegativity: 1.93, meltingPointC: 962, density_g_cm3: 10.49, thermalConductivity_w_mk: 429, valenceElectrons: 11 },
  Al: { atomicNumber: 13, atomicMass: 26.98, atomicRadiusPm: 143, electronegativity: 1.61, meltingPointC: 660, density_g_cm3: 2.70, thermalConductivity_w_mk: 237, valenceElectrons: 3 },
  As: { atomicNumber: 33, atomicMass: 74.92, atomicRadiusPm: 115, electronegativity: 2.18, meltingPointC: 817, density_g_cm3: 5.73, thermalConductivity_w_mk: 50, valenceElectrons: 5 },
  Au: { atomicNumber: 79, atomicMass: 196.97, atomicRadiusPm: 174, electronegativity: 2.54, meltingPointC: 1064, density_g_cm3: 19.30, thermalConductivity_w_mk: 317, valenceElectrons: 11 },
  B: { atomicNumber: 5, atomicMass: 10.81, atomicRadiusPm: 85, electronegativity: 2.04, meltingPointC: 2076, density_g_cm3: 2.34, thermalConductivity_w_mk: 27, valenceElectrons: 3 },
  Be: { atomicNumber: 4, atomicMass: 9.01, atomicRadiusPm: 112, electronegativity: 1.57, meltingPointC: 1287, density_g_cm3: 1.85, thermalConductivity_w_mk: 200, valenceElectrons: 2 },
  C: { atomicNumber: 6, atomicMass: 12.01, atomicRadiusPm: 70, electronegativity: 2.55, meltingPointC: 3550, density_g_cm3: 2.20, thermalConductivity_w_mk: 140, valenceElectrons: 4 },
  Ca: { atomicNumber: 20, atomicMass: 40.08, atomicRadiusPm: 194, electronegativity: 1.00, meltingPointC: 842, density_g_cm3: 1.55, thermalConductivity_w_mk: 201, valenceElectrons: 2 },
  Co: { atomicNumber: 27, atomicMass: 58.93, atomicRadiusPm: 125, electronegativity: 1.88, meltingPointC: 1495, density_g_cm3: 8.90, thermalConductivity_w_mk: 100, valenceElectrons: 9 },
  Cr: { atomicNumber: 24, atomicMass: 52.00, atomicRadiusPm: 128, electronegativity: 1.66, meltingPointC: 1907, density_g_cm3: 7.19, thermalConductivity_w_mk: 94, valenceElectrons: 6 },
  Cu: { atomicNumber: 29, atomicMass: 63.55, atomicRadiusPm: 128, electronegativity: 1.90, meltingPointC: 1085, density_g_cm3: 8.96, thermalConductivity_w_mk: 401, valenceElectrons: 11 },
  Fe: { atomicNumber: 26, atomicMass: 55.85, atomicRadiusPm: 126, electronegativity: 1.83, meltingPointC: 1538, density_g_cm3: 7.87, thermalConductivity_w_mk: 80, valenceElectrons: 8 },
  Ga: { atomicNumber: 31, atomicMass: 69.72, atomicRadiusPm: 135, electronegativity: 1.81, meltingPointC: 30, density_g_cm3: 5.91, thermalConductivity_w_mk: 29, valenceElectrons: 3 },
  Ge: { atomicNumber: 32, atomicMass: 72.63, atomicRadiusPm: 122, electronegativity: 2.01, meltingPointC: 938, density_g_cm3: 5.32, thermalConductivity_w_mk: 60, valenceElectrons: 4 },
  Hf: { atomicNumber: 72, atomicMass: 178.49, atomicRadiusPm: 159, electronegativity: 1.30, meltingPointC: 2233, density_g_cm3: 13.31, thermalConductivity_w_mk: 23, valenceElectrons: 4 },
  In: { atomicNumber: 49, atomicMass: 114.82, atomicRadiusPm: 167, electronegativity: 1.78, meltingPointC: 157, density_g_cm3: 7.31, thermalConductivity_w_mk: 82, valenceElectrons: 3 },
  Ir: { atomicNumber: 77, atomicMass: 192.22, atomicRadiusPm: 136, electronegativity: 2.20, meltingPointC: 2446, density_g_cm3: 22.56, thermalConductivity_w_mk: 147, valenceElectrons: 9 },
  Mg: { atomicNumber: 12, atomicMass: 24.31, atomicRadiusPm: 160, electronegativity: 1.31, meltingPointC: 650, density_g_cm3: 1.74, thermalConductivity_w_mk: 156, valenceElectrons: 2 },
  Mn: { atomicNumber: 25, atomicMass: 54.94, atomicRadiusPm: 127, electronegativity: 1.55, meltingPointC: 1246, density_g_cm3: 7.21, thermalConductivity_w_mk: 8, valenceElectrons: 7 },
  Mo: { atomicNumber: 42, atomicMass: 95.95, atomicRadiusPm: 139, electronegativity: 2.16, meltingPointC: 2623, density_g_cm3: 10.28, thermalConductivity_w_mk: 138, valenceElectrons: 6 },
  N: { atomicNumber: 7, atomicMass: 14.01, atomicRadiusPm: 65, electronegativity: 3.04, meltingPointC: -210, density_g_cm3: 0.0013, thermalConductivity_w_mk: 0.026, valenceElectrons: 5 },
  Nb: { atomicNumber: 41, atomicMass: 92.91, atomicRadiusPm: 146, electronegativity: 1.60, meltingPointC: 2477, density_g_cm3: 8.57, thermalConductivity_w_mk: 54, valenceElectrons: 5 },
  Ni: { atomicNumber: 28, atomicMass: 58.69, atomicRadiusPm: 124, electronegativity: 1.91, meltingPointC: 1455, density_g_cm3: 8.90, thermalConductivity_w_mk: 91, valenceElectrons: 10 },
  O: { atomicNumber: 8, atomicMass: 16.00, atomicRadiusPm: 60, electronegativity: 3.44, meltingPointC: -219, density_g_cm3: 0.0014, thermalConductivity_w_mk: 0.027, valenceElectrons: 6 },
  P: { atomicNumber: 15, atomicMass: 30.97, atomicRadiusPm: 110, electronegativity: 2.19, meltingPointC: 44, density_g_cm3: 1.82, thermalConductivity_w_mk: 0.24, valenceElectrons: 5 },
  Pb: { atomicNumber: 82, atomicMass: 207.20, atomicRadiusPm: 175, electronegativity: 2.33, meltingPointC: 327, density_g_cm3: 11.34, thermalConductivity_w_mk: 35, valenceElectrons: 4 },
  Pd: { atomicNumber: 46, atomicMass: 106.42, atomicRadiusPm: 137, electronegativity: 2.20, meltingPointC: 1555, density_g_cm3: 12.02, thermalConductivity_w_mk: 72, valenceElectrons: 10 },
  Pt: { atomicNumber: 78, atomicMass: 195.08, atomicRadiusPm: 139, electronegativity: 2.28, meltingPointC: 1768, density_g_cm3: 21.45, thermalConductivity_w_mk: 71, valenceElectrons: 10 },
  Re: { atomicNumber: 75, atomicMass: 186.21, atomicRadiusPm: 137, electronegativity: 1.90, meltingPointC: 3186, density_g_cm3: 21.02, thermalConductivity_w_mk: 48, valenceElectrons: 7 },
  Si: { atomicNumber: 14, atomicMass: 28.09, atomicRadiusPm: 111, electronegativity: 1.90, meltingPointC: 1414, density_g_cm3: 2.33, thermalConductivity_w_mk: 148, valenceElectrons: 4 },
  Sn: { atomicNumber: 50, atomicMass: 118.71, atomicRadiusPm: 145, electronegativity: 1.96, meltingPointC: 232, density_g_cm3: 7.31, thermalConductivity_w_mk: 67, valenceElectrons: 4 },
  Ta: { atomicNumber: 73, atomicMass: 180.95, atomicRadiusPm: 146, electronegativity: 1.50, meltingPointC: 3017, density_g_cm3: 16.65, thermalConductivity_w_mk: 57, valenceElectrons: 5 },
  Ti: { atomicNumber: 22, atomicMass: 47.87, atomicRadiusPm: 147, electronegativity: 1.54, meltingPointC: 1668, density_g_cm3: 4.51, thermalConductivity_w_mk: 22, valenceElectrons: 4 },
  V: { atomicNumber: 23, atomicMass: 50.94, atomicRadiusPm: 134, electronegativity: 1.63, meltingPointC: 1910, density_g_cm3: 6.11, thermalConductivity_w_mk: 31, valenceElectrons: 5 },
  W: { atomicNumber: 74, atomicMass: 183.84, atomicRadiusPm: 139, electronegativity: 2.36, meltingPointC: 3422, density_g_cm3: 19.25, thermalConductivity_w_mk: 173, valenceElectrons: 6 },
  Zn: { atomicNumber: 30, atomicMass: 65.38, atomicRadiusPm: 134, electronegativity: 1.65, meltingPointC: 420, density_g_cm3: 7.14, thermalConductivity_w_mk: 116, valenceElectrons: 12 },
  Zr: { atomicNumber: 40, atomicMass: 91.22, atomicRadiusPm: 160, electronegativity: 1.33, meltingPointC: 1855, density_g_cm3: 6.52, thermalConductivity_w_mk: 23, valenceElectrons: 4 }
};

