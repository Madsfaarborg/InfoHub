import { randomUUID } from 'node:crypto';
import { open, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { aaFeeds, aaSnapshotFilename, aaSnapshotMaxBytes, aaSnapshotSchema, type AaEntry, type AaFeed, type AaSnapshot } from './aa-catalog';
import { withPublishLock } from './publish';

const BASE = 'https://artificialanalysis.ai/api/v2';
const RESPONSE_BYTES = 8 * 1024 * 1024;
const TOTAL_BYTES = 64 * 1024 * 1024;
const MAX_REQUESTS = 1000;
const TIMEOUT_MS = 20_000;
const identityText = z.string().min(1).max(1000).refine(value => value.trim() === value && value.length > 0 && !/[\u0000-\u001f\u007f]/.test(value));
const identity = z.object({
  id: identityText,
  name: identityText,
  model_creator: z.object({ name: identityText }),
  reasoning_model: z.boolean().optional(),
});
const paginationSchema = z.object({
  page: z.number().int().min(1),
  page_size: z.number().int().min(1),
  total_pages: z.number().int().min(1).max(MAX_REQUESTS),
  has_more: z.boolean(),
});
const envelopeSchema = z.object({
  tier: z.enum(['free', 'pro', 'commercial']),
  data: z.array(z.unknown()),
  pagination: paginationSchema.optional(),
});
class SyncError extends Error {}
function failure(message: string): never { throw new SyncError(message); }

// Read incrementally: Content-Length is only a hint, and response bodies can grow.
async function boundedJson(response: Response, signal: AbortSignal): Promise<{ value: unknown; bytes: number }> {
  const length = response.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > RESPONSE_BYTES)) failure('Artificial Analysis response exceeds the size limit.');
  if (!response.body) failure('Artificial Analysis returned an empty response.');
  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      signal.throwIfAborted();
      const part = await reader.read();
      signal.throwIfAborted();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > RESPONSE_BYTES) failure('Artificial Analysis response exceeds the size limit.');
      chunks.push(part.value);
    }
    const text = Buffer.concat(chunks, bytes).toString('utf8');
    try { return { value: JSON.parse(text), bytes }; }
    catch { return failure('Artificial Analysis returned invalid JSON.'); }
  } finally {
    signal.removeEventListener('abort', cancel);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function syncArtificialAnalysis({ apiKey, directory, fetcher = fetch }: {
  apiKey: string;
  directory: string;
  fetcher?: typeof fetch;
}): Promise<AaSnapshot> {
  if (!apiKey.trim() || /[\u0000-\u0020\u007f]/.test(apiKey)) throw new Error('Provide a valid Artificial Analysis API key through the host environment.');
  try {
    return await withPublishLock(directory, async () => {
      const entries = new Map<string, AaEntry>();
      let tier: AaSnapshot['tier'] | undefined;
      let requests = 0;
      let totalBytes = 0;
      for (const feed of Object.keys(aaFeeds) as AaFeed[]) {
        const endpoint = aaFeeds[feed].endpoint;
        // Only code-owned, relative paths may receive the credential.
        if (!endpoint.startsWith('/') || endpoint.startsWith('//') || /[?#\\]/.test(endpoint)) failure('Invalid Artificial Analysis feed configuration.');
        const language = endpoint.startsWith('/language/');
        const slugOptional = endpoint.startsWith('/media/music/') || feed === 'speech-to-text';
        let page = 1;
        let totalPages: number | undefined;
        let pageSize: number | undefined;
        do {
          if (++requests > MAX_REQUESTS) failure('Artificial Analysis pagination exceeds the request limit.');
          const url = new URL(`${BASE}${endpoint}`);
          if (language || page > 1) url.searchParams.set('page', String(page));
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
          let payload: z.infer<typeof envelopeSchema>;
          try {
            const response = await fetcher(url, { headers: { 'x-api-key': apiKey, accept: 'application/json' }, redirect: 'error', signal: controller.signal });
            if (!response.ok) {
              await response.body?.cancel().catch(() => {});
              failure(response.status === 401 || response.status === 403
                ? 'Artificial Analysis rejected API access. Check the key and subscription tier.'
                : 'Artificial Analysis request failed. The previous snapshot is unchanged.');
            }
            const result = await boundedJson(response, controller.signal);
            totalBytes += result.bytes;
            if (totalBytes > TOTAL_BYTES) failure('Artificial Analysis import exceeds the total size limit.');
            const parsed = envelopeSchema.safeParse(result.value);
            if (!parsed.success) failure('Artificial Analysis response has an invalid envelope.');
            payload = parsed.data;
          } finally { clearTimeout(timer); }
          if (tier && payload.tier !== tier) failure('Artificial Analysis tier changed during import. Retry the complete sync.');
          tier = payload.tier;
          const pagination = payload.pagination;
          if (language && !pagination) failure('Artificial Analysis language pagination is missing.');
          if (pagination) {
            if (pagination.page !== page || pagination.has_more !== (page < pagination.total_pages)
              || payload.data.length > pagination.page_size
              || (pagination.has_more && payload.data.length === 0)
              || (totalPages !== undefined && pagination.total_pages !== totalPages)
              || (pageSize !== undefined && pagination.page_size !== pageSize)) failure('Artificial Analysis pagination is inconsistent.');
            totalPages = pagination.total_pages;
            pageSize = pagination.page_size;
          }
          const schema = identity.extend({ slug: slugOptional ? identityText.optional() : identityText });
          for (const raw of payload.data) {
            const parsed = schema.safeParse(raw);
            if (!parsed.success) failure('Artificial Analysis returned invalid model identity data.');
            const model = parsed.data;
            if ([model.id, model.name, model.model_creator.name, model.slug].some(value => typeof value === 'string' && value.includes(apiKey))) failure('Artificial Analysis returned credential-like model data. The snapshot was not saved.');
            const existing = entries.get(model.id);
            if (existing) {
              if (!existing.feeds.includes(feed)) existing.feeds.push(feed);
            } else {
              entries.set(model.id, {
                id: model.id, name: model.name,
                slug: model.slug ?? null,
                creator: model.model_creator.name,
                reasoning: model.reasoning_model ?? null,
                feeds: [feed],
              });
            }
          }
          if (!pagination?.has_more) break;
          page++;
        } while (true);
      }
      if (!entries.size || !tier) failure('Artificial Analysis returned no models. The previous snapshot is unchanged.');
      const snapshot = aaSnapshotSchema.parse({ version: 1, refreshedAt: new Date().toISOString(), tier, entries: [...entries.values()] });
      const text = JSON.stringify(snapshot, null, 2) + '\n';
      if (Buffer.byteLength(text) > aaSnapshotMaxBytes) failure('Artificial Analysis snapshot exceeds the size limit.');
      if (text.includes(apiKey)) failure('Artificial Analysis returned credential-like model data. The snapshot was not saved.');
      const dir = path.resolve(directory);
      const temporary = path.join(dir, `.aa-${randomUUID()}.tmp`);
      try {
        const file = await open(temporary, 'wx', 0o600);
        try { await file.writeFile(text); await file.sync(); } finally { await file.close(); }
        await rename(temporary, path.join(dir, aaSnapshotFilename));
      } finally { await rm(temporary, { force: true }); }
      return snapshot;
    });
  } catch (error) {
    // Never propagate fetch, validation, response-body, or filesystem errors that
    // could contain provider payloads, credential-bearing headers or request data.
    if (error instanceof SyncError) throw new Error(error.message);
    throw new Error('Artificial Analysis sync failed. The previous snapshot is unchanged.');
  }
}
