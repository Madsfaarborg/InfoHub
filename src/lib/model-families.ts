import type { BenchmarkMetricId, ModelBenchmarkProfile, ModelObservation, ModelVariant, TaskGuidance } from "./types";

export interface ModelFamily {
  id: string;
  name: string;
  developer: string;
  provider: string;
  description: string;
  deployment: ModelVariant["deployment"];
  availability: ModelVariant["availability"];
  variants: ModelVariant[];
  codingDefault: string | null;
  benchmarkProfile: ModelBenchmarkProfile | null;
  observations: ModelObservation[];
}

const effortOrder = ["non-thinking", "low", "medium", "high", "xhigh", "max", "thinking"];

function effortRank(label: string) {
  const normalized = label.toLocaleLowerCase("en");
  const match = effortOrder.findIndex(effort => normalized.includes(effort));
  return match === -1 ? effortOrder.length : match;
}

function familyKey(model: ModelVariant) {
  return `${model.developer}\u0000${model.name}`;
}

function uniqueObservations(variants: ModelVariant[]) {
  const seen = new Set<string>();
  return variants.flatMap(model => model.observations ?? []).filter(observation => {
    const key = `${observation.url}\u0000${observation.summary}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function codingDefault(variants: ModelVariant[]) {
  const codingVariants = variants.filter(model => model.guidance.coding || model.guidance.debugging);
  if (!codingVariants.length) return null;
  const high = codingVariants.find(model => /\bhigh\b/i.test(model.setting.label) && !/xhigh/i.test(model.setting.label));
  if (high) return "High";
  const thinking = codingVariants.find(model => /^thinking\b/i.test(model.setting.label));
  if (thinking) return "Thinking";
  return [...codingVariants].sort((a, b) => effortRank(b.setting.label) - effortRank(a.setting.label))[0].setting.label.split(" · ")[0];
}

function benchmarkProfile(variants: ModelVariant[]) {
  const profiles = variants.filter(model => /^high(?:\b|$)/i.test(model.benchmarkProfile?.effort ?? ""));
  if (!profiles.length) {
    for (const model of variants) {
      const entry = Object.entries(highEffortResults).find(([id]) => id === model.modelId);
      if (entry) return modelVariantSchema.shape.benchmarkProfile.parse(entry[1]) ?? null;
    }
    return null;
  }
  const codingDefaultLabel = codingDefault(variants);
  const preferred = profiles.find(model => codingDefaultLabel && model.benchmarkProfile?.effort.toLocaleLowerCase("en").startsWith(codingDefaultLabel.toLocaleLowerCase("en")));
  return (preferred ?? profiles[0]).benchmarkProfile ?? null;
}

export function groupModelFamilies(models: ModelVariant[]): ModelFamily[] {
  const groups = Map.groupBy(models.filter(model => !model.image), familyKey);
  return [...groups.values()].map(group => {
    const variants = [...group].sort((a, b) => effortRank(a.setting.label) - effortRank(b.setting.label));
    const representative = variants.find(model => model.availability === "available") ?? variants[0];
    return {
      id: representative.id,
      name: representative.name,
      developer: representative.developer,
      provider: representative.provider,
      description: representative.description,
      deployment: representative.deployment,
      availability: representative.availability,
      variants,
      codingDefault: codingDefault(variants),
      benchmarkProfile: benchmarkProfile(variants),
      observations: uniqueObservations(variants),
    };
  }).sort((a, b) => {
    const aScore = a.benchmarkProfile?.metrics.intelligence?.score ?? -Infinity;
    const bScore = b.benchmarkProfile?.metrics.intelligence?.score ?? -Infinity;
    return bScore - aScore || a.name.localeCompare(b.name, "en", { numeric: true });
  });
}

export function findModelFamily(models: ModelVariant[], id: string) {
  const selected = models.find(model => model.id === id && !model.image);
  if (!selected) return null;
  return groupModelFamilies(models).find(family => family.variants.some(model => model.id === id)) ?? null;
}

export function primaryGuidance(model: ModelVariant): { category: string; guidance: TaskGuidance } | null {
  const preferred = Object.entries(model.guidance).find(([, guidance]) => guidance?.preferred);
  const selected = preferred
    ?? (["coding", "debugging", "analysis", "research", "writing", "networking", "security", "marketing", "presentations"] as const)
      .map(category => [category, model.guidance[category]] as const)
      .find(([, guidance]) => guidance);
  if (!selected?.[1]) return null;
  return { category: selected[0], guidance: selected[1] };
}

export function benchmarkValue(profile: ModelBenchmarkProfile | null, metric: BenchmarkMetricId) {
  return profile?.metrics[metric] ?? null;
}
import highEffortResults from "../content/high-effort-benchmarks.json";
import { modelVariantSchema } from "./catalog-schema";
