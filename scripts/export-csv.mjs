import { mkdirSync, writeFileSync } from "fs";

const { materialsDB } = await import("../src/lib/materials-db.ts");

const headers = [
  "id",
  "name",
  "category",
  "subcategory",
  "density_g_cm3",
  "tensile_strength_mpa",
  "yield_strength_mpa",
  "elastic_modulus_gpa",
  "hardness_vickers",
  "thermal_conductivity_w_mk",
  "specific_heat_j_gk",
  "melting_point_c",
  "glass_transition_c",
  "max_service_temp_c",
  "thermal_expansion_ppm_k",
  "electrical_resistivity_ohm_m",
  "corrosion_resistance",
  "machinability",
  "printability_fdm",
  "cost_usd_kg",
  "tags",
  "data_source",
  "source_kind",
  "formula_pretty",
  "material_id",
  "energy_above_hull",
  "band_gap_eV",
  "is_stable"
];

const rows = materialsDB.map((material) =>
  headers
    .map((header) => {
      const value = material[header];

      if (Array.isArray(value)) {
        return `"${value.join(";")}"`;
      }

      if (value === null || value === undefined) {
        return "";
      }

      if (typeof value === "string") {
        return /[,"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
      }

      return String(value);
    })
    .join(",")
);

mkdirSync("submission", { recursive: true });
writeFileSync("submission/materials_export.csv", [headers.join(","), ...rows].join("\n"));
console.log(`Exported ${materialsDB.length} materials to submission/materials_export.csv`);
