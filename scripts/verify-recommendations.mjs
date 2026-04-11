const BASE_URL = process.env.RECOMMEND_BASE_URL ?? "http://localhost:3000";

const cases = [
  {
    query: "cheapest material",
    expectOneOf: ["Grey Cast Iron", "Carbon Steel 1020"]
  },
  {
    query: "least cost material",
    expectOneOf: ["Grey Cast Iron", "Carbon Steel 1020"]
  },
  {
    query: "lowest cost material",
    expectOneOf: ["Grey Cast Iron", "Carbon Steel 1020"]
  },
  {
    query: "lightweight drone frame",
    expectOneOf: ["CFRP (Carbon Fiber UD)", "Magnesium AZ31B", "Kevlar/Epoxy"]
  },
  {
    query: "lightweight strong metal bracket",
    expectOneOf: ["Ti-6Al-4V", "Aluminum 7075-T6", "Magnesium AZ31B"]
  },
  {
    query: "marine pump housing corrosion resistant",
    expectOneOf: ["Monel 400", "Hastelloy C-276", "GFRP (Glass Fiber Epoxy)"]
  },
  {
    query: "acid resistant metal",
    expectOneOf: ["Hastelloy C-276", "Titanium Grade 2 (CP)", "Monel 400"]
  },
  {
    query: "machinable conductive metal",
    expectOneOf: [
      "Beryllium Copper C17200",
      "Brass C360",
      "Aluminum 7075-T6",
      "ETP Copper C11000"
    ]
  },
  {
    query: "outdoor weather resistant plastic",
    expectOneOf: ["ASA", "PEKK", "PEEK", "PPS (Polyphenylene Sulfide)"]
  },
  {
    query: "3D printed motor bracket 85°C",
    expectOneOf: ["PETG", "ASA", "Nylon PA12"]
  },
  {
    query: "3d printed plastic bracket",
    expectOneOf: ["Nylon PA12", "ASA", "PETG"]
  },
  {
    query: "thermally conductive electrical insulator",
    expectOneOf: [
      "Silicon Nitride Si3N4",
      "Alumina (Al2O3)",
      "Aluminum Nitride AlN",
      "MgO (P6_3/mmc, mp-1192189)",
      "MgO (R-3m, mp-1180973)"
    ]
  },
  {
    query: "wear resistant hard tooling material",
    expectOneOf: [
      "Tungsten Carbide WC-Co 6%",
      "Tool Steel D2",
      "Maraging Steel 300"
    ]
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
