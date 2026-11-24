# Local content publishing

Publishing is a host-side operation. The website reads the completed `current.json`; it has no ingestion route. Imported URLs remain source links. The CLI never fetches them. Keep operational files outside the website's mounted published directory.

The default published directory is the absolute resolution of `data/published` from the working directory. Set `INFOHUB_DATA_DIR` to choose another directory, preferably an absolute path. Its sibling `operations` directory stores source failures, held news items, no-news explanations, and model review candidates. The web bundle contains only catalog records, benchmarks, and published news.

The bundle is owner-readable. When using the Docker Compose setup, set `INFOHUB_UID` and `INFOHUB_GID` to the publisher's non-root user and group IDs so the server can read the mounted file.

The [daily frontier news prompt](../prompts/daily-news.md) produces a JSON candidate for `validate` and `publish-news`. The [weekly model review](../prompts/weekly-model-review.md) produces a Markdown memo for the maintainer. Review its evidence and apply any accepted change to the catalog through the usual `publish-catalog` flow.

Run commands from the repository root:

```sh
npm run content -- init
npm run content -- add-starter-guidance --reviewed
npm run content -- validate /absolute/path/digest.json
npm run content -- publish-news /absolute/path/digest.json --reviewed
npm run content -- publish-catalog /absolute/path/catalog.json --reviewed
npm run content -- rollback REVISION
```

`init` validates and publishes the bundled language, business, and image guidance only when `current.json` does not exist. An existing current file must validate. Initialization never overwrites it.

For an existing deployment, review [the new guidance and source notes](CREATIVE_GUIDANCE.md) and run `add-starter-guidance --reviewed` to add missing starter image entries and fill empty business guidance for matching language-model IDs. Existing records, prices, custom task guidance, news, and benchmark results are preserved. This creates a normal revision that can be rolled back. Repeating the command with the same content leaves the current revision in place.

`validate` detects a digest by its `status` field; other files must be complete published bundles. Validation reads explicit local JSON files, rejects files larger than 1 MiB and unknown fields, checks schemas, dates, source schemes, duplicate events and canonical source URLs, and checks benchmark model references. Digest timestamps must satisfy window start ≤ window end ≤ generation time ≤ now. Source retrieval cannot follow digest generation; publication/event dates cannot follow its calendar date. Maintain accurate host time.

Publication requires `--reviewed`. Review the source evidence and summaries first: a schema validates structure, not truth. News claims labeled `vendor-claim` retain that label. A complete reviewed digest may publish them; a partial digest publishes only items explicitly marked `confirmed`. Other partial items stay in operations for review. A failed digest records its failure in operations and exits unsuccessfully without changing published content. Model review candidates must reference known variant IDs and never change prices, model guidance, or benchmark records automatically.

News publication merges with existing news and preserves the catalog and benchmarks. A matching event key or canonical primary URL replaces the existing item. URL canonicalization removes fragments, trailing path slashes, and common tracking parameters, then sorts query parameters. Other query parameters remain significant. A correction's `supersedesEventKey` removes the superseded active item and remains on the correction; historical bundles retain the original. Items absent from a new digest remain published. No partial or empty digest erases existing news.

`publish-catalog` accepts a complete validated published bundle and replaces its models and benchmark records. It preserves the current published news; use news publishing to update news. The publisher assigns a new revision and generation time, ignoring those supplied in the catalog after validating them. Catalog publishing requires an initialized directory.

Every write uses an exclusive `.publish.lock`. Concurrent attempts fail without changing current content. New JSON is written and synced to a temporary file on the same filesystem, then renamed atomically. The previous complete bundle is saved under `history/REVISION.json` before current changes. History files are created without replacing an existing revision. A revision collision with different content aborts publication. The 1 MiB limit also applies to the final merged bundle; archive older content through a reviewed catalog/content maintenance process before increasing this limit. There is no automatic history deletion.

# Backup and recovery

Back up the entire published directory, its sibling operations directory, and your curated source files together. For a consistent backup, pause publishing while copying; readers may continue. Store backups on another disk or backup service. Preserve at least the latest 30 known-good revisions, and remove older snapshots only after confirming a separate backup exists. History, operations, and source retention are manual in this version.

For a normal rollback, list the files in `history`, take the filename without `.json`, and run `rollback REVISION`. The CLI validates the saved bundle and its revision, saves the outgoing current revision, and atomically restores the requested bundle. Only letters, numbers, dots, underscores, and hyphens are permitted in revision IDs; paths cannot be used. Rollback restores that revision's original generation timestamp. A subsequent publication creates a fresh revision.

If current is missing or corrupted, stop the publisher and restore the whole published directory from a known-good backup, then run `validate /absolute/path/published/current.json`. Do not use `init` to repair operational data. Verify the news, models, and benchmark references in the website before resuming publishing. Test this recovery procedure against a copy of the data directory before relying on backups.

If a process crashes and leaves `.publish.lock`, confirm that no publisher process is running before removing that lock. A crash can leave an unreferenced temporary file; it can be removed after confirming no writer is active. Atomic rename protects readers from partial content; this tool is not a transactional database or a guarantee against disk or filesystem failure.
