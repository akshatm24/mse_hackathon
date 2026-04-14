"use client";

import { ArrowUpDown, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ALL_MATERIALS, ENGINEERING_MATERIALS } from "@/data";
import { dataQualityLabel, formatNullable, sourceBadge, sourceGroup } from "@/lib/material-display";
import { Material } from "@/types";

type SortKey =
  | "name"
  | "category"
  | "max_service_temp_c"
  | "density_g_cm3"
  | "tensile_strength_mpa"
  | "cost_usd_kg";

type SortDirection = "asc" | "desc";
type SearchMode = "exact" | "semantic";
type SourceFilter =
  | "All"
  | "Curated"
  | "MakeItFrom"
  | "Materials Project"
  | "Web Scraped"
  | "Manufacturer Datasheets";

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

function costTone(cost: number | null) {
  if (cost === null) {
    return "#A1A1AA";
  }
  if (cost < 10) {
    return "#34D399";
  }
  if (cost <= 50) {
    return "#A1A1AA";
  }
  return "#FB7185";
}

function corrosionDot(level: Material["corrosion_resistance"]) {
  if (level === null) {
    return "#71717A";
  }
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("exact");
  const [semanticResults, setSemanticResults] = useState<Material[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState("");
  const [category, setCategory] = useState<"All" | Material["category"]>("All");
  const [corrosion, setCorrosion] = useState<
    "All" | Material["corrosion_resistance"]
  >("All");
  const [fdm, setFdm] = useState<"All" | "Printable" | "Non-printable">("All");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All");
  const [experimentalOnly, setExperimentalOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("tensile_strength_mpa");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showMP, setShowMP] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(30);
  const [virtualStart, setVirtualStart] = useState(0);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (searchMode !== "semantic") {
      setSemanticLoading(false);
      setSemanticError("");
      return;
    }

    const query = debouncedSearch.trim();
    if (!query) {
      setSemanticResults([]);
      setSemanticError("");
      setSemanticLoading(false);
      return;
    }

    const controller = new AbortController();

    async function runSemanticSearch() {
      setSemanticLoading(true);
      setSemanticError("");

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ query }),
          signal: controller.signal
        });

        const payload = (await response.json()) as {
          results?: Material[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Semantic search failed");
        }

        setSemanticResults(payload.results ?? []);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        setSemanticResults([]);
        setSemanticError(
          error instanceof Error ? error.message : "Semantic search failed"
        );
      } finally {
        setSemanticLoading(false);
      }
    }

    void runSemanticSearch();
    return () => controller.abort();
  }, [debouncedSearch, searchMode]);

  const filteredMaterials = useMemo(() => {
    const searchValue = debouncedSearch.trim().toLowerCase();
    const baseUniverse = showMP ? ALL_MATERIALS : ENGINEERING_MATERIALS;
    const baseMaterials =
      searchMode === "semantic" && searchValue
        ? semanticResults.filter((material) => showMP || material.source_kind !== "mp")
        : baseUniverse;

    const next = baseMaterials
      .filter((material) => {
        if (searchMode === "semantic" || !searchValue) {
          return true;
        }

        return (
          material.name.toLowerCase().includes(searchValue) ||
          material.subcategory.toLowerCase().includes(searchValue) ||
          material.formula_pretty?.toLowerCase().includes(searchValue) ||
          material.tags.some((tag) => tag.toLowerCase().includes(searchValue))
        );
      })
      .filter((material) => (category === "All" ? true : material.category === category))
      .filter((material) =>
        corrosion === "All" ? true : material.corrosion_resistance === corrosion
      )
      .filter((material) =>
        sourceFilter === "All" ? true : sourceGroup(material) === sourceFilter
      )
      .filter((material) =>
        experimentalOnly
          ? material.data_quality !== "estimated" && material.data_quality !== "mp-calculated"
          : true
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

        if (leftValue === null || leftValue === undefined) return 1;
        if (rightValue === null || rightValue === undefined) return -1;
        return ((leftValue as number) - (rightValue as number)) * direction;
      });

    return next;
  }, [
    category,
    corrosion,
    debouncedSearch,
    experimentalOnly,
    fdm,
    searchMode,
    showMP,
    semanticResults,
    sourceFilter,
    sortDirection,
    sortKey
  ]);

  const visibleMaterials = filteredMaterials.slice(0, visibleCount);
  const rowHeight = 49;
  const usingVirtualRows = visibleMaterials.length > 200;
  const virtualWindow = usingVirtualRows
    ? visibleMaterials.slice(virtualStart, Math.min(visibleMaterials.length, virtualStart + 40))
    : visibleMaterials;
  const topSpacer = usingVirtualRows ? virtualStart * rowHeight : 0;
  const bottomSpacer = usingVirtualRows
    ? Math.max(0, (visibleMaterials.length - (virtualStart + virtualWindow.length)) * rowHeight)
    : 0;

  useEffect(() => {
    setVisibleCount(30);
    setHighlightedIndex(0);
    setVirtualStart(0);
  }, [filteredMaterials.length, category, corrosion, experimentalOnly, fdm, searchMode, debouncedSearch, sourceFilter]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container || !usingVirtualRows) {
      return;
    }

    function handleScroll() {
      const nextStart = Math.max(0, Math.floor((container?.scrollTop ?? 0) / rowHeight) - 8);
      setVirtualStart(nextStart);
    }

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [usingVirtualRows]);

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
          All {ALL_MATERIALS.length} Materials
        </div>
        <h2 className="mt-1 text-[20px] font-semibold text-zinc-100">Material Database</h2>
        <p className="mt-1 text-[13px] leading-[1.7] text-zinc-500">
          Click any row for full property sheet. Sort by any column and filter by source or data quality.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-surface-800 bg-surface-900 p-1 text-[11px]">
          <button
            type="button"
            onClick={() => setSearchMode("exact")}
            className={`rounded-md px-3 py-1.5 ${
              searchMode === "exact"
                ? "bg-surface-800 text-zinc-100"
                : "text-surface-500"
            }`}
          >
            Exact match
          </button>
          <button
            type="button"
            onClick={() => setSearchMode("semantic")}
            className={`rounded-md px-3 py-1.5 ${
              searchMode === "semantic"
                ? "bg-surface-800 text-zinc-100"
                : "text-surface-500"
            }`}
          >
            Semantic search
          </button>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-600" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              searchMode === "semantic"
                ? "Describe a material need..."
                : "Search materials..."
            }
            className="w-[240px] rounded-lg border border-surface-800 bg-surface-900 py-2 pl-8 pr-3 text-[12px] text-zinc-100 outline-none transition focus:border-amber-500/40"
          />
          {semanticLoading && searchMode === "semantic" ? (
            <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-brand" />
          ) : null}
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
          value={corrosion ?? "All"}
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

        <div className="flex items-center gap-1 rounded-lg border border-surface-800 bg-surface-900 p-1">
          {([
            "All",
            "Curated",
            "MakeItFrom",
            "Materials Project",
            "Web Scraped",
            "Manufacturer Datasheets"
          ] as SourceFilter[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSourceFilter(option)}
              className={`rounded-md px-2 py-1 text-[11px] ${
                sourceFilter === option ? "bg-surface-800 text-zinc-100" : "text-surface-500"
              }`}
            >
              {option === "Materials Project" ? "MP" : option}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 rounded-lg border border-surface-800 bg-surface-900 px-3 py-2 text-[12px] text-surface-400">
          <input
            type="checkbox"
            checked={experimentalOnly}
            onChange={(event) => setExperimentalOnly(event.target.checked)}
            className="h-4 w-4 accent-amber-500"
          />
          Show only experimentally verified data
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-surface-800 bg-surface-900 px-3 py-2 text-[12px] text-surface-400">
          <input
            type="checkbox"
            checked={showMP}
            onChange={(event) => setShowMP(event.target.checked)}
            className="h-4 w-4 accent-amber-500"
          />
          Show Materials Project compounds
        </label>

        <div className="ml-auto text-[11px] text-surface-600">
          Showing {visibleMaterials.length} of {filteredMaterials.length} filtered / {ALL_MATERIALS.length} total
        </div>
      </div>

      {searchMode === "semantic" ? (
        <div className="text-[11px] text-surface-500">
          Use descriptive queries like{" "}
          <span className="text-zinc-100">&quot;corrosion resistant for ocean&quot;</span>.
        </div>
      ) : null}

      {semanticError ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 font-mono text-[11px] text-amber-200">
          {semanticError}
        </div>
      ) : null}

      <div
        ref={tableContainerRef}
        className={`overflow-x-auto rounded-xl border border-surface-800 ${usingVirtualRows ? "max-h-[70vh] overflow-y-auto" : ""}`}
        tabIndex={0}
        onKeyDown={(event) => {
          if (virtualWindow.length === 0) {
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightedIndex((current) =>
              Math.min(current + 1, visibleMaterials.length - 1)
            );
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightedIndex((current) => Math.max(current - 1, 0));
          }
          if (event.key === "Enter") {
            event.preventDefault();
            setActiveMaterial(visibleMaterials[highlightedIndex]);
          }
        }}
      >
        <table className="min-w-full border-separate border-spacing-0 bg-surface-900">
          <thead className="sticky top-0 bg-surface-800">
            <tr>
              {[
                ["Material", "name"],
                ["Category", "category"],
                ["Source", null],
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
                  colSpan={9}
                  className="px-4 py-10 text-center text-[13px] text-surface-600"
                >
                  No materials match these filters.
                </td>
              </tr>
            ) : null}

            {usingVirtualRows && topSpacer > 0 ? (
              <tr>
                <td colSpan={9} style={{ height: `${topSpacer}px` }} />
              </tr>
            ) : null}

            {virtualWindow.map((material, index) => (
              <tr
                key={material.id}
                className={`cursor-pointer border-b border-brand-subtle ${
                  highlightedIndex === index + virtualStart
                    ? "bg-[#1F1F23]"
                    : index % 2 === 0
                      ? "bg-surface-900"
                      : "bg-[#141416]"
                } transition`}
                onMouseEnter={() => setHighlightedIndex(index + virtualStart)}
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
                <td className="px-3 py-2">
                  <span className="inline-flex rounded-full border border-surface-700 px-2 py-0.5 text-[9px] text-surface-300">
                    {sourceBadge(material)}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-surface-400">
                  {formatNullable(material.max_service_temp_c)}
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-surface-400">
                  {formatNullable(material.density_g_cm3, { digits: 2 })}
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-surface-400">
                  {formatNullable(material.tensile_strength_mpa)}
                </td>
                <td
                  className="px-3 py-2 font-mono text-[11px]"
                  style={{ color: costTone(material.cost_usd_kg) }}
                >
                  {formatNullable(material.cost_usd_kg, { digits: 2, prefix: "$" })}
                </td>
                <td className="px-3 py-2 text-[12px]">
                  {material.printability_fdm !== "n/a" &&
                  material.printability_fdm !== "poor" ? (
                    <span className="text-emerald-400">✓</span>
                  ) : (
                    <span className="text-surface-700">×</span>
                  )}
                </td>
                <td className="px-3 py-2 text-[11px] text-surface-400">
                  <span
                    className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: corrosionDot(material.corrosion_resistance) }}
                  />
                  {material.corrosion_resistance ?? "—"}
                </td>
              </tr>
            ))}

            {usingVirtualRows && bottomSpacer > 0 ? (
              <tr>
                <td colSpan={9} style={{ height: `${bottomSpacer}px` }} />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {filteredMaterials.length > visibleMaterials.length ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => current + 30)}
            className="rounded-full border border-surface-800 px-4 py-2 text-[12px] text-surface-400 transition hover:text-zinc-100"
          >
            Load more
          </button>
        </div>
      ) : null}

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
                  <span className="rounded-full border border-surface-700 px-2 py-0.5 text-[10px] text-surface-400">
                    {sourceBadge(activeMaterial)}
                  </span>
                  <span className="rounded-full border border-surface-700 px-2 py-0.5 text-[10px] text-surface-600">
                    {dataQualityLabel(activeMaterial)}
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
                ["Formula", activeMaterial.formula_pretty ?? "—"],
                ["Density", formatNullable(activeMaterial.density_g_cm3, { digits: 2, suffix: " g/cm³" })],
                ["Tensile Strength", formatNullable(activeMaterial.tensile_strength_mpa, { suffix: " MPa" })],
                ["Yield Strength", formatNullable(activeMaterial.yield_strength_mpa, { suffix: " MPa" })],
                ["Elastic Modulus", formatNullable(activeMaterial.elastic_modulus_gpa, { digits: 1, suffix: " GPa" })],
                [
                  "Hardness",
                  activeMaterial.hardness_vickers === null
                    ? "—"
                    : `${activeMaterial.hardness_vickers} HV`
                ],
                [
                  "Thermal Conductivity",
                  formatNullable(activeMaterial.thermal_conductivity_w_mk, { digits: 2, suffix: " W/m·K" })
                ],
                [
                  "Specific Heat",
                  formatNullable(activeMaterial.specific_heat_j_gk, { digits: 2, suffix: " J/g·K" })
                ],
                [
                  "Melting Point",
                  formatNullable(activeMaterial.melting_point_c, { suffix: "°C" })
                ],
                [
                  "Glass Transition",
                  formatNullable(activeMaterial.glass_transition_c, { suffix: "°C" })
                ],
                ["Max Service Temp", formatNullable(activeMaterial.max_service_temp_c, { suffix: "°C" })],
                [
                  "Thermal Expansion",
                  formatNullable(activeMaterial.thermal_expansion_ppm_k, { digits: 1, suffix: " ppm/K" })
                ],
                [
                  "Resistivity",
                  formatNullable(activeMaterial.electrical_resistivity_ohm_m, { digits: 2, scientific: true, suffix: " Ω·m" })
                ],
                ["Corrosion", activeMaterial.corrosion_resistance ?? "—"],
                ["Machinability", activeMaterial.machinability],
                ["FDM Printability", activeMaterial.printability_fdm],
                ["Cost", formatNullable(activeMaterial.cost_usd_kg, { digits: 2, prefix: "$", suffix: "/kg" })]
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-surface-800 bg-surface-950 px-3 py-2"
                >
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
