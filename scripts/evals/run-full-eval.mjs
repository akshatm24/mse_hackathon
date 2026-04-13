import { spawn } from "node:child_process";

function runScript(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      stdio: "inherit",
      env: process.env
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${script} exited with code ${code ?? "unknown"}`));
    });
  });
}

await runScript(new URL("./run-recommendation-eval.mjs", import.meta.url));
await runScript(new URL("./run-predictor-eval.mjs", import.meta.url));
