import type { Material } from "@/types";

export type ElementFractions = Record<string, number>;

export function parseFormulaFractionsLocal(input: string): ElementFractions {
  const compact = input.replace(/\s+/g, "");
  if (!compact) {
    return {};
  }

  if (/^[A-Z][a-z]?(?:-?\d+(?:\.\d+)?[A-Z][a-z]?)+$/.test(compact)) {
    const first = compact.match(/^[A-Z][a-z]?/)?.[0];
    const remainder = compact.slice(first?.length ?? 0);
    const pieces = Array.from(remainder.matchAll(/(\d+(?:\.\d+)?)([A-Z][a-z]?)/g)).map(
      (match) => ({
        element: match[2],
        amount: Number.parseFloat(match[1])
      })
    );

    if (first && pieces.length > 0) {
      const explicit = pieces.reduce((sum, piece) => sum + piece.amount, 0);
      const maybeBalanced =
        explicit <= 100 && pieces.every((piece) => piece.amount <= 100)
          ? [{ element: first, amount: Math.max(1, 100 - explicit) }, ...pieces]
          : [{ element: first, amount: 1 }, ...pieces];
      return normalizeFractions(
        Object.fromEntries(maybeBalanced.map((piece) => [piece.element, piece.amount]))
      );
    }
  }

  const matches = Array.from(compact.matchAll(/([A-Z][a-z]?)(\d*(?:\.\d+)?)/g));
  if (matches.length === 0) {
    return {};
  }

  const reconstructed = matches.map((match) => `${match[1]}${match[2]}`).join("");
  if (reconstructed !== compact) {
    return {};
  }

  const amounts = Object.fromEntries(
    matches.map((match) => [match[1], match[2] ? Number.parseFloat(match[2]) : 1])
  );

  return normalizeFractions(amounts);
}

export function normalizeFractions(values: Record<string, number>) {
  const entries = Object.entries(values).filter(([, value]) => Number.isFinite(value) && value > 0);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  if (total <= 0) {
    return {};
  }

  return Object.fromEntries(
    entries
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([element, value]) => [element, Number((value / total).toFixed(6))])
  );
}

export function cosineSimilarity(left: ElementFractions, right: ElementFractions) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (const key of keys) {
    const l = left[key] ?? 0;
    const r = right[key] ?? 0;
    dot += l * r;
    leftNorm += l * l;
    rightNorm += r * r;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export function formulaForMaterial(material: Material) {
  if (material.formula_pretty) {
    return material.formula_pretty;
  }

  const bracketMatch = material.name.match(/\(([^)]+)\)/);
  if (bracketMatch?.[1] && /^[A-Za-z0-9.\-]+$/.test(bracketMatch[1])) {
    return bracketMatch[1];
  }

  return null;
}

export function elementKeywordScore(material: Material, elements: string[]) {
  if (elements.length === 0) {
    return 0;
  }

  const haystack = `${material.name} ${material.subcategory} ${material.tags.join(" ")}`.toLowerCase();
  const aliases = new Map<string, string[]>([
    ["Al", ["aluminum", "aluminium", "al-"]],
    ["Co", ["cobalt", "co-"]],
    ["Cr", ["chromium", "cr-"]],
    ["Cu", ["copper", "cu-"]],
    ["Fe", ["iron", "steel", "fe-"]],
    ["Mo", ["molybdenum", "mo-"]],
    ["Nb", ["niobium", "nb-"]],
    ["Ni", ["nickel", "ni-"]],
    ["Ta", ["tantalum", "ta-"]],
    ["Ti", ["titanium", "ti-"]],
    ["W", ["tungsten", "w-"]],
    ["Zr", ["zirconium", "zr-"]]
  ]);

  const hits = elements.filter((element) =>
    (aliases.get(element) ?? [element.toLowerCase()]).some((token) => haystack.includes(token))
  );

  return hits.length / elements.length;
}
