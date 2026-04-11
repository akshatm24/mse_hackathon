const BASE_URL = process.env.PREDICT_BASE_URL ?? "http://localhost:3000";

const cases = [
  {
    composition: "NiTi",
    expectCategory: "Metal",
    minConfidence: 70,
    expectAnalogOneOf: ["Ni50Ti50", "Ni", "Ti"]
  },
  {
    composition: "CuZn",
    expectCategory: "Metal",
    minConfidence: 70,
    expectAnalogOneOf: ["Cu60Zn40", "Cu", "Cu83Sn7Pb7Zn3"]
  },
  {
    composition: "Al2O3",
    expectCategory: "Ceramic",
    minConfidence: 80,
    expectAnalogOneOf: ["Al2O3", "MgAl2O4", "SiO2"]
  },
  {
    composition: "Fe70Ni30",
    expectCategory: "Metal",
    minConfidence: 45,
    expectAnalogOneOf: ["Fe68Cr17Ni12Mo2", "Fe", "Fe99C1"]
  }
];

let failures = 0;

for (const testCase of cases) {
  const url = `${BASE_URL}/api/predict-alloy?composition=${encodeURIComponent(
    testCase.composition
  )}`;
  const response = await fetch(url);

  if (!response.ok) {
    console.error(`FAIL ${testCase.composition}: HTTP ${response.status}`);
    failures += 1;
    continue;
  }

  const data = await response.json();
  const topAnalog = data?.nearestAnalogs?.[0]?.formula;

  if (data.predictedCategory !== testCase.expectCategory) {
    console.error(
      `FAIL ${testCase.composition}: category "${data.predictedCategory}" expected "${testCase.expectCategory}"`
    );
    failures += 1;
    continue;
  }

  if ((data.confidence ?? 0) < testCase.minConfidence) {
    console.error(
      `FAIL ${testCase.composition}: confidence ${data.confidence} expected >= ${testCase.minConfidence}`
    );
    failures += 1;
    continue;
  }

  if (!testCase.expectAnalogOneOf.includes(topAnalog)) {
    console.error(
      `FAIL ${testCase.composition}: top analog "${topAnalog}" expected one of ${testCase.expectAnalogOneOf.join(", ")}`
    );
    failures += 1;
    continue;
  }

  console.log(
    `PASS ${testCase.composition}: ${data.predictedCategory}, confidence ${data.confidence}, top analog ${topAnalog}`
  );
}

if (failures > 0) {
  process.exit(1);
}

