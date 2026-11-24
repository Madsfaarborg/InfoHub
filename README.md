# InfoHub

A locally hosted guide that helps colleagues choose an AI model and its thinking settings for a real work task.

The intended audience is a consulting and managed service provider team working across network infrastructure, cybersecurity, automation, and customer delivery. InfoHub turns repeated model research into shared, practical guidance.

**Status:** planning and repository setup. The Next.js application has not been scaffolded, built, or deployed.

Confirmed direction:

- English interface, locally hosted, no sign-in.
- Next.js, with a simple Docker deployment planned.
- Generous whitespace, restrained Apple-inspired interactions, and an uncluttered interface.
- Porcelain and graphite as the primary colors, with a sharp vermilion accent.
- Task-based recommendations covering frontier and Qwen models, exact settings, costs, evidence, and practical examples.
- Daily relevant news plus a separate price-to-performance view.

## Build documents

- [Build plan and phase model assignments](docs/BUILD_PLAN.md)
- [Design direction and screen behavior](docs/DESIGN.md)
- [Data, recommendations, and publishing](docs/DATA_MODEL.md)
- [Model selection and subagent workflow](docs/AGENT_WORKFLOW.md)
- [Daily research prompt](prompts/daily-news.md)

The project-local design skills are in [.agents/skills](.agents/skills). Versions and attribution are recorded in [design-skills.lock.json](design-skills.lock.json) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Repository boundaries

The workspace's original AGENTS.md and sources directory are synced reference material. They remain untouched and are excluded from version control.

The configured upstream is [Madsfaarborg/InfoHub](https://github.com/Madsfaarborg/InfoHub). It was public and empty when inspected on 24 November 2026. Keep credentials, client material, internal observations, fetched datasets, and operational news bundles in ignored local storage. Commit only reviewed public content, safe fixtures, code, and documentation.

## First implementation milestone

Build the homepage, one complete Coding category, the model-and-settings data contract, and a working local task search. Prove the recommendation experience before extending charts and automation.

Read the build and design documents before implementation. The daily research prompt is ready to use, but its file importer and automated publishing are future build work.
