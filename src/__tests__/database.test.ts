import { ALL_MATERIALS, ENGINEERING_MATERIALS, MP_COMPOUNDS } from "@/data";
import { deduplicateById } from "@/lib/dedup";

describe("Materials database", () => {
  test("total count ≥ 5000", () => {
    expect(ALL_MATERIALS.length).toBeGreaterThanOrEqual(5000);
  });

  test("no duplicate IDs", () => {
    const ids = ALL_MATERIALS.map((material) => material.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("engineering materials have no MP compounds", () => {
    const mpInEngineering = ENGINEERING_MATERIALS.filter(
      (material) => material.source_kind === "mp" || material.source_kind === "materials-project"
    );
    expect(mpInEngineering.length).toBe(0);
  });

  test("every curated material has a category", () => {
    const missing = ENGINEERING_MATERIALS.filter((material) => !material.category);
    expect(missing.map((material) => material.name)).toEqual([]);
  });

  test("nickel superalloys are present", () => {
    const ids = new Set(ALL_MATERIALS.map((material) => material.id));
    expect(ids.has("inconel_625")).toBe(true);
    expect(ids.has("inconel_718")).toBe(true);
    expect(ids.has("nimonic_c263")).toBe(true);
    expect(ids.has("hastelloy_x")).toBe(true);
    expect(ids.has("rene_41")).toBe(true);
  });

  test("deduplicateById removes dupes", () => {
    const fakeData = [
      { id: "test_a", name: "A", source_url: null, data_quality: "experimental" },
      { id: "test_a", name: "A v2", source_url: "https://example.com", data_quality: "validated" },
      { id: "test_b", name: "B", source_url: null, data_quality: "experimental" }
    ] as any[];
    const deduped = deduplicateById(fakeData);
    expect(deduped.length).toBe(2);
    expect(deduped.find((material) => material.id === "test_a")?.source_url).toBe(
      "https://example.com"
    );
  });

  test("MP pool still contains at least 4800 entries", () => {
    expect(MP_COMPOUNDS.length).toBeGreaterThanOrEqual(4800);
  });
});

describe("/api/recommend endpoint", () => {
  test("turbine query returns nickel superalloy in top 5", async () => {
    const response = await fetch(
      "http://localhost:3000/api/recommend?query=turbine+blade+1000C+high+strength"
    );
    const data = await response.json();
    const top5ids = data.rankedMaterials.slice(0, 5).map((material: any) => material.id);
    const nickelAlloys = [
      "inconel_625",
      "inconel_718",
      "rene_41",
      "hastelloy_x",
      "nimonic_c263",
      "waspaloy",
      "mar_m247",
      "inconel_738lc"
    ];
    const hasNickel = top5ids.some((id: string) => nickelAlloys.includes(id));
    expect(hasNickel).toBe(true);
  });

  test("no duplicate IDs in response", async () => {
    const response = await fetch(
      "http://localhost:3000/api/recommend?query=steel+corrosion+resistant"
    );
    const data = await response.json();
    const ids = data.rankedMaterials.map((material: any) => material.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("llmExplanation mentions actual top material", async () => {
    const response = await fetch(
      "http://localhost:3000/api/recommend?query=lightweight+3d+printable+85C"
    );
    const data = await response.json();
    const top = data.rankedMaterials[0];
    expect(data.llmExplanation.toLowerCase()).toContain(top.name.toLowerCase().split(" ")[0]);
  });
});
