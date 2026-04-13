import axios from "axios";
import * as cheerio from "cheerio";

import {
  APP_DB_PATH,
  USER_AGENT,
  normalizeName,
  readJson,
  sleep,
  writeJson
} from "../lib/pipeline-utils.mjs";

const robotsCache = new Map();

export const http = axios.create({
  timeout: 45000,
  headers: {
    "User-Agent": USER_AGENT,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  }
});

function parseRobots(text) {
  const sections = [];
  let active = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const [directive, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    const key = directive.toLowerCase();

    if (key === "user-agent") {
      active = { agent: value.toLowerCase(), allow: [], disallow: [] };
      sections.push(active);
      continue;
    }

    if (!active) continue;
    if (key === "allow") active.allow.push(value);
    if (key === "disallow") active.disallow.push(value);
  }

  return sections;
}

async function loadRobots(origin) {
  if (robotsCache.has(origin)) {
    return robotsCache.get(origin);
  }

  try {
    const response = await http.get(new URL("/robots.txt", origin).toString());
    const parsed = parseRobots(response.data);
    robotsCache.set(origin, parsed);
    return parsed;
  } catch {
    const empty = [];
    robotsCache.set(origin, empty);
    return empty;
  }
}

export async function isAllowedByRobots(targetUrl) {
  const url = new URL(targetUrl);
  const rules = await loadRobots(url.origin);
  const pathname = url.pathname;
  const candidates = rules.filter(
    (entry) => entry.agent === "*" || USER_AGENT.toLowerCase().includes(entry.agent)
  );

  let bestMatch = { type: "allow", length: -1 };
  for (const entry of candidates) {
    for (const allow of entry.allow) {
      if (allow && pathname.startsWith(allow) && allow.length > bestMatch.length) {
        bestMatch = { type: "allow", length: allow.length };
      }
    }
    for (const disallow of entry.disallow) {
      if (disallow && pathname.startsWith(disallow) && disallow.length > bestMatch.length) {
        bestMatch = { type: "disallow", length: disallow.length };
      }
    }
  }

  return bestMatch.type !== "disallow";
}

export async function fetchHtml(targetUrl, options = {}) {
  const {
    minDelay = 300,
    maxDelay = 700,
    skipRobots = false,
    retry429 = true
  } = options;

  if (!skipRobots && !(await isAllowedByRobots(targetUrl))) {
    console.log(`[scrape] robots blocked ${targetUrl}`);
    return null;
  }

  await sleep(minDelay === maxDelay ? minDelay : Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay);

  try {
    const response = await http.get(targetUrl);
    return cheerio.load(response.data);
  } catch (error) {
    const status = error?.response?.status;
    if (status === 429 && retry429) {
      console.log(`[scrape] 429 at ${targetUrl}, retrying once after 10s`);
      await sleep(10_000);
      return fetchHtml(targetUrl, { ...options, retry429: false });
    }
    if (status === 403) {
      console.log(`[scrape] blocked 403 ${targetUrl}`);
      return null;
    }
    console.log(`[scrape] failed ${targetUrl}: ${status ?? error.message}`);
    return null;
  }
}

export function saveProgressEvery(count, filePath, entries) {
  if (count > 0 && count % 25 === 0) {
    writeJson(filePath, entries);
  }
}

export function extractStandards(text) {
  if (!text) return [];
  const matches = text.match(/\b(?:ASTM|AMS|ISO|DIN|UNS|JIS|EN)\s*[A-Z0-9-]+\b/g) ?? [];
  return [...new Set(matches)];
}

export function extractNumericValues(text) {
  const matches = String(text ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/g) ?? [];
  return matches.map(Number).filter((value) => Number.isFinite(value));
}

export function representativeValue(text) {
  const values = extractNumericValues(text);
  if (values.length === 0) return null;
  if (values.length === 1) return values[0];
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function toMpa(text) {
  const value = representativeValue(text);
  if (!Number.isFinite(value)) return null;
  if (/ksi/i.test(text)) return value * 6.89476;
  if (/psi/i.test(text)) return value * 0.00689476;
  if (/gpa/i.test(text)) return value * 1000;
  return value;
}

export function toDensityGcm3(text) {
  const value = representativeValue(text);
  if (!Number.isFinite(value)) return null;
  if (/lb\/in/i.test(text)) return value * 27.6799;
  if (/kg\/m/i.test(text)) return value / 1000;
  return value;
}

export function toThermalConductivity(text) {
  const value = representativeValue(text);
  if (!Number.isFinite(value)) return null;
  if (/btu/i.test(text)) return value * 1.73073;
  return value;
}

export function toResistivity(text) {
  const value = representativeValue(text);
  if (!Number.isFinite(value)) return null;
  if (/m?ω·?cm|mohm/i.test(text)) return value * 1e-5;
  if (/μ|uΩ|micro/i.test(text)) return value * 1e-6;
  return value;
}

export function toTempC(text) {
  const value = representativeValue(text);
  if (!Number.isFinite(value)) return null;
  if (/°?\s*f/i.test(text)) return ((value - 32) * 5) / 9;
  if (/k\b/i.test(text)) return value - 273.15;
  return value;
}

export function toExpansion(text) {
  const value = representativeValue(text);
  if (!Number.isFinite(value)) return null;
  if (/°?\s*f/i.test(text) || /\/f/i.test(text)) return value * 1.8;
  return value;
}

export function classifyCategory(name, fallback = "Metal") {
  const text = String(name ?? "").toLowerCase();
  if (/solder|braze|sn\d|sac\d|pb\d|bga/i.test(text)) return "Solder";
  if (/cfrp|gfrp|afrp|composite|mmc|cmc|foam/i.test(text)) return "Composite";
  if (/peek|nylon|poly|ptfe|pvc|abs|asa|pla|epoxy|rubber|ultem|delrin|pp|pei|petg|peek|pbt|pom|uhmwpe|hdpe/i.test(text)) return "Polymer";
  if (/alumina|zirconia|nitride|carbide|boride|oxide|ceramic|max phase|silicon|gallium|indium phosphide|telluride|fluoride/i.test(text)) return "Ceramic";
  return fallback;
}

export function findFormulaLike(value) {
  const match = String(value ?? "").match(/\b([A-Z][a-z]?(?:\d+(?:\.\d+)?)?(?:[A-Z][a-z]?(?:\d+(?:\.\d+)?)?)*)\b/);
  return match?.[1] ?? null;
}

export function currentDatabase() {
  return readJson(APP_DB_PATH, []) ?? [];
}

export function dedupeByNormalizedName(entries) {
  const deduped = new Map();
  for (const entry of entries) {
    const key = normalizeName(entry.name);
    if (!key) continue;
    if (!deduped.has(key)) {
      deduped.set(key, entry);
    }
  }
  return [...deduped.values()];
}
