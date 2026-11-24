# InfoHub build plan

Prepared 24 November 2026.

Build a self-hosted Next.js application that answers: **Which model, at which thinking setting, should I use for this task—and why is it worth the cost?**

The hub should save colleagues from repeating the research its maintainer already does. A successful visit ends with a practical choice, an example of when it fits, and a clear reason to spend more only when necessary.

## Confirmed scope

- English, locally hosted, no sign-in or user accounts.
- Audience: consulting/MSP colleagues working on networking, cybersecurity, coding, automation, and client documentation.
- An approachable homepage with a task search, a few useful shortcuts, and recent relevant news.
- Task categories with three price bands where evidence supports them.
- A recommendation identifies the model, provider or tool, and exact supported thinking settings.
- Each recommendation has three to six short lines of practical guidance.
- Frontier and Qwen models are first-class options.
- A separate comparison view explains price, performance, speed, and tradeoffs.
- Daily research uses the supplied prompt; publishing follows a defined validation process.
- Generous whitespace is a requirement. More information should be available on demand without crowding the first view.
- Apply Emil Kowalski's design guidance and Unslop.

This stage delivers the plan, Git setup, and pinned design guidance. Application implementation follows this plan.

## Product structure

### Start page

Use the headline “Choose the right model for the job” above a single prominent field labeled “What do you need to get done?”

Example inputs:

- “Write a small PowerShell script to summarize device inventory”
- “Debug an intermittent failure in our deployment script”
- “Help compare two network migration approaches”
- “Turn sanitized incident notes into a customer update”

Show six task shortcuts underneath: Coding, Debugging, Networking, Cybersecurity, Research, and Writing. Keep a compact “Latest for your work” news section below the main task area, with three recent items and a link to all news.

Do not turn the homepage into a grid of metrics. The recommendation is the main job; news supports it.

### Task results and category pages

Offer three clear bands:

1. **Everyday:** routine, well-defined tasks; start here when it meets the need.
2. **Balanced:** harder work where extra reasoning is useful.
3. **Deep work:** complex debugging, architecture, or difficult analysis that justifies more time and spend.

Highlight one “Recommended for this task” result. Three is a maximum, not a quota: show fewer when there are not three defensible choices. Keep a Qwen/local option visible when it actually meets the task and deployment requirements.

Each result contains:

- Model + tool/provider + supported thinking setting.
- Best-fit description in plain language.
- One realistic MSP example.
- A limitation or condition that changes the choice.
- A reason to step up or step down.
- Cost basis, evidence type, and last review date.

“Why this choice?” expands the evidence and practical notes. “Open tool” appears only when a real destination is configured. “Copy settings” produces a useful setup instruction; the hub does not execute the user's work.

### Model detail

Show the model's settings, provider variants, strengths by task, caveats, supported context/tool capabilities, source links, and change history. Keep measured results separate from maintainer observations and vendor claims.

The user's examples about Sol at high versus xhigh, Astra's investigative behavior, and expensive models on simple work are **editorial hypotheses to capture and test**, not facts to publish without attribution. Do not infer why a model behaves a certain way from anecdotes.

### Compare

Provide task-relevant charts with exact setting labels, visible units, dates, and source links. Start with cost versus quality; offer latency or throughput as separate views. Allow a table view and a focused comparison of two to four variants.

### News

Provide short, source-linked updates for colleagues: what changed, why it affects their work, and what action—if any—is useful. Filters cover Models and pricing, Coding tools, Networking, Cybersecurity, and Microsoft/cloud operations.

## Implementation architecture

Use Next.js App Router, TypeScript, and a patched stable release selected and pinned when implementation starts. Use server-rendered pages for content and small client components for search, filtering, and charts. Tailwind CSS is a reasonable styling choice; use CSS variables for the design tokens and accessible primitives for interactive controls.

Deploy one Next.js Node server in a multi-stage Docker image using standalone output. Include public assets and static build assets explicitly. Docker Compose mounts a published data directory read-only into the web container. This follows Next.js's documented [self-hosting](https://nextjs.org/docs/app/guides/self-hosting) and [standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) patterns.

Use a file-based catalog and published snapshot for v1. A database, vector search, Redis, and a model gateway are unnecessary for the initial workload. Define a repository interface so storage can change later without rewriting recommendation logic.

The data path is:

~~~text
Official sources / permitted benchmark API / maintainer observations
                              |
                   local staging and validation
                              |
                 reviewed, atomic published snapshot
                              |
                 Next.js read-only local application
                              |
                colleague's browser and local search
~~~

Keep colleague task text in the browser. The default search uses a curated vocabulary and deterministic matching, with task chips and one optional clarification. It makes no model API call and does not put the user's free text in URLs, access logs, or analytics.

An optional local Qwen classifier can be evaluated later if matching tests show a real need. It may classify a task into known fields; it must not invent model recommendations or write the catalog. Self-hosting InfoHub does not require hosting a model.

Content maintenance happens through files and a local command-line importer. There is no unauthenticated browser editor or remotely exposed publishing endpoint. Ordinary readers need no sign-in. Restrict deployment to the intended local network; local-only operation is a deployment boundary, not a user account feature.

## Phases and execution models

The assignments below are execution recommendations, not benchmark claims about these models. The exact available runtime identifiers and delegation rules are in [Agent workflow](AGENT_WORKFLOW.md). “Astra 6” means gpt-6-astra; do not silently substitute Astra 6.2.

| Phase | Lead model and thinking | Bounded subagents | Deliverable and acceptance |
| --- | --- | --- | --- |
| 0. Plan and repository | Sol 6.2 · medium | Sol 6.1 · medium for source/skill research | Git initialized, remote set, plan and daily prompt saved, design skills pinned; synced files untouched |
| 1. Screen design and working prototype | Sol 6.2 · high | Terra 6.1 · medium for visual review | Homepage, one category, and a result detail work with clearly labeled fixtures; whitespace, focus states, mobile layout, and visual direction checked |
| 2. Next.js and local deployment foundation | Sol 6.2 · medium | Sol 6.1 · low for runbook and configuration documentation | Pinned dependencies, scripts, CI build/type checks, standalone Docker build, local launch and health check |
| 3. Catalog and recommendation engine | Sol 6.2 · high | Sol 6.1 · medium for schema fixtures and test cases; Astra 6 · high for one bounded rules review | Exact model/settings identities, evidence and freshness rules, constraints and ranking; curated task cases pass |
| 4. Task search and guidance screens | Sol 6.2 · high | Sol 6.1 · medium for practical copy; Terra 6.1 · medium for interaction testing | Free text, category shortcuts, editable interpretation, tiers, cost explanation, and copy/open actions work end to end |
| 5. Price-to-performance comparisons | Sol 6.2 · high | Sol 6.1 · medium for normalization fixtures; Terra 6.1 · medium for chart readability | Comparable evidence only, correct units/cost arithmetic, missing-data handling, accessible table, and attribution |
| 6. Daily news and content publishing | Sol 6.2 · medium | Sol 6.1 · medium for research output fixtures and editorial checks | Daily prompt contract, deduplication, staged review, safe rendering, atomic updates, and failure recovery verified |
| 7. Local release and pilot | Sol 6.2 · high | Terra 6.1 · medium for browser QA; Astra 6 · high for a targeted edge-case/security review | Complete Docker flow, restore/rollback drill, keyboard/mobile checks, pilot task validation, and operating runbook |

Phases 1 and 2 are closely coupled; keep one owner for the application shell and dependencies. After phase 3's data contract is stable, charts and news can be delegated independently with separate file ownership. Integrate and test the complete flow in phase 7.

The first useful milestone is phases 1–4 with a small verified catalog. Full v1 includes charts, the daily news path, and the local release checks. Do not delay the recommendation experience for a large model directory.

### Phase 1 details

Read the installed apple-design and emil-design-eng skills before UI work. Use the five-line direction and whitespace rules in [Design](DESIGN.md). Build a functional prototype with clearly marked demonstration content; do not present invented model rankings or current prices.

Apply Unslop after screens exist, following its ordered passes. Resolve differences between skill defaults using the explicit product brief: this is a quiet internal work tool, with generous spacing, a short search hero, and restrained motion.

### Phase 2 details

Use a single application at the repository root. Pin Node and the package manager, commit the lockfile, and create a minimal environment example without secrets. Use local/system fonts so runtime rendering does not depend on external font services.

The future container reads published content from /app/data. The host-side publisher owns writes. Include a health endpoint and distinguish an unavailable initial catalog from an optional failed news refresh.

### Phase 3 details

Implement schema validation and recommendation logic before the full catalog. Start with 6–10 verified model/settings/provider variants spanning the team's available frontier tools and Qwen options. Confirm real provider IDs and supported settings from primary documentation at population time.

Use 20–30 sanitized, representative tasks spanning simple scripts, ambiguous requests, debugging, network design, incident summaries, research, and customer writing. Define expected categories, eligible settings, and reasons to escalate before tuning search.

### Phase 4 details

Show the interpreted task and priority so the user can correct them. Support a short ambiguous input without pretending to know its intent. A follow-up should be a simple choice such as “Write new code” or “Debug an existing problem.”

Local-only requirements and availability are hard filters. If nothing qualifies, explain the mismatch and let the user adjust the requirement; do not silently recommend a hosted model.

### Phase 5 details

Start with one meaningful chart. Never combine unlike benchmark versions into a single ranking. Thinking effort is part of each point's identity. If token use or pricing is missing, display “Cost unavailable,” not zero.

Use the [Artificial Analysis API documentation](https://artificialanalysis.ai/api-reference) and [Data API docs](https://artificialanalysis.ai/data-api/docs) to confirm field coverage and permitted integration. Retain attribution and check the organization's access against the [Data Platform Terms](https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf) before importing. Until access is established, ship the importer boundary and verified alternative evidence or local evaluations; do not scrape around unavailable access.

### Phase 6 details

Use [the daily research prompt](../prompts/daily-news.md) to produce reviewable structured candidates. Run ingestion outside the web request process. A local scheduler or the user's existing automation can supply the file.

Recommend one run each weekday or day at 07:00 Europe/Copenhagen, configurable by the owner. This is a scheduling suggestion; no automation is created by this planning stage.

Start with manual promotion of candidates into the published snapshot. Automatic promotion of ordinary news can be enabled later with the same validation rules. Changes to model recommendations, supported settings, or cost claims require evidence review.

### Phase 7 details

Verify the full route from a published bundle to a search result, comparison, and news item. Test a broken source fetch, malformed import, duplicate run, empty news day, stale catalog, removed model, and interrupted publication.

Pilot with five colleagues using their own sanitized tasks. Proposed acceptance target: at least four can select a suitable model and setting within one minute without help and explain why the more expensive choice is or is not needed. This is a target to measure, not a promised result.

## Quality gates

- Every published recommendation has a real variant ID, source or attributed observation, review date, example, limitation, and escalation reason.
- Every price states provider, currency, units, access route, and date.
- No news claim is published from an inaccessible or unverified source.
- Search and browsing work without external AI services.
- No confidential prompts, client details, keys, licensed datasets, or local operational bundles enter Git.
- Keyboard navigation, visible focus, text zoom, reduced motion, and an accessible chart alternative work.
- Main screens are checked at 390 px, 768 px, and 1440 px widths. No unintended horizontal scrolling.
- Measure local page performance on representative hardware; target a usable first screen within two seconds and near-instant local filtering. Record the measurement conditions.
- Production build, type checks, targeted recommendation/import tests, and complete browser flows pass. Avoid tests that merely duplicate component markup.
- A restart preserves content; failed imports leave the last good snapshot; a backup can actually be restored.

## Decisions deferred to implementation

Only a few details require later configuration: the local host address, available company tools/providers, any internal Qwen deployment, the benchmark-data entitlement, and the news automation's output location. None blocks building the initial local prototype with honest demonstration content.

Do not add accounts, billing, chat execution, arbitrary uploads, autonomous remediation, or a broad administration portal to v1.
