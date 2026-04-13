import { run as runAzom } from "./azom.mjs";
import { run as runEngineeringToolbox } from "./engineeringtoolbox.mjs";
import { run as runWikipedia } from "./wikipedia.mjs";
import { run as runManufacturerPages } from "./manufacturer-pages.mjs";
import { run as runMatWeb } from "./matweb.mjs";
import { run as runNist } from "./nist.mjs";
import { run as runMerge } from "./merge-scraped.mjs";

export async function run() {
  await runAzom();
  await runEngineeringToolbox();
  await runWikipedia();
  await runManufacturerPages();
  await runMatWeb();
  await runNist();
  await runMerge();
}

run().catch((error) => {
  console.error("[scrape] run-all failed", error);
  process.exit(1);
});
