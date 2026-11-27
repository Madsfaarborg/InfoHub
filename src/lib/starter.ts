import { isDeepStrictEqual } from "node:util";
import { categoryIds } from "./types";
import gptNotes from "../content/gpt-observations.json";
import otherNotes from "../content/other-observations.json";
import imageNotes from "../content/image-observations.json";
import earlierGpt from "../content/earlier-gpt.json";
import earlierClaude from "../content/earlier-claude.json";
import base from "../content/starter.json";
import images from "../content/image-starter.json";
import business from "../content/business-guidance.json";
import claude from "../content/claude-models.json";
import gemini from "../content/gemini-models.json";
import { catalogSchema, modelVariantSchema } from "./catalog-schema";
import type { ModelVariant, PublishedBundle } from "./types";

const businessGuidance = business as Record<string, ModelVariant["guidance"]>;
const starterImages: ModelVariant[] = modelVariantSchema.array().parse(images);
const earlier = modelVariantSchema.array().parse([...earlierGpt, ...earlierClaude]);
const observations: Record<string, unknown> = { ...gptNotes, ...otherNotes, ...imageNotes };
const starterClaude: ModelVariant[] = modelVariantSchema.array().parse(claude);
const starterGemini: ModelVariant[] = modelVariantSchema.array().parse(gemini);

export function addStarterGuidance(models: ModelVariant[]): ModelVariant[] {
  const ids = new Set(models.map(model => model.id));
  const modelIds = new Set(models.map(model => model.modelId));
  const combined = [
    ...models.map(model => {
      const extra = businessGuidance[model.id];
      return extra ? { ...model, guidance: { ...extra, ...model.guidance } } : model;
    }),
    ...starterClaude.filter(model => !ids.has(model.id)),
    ...starterGemini.filter(model => !ids.has(model.id) && !modelIds.has(model.modelId)),
    ...earlier.filter(model => !ids.has(model.id)),
    ...starterImages.filter(model => !ids.has(model.id)),
  ];
  return combined.map(model => {
    const notes = observations[model.modelId];
    if (!notes) return model;
    const updated = modelVariantSchema.parse({ ...model, observations: model.observations ?? notes });
    const original = [...base.models, ...starterClaude].find(item => item.id === model.id && item.modelId === model.modelId);
    if (!original) return updated;
    const reference: ModelVariant["guidance"] = { ...businessGuidance[model.id], ...original.guidance };
    for (const category of categoryIds) {
      const curated = reference[category];
      const current = updated.guidance[category];
      if (!curated?.evidenceUrl || !current || current.evidenceUrl) continue;
      const { evidenceUrl, ...previous } = curated;
      if (isDeepStrictEqual(previous, current) && updated.observations?.some(note => note.url === evidenceUrl && note.tasks.includes(category))) {
        current.evidenceUrl = evidenceUrl;
      }
    }
    return updated;
  });
}

export function starterBundle(): PublishedBundle {
  const bundle = catalogSchema.parse(base);
  return catalogSchema.parse({
    ...bundle,
    revision: "starter-2026-11-25-observations",
    models: addStarterGuidance(bundle.models),
  });
}
