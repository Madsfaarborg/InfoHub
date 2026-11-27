import test from "node:test";
import assert from "node:assert/strict";
import { estimateCost, formatUsd, priceIsStale } from "../src/lib/cost";
import type { ModelVariant } from "../src/lib/types";
// Cost functions only read this fixture's price; keeping it scoped makes assumptions explicit.
const model = { price: { input: 2, output: 8, cachedInput: 0.5, verifiedAt: "2026-11-17T12:00:00Z" } } as ModelVariant;
const usage = { inputTokens: 1_000_000, outputTokens: 100_000, cachedTokens: 400_000 };
test("cached input replaces ordinary input charges", () => assert.equal(estimateCost(model, usage), 2.2));
test("unknown cached pricing matters only when cached tokens are used", () => {
  const unknown = { ...model, price: { ...model.price, cachedInput: null } };
  assert.equal(estimateCost(unknown, usage), null);
  assert.equal(estimateCost(unknown, { ...usage, cachedTokens: 0 }), 2.8);
});
test("unknown output and input rates do not become free", () => {
  assert.equal(estimateCost({ ...model, price: { ...model.price, output: null } }, usage), null);
  assert.equal(estimateCost({ ...model, price: { ...model.price, input: null } }, usage), null);
});
test("zero rates and zero usage remain valid", () => {
  assert.equal(estimateCost({ ...model, price: { ...model.price, input: 0, output: 0, cachedInput: 0 } }, usage), 0);
  assert.equal(estimateCost({ ...model, price: { ...model.price, input: null, output: null, cachedInput: null } }, { inputTokens: 0, outputTokens: 0, cachedTokens: 0 }), 0);
});
for (const invalid of [-1, Infinity, NaN, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
  test(`rejects invalid token assumption ${invalid}`, () => assert.equal(estimateCost(model, { ...usage, inputTokens: invalid }), null));
}
test("cache cannot exceed total input", () => assert.equal(estimateCost(model, { ...usage, cachedTokens: usage.inputTokens + 1 }), null));
for (const rate of [-1, NaN, Infinity]) test(`invalid rate ${rate} is unknown`, () => assert.equal(estimateCost({ ...model, price: { ...model.price, input: rate } }, usage), null));
test("price freshness crosses seven days precisely", () => {
  assert.equal(priceIsStale(model, new Date("2026-11-24T12:00:00Z")), false);
  assert.equal(priceIsStale(model, new Date("2026-11-24T12:00:00.001Z")), true);
  assert.equal(priceIsStale(model, new Date("2026-11-16")), true);
});
test("invalid verification dates are stale", () => {
  for (const verifiedAt of ["invalid", "2026-02-30"]) assert.equal(priceIsStale({ ...model, price: { ...model.price, verifiedAt } }), true);
});
test("formats useful small costs without calling them zero", () => {
  assert.equal(formatUsd(0), "$0.00");
  assert.equal(formatUsd(2.25), "$2.25");
  assert.equal(formatUsd(0.0025), "$0.0025");
  assert.equal(formatUsd(0.000001), "<$0.0001");
  assert.equal(formatUsd(NaN), "Unknown");
});

test("an expired promotional rate cannot produce a cost estimate", () => {
  const promo = { ...model, price: { ...model.price, validUntil: "2026-12-01T00:00:00Z" } };
  assert.equal(estimateCost(promo, usage, new Date("2026-11-30T23:59:59Z")), 2.2);
  assert.equal(estimateCost(promo, usage, new Date("2026-12-01T00:00:00Z")), null);
  assert.equal(priceIsStale(promo, new Date("2026-12-01T00:00:00Z")), true);
});
