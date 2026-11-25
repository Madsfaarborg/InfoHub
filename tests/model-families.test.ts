import test from "node:test";
import assert from "node:assert/strict";
import release from "../src/content/public-release.json";
import { catalogSchema } from "../src/lib/catalog-schema";
import { findModelFamily, groupModelFamilies, primaryGuidance } from "../src/lib/model-families";

const bundle = catalogSchema.parse(release);

test("groups effort variants into one model-family row", () => {
  const families = groupModelFamilies(bundle.models);
  const sol = families.find(family => family.name === "GPT-6.2 Sol");
  assert.ok(sol);
  assert.equal(sol.variants.length, 2);
  assert.equal(sol.codingDefault, "High");
  assert.equal(sol.benchmarkProfile?.effort, "High");
  assert.equal(families.filter(family => family.name === "GPT-6.2 Sol").length, 1);
});

test("keeps benchmark absence distinct from a zero score", () => {
  const families = groupModelFamilies(bundle.models);
  const qwen = families.find(family => family.name === "Qwen3-30B-A3B");
  assert.ok(qwen);
  assert.equal(qwen.benchmarkProfile, null);
  assert.equal(qwen.codingDefault, "Thinking");
});

test("uses the configured effort rather than treating adaptive thinking as an effort name", () => {
  const opus = groupModelFamilies(bundle.models).find(family => family.name === "Claude Opus 5.5");
  assert.ok(opus);
  assert.equal(opus.codingDefault, "Medium");
});

test("resolves every configuration route to the same family", () => {
  const medium = findModelFamily(bundle.models, "sol-medium");
  const high = findModelFamily(bundle.models, "sol-high");
  assert.ok(medium);
  assert.ok(high);
  assert.equal(medium.name, high.name);
  assert.deepEqual(medium.variants.map(model => model.id), high.variants.map(model => model.id));
});

test("chooses task guidance for the effort explanation", () => {
  const model = bundle.models.find(item => item.id === "sol-high");
  assert.ok(model);
  const fit = primaryGuidance(model);
  assert.ok(fit);
  assert.equal(fit.category, "analysis");
  assert.ok(fit.guidance.stepUp.length > 0);
});
