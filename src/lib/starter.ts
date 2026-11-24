import base from "../content/starter.json";
import images from "../content/image-starter.json";
import business from "../content/business-guidance.json";
import { catalogSchema, modelVariantSchema } from "./catalog-schema";
import type { ModelVariant, PublishedBundle } from "./types";

const businessGuidance = business as Record<string, ModelVariant["guidance"]>;
const starterImages: ModelVariant[] = modelVariantSchema.array().parse(images);

export function addStarterGuidance(models: ModelVariant[]): ModelVariant[] {
  const ids = new Set(models.map(model => model.id));
  return [
    ...models.map(model => {
      const extra = businessGuidance[model.id];
      return extra ? { ...model, guidance: { ...extra, ...model.guidance } } : model;
    }),
    ...starterImages.filter(model => !ids.has(model.id)),
  ];
}

export function starterBundle(): PublishedBundle {
  const bundle = catalogSchema.parse(base);
  return catalogSchema.parse({
    ...bundle,
    revision: "starter-2026-11-24-creative",
    models: addStarterGuidance(bundle.models),
  });
}
