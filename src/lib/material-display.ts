import type { Material } from "@/types";

function firstSource(material: Material) {
  if (Array.isArray(material.source)) {
    return material.source[0] ?? "";
  }
  return material.source ?? "";
}

export function formatNullable(
  value: number | null | undefined,
  options?: { digits?: number; suffix?: string; scientific?: boolean; prefix?: string }
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  const digits = options?.digits ?? 0;
  const core = options?.scientific ? value.toExponential(digits) : value.toFixed(digits);
  return `${options?.prefix ?? ""}${core}${options?.suffix ?? ""}`;
}

export function sourceBadge(material: Material) {
  const source = firstSource(material);
  if (source === "MP") return "MP";
  if (source === "AZoM") return "AZoM";
  if (source === "Wikipedia") return "Wiki";
  if (source === "MatWeb") return "MatWeb";
  if (source === "EngineeringToolbox") return "Toolbox";
  if (/Hardcoded-|SpecialMetals|Haynes|Carpenter|ATI|Kennametal|Manufacturer/i.test(source)) {
    return "Manufacturer";
  }
  return "Curated";
}

export function sourceGroup(material: Material) {
  const source = firstSource(material);
  if (source === "MP") return "Materials Project";
  if (["AZoM", "Wikipedia", "MatWeb", "EngineeringToolbox"].includes(source)) {
    return "Web Scraped";
  }
  if (/Hardcoded-|SpecialMetals|Haynes|Carpenter|ATI|Kennametal|Manufacturer/i.test(source)) {
    return "Manufacturer Datasheets";
  }
  return "Curated";
}

export function dataQualityLabel(material: Material) {
  switch (material.data_quality) {
    case "hardcoded-cited":
      return "Hardcoded Cited";
    case "scraped":
      return "Scraped";
    case "estimated":
      return "Estimated";
    case "mp-calculated":
      return "MP Calculated";
    default:
      return "Experimental";
  }
}

export function sourceCount(materials: Material[]) {
  return new Set(materials.map((material) => sourceGroup(material))).size;
}
