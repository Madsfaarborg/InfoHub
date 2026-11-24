# InfoHub

A locally hosted guide that helps colleagues choose an AI model and its thinking settings for a real work task.

The intended audience is a consulting and managed service provider team working across network infrastructure, cybersecurity, automation, and customer delivery. InfoHub turns repeated model research into shared, practical guidance.

**Status:** the local pilot covers technical, creative, and business work. Search for image creation, marketing and sales, presentations, spreadsheets, and the original technical categories. The starter catalog includes 10 language-model settings and seven image configurations, with sources, suggested settings, and a local publishing tool.

Confirmed direction:

- English interface, locally hosted, no sign-in.
- Next.js with standalone Node and Docker launch options.
- Generous whitespace, restrained Apple-inspired interactions, and an uncluttered interface.
- Porcelain and graphite as the primary colors, with a sharp vermilion accent.
- Task-based recommendations covering frontier and Qwen models, exact settings, costs, evidence, and practical examples.
- A reviewable daily news workflow and a separate price-to-performance view.

## Run locally

Use the Node version in `.nvmrc`, then run:

```sh
npm ci
npm run build
npm start
```

Open [InfoHub on this computer](http://127.0.0.1:3000). This launch binds to loopback. For development with live updates, use `npm run dev`.

To start with Docker, run these commands as the non-root account that will publish content:

```sh
npm run content -- init
INFOHUB_UID="$(id -u)" INFOHUB_GID="$(id -g)" docker compose up --build
```

Docker also binds to loopback by default. For colleagues on an intended private network, set `INFOHUB_BIND` to the server's private IP and restrict access using the host's network controls. There is no sign-in.

The app reads the reviewed bundle at `data/published/current.json`. It serves the public starter catalog when the file is absent. Follow the [publishing runbook](docs/PUBLISHING.md) to prepare content, publish updates, and roll back.

Run the [weekly model review](prompts/weekly-model-review.md) to revisit recommendations and the [daily frontier news scan](prompts/daily-news.md) to collect news candidates. Enable web search and save their outputs for review.

For an existing published catalog, use `npm run content -- add-starter-guidance --reviewed` after reviewing the [creative and business guidance](docs/CREATIVE_GUIDANCE.md). This adds the new entries and preserves your existing records.

The task finder shows up to three curated choices with exact settings. The model catalog also links to a wider directory that can load [authorized Artificial Analysis data](docs/ARTIFICIAL_ANALYSIS.md).

Verify changes with `npm run typecheck`, `npm test`, and `npm run build`.

## Build documents

- [Build plan and phase model assignments](docs/BUILD_PLAN.md)
- [Design direction and screen behavior](docs/DESIGN.md)
- [Data, recommendations, and publishing](docs/DATA_MODEL.md)
- [Model selection and subagent workflow](docs/AGENT_WORKFLOW.md)
- [Weekly model review prompt](prompts/weekly-model-review.md) and [daily frontier news prompt](prompts/daily-news.md)
- [Starter catalog sources](docs/CONTENT_SOURCES.md)
- [Decisions](docs/DECISIONS.md), [learnings](docs/LEARNINGS.md), and [implementation guidance](src/AGENTS.md)

The project-local design skills are in [.agents/skills](.agents/skills). Versions and attribution are recorded in [design-skills.lock.json](design-skills.lock.json) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Repository boundaries

The workspace's original AGENTS.md and sources directory are synced reference material. They remain untouched and are excluded from version control.

The configured upstream is [Madsfaarborg/InfoHub](https://github.com/Madsfaarborg/InfoHub). It was public and empty when inspected on 24 November 2026. Keep credentials, client material, internal observations, fetched datasets, and operational news bundles in ignored local storage. Commit only reviewed public content, safe fixtures, code, and documentation.

## Pilot scope

The starter recommendations are editorial and use dated provider sources for settings and rates. The cost calculator uses editable token assumptions. Populate measured results from a compatible benchmark or an MSP task evaluation before using the measured comparison view. Local Qwen entries require a configured model deployment. The daily prompt and importer are ready for the owner's scheduler.
