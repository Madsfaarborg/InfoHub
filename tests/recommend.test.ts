import test from "node:test";
import assert from "node:assert/strict";
import { interpretTask, recommend } from "../src/lib/recommend";
import type { CategoryId, ModelVariant, Tier } from "../src/lib/types";
import starter from "../src/content/starter.json";
import { catalogSchema } from "../src/lib/catalog-schema";
import { starterBundle } from "../src/lib/starter";
import { estimateCost } from "../src/lib/cost";

const cases: [string, CategoryId | null][] = [
  ["Write a PowerShell script", "coding"], ["Create a Python automation", "coding"],
  ["Build a Bash script", "coding"], ["Refactor Terraform", "coding"], ["Ansible automation", "coding"],
  ["Implement a TypeScript function", "coding"], ["Debug this Python stack trace", "debugging"],
  ["Troubleshoot a crash", "debugging"], ["Find the root cause of failing requests", "debugging"],
  ["Configure BGP routing", "networking"], ["Plan a VLAN and subnet", "networking"],
  ["Investigate DNS connectivity", "networking"], ["Firewall routing", "networking"],
  ["SIEM threat detection", "security"], ["Analyze logs", "security"], ["Analyze a phishing incident", "security"],
  ["Review ransomware indicators", "security"], ["Assess CVE vulnerabilities", "security"],
  ["Compare architectures with sources", "research"], ["Research trade-offs", "research"],
  ["Evaluate architectural design", "research"], ["Draft a customer update", "writing"],
  ["Rewrite this email", "writing"], ["Proofread documentation", "writing"],
  ["Translate a message", "writing"], ["", null], ["Help me with something", null],
  ["security networking", null],
];
for (const [text, category] of cases) test(`interprets: ${text || "empty"}`, () => assert.equal(interpretTask(text).category, category));

test("conflicting cues expose alternatives", () => {
  const task = interpretTask("security networking");
  assert.equal(task.category, null);
  assert.deepEqual(new Set(task.alternatives), new Set(["security", "networking"]));
});
test("recognizes complexity without escalating simple work", () => {
  assert.equal(interpretTask("simple Python script").complexity, "routine");
  assert.equal(interpretTask("intermittent distributed race condition").complexity, "complex");
  assert.equal(interpretTask("this script is not complex").complexity, "routine");
});
for (const text of ["local only", "local-only Python", "write a Python script locally only", "only locally", "only local models", "offline research", "on-premises coding", "air-gapped", "Do not send this to the cloud", "do-not-send-to-cloud", "I don’t want to send this to the cloud", "Data must stay on my device", "Don't upload data to hosted services", "Data must not leave my device", "no cloud", "run locally"]) {
  test(`preserves local requirement: ${text}`, () => assert.equal(interpretTask(text).localOnly, true));
}
for (const text of ["not local only", "not local-only", "not only locally", "not offline", "don't need offline", "do not require local only", "local only is not required", "no need for local only", "data must leave my device", "write a script", "only local files should be listed"]) {
  test(`does not invent local requirement: ${text}`, () => assert.equal(interpretTask(text).localOnly, false));
}
const guidance = { bestFor: "Scripts", example: "Write a script", limitation: "Verify output", stepUp: "Escalate difficult tasks" };
function model(id: string, tier: Tier, override: Partial<ModelVariant> = {}): ModelVariant {
  return { id, name: id, developer: "Developer", provider: "Provider", modelId: id, tier, deployment: "hosted", availability: "available", setting: { label: "Default", parameters: {}, note: "" }, description: "Test", toolUrl: "https://example.com", price: { input: 1, output: 2, cachedInput: 0.1, currency: "USD", verifiedAt: "2026-11-24", sourceUrl: "https://example.com", note: "" }, guidance: { coding: guidance }, sources: [{ label: "Source", url: "https://example.com", kind: "provider", checkedAt: "2026-11-24" }], reviewedAt: "2026-11-24", ...override };
}
const models = [model("deep", "deep"), model("everyday", "everyday"), model("balanced", "balanced")];
for (const [complexity, priority, expected] of [
  ["routine", "value", "everyday"], ["routine", "quality", "balanced"], ["routine", "speed", "everyday"],
  ["complex", "value", "balanced"], ["complex", "quality", "deep"], ["complex", "speed", "everyday"],
] as const) test(`${complexity} / ${priority} selects ${expected}`, () => {
  const result = recommend(models, "coding", { complexity, priority, localOnly: false });
  assert.equal(result[0].model.id, expected);
  assert.equal(result.length, 3);
  assert.equal(result.filter((item) => item.recommended).length, 1);
  assert.equal(new Set(result.map((item) => item.model.tier)).size, 3);
  assert.equal("score" in result[0], false);
});
test("hard constraints precede ranking, never relaxing local-only", () => {
  const options = { priority: "quality", complexity: "complex", localOnly: true } as const;
  const candidates = [...models, model("not-ready", "deep", { deployment: "local", availability: "setup-required" }), model("local", "everyday", { deployment: "local" }), model("unavailable", "deep", { deployment: "local", availability: "unavailable" })];
  assert.deepEqual(recommend(candidates, "coding", options).map((item) => item.model.id), ["local"]);
  assert.deepEqual(recommend(models, "coding", options), []);
  assert.deepEqual(recommend(candidates, "security", options), []);
});
test("equivalent settings are not offered as different alternatives", () => {
  const a = model("one", "everyday", { modelId: "same", setting: { label: "One", parameters: { effort: "low", tools: false }, note: "" } });
  const b = model("two", "everyday", { modelId: "same", setting: { label: "Two", parameters: { tools: false, effort: "low" }, note: "" } });
  const result = recommend([a, b, model("three", "balanced")], "coding", { complexity: "routine", priority: "value", localOnly: false });
  assert.deepEqual(result.map((item) => item.model.id), ["one", "three"]);
});
test("does not mutate the supplied catalog", () => {
  const before = JSON.stringify(models);
  recommend(models, "coding", { complexity: "routine", priority: "value", localOnly: false });
  assert.equal(JSON.stringify(models), before);
});

test("starter recommendations allow editorial choices within a tier to differ by task", () => {
  const published = catalogSchema.parse(starter);
  const options = { priority: "quality", complexity: "complex", localOnly: false } as const;
  assert.equal(recommend(published.models, "coding", options)[0].model.id, "sol-high");
  assert.equal(recommend(published.models, "debugging", options)[0].model.id, "astra-medium");
  assert.equal(recommend(published.models, "debugging", { ...options, localOnly: true }).length, 0);
});

test("creative and business requests follow the intended deliverable", () => {
  for (const [input, category, workflow] of [
    ["Generate a banner image for a managed services campaign", "images", "concepts"],
    ["Remove the background from the product photo", "images", "edits"],
    ["Design an event poster with a headline", "images", "layout"],
    ["Write a LinkedIn post for our managed services launch", "marketing", undefined],
    ["Create a presentation with images about our sales results", "presentations", undefined],
    ["Summarize sales trends from this spreadsheet", "analysis", undefined],
  ]) {
    const interpreted = interpretTask(input!);
    assert.equal(interpreted.category, category, input);
    assert.equal(interpreted.imageWorkflow, workflow, input);
  }
});

test("image workflows only suggest eligible image tools and bypass token pricing", () => {
  const { models } = starterBundle();
  const options = { priority: "value", complexity: "routine", localOnly: false } as const;
  assert.equal(recommend(models, "images", options)[0].model.id, "nano-banana-21");
  assert.equal(recommend(models, "images", { ...options, imageWorkflow: "edits" })[0].model.id, "gpt-image-sunburst-26");
  assert.equal(recommend(models, "images", { ...options, imageWorkflow: "layout" })[0].model.id, "ideogram-46");
  assert.deepEqual(recommend(models, "images", { ...options, localOnly: true }), []);
  assert.equal(estimateCost(recommend(models, "images", options)[0].model, { inputTokens: 0, outputTokens: 0, cachedTokens: 0 }), null);
  for (const category of ["marketing", "presentations", "analysis"] as const) {
    assert.equal(recommend(models, category, options).length, 3);
    assert.ok(recommend(models, category, options).every(result => !result.model.image));
  }
});

test("only an explicitly cited observation about the requested task supports a pick", () => {
  const url = "https://example.org/patch-trial";
  const note = { url, tasks: ["coding"], kind: "Practitioner report", summary: "Completed a scoped patch.", scope: "One trial.", label: "Patch trial", checkedAt: "2026-11-25" } as const;
  const entry = (id: string, task: CategoryId, cited: boolean) => model(id, "balanced", {
    observations: [{ ...note, tasks: [task] }],
    guidance: { coding: { ...guidance, evidenceUrl: cited ? url : undefined } },
  });
  const candidates = [entry("unrelated", "writing", true), entry("uncited", "coding", false), entry("supported", "coding", true)];
  const result = recommend(candidates, "coding", { priority: "quality", complexity: "routine", localOnly: false });
  assert.equal(result[0].model.id, "supported");
  assert.equal(result[0].category, "coding");
});

test("equal alternatives can introduce another developer within a tier", () => {
  const candidates = [model("starter", "everyday"), model("same-developer", "balanced"), model("alternative", "balanced", { developer: "Another developer" })];
  const result = recommend(candidates, "coding", { priority: "value", complexity: "routine", localOnly: false });
  assert.deepEqual(result.slice(0, 2).map(item => item.model.id), ["starter", "alternative"]);
});

test("interprets English and Danish task phrasing and feeds preferences into ranking", () => {
  for (const [query, category, priority, localOnly] of [
    ["Pods keep restarting after a rollout. I need a quick starting point.", "debugging", "speed", false],
    ["Pods bliver ved med at genstarte. Jeg vil have en grundig fejlsøgning kun lokalt.", "debugging", "quality", true],
    ["Skriv en mail til kunden om hændelsen", "writing", undefined, false],
    ["Lav en præsentation med salgstal", "presentations", undefined, false],
    ["Find mønstre i salgstallene til en lav pris", "analysis", "value", false],
    ["Fjern baggrunden fra produktfotoet", "images", undefined, false],
  ] as const) {
    const intent = interpretTask(query);
    assert.equal(intent.category, category, query);
    assert.equal(intent.priority, priority, query);
    assert.equal(intent.localOnly, localOnly, query);
  }

  const { priority, localOnly, complexity } = interpretTask("Tilføj en funktion. Jeg vil have en grundig gennemgang af det komplekse flow.");
  assert.ok(priority);
  assert.equal(recommend(models, "coding", { priority, localOnly, complexity })[0].model.id, "deep");
  assert.equal(interpretTask("Fjern baggrunden fra produktfotoet").imageWorkflow, "edits");
});
