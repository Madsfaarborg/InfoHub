import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { aaFeeds, type AaFeed } from '../src/lib/aa-catalog';
import { syncArtificialAnalysis } from '../src/lib/aa-sync';
import { withPublishLock } from '../src/lib/publish';

const apiKey = 'synthetic-secret-key-not-real';
const feeds = Object.keys(aaFeeds) as AaFeed[];
const model = (id: string, extra = {}) => ({ id, name: 'Synthetic model', slug: 'synthetic-model', model_creator: { name: 'Synthetic creator' }, ...extra });
const envelope = (data: unknown[], page = 1, total = 1) => ({ tier: 'free', data, pagination: { page, page_size: 2, total_pages: total, has_more: page < total } });
function fake(body: (feed: AaFeed, page: number) => unknown = feed => envelope([model(feed)])) {
  const requests: URL[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    requests.push(url);
    assert.equal(url.origin, 'https://artificialanalysis.ai');
    assert.equal(init?.redirect, 'error');
    assert.equal(new Headers(init?.headers).get('x-api-key'), apiKey);
    assert.ok(init?.signal);
    const feed = feeds.find(id => `/api/v2${aaFeeds[id].endpoint}` === url.pathname);
    assert.ok(feed);
    return Response.json(body(feed, Number(url.searchParams.get('page') ?? 1)));
  };
  return { fetcher, requests };
}
async function temporary(work: (directory: string) => Promise<void>) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'infohub-aa-'));
  try { await work(directory); } finally { await rm(directory, { recursive: true, force: true }); }
}

test('all feeds sync sequentially; language pagination, exact-ID dedup and variant IDs are preserved', async () => {
  await temporary(async directory => {
    const mock = fake((feed, page) => {
      if (feed === 'language') return envelope([model(page === 1 ? 'shared' : 'variant', { reasoning_model: page === 2 })], page, 2);
      if (feed === 'image') return envelope([model('shared', { name: 'Conflicting name', model_creator: { name: 'Other creator' } })]);
      if (feed === 'instrumental-music' || feed === 'vocal-music') return { tier: 'free', data: [{ id: 'music', name: 'Music variant', model_creator: { name: 'Music maker' } }] };
      if (feed === 'speech-to-text') return { tier: 'free', data: [{ id: 'transcription', name: 'Transcription variant', model_creator: { name: 'Speech maker' } }] };
      return { tier: 'free', data: [model(feed)] };
    });
    const result = await syncArtificialAnalysis({ apiKey, directory, fetcher: mock.fetcher });
    assert.equal(mock.requests.length, feeds.length + 1);
    assert.equal(mock.requests[1].searchParams.get('page'), '2');
    const shared = result.entries.find(entry => entry.id === 'shared')!;
    assert.equal(shared.name, 'Synthetic model');
    assert.equal(shared.creator, 'Synthetic creator');
    assert.deepEqual(shared.feeds, ['language', 'image']);
    assert.equal(shared.reasoning, false);
    assert.equal(result.entries.find(entry => entry.id === 'variant')?.reasoning, true);
    const music = result.entries.find(entry => entry.id === 'music')!;
    assert.equal(music.slug, null);
    assert.equal(music.reasoning, null);
    assert.deepEqual(music.feeds, ['instrumental-music', 'vocal-music']);
    assert.equal(result.entries.find(entry => entry.id === 'transcription')?.slug, null);
    const output = await readFile(path.join(directory, 'artificial-analysis.json'), 'utf8');
    assert.deepEqual(JSON.parse(output), result);
    assert.equal(output.includes(apiKey), false);
    assert.equal((await stat(path.join(directory, 'artificial-analysis.json'))).mode & 0o777, 0o600);
    assert.deepEqual(await readdir(directory), ['artificial-analysis.json']);
  });
});

test('failed later page, invalid identity and pagination never replace a prior snapshot', async () => {
  await temporary(async directory => {
    const file = path.join(directory, 'artificial-analysis.json');
    await writeFile(file, 'prior snapshot');
    const cases = [
      fake((feed, page) => feed === 'language' ? (page === 1 ? envelope([model('first')], 1, 2) : { tier: 'free', data: 'invalid' }) : envelope([])).fetcher,
      fake(feed => envelope([model(feed, { model_creator: null })])).fetcher,
      fake(feed => envelope([model(feed, { slug: undefined })])).fetcher,
      fake(feed => envelope([model(feed, { reasoning_model: 'yes' })])).fetcher,
      fake(() => ({ ...envelope([model('first')]), pagination: { page: 1, page_size: 2, total_pages: 2, has_more: false } })).fetcher,
      fake(() => ({ tier: 'free', data: [] })).fetcher,
      fake(() => envelope([])).fetcher,
      fake(() => envelope([model('echo', { name: apiKey })])).fetcher,
    ];
    for (const fetcher of cases) {
      await assert.rejects(syncArtificialAnalysis({ apiKey, directory, fetcher }));
      assert.equal(await readFile(file, 'utf8'), 'prior snapshot');
      assert.deepEqual(await readdir(directory), ['artificial-analysis.json']);
    }
  });
});

test('auth errors, network errors and malformed JSON cannot disclose response content or keys', async () => {
  await temporary(async directory => {
    for (const status of [401, 403, 429, 500]) {
      const fetcher: typeof fetch = async () => new Response(`sensitive upstream body ${apiKey}`, { status });
      await assert.rejects(syncArtificialAnalysis({ apiKey, directory, fetcher }), error => {
        assert.ok(error instanceof Error);
        assert.equal(error.message.includes(apiKey), false);
        assert.equal(error.message.includes('sensitive'), false);
        return true;
      });
    }
    for (const fetcher of [
      (async () => { throw new Error(`request headers ${apiKey}`); }) as typeof fetch,
      (async () => new Response(`invalid JSON ${apiKey}`)) as typeof fetch,
      (async () => new Response('too large', { headers: { 'content-length': String(9 * 1024 * 1024) } })) as typeof fetch,
      (async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(8 * 1024 * 1024 + 1)); controller.close(); } }))) as typeof fetch,
    ]) {
      await assert.rejects(syncArtificialAnalysis({ apiKey, directory, fetcher }), error => error instanceof Error && !error.message.includes(apiKey));
    }
    assert.deepEqual(await readdir(directory), []);
  });
});

test('publish lock blocks overlapping sync without sending requests', async () => {
  await temporary(async directory => {
    let requested = false;
    const fetcher: typeof fetch = async () => { requested = true; return Response.json(envelope([])); };
    await withPublishLock(directory, async () => {
      await assert.rejects(syncArtificialAnalysis({ apiKey, directory, fetcher }));
      assert.equal(requested, false);
    });
  });
});
