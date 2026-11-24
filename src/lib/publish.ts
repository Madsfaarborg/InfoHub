import { constants } from 'node:fs';
import { open, mkdir, rename, rm, link } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import digestSchema from '../../schemas/news-digest.schema.json';
import { catalogSchema } from './catalog-schema';
import type { NewsDigest, NewsItem, PublishedBundle } from './types';

export const MAX_BYTES = 1024 * 1024;
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const checkDigest = ajv.compile(digestSchema);
const revisionPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;
export function dataDirectory(dir = process.env.INFOHUB_DATA_DIR ?? 'data/published'): string { return path.resolve(dir); }
export function canonicalUrl(value: string): string {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Only HTTP(S) source URLs without credentials are allowed');
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) if (/^(utm_.+|fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
  return url.href;
}
export async function readJson(file: string): Promise<unknown> {
  const handle = await open(path.resolve(file), constants.O_RDONLY);
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > MAX_BYTES) throw new Error('Input must be a regular JSON file no larger than 1 MiB');
    // Read a bounded buffer even if another process grows the file after stat.
    const buffer = Buffer.alloc(MAX_BYTES + 1);
    let count = 0;
    while (count < buffer.length) {
      const result = await handle.read(buffer, count, buffer.length - count, null);
      if (!result.bytesRead) break;
      count += result.bytesRead;
    }
    if (count > MAX_BYTES) throw new Error('JSON exceeds 1 MiB');
    return JSON.parse(buffer.subarray(0, count).toString('utf8'));
  } finally { await handle.close(); }
}
export function validateDigest(value: unknown, now = new Date()): NewsDigest {
  if (!checkDigest(value)) throw new Error(`Invalid news digest: ${ajv.errorsText(checkDigest.errors)}`);
  const digest = value as unknown as NewsDigest;
  const time = (s: string) => Date.parse(s);
  if (!(time(digest.windowStart) <= time(digest.windowEnd) && time(digest.windowEnd) <= time(digest.generatedAt) && time(digest.generatedAt) <= now.getTime())) throw new Error('Digest timestamps must be chronological and not in the future');
  const keys = new Set<string>(); const urls = new Set<string>();
  for (const item of digest.items) {
    const url = canonicalUrl(item.primarySource.url);
    if (keys.has(item.eventKey) || urls.has(url)) throw new Error('Duplicate event key or primary source URL in digest');
    keys.add(item.eventKey); urls.add(url);
    if (item.supersedesEventKey === item.eventKey) throw new Error('A correction cannot supersede itself');
    const sources = new Set<string>();
    for (const source of [item.primarySource, ...item.additionalSources]) {
      const canonical = canonicalUrl(source.url);
      if (sources.has(canonical)) throw new Error('Duplicate source URL in news item');
      sources.add(canonical);
      if (time(source.retrievedAt) > time(digest.generatedAt)) throw new Error('Source retrieval date is after digest generation');
      for (const date of [source.eventDate, source.publishedDate]) if (date && date > digest.generatedAt.slice(0, 10)) throw new Error('Source date is in the future');
    }
  }
  for (const failure of digest.sourceFailures) if (failure.url) canonicalUrl(failure.url);
  for (const candidate of digest.modelReviewCandidates) for (const url of candidate.evidenceUrls) canonicalUrl(url);
  return digest;
}
export function validateBundle(value: unknown): PublishedBundle {
  const bundle = catalogSchema.parse(value) as PublishedBundle;
  if (!revisionPattern.test(bundle.revision)) throw new Error('Invalid revision ID');
  if (Date.parse(bundle.generatedAt) > Date.now()) throw new Error('Bundle generation date is in the future');
  return bundle;
}
export async function validateFile(file: string): Promise<'news' | 'catalog'> {
  const value = await readJson(file);
  if (value && typeof value === 'object' && 'status' in value) { validateDigest(value); return 'news'; }
  validateBundle(value); return 'catalog';
}
async function atomicJson(file: string, value: unknown): Promise<void> {
  const text = JSON.stringify(value, null, 2) + '\n';
  if (Buffer.byteLength(text) > MAX_BYTES) throw new Error('Published content exceeds 1 MiB; archive older content before publishing');
  const temporary = path.join(path.dirname(file), `.tmp-${randomUUID()}.json`);
  try {
    const handle = await open(temporary, 'wx', 0o600);
    try { await handle.writeFile(text); await handle.sync(); } finally { await handle.close(); }
    await rename(temporary, file);
  } finally { await rm(temporary, { force: true }); }
}
export async function withPublishLock<T>(dir: string, work: () => Promise<T>): Promise<T> {
  dir = dataDirectory(dir); await mkdir(dir, { recursive: true });
  const lockFile = path.join(dir, '.publish.lock');
  let lock;
  try { lock = await open(lockFile, 'wx', 0o600); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new Error('Another publisher holds .publish.lock. If a process crashed, confirm it is stopped before removing the lock.');
    throw error;
  }
  try { await lock.writeFile(`${process.pid}\n`); return await work(); }
  finally { await lock.close(); await rm(lockFile, { force: true }); }
}
async function current(dir: string): Promise<PublishedBundle> { return validateBundle(await readJson(path.join(dir, 'current.json'))); }
function nextRevision(): string { return `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`; }
async function commit(dir: string, bundle: PublishedBundle, previous?: PublishedBundle): Promise<PublishedBundle> {
  validateBundle(bundle);
  // Check the final serialized size before writing history or touching current.
  if (Buffer.byteLength(JSON.stringify(bundle, null, 2) + '\n') > MAX_BYTES) throw new Error('Published content exceeds 1 MiB; archive older content before publishing');
  await mkdir(path.join(dir, 'history'), { recursive: true });
  if (previous) {
    const history = path.join(dir, 'history', `${previous.revision}.json`);
    const temporary = path.join(dir, 'history', `.tmp-${randomUUID()}.json`);
    try {
      await atomicJson(temporary, previous);
      try { await link(temporary, history); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        const saved = validateBundle(await readJson(history));
        if (JSON.stringify(saved) !== JSON.stringify(previous)) throw new Error('History revision collision; current content is unchanged');
      }
    } finally { await rm(temporary, { force: true }); }
  }
  await atomicJson(path.join(dir, 'current.json'), bundle);
  return bundle;
}
export async function initialize(dir = dataDirectory(), starter = path.resolve('src/content/starter.json')): Promise<PublishedBundle> {
  dir = dataDirectory(dir);
  return withPublishLock(dir, async () => {
    try { return await current(dir); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    return commit(dir, validateBundle(await readJson(starter)));
  });
}
export function mergeNews(existing: NewsItem[], incoming: NewsItem[]): NewsItem[] {
  let result = [...existing];
  for (const item of incoming) {
    const url = canonicalUrl(item.primarySource.url);
    result = result.filter(old => old.eventKey !== item.eventKey && canonicalUrl(old.primarySource.url) !== url && old.eventKey !== item.supersedesEventKey);
    result.push(item);
  }
  return result;
}
function requireReview(reviewed: boolean): void { if (!reviewed) throw new Error('Publication requires explicit editorial review: pass --reviewed'); }
export async function publishNews(file: string, reviewed: boolean, dir = dataDirectory()): Promise<PublishedBundle> {
  requireReview(reviewed); dir = dataDirectory(dir);
  const digest = validateDigest(await readJson(file));
  return withPublishLock(dir, async () => {
    const previous = await current(dir);
    for (const candidate of digest.modelReviewCandidates) for (const id of candidate.variantIds) if (!previous.models.some(model => model.id === id)) throw new Error(`Unknown candidate variant ID: ${id}`);
    const operations = path.join(path.dirname(dir), 'operations'); await mkdir(operations, { recursive: true });
    const revision = nextRevision();
    const approved = digest.status === 'partial' ? digest.items.filter(item => item.confidence === 'confirmed') : digest.items;
    await atomicJson(path.join(operations, `${revision}.json`), { revision, status: digest.status, modelReviewCandidates: digest.modelReviewCandidates, sourceFailures: digest.sourceFailures, heldItems: digest.items.filter(item => !approved.includes(item)), noNewsReason: digest.noNewsReason });
    if (digest.status === 'failed') throw new Error('Failed digest recorded in operations; published content is unchanged');
    return commit(dir, { ...previous, revision, generatedAt: new Date().toISOString(), news: mergeNews(previous.news, approved) }, previous);
  });
}
export async function publishCatalog(file: string, reviewed: boolean, dir = dataDirectory()): Promise<PublishedBundle> {
  requireReview(reviewed); dir = dataDirectory(dir);
  const incoming = validateBundle(await readJson(file));
  return withPublishLock(dir, async () => {
    const previous = await current(dir);
    return commit(dir, { ...incoming, revision: nextRevision(), generatedAt: new Date().toISOString(), news: previous.news }, previous);
  });
}
export async function rollback(revision: string, dir = dataDirectory()): Promise<PublishedBundle> {
  if (!revisionPattern.test(revision)) throw new Error('Invalid revision ID'); dir = dataDirectory(dir);
  return withPublishLock(dir, async () => {
    const previous = await current(dir);
    const restored = validateBundle(await readJson(path.join(dir, 'history', `${revision}.json`)));
    if (restored.revision !== revision) throw new Error('History revision does not match filename');
    return commit(dir, restored, previous);
  });
}
