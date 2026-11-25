export const categoryIds = ["images", "marketing", "presentations", "analysis", "writing", "research", "coding", "debugging", "networking", "security"] as const;
export type CategoryId = (typeof categoryIds)[number];
export const imageWorkflowIds = ["concepts", "edits", "layout"] as const;
export type ImageWorkflow = (typeof imageWorkflowIds)[number];
export type Tier = "everyday" | "balanced" | "deep";
export type Priority = "value" | "quality" | "speed";

export interface EvidenceSource {
  label: string;
  url: string;
  kind: "provider" | "benchmark" | "editorial";
  checkedAt: string;
}

export interface TaskGuidance {
  bestFor: string;
  example: string;
  limitation: string;
  stepUp: string;
  preferred?: boolean;
}

export interface ModelVariant {
  id: string;
  name: string;
  developer: string;
  provider: string;
  modelId: string;
  tier: Tier;
  deployment: "hosted" | "local";
  availability: "available" | "setup-required" | "unavailable";
  setting: { label: string; parameters: Record<string, string | number | boolean>; note: string };
  description: string;
  toolUrl: string | null;
  price: {
    input: number | null;
    output: number | null;
    cachedInput: number | null;
    currency: "USD";
    verifiedAt: string;
    sourceUrl: string;
    note: string;
  };
  limits?: { contextTokens: number; maxOutputTokens: number };
  reportedBenchmarks?: {
    sourceLabel: string;
    sourceUrl: string;
    publishedAt: string;
    results: { name: string; percent: number; conditions?: string }[];
  };
  image?: {
    workflows: Partial<Record<ImageWorkflow, TaskGuidance>>;
    outputUsd: number | null;
    priceBasis: string;
    brief: string;
  };
  guidance: Partial<Record<CategoryId, TaskGuidance>>;
  sources: EvidenceSource[];
  reviewedAt: string;
}

export interface BenchmarkPoint {
  id: string;
  variantId: string;
  suite: string;
  version: string;
  score: number;
  unit: string;
  higherIsBetter: boolean;
  costUsd: number;
  sampleSize: number;
  testedAt: string;
  sourceUrl: string;
  note: string;
}

export interface NewsSource {
  url: string;
  publisher: string;
  publishedDate: string | null;
  eventDate: string | null;
  retrievedAt: string;
}
export type NewsTag = "models-and-pricing" | "coding-tools" | "networking" | "cybersecurity" | "microsoft-and-cloud" | "work-practices" | "creative-tools" | "business-productivity";
export interface NewsItem {
  eventKey: string;
  title: string;
  summary: string;
  whyItMatters: string;
  suggestedAction: string;
  tags: NewsTag[];
  urgency: "routine" | "time-sensitive";
  confidence: "confirmed" | "vendor-claim";
  recommendationImpact: "none" | "review";
  primarySource: NewsSource;
  additionalSources: NewsSource[];
  supersedesEventKey: string | null;
}
export interface NewsDigest {
  schemaVersion: "1.0";
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  timezone: "Europe/Copenhagen";
  status: "complete" | "partial" | "failed";
  items: NewsItem[];
  modelReviewCandidates: { claim: string; variantIds: string[]; evidenceUrls: string[]; verificationNeeded: string }[];
  sourceFailures: { url: string | null; reason: string }[];
  noNewsReason: string | null;
}
export interface PublishedBundle {
  schemaVersion: "1.0";
  revision: string;
  generatedAt: string;
  models: ModelVariant[];
  benchmarks: BenchmarkPoint[];
  news: NewsItem[];
}

export interface TaskInterpretation {
  category: CategoryId | null;
  alternatives: CategoryId[];
  complexity: "routine" | "complex";
  localOnly: boolean;
  imageWorkflow?: ImageWorkflow;
}
export interface Recommendation {
  model: ModelVariant;
  guidance: TaskGuidance;
  recommended: boolean;
}
