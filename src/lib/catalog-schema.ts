import { z } from "zod";
import { benchmarkMetricIds, categoryIds, imageWorkflowIds, type PublishedBundle } from "./types";

const text = z.string().trim().min(1);
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/, "Use a stable identifier without spaces");
const url = z.string().url().refine((value) => {
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}, "Only HTTP and HTTPS URLs are supported");
const date = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) return false;
  if (value.includes("T") && (Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59 || Number(value.slice(17, 19)) > 59)) return false;
  const parsed = new Date(value);
  const day = value.slice(0, 10);
  const calendar = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && calendar.toISOString().slice(0, 10) === day;
}, "Use a valid ISO date or timestamp");
const money = z.number().finite().nonnegative();
const source = z.strictObject({ label: text, url, kind: z.enum(["provider", "benchmark", "editorial"]), checkedAt: date });
const guidance = z.strictObject({ bestFor: text, example: text, limitation: text, stepUp: text, preferred: z.boolean().optional(), evidenceUrl: url.optional() });
const guidanceFields = Object.fromEntries(categoryIds.map((category) => [category, guidance.optional()])) as Record<(typeof categoryIds)[number], z.ZodOptional<typeof guidance>>;
const imageWorkflows = z.partialRecord(z.enum(imageWorkflowIds), guidance)
  .refine(workflows => Object.keys(workflows).length > 0, "Add at least one image workflow");
export const modelVariantSchema = z.strictObject({
  observations: z.array(z.strictObject({
    tasks: z.array(z.enum(categoryIds)).min(1),
    kind: z.enum(["Provider guidance", "Independent evaluation", "Practitioner report"]),
    summary: text, scope: text, label: text, url, checkedAt: date,
  })).optional(),
  benchmarkProfile: z.strictObject({
    effort: text,
    sourceLabel: text,
    sourceUrl: url,
    checkedAt: date,
    metrics: z.partialRecord(z.enum(benchmarkMetricIds), z.strictObject({
      benchmark: text,
      score: z.number().finite(),
      unit: z.enum(["%", "index"]),
    })).refine(metrics => Object.keys(metrics).length > 0, "Add at least one benchmark metric"),
  }).optional(),
  id, name: text, developer: text, provider: text, modelId: text,
  tier: z.enum(["everyday", "balanced", "deep"]), deployment: z.enum(["hosted", "local"]),
  availability: z.enum(["available", "setup-required", "unavailable"]),
  setting: z.strictObject({ label: text, parameters: z.record(text, z.union([z.string(), z.number().finite(), z.boolean()])), note: z.string() }),
  description: text, toolUrl: url.nullable(),
  price: z.strictObject({ input: money.nullable(), output: money.nullable(), cachedInput: money.nullable(), currency: z.literal("USD"), verifiedAt: date, sourceUrl: url, note: z.string() }),
  limits: z.strictObject({ contextTokens: z.number().int().positive(), maxOutputTokens: z.number().int().positive() }).optional(),
  reportedBenchmarks: z.strictObject({
    sourceLabel: text, sourceUrl: url, publishedAt: date,
    results: z.array(z.strictObject({ name: text, percent: z.number().finite().min(0).max(100), conditions: text.optional() }))
      .min(1).refine(results => new Set(results.map(result => result.name)).size === results.length, "Benchmark names must be unique within a report"),
  }).optional(),
  image: z.strictObject({ workflows: imageWorkflows, outputUsd: money.nullable(), priceBasis: text, brief: text }).optional(),
  guidance: z.strictObject(guidanceFields), sources: z.array(source).min(1), reviewedAt: date,
}).superRefine((record, ctx) => {
  if (record.image && [record.price.input, record.price.output, record.price.cachedInput].some(rate => rate !== null)) {
    ctx.addIssue({ code: "custom", path: ["price"], message: "Image output pricing belongs in the image record" });
  }
  if (record.guidance.images) {
    ctx.addIssue({ code: "custom", path: ["guidance", "images"], message: "Use image workflow guidance for the image category" });
  }
});
const benchmark = z.strictObject({ id, variantId: id, suite: text, version: text, score: z.number().finite(), unit: text, higherIsBetter: z.boolean(), costUsd: money, sampleSize: z.number().int().positive(), testedAt: date, sourceUrl: url, note: z.string() });
const newsSource = z.strictObject({ url, publisher: text, publishedDate: date.nullable(), eventDate: date.nullable(), retrievedAt: date });
const news = z.strictObject({ eventKey: id, title: text, summary: text, whyItMatters: text, suggestedAction: text, tags: z.array(z.enum(["models-and-pricing", "coding-tools", "networking", "cybersecurity", "microsoft-and-cloud", "work-practices", "creative-tools", "business-productivity"])).min(1), urgency: z.enum(["routine", "time-sensitive"]), confidence: z.enum(["confirmed", "vendor-claim"]), recommendationImpact: z.enum(["none", "review"]), primarySource: newsSource, additionalSources: z.array(newsSource), supersedesEventKey: id.nullable() });

export const catalogSchema: z.ZodType<PublishedBundle> = z.strictObject({
  schemaVersion: z.literal("1.0"), revision: id, generatedAt: date,
  models: z.array(modelVariantSchema), benchmarks: z.array(benchmark), news: z.array(news),
}).superRefine((bundle, ctx) => {
  const checkDuplicates = (items: string[], field: string) => {
    const seen = new Set<string>();
    items.forEach((value, index) => {
      if (seen.has(value)) ctx.addIssue({ code: "custom", path: [field, index], message: `Duplicate identifier: ${value}` });
      seen.add(value);
    });
  };
  checkDuplicates(bundle.models.map((item) => item.id), "models");
  checkDuplicates(bundle.benchmarks.map((item) => item.id), "benchmarks");
  checkDuplicates(bundle.news.map((item) => item.eventKey), "news");
  const variants = new Set(bundle.models.map((item) => item.id));
  bundle.benchmarks.forEach((item, index) => {
    if (!variants.has(item.variantId)) ctx.addIssue({ code: "custom", path: ["benchmarks", index, "variantId"], message: "Unknown model variant" });
  });
  bundle.news.forEach((item, index) => {
    if (item.supersedesEventKey === item.eventKey) ctx.addIssue({ code: "custom", path: ["news", index, "supersedesEventKey"], message: "An event cannot supersede itself" });
  });
});
