# Data and recommendation contract

InfoHub publishes practical guidance with visible provenance. A model name alone is not enough to support a recommendation.

## Records

Use stable internal IDs and validate every import. Keep the following entities separate even if v1 stores them together in a JSON bundle.

| Entity | Required information |
| --- | --- |
| Model | Internal ID, developer, exact model/version, display name, provider IDs, capabilities, status |
| Variant | Model ID, access route/provider, exact thinking controls, supported tool/context settings, hosted/local mode, availability |
| Price snapshot | Variant, currency, input/output/cached-input units and prices, applicable tiers, source, effective and retrieval dates |
| Evidence | Variant, source type, source URL or internal observation reference, task, result, date, limitations |
| Benchmark result | Evidence ID, benchmark name/version, metric/units/direction, exact settings, evaluation environment and date |
| Task guidance | Category, subtask, complexity, candidate variants, fit explanation, practical example, limitations, escalation rule, optional preferred variant within its tier |
| Maintainer observation | Author, observation date, task context, variant/settings, observed behavior, confidence, review date |
| News candidate | Structured digest item as defined in the news schema, with evidence links and publication state |
| Published bundle | Schema version, content revision, generated time, previous revision, validated records and editorial decisions |

Preserve aliases for search, but never merge distinct providers, revisions, quantizations, or thinking settings solely because their display names look similar.

Image variants use an optional `image` record with workflow-specific guidance, a draft brief, an optional USD output estimate, and a named billing basis. Their language-token rates are null. An image estimate describes a specific output size and quality or another documented basis. Older language-only bundles remain valid.

### Thinking controls

Store provider-specific controls as validated key/value settings plus a readable explanation. Keep “unspecified,” “unsupported,” and “unknown” distinct.

Do not equate every vendor's “high” setting. One provider may expose an effort enum, another a token budget, and a local Qwen setup a thinking switch. Some models expose no adjustable control. Verify the exact version and serving stack before showing a setting.

Qwen's [vLLM documentation](https://qwen.readthedocs.io/en/latest/deployment/vllm.html) demonstrates version-specific serving and thinking controls. Treat this as a reason to store the deployment configuration, not evidence that every current Qwen model has identical controls.

For a local model, also record quantization, hardware, serving engine/version, context configuration, and test concurrency. “Qwen” alone is not a reproducible test condition.

## Evidence and editorial judgment

Use four visible evidence labels:

- **Independent benchmark:** a named test, version, and published method.
- **Provider documentation:** capabilities, prices, and supported settings.
- **Team evaluation:** repeatable internal tasks with recorded conditions.
- **Maintainer observation:** attributed practical experience, with scope and date.

Vendor claims remain labeled as claims until corroborated. A small observed benchmark difference is not proof of superiority when variance or sample size is unknown.

Capture the maintainer's model quirks as structured observations. For example: “In these debugging tasks, this setting was useful when provided explicit reproduction steps.” Preserve the actual task scope instead of turning the observation into “This model is good/bad at coding.”

Initial freshness policy, adjustable by the owner:

- Prices: verify at least weekly; flag after seven days without a successful check.
- Availability/settings: review on provider changes and at least monthly.
- Task recommendations: review monthly or when material evidence changes.
- Benchmarks: retain as historical observations with their version and date.
- News: retain publication/event dates; “latest” reflects publication order, not an arbitrary freshness badge.

A failed refresh never changes a record's “last verified” date. Stale prices remain readable with a warning but are excluded from claims about the cheapest current option.

## Recommendation procedure

1. Interpret the task into category, subtask, complexity, latency preference, available tools, local-only requirement, and budget priority.
2. Let the user correct this interpretation. If ambiguous, ask one short choice or offer matching categories.
3. Apply hard constraints before ranking: supported capability, local/hosted requirement, availability, and configured organization policy.
4. Select only published task guidance backed by evidence. Do not infer a coding recommendation from an unrelated intelligence index.
5. Choose the least costly eligible variant that meets the task's recorded quality requirement. Rank by editorial fit first where comparable task evidence is missing; explain this basis.
6. Offer up to two genuinely different alternatives with clear reasons to spend more or less. Deduplicate equivalent choices.
7. Return the exact supported setting, why it fits, a practical example, the caveat, escalation trigger, and evidence dates.

Keep v1 deterministic and explainable. Do not manufacture a universal “92% match” score or average unrelated benchmark scores into a single quality score.

The starter catalog uses the optional `preferred` flag to identify an editorial first choice by category within a tier. Without that flag, the catalog order breaks ties. Neither implies measured quality or cost superiority.

Organization approval is a separate optional policy field, not something the hub can infer from provider availability. Unknown approval must not be displayed as “approved.” Local-only is a deployment constraint and does not itself certify that a model or tool is safe for every kind of data.

### Search behavior

Start with a curated vocabulary and synonyms: PowerShell, Python, Bash, Terraform, Ansible, firewall, routing, SIEM, detection, logs, incident, customer update, architecture, and research. Weight strong task cues and allow multiple categories.

Empty input shows task shortcuts. Weak or conflicting matches show a clarification. No eligible recommendation explains which constraint blocked the result. Never silently remove a local-only constraint.

Free text remains in browser memory, is not persisted, and is not sent to hosted services. Safe filter values can be shareable URL parameters; free-text task descriptions should not be included.

## Cost and chart rules

Distinguish API rates, estimated task cost, measured task cost, subscription access, and local inference cost.

For standard token billing:

~~~text
Estimated cost in USD =
  uncached input tokens × input rate / 1,000,000
  + cached input tokens × cached-input rate / 1,000,000
  + billable output tokens × output rate / 1,000,000
  + separately billed tool or request charges
~~~

Follow the provider's actual billing semantics. Do not add reasoning tokens twice when they are already included in billable output. Include retries and all attempts in measured totals. For a fixed evaluation set, cost per successful task is total billed cost divided by successfully completed tasks; zero successes makes this measure unavailable.

When only rates are known, offer a clearly labeled calculator with editable token assumptions. Do not imply that equal token assumptions measure high-versus-xhigh efficiency. That comparison needs measured runs for each setting on equivalent tasks.

Subscription plans are a different access model; do not manufacture an API price from a monthly subscription. Local Qwen has infrastructure and operating costs, even when there is no per-token invoice. Show local cost as unknown until hardware, amortization period, utilization, and power assumptions are supplied.

Chart modes:

- **Team task evaluations:** x = measured USD per task or successful task; y = task success rate (%). Include sample size, test revision, and run conditions.
- **Published benchmarks:** x = the documented cost measure; y = one specific benchmark's score in its original units. Label any synthetic price blend and keep different versions separate.
- **Speed:** latency in seconds or throughput in tokens/second, with provider, date, and workload.

Do not overlay a public benchmark index and internal task success as if they were the same unit. Show missing values as missing, keep zero distinct, and disclose log scales. A Pareto boundary is useful only among comparable points; lower cost and higher quality define it. Do not mark a point as a statistically proven winner without sufficient evidence.

Provide a table alternative and tooltips showing model, provider, thinking settings, raw value, source, and date.

## File publishing and daily operations

Planned local directories, all under ignored data:

~~~text
data/
  curated/                 Maintainer catalog, observations, policy
  inbox/news/              Raw candidate digests
  staging/                 Validated candidate content
  published/
    current.json           The active bundle
    history/               Prior complete bundles
  operations/              Run status and non-sensitive diagnostics
~~~

The repository contains schemas and safe fixtures, not real internal operational data. Store approved public seed content separately if useful.

The host-side publisher will:

1. Accept a file from an explicit local path; enforce size limits and the schema.
2. Validate dates, URL schemes, variant IDs, enums, duplicates, and required evidence.
3. Canonicalize URLs and deduplicate by event and source. Retain corrections and supersession links.
4. Hold news candidates for maintainer review initially. Keep model guidance and pricing changes separately reviewable.
5. Build a complete next bundle, preserving the previous catalog and existing news unless an explicit change replaces them.
6. Use a single-writer lock and atomic rename on the same filesystem. Keep the previous revision for rollback.
7. Expose the completed revision to Next.js within a documented maximum of 60 seconds; avoid build-time-only reads and indefinite page caches.
8. Record source failures separately. A partial or failed run cannot erase healthy content or claim a successful freshness update.

The web service mounts published content read-only and provides no ingestion route. Ingestion runs on the host or an isolated scheduled job with write access.

Render summaries as plain text or a tightly restricted content format; never execute imported HTML or instructions embedded in articles. Fetch collectors use configured source hosts, bounded responses, timeouts, and rate limits. An arbitrary colleague-supplied URL must not become a server-side fetch.

Keep a backup of curated records and published history. Verify restoring the last good bundle during release testing. Retention can begin at 30 daily snapshots, subject to storage limits and any data-source terms.

## Initial validation cases

Cover simple scripting versus complex debugging, high versus xhigh variants, provider-specific controls, local-only eligibility, an unavailable tool, no matching category, stale pricing, missing token usage, zero successful tasks, duplicate news, unknown schema fields, and source-fetch failures.

Before the main implementation, settle only the schema and observable behavior. Exact scoring weights should come from the representative task set, not invented precision.
