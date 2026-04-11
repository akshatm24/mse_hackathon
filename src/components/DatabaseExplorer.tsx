"use client";

import { ArrowUpDown, Database, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { materialsDB } from "@/lib/materials-db";
import { Material } from "@/types";

type SortKey = "density" | "tensile" | "max_service_temp" | "cost";
type SortDirection = "asc" | "desc";

const categoryOptions = ["All", "Metal", "Polymer", "Ceramic", "Composite", "Solder"] as const;
const corrosionOptions = ["All", "excellent", "good", "fair", "poor"] as const;
const printabilityOptions = ["All", "excellent", "good", "fair", "poor", "n/a"] as const;

function formatNullable(value: number | null, suffix = "", digits = 0): string {
  if (value === null) {
    return "—";
  }

  return `${value.toFixed(digits)}${suffix}`;
}

export default function DatabaseExplorer(): JSX.Element {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>("All");
  const [corrosion, setCorrosion] = useState<(typeof corrosionOptions)[number]>("All");
  const [printability, setPrintability] = useState<(typeof printabilityOptions)[number]>("All");
  const [sortKey, setSortKey] = useState<SortKey>("tensile");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);

  const filteredMaterials = useMemo(() => {
    const searchValue = deferredSearch.trim().toLowerCase();

    return materialsDB
      .filter((material) =>
        searchValue.length === 0 ? true : material.name.toLowerCase().includes(searchValue)
      )
      .filter((material) => (category === "All" ? true : material.category === category))
      .filter((material) => (corrosion === "All" ? true : material.corrosion_resistance === corrosion))
      .filter((material) => (printability === "All" ? true : material.printability_fdm === printability))
      .sort((first, second) => {
        const direction = sortDirection === "asc" ? 1 : -1;

        switch (sortKey) {
          case "density":
            return (first.density_g_cm3 - second.density_g_cm3) * direction;
          case "tensile":
            return (first.tensile_strength_mpa - second.tensile_strength_mpa) * direction;
          case "max_service_temp":
            return (first.max_service_temp_c - second.max_service_temp_c) * direction;
          case "cost":
            return (first.cost_usd_kg - second.cost_usd_kg) * direction;
          default:
            return 0;
        }
      });
  }, [category, corrosion, deferredSearch, printability, sortDirection, sortKey]);

  function toggleSort(nextKey: SortKey): void {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "density" || nextKey === "cost" ? "asc" : "desc");
  }

  return (
    <section id="database" className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Database Explorer</p>
          <h2 className="mt-2 text-lg font-medium text-zinc-100">Search and inspect the full embedded materials set</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {filteredMaterials.length} of {materialsDB.length} materials visible after filters.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300">
          <Database className="h-4 w-4 text-amber-400" />
          Embedded 40+ material records
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,0.6fr))]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by material name"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as (typeof categoryOptions)[number])}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={corrosion}
          onChange={(event) => setCorrosion(event.target.value as (typeof corrosionOptions)[number])}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        >
          {corrosionOptions.map((option) => (
            <option key={option} value={option}>
              Corrosion: {option}
            </option>
          ))}
        </select>
        <select
          value={printability}
          onChange={(event) => setPrintability(event.target.value as (typeof printabilityOptions)[number])}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        >
          {printabilityOptions.map((option) => (
            <option key={option} value={option}>
              FDM: {option}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-950/80 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort("density")} className="inline-flex items-center gap-2">
                  Density
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort("tensile")} className="inline-flex items-center gap-2">
                  Tensile
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort("max_service_temp")} className="inline-flex items-center gap-2">
                  Max Service Temp
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort("cost")} className="inline-flex items-center gap-2">
                  Cost
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map((material) => (
              <tr
                key={material.id}
                className="cursor-pointer border-t border-zinc-800 text-zinc-200 transition-colors hover:bg-zinc-800/70"
                onClick={() => setActiveMaterial(material)}
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-zinc-100">{material.name}</p>
                    <p className="text-xs text-zinc-500">{material.subcategory}</p>
                  </div>
                </td>
                <td className="px-4 py-3">{material.category}</td>
                <td className="px-4 py-3">{material.density_g_cm3.toFixed(2)} g/cm³</td>
                <td className="px-4 py-3">{material.tensile_strength_mpa.toFixed(0)} MPa</td>
                <td className="px-4 py-3">{material.max_service_temp_c.toFixed(0)}°C</td>
                <td className="px-4 py-3">${material.cost_usd_kg.toFixed(2)}/kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={activeMaterial !== null} onOpenChange={(open) => (!open ? setActiveMaterial(null) : undefined)}>
        <DialogContent>
          {activeMaterial ? (
            <>
              <DialogHeader>
                <DialogTitle>{activeMaterial.name}</DialogTitle>
                <DialogDescription>
                  {activeMaterial.category} · {activeMaterial.subcategory}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  ["Density", `${activeMaterial.density_g_cm3.toFixed(2)} g/cm³`],
                  ["Tensile Strength", `${activeMaterial.tensile_strength_mpa.toFixed(0)} MPa`],
                  ["Yield Strength", `${activeMaterial.yield_strength_mpa.toFixed(0)} MPa`],
                  ["Elastic Modulus", `${activeMaterial.elastic_modulus_gpa.toFixed(1)} GPa`],
                  ["Hardness", formatNullable(activeMaterial.hardness_vickers, " HV")],
                  ["Thermal Conductivity", `${activeMaterial.thermal_conductivity_w_mk.toFixed(2)} W/m·K`],
                  ["Specific Heat", `${activeMaterial.specific_heat_j_gk.toFixed(3)} J/g·K`],
                  ["Melting Point", formatNullable(activeMaterial.melting_point_c, "°C")],
                  ["Glass Transition", formatNullable(activeMaterial.glass_transition_c, "°C")],
                  ["Max Service Temp", `${activeMaterial.max_service_temp_c.toFixed(0)}°C`],
                  ["Thermal Expansion", `${activeMaterial.thermal_expansion_ppm_k.toFixed(2)} ppm/K`],
                  ["Electrical Resistivity", `${activeMaterial.electrical_resistivity_ohm_m.toExponential(2)} Ω·m`],
                  ["Corrosion", activeMaterial.corrosion_resistance],
                  ["Machinability", activeMaterial.machinability],
                  ["FDM Printability", activeMaterial.printability_fdm],
                  ["Cost", `$${activeMaterial.cost_usd_kg.toFixed(2)}/kg`]
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm">
                    <span className="text-zinc-500">{label}</span>
                    <span className="text-right text-zinc-200">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {activeMaterial.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-zinc-500">{activeMaterial.data_source}</p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
