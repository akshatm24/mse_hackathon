"use client";

import { Check, Clipboard } from "lucide-react";
import { useEffect, useState } from "react";

import ScoreBreakdown from "@/components/ScoreBreakdown";
import { dataQualityLabel, formatNullable, sourceBadge } from "@/lib/material-display";
import type { RankedMaterial, UserConstraints } from "@/types";

interface MaterialCardProps {
  material: RankedMaterial;
  rank: number;
  selected: boolean;
  onToggle: () => void;
  compareDisabled?: boolean;
  staggerIndex?: number;
  weights: UserConstraints["priorityWeights"];
}

function categoryTone(category: RankedMaterial["category"]) {
  if (category === "Metal") return "border-blue-800 bg-[#1E3A5F] text-sky-400";
  if (category === "Polymer") return "border-green-800 bg-[#14532D] text-emerald-400";
  if (category === "Ceramic") return "border-red-900 bg-[#3F1616] text-rose-300";
  if (category === "Composite") return "border-orange-900 bg-[#44240C] text-orange-400";
  return "border-violet-900 bg-[#3B1F6E] text-violet-400";
}

function rankTone(rank: number) {
  if (rank === 1) return "bg-brand text-brand-subtle";
  if (rank === 2) return "bg-surface-800 text-surface-400";
  return "bg-[#1F1F23] text-surface-600";
}

function scoreTone(score: number) {
  if (score >= 80) return "#F59E0B";
  if (score >= 60) return "#38BDF8";
  return "#34D399";
}

export default function MaterialCard({
  material,
  rank,
  selected,
  onToggle,
  compareDisabled = false,
  staggerIndex = 0,
  weights
}: MaterialCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [barReady, setBarReady] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setBarReady(true), 80);
    const started = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / 700);
      setDisplayScore(Math.round(material.score * progress));
      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      }
    };

    frame = window.requestAnimationFrame(step);

    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frame);
    };
  }, [material.score]);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(
        `Material: ${material.name} | Score: ${material.score}/100 | Max Temp: ${formatNullable(material.max_service_temp_c, {
          suffix: "°C"
        })} | Density: ${formatNullable(material.density_g_cm3, {
          digits: 2,
          suffix: " g/cm³"
        })} | Cost: ${formatNullable(material.cost_usd_kg, {
          digits: 2,
          prefix: "$",
          suffix: "/kg"
        })}`
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const properties = [
    ["Subcategory", material.subcategory],
    ["Yield Strength", formatNullable(material.yield_strength_mpa, { suffix: " MPa" })],
    ["Elastic Modulus", formatNullable(material.elastic_modulus_gpa, { digits: 1, suffix: " GPa" })],
    ["Hardness", formatNullable(material.hardness_vickers, { suffix: " HV" })],
    ["Thermal Conductivity", formatNullable(material.thermal_conductivity_w_mk, { digits: 2, suffix: " W/m·K" })],
    ["Specific Heat", formatNullable(material.specific_heat_j_gk, { digits: 2, suffix: " J/g·K" })],
    ["Melting Point", formatNullable(material.melting_point_c, { suffix: "°C" })],
    ["Glass Transition", formatNullable(material.glass_transition_c, { suffix: "°C" })],
    ["Thermal Expansion", formatNullable(material.thermal_expansion_ppm_k, { digits: 1, suffix: " ppm/K" })],
    ["Resistivity", formatNullable(material.electrical_resistivity_ohm_m, { digits: 2, scientific: true, suffix: " Ω·m" })],
    ["Corrosion", material.corrosion_resistance ?? "—"],
    ["Machinability", material.machinability],
    ["FDM Printability", material.printability_fdm],
    ["Data Quality", dataQualityLabel(material)]
  ];

  return (
    <article
      className={`fade-slide-up rounded-xl border bg-surface-900 p-4 transition-all duration-200 hover:-translate-y-[1px] hover:border-surface-700 ${
        selected
          ? "border-amber-500/50 shadow-[0_0_0_1px_rgba(245,158,11,0.1)]"
          : rank === 1
            ? "border-amber-500/40 shadow-[0_0_0_1px_rgba(245,158,11,0.1),inset_0_1px_0_rgba(245,158,11,0.05)]"
            : "border-surface-800"
      }`}
      style={{ animationDelay: `${staggerIndex * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${rankTone(rank)}`}>
            #{rank}
          </span>
          <h3 className="mt-1.5 text-[15px] font-semibold text-zinc-100">{material.name}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${categoryTone(material.category)}`}
            >
              {material.category}
            </span>
            <span className="inline-flex rounded-full border border-surface-700 bg-surface-800 px-2 py-0.5 text-[10px] text-surface-300">
              {sourceBadge(material)}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <label
            className={`inline-flex items-center gap-1.5 text-[10px] text-surface-600 ${
              compareDisabled && !selected ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            title={compareDisabled && !selected ? "Max 4 for comparison" : "Compare"}
            onClick={(event) => event.stopPropagation()}
          >
            <span>Compare</span>
            <input
              type="checkbox"
              checked={selected}
              disabled={compareDisabled && !selected}
              onChange={onToggle}
              className="h-3.5 w-3.5 rounded border-surface-700 bg-surface-900 accent-amber-500"
            />
          </label>
          <div className="text-right">
            <div className="font-mono text-[22px] font-bold" style={{ color: scoreTone(material.score) }}>
              {displayScore}
            </div>
            <div className="text-[10px] text-surface-700">/100</div>
          </div>
        </div>
      </div>

      <div className="my-3 h-[2px] rounded-full bg-surface-800">
        <div
          className="h-[2px] rounded-full transition-[width] duration-700"
          style={{
            backgroundColor: scoreTone(material.score),
            width: barReady ? `${material.score}%` : "0%"
          }}
        />
      </div>

      <button type="button" onClick={() => setExpanded((current) => !current)} className="w-full text-left">
        <div className="grid grid-cols-2 gap-1">
          {[
            { label: "Max Temp", value: formatNullable(material.max_service_temp_c, { suffix: "°C" }) },
            { label: "Density", value: formatNullable(material.density_g_cm3, { digits: 2, suffix: " g/cm³" }) },
            { label: "Tensile", value: formatNullable(material.tensile_strength_mpa, { suffix: " MPa" }) },
            { label: "Cost", value: formatNullable(material.cost_usd_kg, { digits: 2, prefix: "$", suffix: "/kg" }) }
          ].map((property) => (
            <div key={property.label} className="rounded-md border border-brand-subtle bg-[#0C0A09] px-2 py-1.5">
              <div className="text-[9px] uppercase tracking-[0.08em] text-surface-700">
                {property.label}
              </div>
              <div className="font-mono text-[12px] font-medium text-zinc-100">{property.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-2 rounded-md border-l-2 border-surface-800 bg-[#0C0A09] px-2 py-1.5 text-[11px] leading-[1.5] text-surface-600">
          {material.matchReason}
        </div>
        {material.warnings && material.warnings.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {material.warnings.slice(0, 3).map((warning) => (
              <span
                key={warning}
                className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-100"
              >
                {warning}
              </span>
            ))}
          </div>
        ) : null}
      </button>

      <div className="overflow-hidden transition-[max-height] duration-300 ease-out" style={{ maxHeight: expanded ? 720 : 0 }}>
        <div className="pt-3">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void copySummary();
              }}
              className="inline-flex items-center gap-1 rounded-md border border-surface-700 px-2 py-1 text-[10px] text-surface-600 transition hover:text-surface-200"
            >
              {copied ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="rounded-md border border-surface-800 bg-[#0C0A09] px-3 py-3">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-surface-600">
              Score Breakdown
            </div>
            <ScoreBreakdown weights={weights} normalized={material.normalizedScores} />
          </div>

          <div className="mt-3 grid gap-x-3 md:grid-cols-2">
            {properties.map(([label, value], index) => (
              <div
                key={label}
                className={`flex items-center justify-between px-2 py-1 text-[11px] ${
                  index % 2 === 0 ? "bg-[#0C0A09]" : "bg-transparent"
                }`}
              >
                <span className="text-surface-600">{label}</span>
                <span className="font-mono text-surface-200">{value}</span>
              </div>
            ))}
          </div>

          {material.source_url ? (
            <a
              href={material.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 hover:underline"
            >
              View datasheet →
            </a>
          ) : (
            <div className="mt-3 text-right text-[10px] italic text-surface-700">
              Source: {material.data_source}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
