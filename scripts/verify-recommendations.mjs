const BASE_URL = process.env.RECOMMEND_BASE_URL ?? "http://localhost:3000";

const cases = [
  {
    query: "cheapest material",
    expectOneOf: ["Grey Cast Iron", "Carbon Steel 1020", "HDPE"]
  },
  {
    query: "least cost material",
    expectOneOf: ["Grey Cast Iron", "Carbon Steel 1020", "HDPE"]
  },
  {
    query: "lowest cost material",
    expectOneOf: ["Grey Cast Iron", "Carbon Steel 1020", "HDPE"]
  },
  {
    query: "lightweight drone frame",
    expectOneOf: ["CFRP (Carbon Fiber UD)", "Magnesium AZ31B", "Kevlar/Epoxy"]
  },
  {
    query: "3D printed motor bracket 85°C",
    expectOneOf: ["PETG", "ASA", "Nylon PA12"]
  }
];

let failures = 0;

for (const testCase of cases) {
  const url = `${BASE_URL}/api/recommend?query=${encodeURIComponent(testCase.query)}`;
  const response = await fetch(url);

  if (!response.ok) {
    console.error(`FAIL ${testCase.query}: HTTP ${response.status}`);
    failures += 1;
    continue;
  }

  const data = await response.json();
  const top = data?.rankedMaterials?.[0]?.name;
  const ok = testCase.expectOneOf.includes(top);

  if (!ok) {
    console.error(
      `FAIL ${testCase.query}: got "${top}" expected one of ${testCase.expectOneOf.join(", ")}`
    );
    failures += 1;
    continue;
  }

  console.log(`PASS ${testCase.query}: ${top}`);
}

if (failures > 0) {
  process.exit(1);
}
