import "server-only";
import { constants } from "node:fs";
import { open } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import publicRelease from "../content/public-release.json";
import { catalogSchema } from "./catalog-schema";
import { starterBundle } from "./starter";
import { aaSnapshotFilename, aaSnapshotMaxBytes, aaSnapshotSchema } from "./aa-catalog";
import type { PublishedBundle } from "./types";

export interface CatalogResult {
  bundle: PublishedBundle;
  origin: "starter" | "published";
  warning: string | null;
}

async function readPublishedFile(file: string, limit = 1024 * 1024) {
  const handle = await open(file, constants.O_RDONLY | constants.O_NONBLOCK);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > limit) throw new Error("Invalid published file size or type");
    const buffer = Buffer.alloc(limit + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, null);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > limit) throw new Error("Published bundle exceeds size limit");
    return JSON.parse(buffer.toString("utf8", 0, length)) as unknown;
  } finally {
    await handle.close();
  }
}

// The snapshot is separate from curated content and is read only by the directory.
export async function readArtificialAnalysis() {
  const directory = process.env.INFOHUB_DATA_DIR || path.join(process.cwd(), "data", "published");
  try {
    const file = await readPublishedFile(path.join(/* turbopackIgnore: true */ directory, aaSnapshotFilename), aaSnapshotMaxBytes);
    return { snapshot: aaSnapshotSchema.parse(file), unavailable: false };
  } catch (error) {
    const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
    if (!missing) console.error("InfoHub could not read the Artificial Analysis directory snapshot.");
    return { snapshot: null, unavailable: !missing };
  }
}

function addFrontierModels(bundle: PublishedBundle): PublishedBundle {
  if (!publicRelease) return bundle;
  const existingIds = new Set(bundle.models.map(model => model.id));
  const additions = catalogSchema.parse(publicRelease).models.filter(model => model.id.startsWith("gemini-4-") && !existingIds.has(model.id));
  const models = [...bundle.models, ...additions].map(model => {
    if (model.modelId !== "gemini-4-carbon" || Date.now() < Date.parse("2026-12-01T00:00:00Z")) return model;
    if (model.price.verifiedAt > "2026-11-27") return model;
    return { ...model, price: { ...model.price, input: 4, cachedInput: 0.2, output: 20, note: "Standard Gemini Developer API rates effective December 1, 2026. Output includes thinking tokens." } };
  });
  return { ...bundle, models };
}

// React cache deduplicates only within a request. Every new request reads the
// published snapshot, so atomic content updates do not require an app rebuild.
export const readCatalog = cache(async (): Promise<CatalogResult> => {
  const directory = process.env.INFOHUB_DATA_DIR || path.join(process.cwd(), "data", "published");
  try {
    const raw = await readPublishedFile(path.join(directory, "current.json"));
    return { bundle: addFrontierModels(catalogSchema.parse(raw)), origin: "published", warning: null };
  } catch (error) {
    const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
    // Malformed operational content must not become a blank application.
    if (!missing) console.error("InfoHub could not load its published catalog; serving the bundled public catalog.");
    return {
      bundle: addFrontierModels(publicRelease === null ? starterBundle() : catalogSchema.parse(publicRelease)),
      origin: publicRelease === null ? "starter" : "published",
      warning: missing ? null : "The team catalog is temporarily unavailable. Showing the public guide.",
    };
  }
});
