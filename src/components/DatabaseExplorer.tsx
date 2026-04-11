"use client";

import { ArrowUpDown, Search, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import materialsDB from "@/lib/materials-db";
import { Material } from "@/types";

type SortKey =
  | "name"
  | "category"
  | "max_service_temp_c"
  | "density_g_cm3"
  | "tensile_strength_mpa"
  | "cost_usd_kg";

type SortDirection = "asc" | "desc";

function categoryTone(category: Material["category"]) {
  if (category === "Metal") {
    return "border-blue-800 bg-[#1E3A5F] text-sky-400";
  }
  if (category === "Polymer") {
    return "border-green-800 bg-[#14532D] text-emerald-400";
  }
  if (category === "Ceramic") {
    return "border-violet-900 bg-[#3B1F6E] text-violet-400";
  }
  if (category === "Composite") {
    return "border-orange-900 bg-[#44240C] text-orange-400";
  }
  return "border-rose-900 bg-[#3B1111] text-rose-400";
}

function costTone(cost: number) {
  if (cost < 10) {
    return "#34D399";
  }
  if (cost <= 50) {
    return "#A1A1AA";
  }
  return "#FB7185";
}

function corrosionDot(level: Material["corrosion_resistance"]) {
  if (level === "excellent") {
    return "#34D399";
  }
  if (level === "good") {
    return "#38BDF8";
  }
  if (level === "fair") {
    return "#F59E0B";
  }
  return "#FB7185";
}

export default function DatabaseExplorer() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState<"All" | Material["category"]>("All");
  const [corrosion, setCorrosion] = useState<
    "All" | Material["corrosion_resistance"]
  >("All");
  const [fdm, setFdm] = useState<"All" | "Printable" | "Non-printable">("All");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredMaterials = useMemo(() => {
    const searchValue = deferredSearch.trim().toLowerCase();
    const next = materialsDB
      .filter((material) => {
        if (!searchValue) {
          return true;
        }
        return (
          material.name.toLowerCase().includes(searchValue) ||
          material.subcategory.toLowerCase().includes(searchValue) ||
          material.tags.some((tag) => tag.toLowerCase().includes(searchValue))
        );
      })
      .filter((material) => (category === "All" ? true : material.category === category))
      .filter((material) =>
        corrosion === "All" ? true : material.corrosion_resistance === corrosion
      )
      .filter((material) => {
        if (fdm === "All") {
          return true;
        }
        if (fdm === "Printable") {
          return material.printability_fdm !== "n/a" && material.printability_fdm !== "poor";
        }
        return material.printability_fdm === "n/a" || material.printability_fdm === "poor";
      })
      .sort((left, right) => {
        const direction = sortDirection === "asc" ? 1 : -1;
        const leftValue = left[sortKey];
        const rightValue = right[sortKey];

        if (typeof leftValue === "string" && typeof rightValue === "string") {
          return leftValue.localeCompare(rightValue) * direction;
        }

        return ((leftValue as number) - (rightValue as number)) * direction;
      });

    return next;
  }, [category, corrosion, deferredSearch, fdm, sortDirection, sortKey]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredMaterials.length]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (activeMaterial && event.key === "Escape") {
        setActiveMaterial(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeMaterial]);

  function toggleSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === "name" || nextKey === "category" ? "asc" : "desc");
  }

  function sortLabel(key: SortKey) {
    if (sortKey !== key) {
      return "↕";
    }
    return sortDirection === "asc" ? "↑" : "↓";
  }

  return (
    <section className="space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.12em] text-surface-600">
          All 42 Materials
        </div>
        <h2 className="mt-1 text-[20px] font-semibold text-zinc-100">Material Database</h2>
        <p className="mt-1 text-[13px] leading-[1.7] text-zinc-500">
          Click any row for full property sheet. Sort by any column.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-600" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search materials..."
            className="w-[240px] rounded-lg border border-surface-800 bg-surface-900 py-2 pl-8 pr-3 text-[12px] text-zinc-100 outline-none transition focus:border-amber-500/40"
          />
        </label>

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as "All" | Material["category"])}
          className="rounded-lg border border-surface-800 bg-surface-900 px-3 py-2 text-[12px] text-zinc-100 outline-none"
        >
          <option>All</option>
          <option>Metal</option>
          <option>Polymer</option>
          <option>Ceramic</option>
          <option>Composite</option>
          <option>Solder</option>
        </select>

        <select
          value={corrosion}
          onChange={(event) =>
            setCorrosion(event.target.value as "All" | Material["corrosion_resistance"])
          }
          className="rounded-lg border border-surface-800 bg-surface-900 px-3 py-2 text-[12px] text-zinc-100 outline-none"
        >
          <option>All</option>
          <option>excellent</option>
          <option>good</option>
          <option>fair</option>
          <option>poor</option>
        </select>

        <select
          value={fdm}
          onChange={(event) => setFdm(event.target.value as "All" | "Printable" | "Non-printable")}
          className="rounded-lg border border-surface-800 bg-surface-900 px-3 py-2 text-[12px] text-zinc-100 outline-none"
        >
          <option>All</option>
          <option>Printable</option>
          <option>Non-printable</option>
        </select>

        <div className="ml-auto text-[11px] text-surface-600">
          Showing {filteredMaterials.length} of {materialsDB.length} materials
        </div>
      </div>

      <div
        className="overflow-x-auto rounded-xl border border-surface-800"
        tabIndex={0}
        onKeyDown={(event) => {
          if (filteredMaterials.length === 0) {
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightedIndex((current) =>
              Math.min(current + 1, filteredMaterials.length - 1)
            );
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightedIndex((current) => Math.max(current - 1, 0));
          }
          if (event.key === "Enter") {
            event.preventDefault();
            setActiveMaterial(filteredMaterials[highlightedIndex]);
          }
        }}
      >
        <table className="min-w-full border-separate border-spacing-0 bg-surface-900">
          <thead className="sticky top-0 bg-surface-800">
            <tr>
              {[
                ["Material", "name"],
                ["Category", "category"],
                ["Max Temp", "max_service_temp_c"],
                ["Density", "density_g_cm3"],
                ["Tensile", "tensile_strength_mpa"],
                ["Cost", "cost_usd_kg"],
                ["FDM", null],
                ["Corrosion", null]
              ].map(([label, key]) => (
                <th
                  key={label}
                  className={`px-3 py-2 text-left text-[10px] uppercase tracking-[0.12em] ${
                    key && sortKey === key ? "text-brand" : "text-surface-600"
                  }`}
                >
                  {key ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(key as SortKey)}
                      className="inline-flex items-center gap-1"
                    >
                      {label}
                      <ArrowUpDown className="h-3 w-3" />
                      <span>{sortLabel(key as SortKey)}</span>
                    </button>
                  ) : (
                    label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-[13px] text-surface-600"
                >
                  No materials match these filters.
                </td>
              </tr>
            ) : null}

            {filteredMaterials.map((material, index) => (
              <tr
                key={material.id}
                className={`cursor-pointer border-b border-brand-subtle ${
                  highlightedIndex === index ? "bg-[#1F1F23]" : index % 2 === 0 ? "bg-surface-900" : "bg-[#141416]"
                } transition`}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => setActiveMaterial(material)}
              >
                <td className="px-3 py-2">
                  <div className="text-[12px] font-medium text-zinc-100">{material.name}</div>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] ${categoryTone(material.category)}`}
                  >
                    {material.category}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-surface-400">
                  {material.max_service_temp_c}
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-surface-400">
                  {material.density_g_cm3.toFixed(2)}
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-surface-400">
                  {material.tensile_strength_mpa}
                </td>
                <td
                  className="px-3 py-2 font-mono text-[11px]"
                  style={{ color: costTone(material.cost_usd_kg) }}
                >
                  ${material.cost_usd_kg.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-[12px]">
                  {material.printability_fdm !== "n/a" && material.printability_fdm !== "poor" ? (
                    <span className="text-emerald-400">✓</span>
                  ) : (
                    <span className="text-surface-700">×</span>
                  )}
                </td>
                <td className="px-3 py-2 text-[11px] text-surface-400">
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: corrosionDot(material.corrosion_resistance) }} />
                  {material.corrosion_resistance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeMaterial ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[4px]"
          onClick={() => setActiveMaterial(null)}
        >
          <div
            className="modal-in max-h-[80vh] w-[90%] max-w-[560px] overflow-y-auto rounded-2xl border border-surface-800 bg-surface-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-surface-800 px-5 py-4">
              <div>
                <h3 className="text-[20px] font-bold text-zinc-100">{activeMaterial.name}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${categoryTone(activeMaterial.category)}`}
                  >
                    {activeMaterial.category}
                  </span>
                  <span className="rounded-full border border-surface-700 px-2 py-0.5 text-[10px] text-surface-600">
                    {activeMaterial.data_source}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMaterial(null)}
                className="text-surface-600 transition hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 px-5 py-4 md:grid-cols-2">
              {[
                ["Subcategory", activeMaterial.subcategory],
                ["Density", `${activeMaterial.density_g_cm3.toFixed(2)} g/cm³`],
                ["Tensile Strength", `${activeMaterial.tensile_strength_mpa} MPa`],
                ["Yield Strength", `${activeMaterial.yield_strength_mpa} MPa`],
                ["Elastic Modulus", `${activeMaterial.elastic_modulus_gpa.toFixed(1)} GPa`],
                ["Hardness", activeMaterial.hardness_vickers === null ? "—" : `${activeMaterial.hardness_vickers} HV`],
                ["Thermal Conductivity", `${activeMaterial.thermal_conductivity_w_mk.toFixed(2)} W/m·K`],
                ["Specific Heat", `${activeMaterial.specific_heat_j_gk.toFixed(2)} J/g·K`],
                ["Melting Point", activeMaterial.melting_point_c === null ? "—" : `${activeMaterial.melting_point_c}°C`],
                ["Glass Transition", activeMaterial.glass_transition_c === null ? "—" : `${activeMaterial.glass_transition_c}°C`],
                ["Max Service Temp", `${activeMaterial.max_service_temp_c}°C`],
                ["Thermal Expansion", `${activeMaterial.thermal_expansion_ppm_k.toFixed(1)} ppm/K`],
                ["Resistivity", `${activeMaterial.electrical_resistivity_ohm_m.toExponential(2)} Ω·m`],
                ["Corrosion", activeMaterial.corrosion_resistance],
                ["Machinability", activeMaterial.machinability],
                ["FDM Printability", activeMaterial.printability_fdm],
                ["Cost", `$${activeMaterial.cost_usd_kg.toFixed(2)}/kg`]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-surface-800 bg-surface-950 px-3 py-2">
                  <div className="text-[11px] text-surface-600">{label}</div>
                  <div className="mt-1 font-mono text-[13px] text-zinc-100">{value}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-surface-800 px-5 py-4">
              <div className="mb-2 text-[11px] text-surface-600">Tags</div>
              <div className="flex flex-wrap gap-1.5">
                {activeMaterial.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-surface-800 px-2 py-0.5 text-[10px] text-zinc-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
