import { writeFileSync } from "fs";

import { materialsDB } from "../src/lib/materials-db.ts";

writeFileSync("src/lib/materials-db-export.json", `${JSON.stringify(materialsDB, null, 2)}\n`);
console.log(`Exported ${materialsDB.length} materials to src/lib/materials-db-export.json`);
