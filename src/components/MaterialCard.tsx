"use client";

import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { RankedMaterial } from "@/types";

interface MaterialCardProps {
  material: RankedMaterial;
  rank: number;
  isExpanded: boolean;
  isSelected: boolean;
  disableCompare: boolean;
  onToggle: () => void;
  onCompareToggle: () => void;
}

function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits > 0 ? Math.min(digits, 1) : 0
  });
}

function formatNullable(value: number | null, suffix = "", digits = 0): string {
  if (value === null) {
    return "—";
  }

  return `${formatNumber(value, digits)}${suffix}`;
}

function categoryBadgeClass(category: RankedMaterial["category"]): string {
  switch (category) {
    case "Metal":
      return "border-sky-500/40 bg-sky-500/10 text-sky-300";
    case "Polymer":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case "Ceramic":
      return "border-violet-500/40 bg-violet-500/10 text-violet-300";
    case "Composite":
      return "border-cyan-500/40 bg-cyan-500/10 text-cyan-300";
    case "Solder":
      return "border-rose-500/40 bg-rose-500/10 text-rose-300";
    default:
      return "border-zinc-600 bg-zinc-800 text-zinc-300";
  }
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) {
    return "border border-amber-500/50 bg-amber-500/20 text-amber-400";
  }

  if (rank === 2) {
    return "bg-zinc-700/50 text-zinc-300";
  }

  if (rank === 3) {
    return "bg-zinc-800 text-zinc-400";
  }

  return "bg-zinc-800/80 text-zinc-400";
}

function scoreBarClass(score: number): string {
  if (score >= 80) {
    return "bg-amber-500";
  }

  if (score >= 60) {
    return "bg-sky-400";
  }

  return "bg-zinc-500";
}

export default function MaterialCard({
  material,
  rank,
  isExpanded,
  isSelected,
  disableCompare,
  onToggle,
  onCompareToggle
}: MaterialCardProps): JSX.Element {
  const properties = [
    ["Subcategory", material.subcategory],
    ["Density", `${formatNumber(material.density_g_cm3, 2)} g/cm³`],
    ["Tensile Strength", `${formatNumber(material.tensile_strength_mpa)} MPa`],
    ["Yield Strength", `${formatNumber(material.yield_strength_mpa)} MPa`],
    ["Elastic Modulus", `${formatNumber(material.elastic_modulus_gpa, 1)} GPa`],
    ["Hardness", formatNullable(material.hardness_vickers, " HV")],
    ["Thermal Conductivity", `${formatNumber(material.thermal_conductivity_w_mk, 2)} W/m·K`],
    ["Specific Heat", `${formatNumber(material.specific_heat_j_gk, 3)} J/g·K`],
    ["Melting Point", formatNullable(material.melting_point_c, "°C")],
    ["Glass Transition", formatNullable(material.glass_transition_c, "°C")],
    ["Max Service Temp", `${formatNumber(material.max_service_temp_c)}°C`],
    ["Thermal Expansion", `${formatNumber(material.thermal_expansion_ppm_k, 2)} ppm/K`],
    ["Electrical Resistivity", `${material.electrical_resistivity_ohm_m.toExponential(2)} Ω·m`],
    ["Corrosion", material.corrosion_resistance],
    ["Machinability", material.machinability],
    ["FDM Printability", material.printability_fdm],
    ["Cost", `$${formatNumber(material.cost_usd_kg, 2)}/kg`]
  ];

  return (
    <article className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 transition hover:border-zinc-500 hover:shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", rankBadgeClass(rank))}>
              #{rank}
            </span>
            <span className={cn("rounded-full border px-2 py-0.5 text-xs", categoryBadgeClass(material.category))}>
              {material.category}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">{material.name}</h3>
            <p className="text-sm text-zinc-400">{material.subcategory}</p>
          </div>
        </div>

        <label
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
            isSelected
              ? "border-amber-500 bg-amber-500/10 text-amber-400"
              : "border-zinc-700 bg-zinc-800 text-zinc-400",
            disableCompare && !isSelected ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          )}
          onClick={(event) => event.stopPropagation()}
          title={disableCompare && !isSelected ? "Select up to four materials for comparison." : "Compare material"}
        >
          <input
            type="checkbox"
            checked={isSelected}
            disabled={disableCompare && !isSelected}
            onChange={onCompareToggle}
            className="sr-only"
          />
          <Check className="h-4 w-4" />
        </label>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-500">
          <span>Score</span>
          <span className="font-mono text-amber-400">{material.score.toFixed(1)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-700">
          <div
            className={cn("h-1.5 rounded-full transition-[width] duration-700 ease-out", scoreBarClass(material.score))}
            style={{ width: `${Math.min(100, material.score)}%` }}
          />
        </div>
      </div>

      <button type="button" className="mt-4 w-full text-left" onClick={onToggle}>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { label: "Max Temp", value: `${formatNumber(material.max_service_temp_c)}°C` },
            { label: "Density", value: `${formatNumber(material.density_g_cm3, 2)} g/cm³` },
            { label: "Tensile", value: `${formatNumber(material.tensile_strength_mpa)} MPa` },
            { label: "Cost", value: `$${formatNumber(material.cost_usd_kg, 2)}/kg` }
          ].map((pill) => (
            <div key={pill.label} className="rounded-xl border border-zinc-800 bg-zinc-800/70 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">{pill.label}</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">{pill.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
          <span>{isExpanded ? "Hide full property sheet" : "Show full property sheet"}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded ? "rotate-180" : "rotate-0")} />
        </div>
      </button>

      {isExpanded ? (
        <div className="mt-4 space-y-4 border-t border-zinc-800 pt-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2">
            {properties.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 border-b border-zinc-800/80 py-2 text-sm">
                <span className="text-zinc-500">{label}</span>
                <span className="text-right text-zinc-200">{value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs uppercase tracking-wide text-amber-400">Why Recommended</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">{material.matchReason}</p>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
            <p className="flex flex-wrap gap-1">
              {material.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-400">
                  {tag}
                </span>
              ))}
            </p>
            <span className="text-right">{material.data_source}</span>
          </div>
        </div>
      ) : null}
    </article>
  );
}
