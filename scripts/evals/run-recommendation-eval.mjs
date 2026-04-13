import { mkdir, writeFile } from "fs/promises";

import recommendationCases from "./recommendation-cases.mjs";

const BASE_URL = process.env.RECOMMEND_BASE_URL ?? "http://localhost:3000";
const REPORT_DIR = new URL("../../reports/", import.meta.url);

function firstParagraph(text = "") {
  return text.split(/\n\s*\n/)[0] ?? "";
}

function includesName(paragraph, name) {
  return paragraph.toLowerCase().includes(name.toLowerCase());
}

function classifyCase(testCase, data) {
  const ranked = data?.rankedMaterials ?? [];
  const top = ranked[0];
  const top3 = ranked.slice(0, 3);
  const top5 = ranked.slice(0, 5);

  if (!top) {
    return {
      status: "wrong",
      reason: "no ranked materials returned"
    };
  }

  const paragraph = firstParagraph(data.llmExplanation);
  if (testCase.requireTopNameInExplanation && !includesName(paragraph, top.name)) {
    return {
      status: "explanation mismatch",
      reason: `first paragraph does not name ${top.name}`
    };
  }

  if (
    testCase.bannedTop3Categories?.some((category) =>
      top3.some((material) => material.category === category)
    )
  ) {
    return {
      status: "wrong",
      reason: "banned category appeared in top 3"
    };
  }

  if (
    testCase.bannedTop5Categories?.some((category) =>
      top5.some((material) => material.category === category)
    )
  ) {
    return {
      status: "wrong",
      reason: "banned category appeared in top 5"
    };
  }

  if (testCase.dominantWeight) {
    const weight = data?.inferredConstraints?.priorityWeights?.[testCase.dominantWeight] ?? 0;
    if (weight < (testCase.minDominantWeight ?? 0)) {
      return {
        status: "wrong",
        reason: `${testCase.dominantWeight} weight ${weight.toFixed(3)} below expected ${(testCase.minDominantWeight ?? 0).toFixed(3)}`
      };
    }
  }

  if (testCase.requiresWarning) {
    const warningPresent =
      (data?.warnings?.length ?? 0) > 0 || (top?.warnings?.length ?? 0) > 0;
    if (!warningPresent) {
      return {
        status: "warning missing",
        reason: "expected a warning but none were returned"
      };
    }
  }

  if ((testCase.expectedOneOf?.length ?? 0) === 0 && (testCase.acceptableOneOf?.length ?? 0) === 0) {
    return {
      status: "correct",
      reason: "no strict winner expectation for this exploratory prompt"
    };
  }

  if (testCase.expectedOneOf?.includes(top.name)) {
    return {
      status: "correct",
      reason: `${top.name} matched expected winner set`
    };
  }

  if (testCase.acceptableOneOf?.includes(top.name)) {
    return {
      status: "acceptable but suboptimal",
      reason: `${top.name} is acceptable but not the preferred winner`
    };
  }

  if (top3.some((material) => testCase.expectedOneOf?.includes(material.name))) {
    return {
      status: "acceptable but suboptimal",
      reason: "expected winner exists in top 3 but not at rank 1"
    };
  }

  return {
    status: "wrong",
    reason: `${top.name} did not match expected or acceptable winners`
  };
}

async function run() {
  const results = [];

  for (const testCase of recommendationCases) {
    let status = "wrong";
    let reason = "not run";
    let topMaterial = "";
    let responseStatus = 0;

    try {
      const response = await fetch(`${BASE_URL}/api/recommend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: testCase.query })
      });

      responseStatus = response.status;
      const payload = await response.json();

      if (!response.ok) {
        status = "wrong";
        reason = payload?.error ?? `HTTP ${response.status}`;
      } else {
        topMaterial = payload?.rankedMaterials?.[0]?.name ?? "";
        const classification = classifyCase(testCase, payload);
        status = classification.status;
        reason = classification.reason;
      }
    } catch (error) {
      status = "wrong";
      reason = error instanceof Error ? error.message : "request failed";
    }

    results.push({
      id: testCase.id,
      group: testCase.group,
      query: testCase.query,
      status,
      reason,
      responseStatus,
      topMaterial
    });
  }

  const summary = {
    baseUrl: BASE_URL,
    total: results.length,
    correct: results.filter((entry) => entry.status === "correct").length,
    acceptable: results.filter((entry) => entry.status === "acceptable but suboptimal").length,
    wrong: results.filter((entry) => entry.status === "wrong").length,
    warningMissing: results.filter((entry) => entry.status === "warning missing").length,
    explanationMismatch: results.filter((entry) => entry.status === "explanation mismatch").length,
    failures: results.filter((entry) => entry.status !== "correct")
  };

  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(
    new URL("recommendation-eval.json", REPORT_DIR),
    JSON.stringify({ summary, results }, null, 2)
  );

  const markdown = [
    "# Recommendation Evaluation",
    "",
    `Base URL: ${BASE_URL}`,
    `Total prompts: ${summary.total}`,
    `Correct: ${summary.correct}`,
    `Acceptable but suboptimal: ${summary.acceptable}`,
    `Wrong: ${summary.wrong}`,
    `Warning missing: ${summary.warningMissing}`,
    `Explanation mismatch: ${summary.explanationMismatch}`,
    "",
    "## Failing or review-needed cases",
    "",
    ...summary.failures.map(
      (entry) =>
        `- [${entry.status}] ${entry.id} :: ${entry.query} -> ${entry.topMaterial || "no result"} (${entry.reason})`
    )
  ].join("\n");

  await writeFile(new URL("recommendation-eval.md", REPORT_DIR), `${markdown}\n`);

  console.log(JSON.stringify(summary, null, 2));

  if (summary.wrong > 0 || summary.warningMissing > 0 || summary.explanationMismatch > 0) {
    process.exitCode = 1;
  }
}

await run();
