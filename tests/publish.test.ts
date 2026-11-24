import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { initialize, preparePublicRelease, publishNews, publishCatalog, readPublicRelease, rollback, upgradeStarterGuidance, validateDigest, withPublishLock } from '../src/lib/publish';
import { starterBundle } from '../src/lib/starter';
import { main } from '../scripts/content';
import type { NewsDigest, NewsItem, PublishedBundle } from '../src/lib/types';
const bundle: PublishedBundle = { schemaVersion: '1.0', revision: 'seed', generatedAt: '2026-01-01T12:00:00Z', models: [], benchmarks: [], news: [] };
const item: NewsItem = { eventKey: 'event-one', title: 'A documented change', summary: 'A verified change with sufficient detail.', whyItMatters: 'Changes workflow', suggestedAction: 'Review documentation', tags: ['coding-tools'], urgency: 'routine', confidence: 'confirmed', recommendationImpact: 'none', primarySource: { url: 'https://example.com/news', publisher: 'Example', publishedDate: '2026-01-01', eventDate: null, retrievedAt: '2026-01-01T11:00:00Z' }, additionalSources: [], supersedesEventKey: null };
const digest = (items: NewsItem[] = [item]): NewsDigest => ({ schemaVersion: '1.0', generatedAt: '2026-01-01T12:00:00Z', windowStart: '2026-01-01T00:00:00Z', windowEnd: '2026-01-01T12:00:00Z', timezone: 'Europe/Copenhagen', status: 'complete', items, modelReviewCandidates: [], sourceFailures: [], noNewsReason: items.length ? null : 'No changes' });
async function setup() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'infohub-publish-'));
  const dir = path.join(root, 'published'); const file = path.join(root, 'input.json'); const starter = path.join(root, 'starter.json');
  await writeFile(starter, JSON.stringify(bundle));
  await initialize(dir, starter);
  const put = async (value: unknown) => { await writeFile(file, JSON.stringify(value)); return file; };
  const get = async () => JSON.parse(await readFile(path.join(dir, 'current.json'), 'utf8')) as PublishedBundle;
  return { root, dir, file, starter, put, get };
}
test('first initialization validates starter and never overwrites current', async () => {
  const s = await setup(); try { await writeFile(s.starter, '{}'); assert.deepEqual(await initialize(s.dir, s.starter), bundle); } finally { await rm(s.root, { recursive: true }); }
});
test('CLI and library require reviewed flag before reading or writing', async () => {
  await assert.rejects(main(['publish-news', '/missing.json']), /--reviewed/);
  await assert.rejects(publishCatalog('/missing.json', false), /--reviewed/);
});
test('malformed and failed imports preserve current; failures stay outside web bundle', async () => {
  const s = await setup(); try {
    await assert.rejects(publishNews(await s.put({ ...digest(), unexpected: true }), true, s.dir), /Invalid news digest/);
    const failed = { ...digest([]), status: 'failed', sourceFailures: [{ url: null, reason: 'Timeout' }] };
    await assert.rejects(publishNews(await s.put(failed), true, s.dir), /Failed digest/);
    assert.deepEqual(await s.get(), bundle);
  } finally { await rm(s.root, { recursive: true }); }
});
test('news merges canonical duplicate URLs, corrections supersede, rollback restores', async () => {
  const s = await setup(); try {
    const first = await publishNews(await s.put(digest()), true, s.dir);
    const duplicate = { ...item, eventKey: 'event-two', primarySource: { ...item.primarySource, url: `${item.primarySource.url}?utm_source=test#anchor` } };
    const second = await publishNews(await s.put(digest([duplicate])), true, s.dir);
    assert.equal(second.news.length, 1); assert.equal(second.news[0].eventKey, 'event-two');
    const correction = { ...item, eventKey: 'correction', supersedesEventKey: 'event-two', primarySource: { ...item.primarySource, url: 'https://example.com/correction' } };
    assert.equal((await publishNews(await s.put(digest([correction])), true, s.dir)).news.length, 1);
    assert.deepEqual(await rollback(first.revision, s.dir), first);
    await assert.rejects(rollback('../current', s.dir), /Invalid revision/);
  } finally { await rm(s.root, { recursive: true }); }
});
test('partial digest only merges confirmed items and preserves old news', async () => {
  const s = await setup(); try {
    await publishNews(await s.put(digest()), true, s.dir);
    const partial = { ...digest([{ ...item, eventKey: 'vendor-claim', confidence: 'vendor-claim', primarySource: { ...item.primarySource, url: 'https://example.com/claim' } } as NewsItem]), status: 'partial', sourceFailures: [{ url: null, reason: 'Unavailable feed' }] };
    const result = await publishNews(await s.put(partial), true, s.dir);
    assert.equal(result.news.length, 1); assert.equal(result.news[0].eventKey, item.eventKey);
  } finally { await rm(s.root, { recursive: true }); }
});
test('single writer rejects concurrency and releases lock after exceptions', async () => {
  const s = await setup(); try {
    await assert.rejects(withPublishLock(s.dir, async () => { await assert.rejects(withPublishLock(s.dir, async () => undefined), /Another publisher/); throw new Error('abort'); }), /abort/);
    await withPublishLock(s.dir, async () => undefined);
  } finally { await rm(s.root, { recursive: true }); }
});
test('semantic validation rejects duplicate, future and unsafe sources', () => {
  assert.throws(() => validateDigest(digest([item, item])), /Duplicate/);
  assert.throws(() => validateDigest({ ...digest(), generatedAt: '2999-01-01T00:00:00Z' }), /chronological/);
  assert.throws(() => validateDigest(digest([{ ...item, primarySource: { ...item.primarySource, url: 'file:///etc/passwd' } }])), /Invalid news digest/);
});
test('oversize imports and malformed catalog leave published bytes unchanged', async () => {
  const s = await setup(); try {
    const before = await readFile(path.join(s.dir, 'current.json'), 'utf8');
    await writeFile(s.file, ' '.repeat(1024 * 1024 + 1));
    await assert.rejects(publishNews(s.file, true, s.dir), /1 MiB/);
    await assert.rejects(publishCatalog(await s.put({ ...bundle, extra: 'unknown' }), true, s.dir));
    assert.equal(await readFile(path.join(s.dir, 'current.json'), 'utf8'), before);
  } finally { await rm(s.root, { recursive: true }); }
});
test('reviewed catalog replaces catalog records while preserving published news', async () => {
  const s = await setup(); try {
    await publishNews(await s.put(digest()), true, s.dir);
    const result = await publishCatalog(await s.put(bundle), true, s.dir);
    assert.deepEqual(result.news, [item]); assert.deepEqual(result.models, bundle.models);
  } finally { await rm(s.root, { recursive: true }); }
});
test('starter guidance upgrade is reviewed, additive, idempotent, and reversible', async () => {
  const s = await setup();
  try {
    const terra = starterBundle().models.find(model => model.id === 'terra-low')!;
    const custom = { ...terra, guidance: { marketing: { ...terra.guidance.marketing!, example: 'Custom company wording' } } };
    await publishNews(await s.put(digest([{ ...item, tags: ['creative-tools', 'business-productivity'] }])), true, s.dir);
    const old = await publishCatalog(await s.put({ ...bundle, models: [custom] }), true, s.dir);
    await assert.rejects(upgradeStarterGuidance(false, s.dir), /--reviewed/);
    const updated = await upgradeStarterGuidance(true, s.dir);
    assert.notEqual(updated.revision, old.revision);
    assert.deepEqual(updated.news, old.news);
    assert.equal(updated.models[0].guidance.marketing?.example, 'Custom company wording');
    assert.ok(updated.models[0].guidance.presentations);
    assert.ok(updated.models.some(model => model.image));
    assert.equal((await upgradeStarterGuidance(true, s.dir)).revision, updated.revision);
    assert.deepEqual(await rollback(old.revision, s.dir), old);
  } finally { await rm(s.root, { recursive: true }); }
});

test('public releases combine reviewed news and catalog changes without using local data', async () => {
  const s = await setup();
  try {
    const release = path.join(s.root, 'public.json');
    await writeFile(release, 'null\n');
    const first = await readPublicRelease(release);
    const candidate = await s.put(digest());
    await assert.rejects(preparePublicRelease('news', candidate, false, release), /--reviewed/);
    assert.equal(await readFile(release, 'utf8'), 'null\n');

    const result = await preparePublicRelease('news', candidate, true, release);
    assert.equal(result.changed, true);
    const published = await readPublicRelease(release);
    assert.deepEqual(published.models, first.models);
    assert.deepEqual(published.news, [...first.news, item]);
    assert.deepEqual(await preparePublicRelease('news', candidate, true, release), { changed: false, revision: result.revision });
    const before = await readFile(release, 'utf8');
    await assert.rejects(preparePublicRelease('news', await s.put({ ...digest([]), status: 'failed' }), true, release));
    await assert.rejects(preparePublicRelease('catalog', await s.put(bundle), true, release), /must contain models/);
    assert.equal(await readFile(release, 'utf8'), before);

    const models = [{ ...first.models[0], description: 'Updated public guidance for this test.' }, ...first.models.slice(1)];
    await preparePublicRelease('catalog', await s.put({ ...first, models }), true, release);
    const updated = await readPublicRelease(release);
    assert.deepEqual(updated.models, models);
    assert.deepEqual(updated.news, published.news);
    assert.deepEqual(await s.get(), bundle);
  } finally {
    await rm(s.root, { recursive: true, force: true });
  }
});
