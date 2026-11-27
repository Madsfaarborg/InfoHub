import test from "node:test";
import assert from "node:assert/strict";
import { catalogSchema } from "../src/lib/catalog-schema";
import type { PublishedBundle } from "../src/lib/types";

function fixture(): PublishedBundle {
  return {
    schemaVersion: "1.0", revision: "revision-1", generatedAt: "2026-11-24T12:00:00Z",
    models: [{ id: "variant-1", name: "Test", developer: "Developer", provider: "Provider", modelId: "model/v1", tier: "everyday", deployment: "hosted", availability: "available", setting: { label: "Default", parameters: { effort: "low", tools: false, budget: 100 }, note: "" }, description: "Example", toolUrl: "https://example.com", price: { input: 1, output: 2, cachedInput: null, currency: "USD", verifiedAt: "2026-11-24", sourceUrl: "https://example.com/pricing", note: "" }, guidance: { coding: { bestFor: "Scripts", example: "A script", limitation: "Check results", stepUp: "Complex tasks" } }, sources: [{ label: "Provider docs", url: "https://example.com", kind: "provider", checkedAt: "2026-11-24" }], reviewedAt: "2026-11-24" }],
    benchmarks: [{ id: "benchmark-1", variantId: "variant-1", suite: "Test suite", version: "1", score: 0, unit: "%", higherIsBetter: true, costUsd: 0, sampleSize: 1, testedAt: "2026-11-24", sourceUrl: "https://example.com/test", note: "" }],
    news: [{ eventKey: "event-1", title: "Example", summary: "Summary", whyItMatters: "Reason", suggestedAction: "Review", tags: ["coding-tools"], urgency: "routine", confidence: "confirmed", recommendationImpact: "none", primarySource: { url: "https://example.com/news", publisher: "Provider", publishedDate: "2026-11-24", eventDate: null, retrievedAt: "2026-11-24T12:00:00Z" }, additionalSources: [], supersedesEventKey: null }],
  };
}
test("validates the complete typed bundle with zero costs and scores", () => assert.deepEqual(catalogSchema.parse(fixture()), fixture()));
test("validates sourced benchmark profiles without treating missing metrics as zero", () => {
  const bundle = fixture();
  bundle.models[0].benchmarkProfile = {
    effort: "High",
    sourceLabel: "Independent comparison",
    sourceUrl: "https://example.com/benchmarks",
    checkedAt: "2026-11-25",
    metrics: {
      coding: { benchmark: "Coding suite", score: 42.5, unit: "%" },
      intelligence: { benchmark: "Intelligence index", score: 51, unit: "index" },
    },
  };
  assert.equal(catalogSchema.safeParse(bundle).success, true);
  const empty = fixture();
  empty.models[0].benchmarkProfile = { ...bundle.models[0].benchmarkProfile, metrics: {} };
  assert.equal(catalogSchema.safeParse(empty).success, false);
});
test("strictly rejects unknown properties at every object level", () => {
  for (const place of ["bundle", "model", "price", "settings", "guidance", "source", "benchmark", "news", "newsSource"]) {
    const bundle = fixture();
    const targets: Record<string, object> = { bundle, model: bundle.models[0], price: bundle.models[0].price, settings: bundle.models[0].setting, guidance: bundle.models[0].guidance.coding!, source: bundle.models[0].sources[0], benchmark: bundle.benchmarks[0], news: bundle.news[0], newsSource: bundle.news[0].primarySource };
    Object.assign(targets[place], { unexpected: true });
    assert.equal(catalogSchema.safeParse(bundle).success, false, place);
  }
});
test("rejects duplicate variant, benchmark and news IDs", () => {
  for (const field of ["models", "benchmarks", "news"] as const) {
    const bundle = fixture();
    (bundle[field] as unknown[]).push(bundle[field][0]);
    assert.equal(catalogSchema.safeParse(bundle).success, false, field);
  }
});
test("rejects invalid identifiers and unknown benchmark references", () => {
  const bundle = fixture();
  bundle.models[0].id = "../../unsafe id";
  assert.equal(catalogSchema.safeParse(bundle).success, false);
  const badReference = fixture();
  badReference.benchmarks[0].variantId = "missing";
  assert.equal(catalogSchema.safeParse(badReference).success, false);
});
test("news cannot supersede itself", () => {
  const bundle = fixture(); bundle.news[0].supersedesEventKey = bundle.news[0].eventKey;
  assert.equal(catalogSchema.safeParse(bundle).success, false);
});
test("historical supersession IDs can reference events no longer present", () => {
  const bundle = fixture(); bundle.news[0].supersedesEventKey = "event-old";
  assert.equal(catalogSchema.safeParse(bundle).success, true);
});
for (const value of ["javascript:alert(1)", "file:///tmp/file", "data:text/html,hello", "ftp://example.com/file", "not-a-url"]) {
  test(`rejects unsafe source URL ${value}`, () => {
    const bundle = fixture(); bundle.models[0].price.sourceUrl = value;
    assert.equal(catalogSchema.safeParse(bundle).success, false);
  });
}
for (const value of ["2026-02-30", "2026-13-01", "yesterday", "2026-11-24T24:00:00Z", "2026-11-24T12:00:00"]) {
  test(`rejects invalid date ${value}`, () => {
    const bundle = fixture(); bundle.generatedAt = value;
    assert.equal(catalogSchema.safeParse(bundle).success, false);
  });
}
for (const value of [-1, NaN, Infinity, -Infinity]) {
  test(`rejects invalid monetary value ${value}`, () => {
    const bundle = fixture(); bundle.models[0].price.input = value;
    assert.equal(catalogSchema.safeParse(bundle).success, false);
    const benchmarkBundle = fixture(); benchmarkBundle.benchmarks[0].costUsd = value;
    assert.equal(catalogSchema.safeParse(benchmarkBundle).success, false);
  });
}
test("requires provenance and rejects unsupported category guidance", () => {
  const bundle = fixture(); bundle.models[0].sources = [];
  assert.equal(catalogSchema.safeParse(bundle).success, false);
  const wrongCategory = fixture(); Object.assign(wrongCategory.models[0].guidance, { magic: wrongCategory.models[0].guidance.coding });
  assert.equal(catalogSchema.safeParse(wrongCategory).success, false);
});
test("rejects nonfinite settings, scores and invalid sample sizes", () => {
  const bundle = fixture(); bundle.models[0].setting.parameters.budget = Infinity;
  assert.equal(catalogSchema.safeParse(bundle).success, false);
  for (const sampleSize of [0, -1, 1.5]) {
    const candidate = fixture(); candidate.benchmarks[0].sampleSize = sampleSize;
    assert.equal(catalogSchema.safeParse(candidate).success, false);
  }
  const scoreBundle = fixture(); scoreBundle.benchmarks[0].score = NaN;
  assert.equal(catalogSchema.safeParse(scoreBundle).success, false);
});

test("Gemini models appear in the starter and released catalogs with high-effort evidence", async () => {
  const { starterBundle, addStarterGuidance } = await import("../src/lib/starter");
  const release = (await import("../src/content/public-release.json")).default;
  const { groupModelFamilies } = await import("../src/lib/model-families");
  for (const bundle of [starterBundle(), catalogSchema.parse(release)]) {
    const families = groupModelFamilies(bundle.models);
    for (const name of ["Hydrogen", "Neon", "Carbon"]) {
      const family = families.find(item => item.name === `Gemini 4 ${name}`);
      assert.ok(family, `${name} is missing`);
      assert.equal(family.benchmarkProfile?.effort, "High");
      assert.ok(family.variants[0].guidance.coding);
    }
  }
  const upgraded = addStarterGuidance(starterBundle().models);
  assert.equal(upgraded.filter(model => model.id === "gemini-4-neon-high").length, 1);
});
