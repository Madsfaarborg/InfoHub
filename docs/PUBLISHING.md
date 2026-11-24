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

# GitHub and Vercel publishing

Research runs produce candidates for editorial review. A reviewed daily digest or a catalog update based on the weekly memo can then ship as a content-only pull request. The public website builds the Git-tracked `src/content/public-release.json`. A local server with an existing `current.json` continues to use its local catalog. An empty public release starts from the bundled guides.

1. Review the candidate and its sources before creating a public branch. Commit only reviewed, public-facing material. Keep raw digests, research memos, client information, credentials, and licensed Artificial Analysis exports out of the public repository, including draft pull requests.
2. Start from the latest `main`. For daily news, run `npm run content -- prepare-release news /absolute/path/digest.json --reviewed`. A failed digest leaves the release unchanged. An unchanged digest produces no commit.
3. For weekly changes, run `npm run --silent content -- show-release > /absolute/path/catalog.json`. Edit the approved model settings, guidance, prices, or benchmark records using the cited evidence. Run `npm run content -- prepare-release catalog /absolute/path/catalog.json --reviewed`. This replaces the catalog and keeps published news. Use the latest catalog as the starting point if another release merged while you worked. After the first public release, edits to starter files apply to the public site when incorporated into a public catalog release.
4. Inspect the diff and commit only `src/content/public-release.json`. Push a branch and open a pull request to `main` through GitHub or a repository-authorized runner. If using a separate publishing automation, supply explicitly approved input to it. Keep the web research runner read-only.
5. Wait for **Validate InfoHub**. GitHub installs the locked dependencies and runs `npm run ci`, which validates the published content, checks types, runs the full test suite, builds the app, and starts the production build to verify its routes, release revision, model counts, and published headlines. The same command works locally.
6. Merge the reviewed pull request once the required check passes. If GitHub auto-merge is enabled for the repository, the reviewer can enable it on that pull request and GitHub will merge when requirements are satisfied. When the repository is connected to Vercel with `main` as the Production Branch, this starts the production build. Vercel repeats the release checks through `vercel.json` and serves the new build only after they succeed.

To set up the merge gate, require a pull request and the **Validate InfoHub** status from GitHub Actions in a rule targeting `main`. Require the branch to be current and leave bypass disabled. This checks the combined result when daily and weekly edits are in flight. No Vercel token is needed in GitHub Actions for this setup.

To reverse a bad public content release, open a pull request reverting its commit. The correction runs through the same check and deploy process. If Vercel's immediate rollback is used, verify production domain assignment before expecting later merges to go live.

## Scheduled publishing

Point both automations at a local or managed checkout of `Madsfaarborg/InfoHub` with web search, Git, Node 22, npm, and an authenticated GitHub CLI. Start each run on current `main`, with an authenticated Git remote for pushes and a Git author linked to the Vercel account. Set up credentials in the runner rather than in its prompt or in the repository. In Codex, allow the runner to execute the publishing command with filesystem and network access. If the automation only returns chat text, it can still research, but it needs a repository-capable runner to ship.

Replace the existing automation prompt with the corresponding instructions below. Keep the schedule and model settings already configured.

### Daily runner instructions

> Run the daily frontier news automation in the InfoHub repository. Read and follow the Reusable prompt in `prompts/daily-news.md` from current `main`. Enable scheduled publishing for this run. Use the repository publishing command with the verified public digest. Report the resulting pull request link, no-change outcome, or blocker.

### Weekly runner instructions

> Run the weekly model review in the InfoHub repository. Read and follow the Reusable prompt in `prompts/weekly-model-review.md` from current `main`. Enable scheduled publishing. Generate a private catalog from `npm run --silent content -- show-release`, evaluate the evidence and apply qualifying findings to that catalog. Run `npm run content:ship -- catalog /absolute/path/catalog.json --publish` when qualifying changes exist. The command creates a pull request and enables auto-merge after the required checks. Keep the research memo private. Report the pull request, a specific reason no finding qualified, or the exact blocker. Do not create a memo-only pull request.

Both runners use `npm run content:ship`. It prepares the candidate from a fresh checkout, runs the full release suite locally, commits only the public snapshot, pushes a new branch, opens a pull request, and enables auto-merge. GitHub repeats the release suite and requires the pull request to be up to date with `main`. Vercel Git integration builds the resulting `main` commit and repeats the checks before publishing it. No Vercel token or new GitHub Actions secret is required. Use `--check-only` in place of `--publish` to rehearse without creating a commit or pull request.

Unattended daily releases accept confirmed items. Failed, unchanged, and vendor-claim-only scans produce no release. Unattended weekly releases require the current catalog revision, so an older report cannot replace newer catalog edits. If simultaneous releases leave a pull request out of date or conflicted, rerun the affected candidate against current `main`; review and close the superseded pull request. Raw digests, weekly memos, and private source notes stay outside Git.
