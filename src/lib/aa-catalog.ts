import { z } from "zod";

export const aaFeeds = {
  language: { label: "Language", endpoint: "/language/models/free", sourceUrl: "https://artificialanalysis.ai/models/releases" },
  image: { label: "Text to image", endpoint: "/media/text-to-image/models/free", sourceUrl: "https://artificialanalysis.ai/image/leaderboard/text-to-image" },
  "image-editing": { label: "Image editing", endpoint: "/media/image-editing/models/free", sourceUrl: "https://artificialanalysis.ai/image/leaderboard/editing" },
  video: { label: "Text to video (silent)", endpoint: "/media/text-to-video/models/free", sourceUrl: "https://artificialanalysis.ai/video/leaderboard/text-to-video?audio-output=false" },
  "image-to-video": { label: "Image to video (silent)", endpoint: "/media/image-to-video/models/free", sourceUrl: "https://artificialanalysis.ai/video/models" },
  "video-audio": { label: "Text to video with audio", endpoint: "/media/text-to-video-audio/models/free", sourceUrl: "https://artificialanalysis.ai/video/leaderboard/text-to-video" },
  "image-to-video-audio": { label: "Image to video with audio", endpoint: "/media/image-to-video-audio/models/free", sourceUrl: "https://artificialanalysis.ai/video/leaderboard/image-to-video" },
  "text-to-speech": { label: "Text to speech", endpoint: "/media/text-to-speech/models/free", sourceUrl: "https://artificialanalysis.ai/text-to-speech/models" },
  "speech-to-text": { label: "Speech to text", endpoint: "/media/speech-to-text/models/free", sourceUrl: "https://artificialanalysis.ai/speech-to-text/non-streaming" },
  "speech-to-speech": { label: "Speech to speech", endpoint: "/media/speech-to-speech/models/free", sourceUrl: "https://artificialanalysis.ai/speech-to-speech" },
  "instrumental-music": { label: "Instrumental music", endpoint: "/media/music/instrumental/models/free", sourceUrl: "https://artificialanalysis.ai/music/leaderboard/instrumental" },
  "vocal-music": { label: "Music with vocals", endpoint: "/media/music/with-vocals/models/free", sourceUrl: "https://artificialanalysis.ai/music/leaderboard/vocals" },
} as const;

export type AaFeed = keyof typeof aaFeeds;
export const aaFeedIds = Object.keys(aaFeeds) as AaFeed[];
export const aaSnapshotFilename = "artificial-analysis.json";
export const aaSnapshotMaxBytes = 4 * 1024 * 1024;

const aaEntrySchema = z.strictObject({
  id: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(280),
  slug: z.string().trim().min(1).max(250).nullable(),
  creator: z.string().trim().min(1).max(200),
  reasoning: z.boolean().nullable(),
  feeds: z.array(z.enum(aaFeedIds)).min(1).max(aaFeedIds.length)
    .refine(feeds => new Set(feeds).size === feeds.length, "Feed memberships must be unique"),
});

export const aaSnapshotSchema = z.strictObject({
  version: z.literal(1),
  refreshedAt: z.iso.datetime({ offset: true }),
  tier: z.enum(["free", "pro", "commercial"]),
  entries: z.array(aaEntrySchema).min(1).max(25_000),
}).superRefine(({ entries }, ctx) => {
  const ids = new Set<string>();
  for (const [index, entry] of entries.entries()) {
    if (ids.has(entry.id)) ctx.addIssue({ code: "custom", path: ["entries", index, "id"], message: "Duplicate model entry" });
    ids.add(entry.id);
  }
});

export type AaEntry = z.infer<typeof aaEntrySchema>;
export type AaSnapshot = z.infer<typeof aaSnapshotSchema>;

export function isAaFeed(value: string): value is AaFeed {
  return Object.hasOwn(aaFeeds, value);
}

export function filterAaEntries(entries: AaEntry[], query: string, feed: AaFeed | null) {
  const words = query.trim().toLocaleLowerCase("en").split(/\s+/).filter(Boolean);
  return entries.filter(entry => {
    if (feed && !entry.feeds.includes(feed)) return false;
    const text = [entry.name, entry.creator, entry.slug ?? ""].join(" ").toLocaleLowerCase("en");
    return words.every(word => text.includes(word));
  }).sort((first, second) => first.name.localeCompare(second.name, "en", { numeric: true }) || first.creator.localeCompare(second.creator, "en") || first.id.localeCompare(second.id, "en"));
}
