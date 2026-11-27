import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreRange } from "../src/lib/chart-range";

test("score range fits the benchmark values with readable ticks", () => {
  const range = scoreRange([59.4, 79.2, 71.4]);
  assert.ok(range.min < 59.4 && range.max > 79.2);
  assert.ok(range.max - range.min < 100);
  assert.ok(range.ticks.every((tick, index) => index === 0 || tick > range.ticks[index - 1]));
});

test("score range handles identical, zero and negative scores", () => {
  for (const values of [[0, 0], [50, 50], [-10, -2], [101, 110]]) {
    const range = scoreRange(values);
    assert.ok(range.min <= Math.min(...values));
    assert.ok(range.max >= Math.max(...values));
    assert.ok(range.max > range.min);
    assert.ok(range.ticks.length >= 2);
  }
});
