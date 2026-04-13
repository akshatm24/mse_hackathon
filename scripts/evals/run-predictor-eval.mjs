import { mkdir, writeFile } from "fs/promises";

import predictorCases from "./predictor-cases.mjs";

const BASE_URL = process.env.PREDICT_BASE_URL ?? "http://localhost:3000";
const REPORT_DIR = new URL("../../reports/", import.meta.url);

function classifyCase(testCase, data) {
  const winner = data?.winner;
  const nearest = data?.nearestAnalogs ?? [];
  const warnings = data?.warnings ?? [];

  if (!winner) {
    return {
      status: "wrong",
      reason: "no winner returned"
    };
  }

  if (testCase.expectedMethod && data.method !== testCase.expectedMethod) {
    return {
      status: "acceptable but suboptimal",
      reason: `method ${data.method} differed from expected ${testCase.expectedMethod}`
    };
  }

  if (testCase.expectedCategory && data.predictedCategory !== testCase.expectedCategory) {
    return {
      status: "wrong",
      reason: `predicted category ${data.predictedCategory} did not match ${testCase.expectedCategory}`
    };
  }

  if ((data.confidence ?? 0) < (testCase.minConfidence ?? 0)) {
    return {
      status: "acceptable but suboptimal",
      reason: `confidence ${data.confidence} was below ${testCase.minConfidence}`
    };
  }

  if (testCase.requiresWarnings && warnings.length === 0) {
    return {
      status: "warning missing",
      reason: "expected nonlinear-screening warning but none were returned"
    };
  }

  if (testCase.expectedWinnerOneOf?.includes(winner.name)) {
    return {
      status: "correct",
      reason: `${winner.name} matched expected winner set`
    };
  }

  if (testCase.acceptableWinnerOneOf?.includes(winner.name)) {
    return {
      status: "acceptable but suboptimal",
      reason: `${winner.name} is acceptable but not the preferred winner`
    };
  }

  if (
    nearest.some((material) =>
      [
        ...(testCase.expectedWinnerOneOf ?? []),
        ...(testCase.acceptableWinnerOneOf ?? [])
      ].includes(material.name)
    )
  ) {
    return {
      status: "acceptable but suboptimal",
      reason: "expected analogue was present in the nearby shortlist but not at rank 1"
    };
  }

  return {
    status: "wrong",
    reason: `${winner.name} did not match any expected analogue`
  };
}

async function run() {
  const results = [];

  for (const testCase of predictorCases) {
    let status = "wrong";
    let reason = "not run";
    let winner = "";
    let responseStatus = 0;

    try {
      const response = await fetch(`${BASE_URL}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          formula: testCase.formula,
          context: testCase.context
        })
      });

      responseStatus = response.status;
      const payload = await response.json();

      if (!response.ok) {
        status = "wrong";
        reason = payload?.error ?? `HTTP ${response.status}`;
      } else {
        winner = payload?.winner?.name ?? "";
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
      formula: testCase.formula,
      context: testCase.context,
      status,
      reason,
      responseStatus,
      winner
    });
  }

  const summary = {
    baseUrl: BASE_URL,
    total: results.length,
    correct: results.filter((entry) => entry.status === "correct").length,
    acceptable: results.filter((entry) => entry.status === "acceptable but suboptimal").length,
    wrong: results.filter((entry) => entry.status === "wrong").length,
    warningMissing: results.filter((entry) => entry.status === "warning missing").length,
    failures: results.filter((entry) => entry.status !== "correct")
  };

  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(
    new URL("predictor-eval.json", REPORT_DIR),
    JSON.stringify({ summary, results }, null, 2)
  );

  const markdown = [
    "# Predictor Evaluation",
    "",
    `Base URL: ${BASE_URL}`,
    `Total formulas: ${summary.total}`,
    `Correct: ${summary.correct}`,
    `Acceptable but suboptimal: ${summary.acceptable}`,
    `Wrong: ${summary.wrong}`,
    `Warning missing: ${summary.warningMissing}`,
    "",
    "## Failing or review-needed cases",
    "",
    ...summary.failures.map(
      (entry) =>
        `- [${entry.status}] ${entry.id} :: ${entry.formula} -> ${entry.winner || "no result"} (${entry.reason})`
    )
  ].join("\n");

  await writeFile(new URL("predictor-eval.md", REPORT_DIR), `${markdown}\n`);

  console.log(JSON.stringify(summary, null, 2));

  if (summary.wrong > 0 || summary.warningMissing > 0) {
    process.exitCode = 1;
  }
}

await run();
