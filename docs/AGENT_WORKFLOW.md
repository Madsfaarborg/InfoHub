# Build models and subagent workflow

Use the least expensive capable worker for each bounded task, then verify the result at the integration boundary. Model choice is a working allocation policy; actual savings depend on the account's rates, token use, retries, and elapsed time.

The phase-by-phase assignments are in [Build plan](BUILD_PLAN.md). This file makes those assignments actionable.

## Available model mapping

These exact identifiers were exposed by this session's subagent tools on 24 November 2026. Recheck availability when a future build starts.

| Plan name | Runtime identifier | Default use in this build |
| --- | --- | --- |
| 6-Astra | gpt-6-astra | High, only for a complex architecture decision, difficult cross-system bug, or unusually complex review |
| Sol 6.2 | gpt-6.2-sol | Medium: ordinary implementation; high: recommendation logic, integration, difficult UI |
| Sol 6.1 | gpt-6.1-sol | Low: mechanical documentation/configuration; medium: bounded research, fixtures, copy, import transforms |
| Terra 6.1 | gpt-6.1-terra | Medium: visual inspection and browser interaction checks; high only for an unresolved visual problem |

Do not use xhigh by default. Escalate a specific unresolved problem after two focused attempts or evidence of an architectural issue. First improve the reproduction case and instructions. High effort is not automatically necessary for every file.

The session supports choosing a model for a newly spawned subagent. It does not expose a tool here to switch the already-running parent model. If the parent's selected model differs from a phase recommendation, delegate the bounded implementation to the recommended worker and retain integration ownership. Do not claim that Autopilot guarantees model switching or a lower bill.

## Delegation rules

- At most three active subagents alongside the coordinator; normally use only one or two.
- Delegate only independent work with a concrete result. Do not run several agents on the same question without a reason.
- Give each writer a non-overlapping file set. One coordinator owns dependencies, the lockfile, shared schemas, and integration.
- For an explicit model override, start with fresh context using fork_turns = none and supply the relevant brief, instructions, files, and acceptance criteria.
- Read-only research and review agents do not edit.
- A worker returns files changed, validation performed, unresolved questions, and evidence. The coordinator checks the result before integrating.
- No worker pushes, deploys, changes credentials, or edits synced source files as a side effect of its assignment.
- Keep keys and internal/customer content out of prompts and committed fixtures.

## Concrete assignment brief

Use this shape for a worker:

~~~text
Task: Implement one bounded feature from the InfoHub plan.
Model: The explicit runtime identifier and thinking level for this phase.
Context: English, locally hosted, no sign-in; Next.js; generous whitespace.
Read first: workspace AGENTS.md and the relevant docs/design skills.
Ownership: Exact writable files or directories.
Inputs: Existing schema, component interfaces, approved source material.
Deliverable: Observable behavior and any output files.
Acceptance: A small list of checks that prove the feature works.
Constraints: No changes outside ownership; no pushes/deployments; sources read-only.
Return: Changes, checks/results, assumptions, and remaining issues.
~~~

Example dispatch through the available agent tool, not application code:

~~~json
{
  "task_name": "news_copy_and_fixtures",
  "fork_turns": "none",
  "model": "gpt-6.1-sol",
  "reasoning_effort": "medium",
  "message": "Read the workspace AGENTS.md, docs/DATA_MODEL.md, and prompts/daily-news.md. Own only tests/fixtures/news/. Add safe fixtures for a normal digest, duplicate story, failed fetch, and no-news day using the agreed schema. Clearly label fictional fixture content. Do not edit the schema, application, lockfile, or sources/. Return changed files and validation results. Do not push or deploy."
}
~~~

The actual coordinator must supply the absolute workspace path and confirm that the named schema and fixture location exist before dispatching this implementation task.

## Efficient work batches

After the schema is stable:

- **Sol 6.2 high:** recommendation implementation and integration.
- **Sol 6.1 medium:** scoped importer fixtures or practical task copy.
- **Terra 6.1 medium:** read-only UI checks against a running preview.

Use 6-Astra only for complex tasks. Delegate a specific complex architecture decision or persistent failure with its constraints and reproduction case. Routine implementation, research, and reviews stay with Sol or Terra.

For daily news, start with Sol 6.1 medium for source collection and structured summaries. Use Sol 6.2 medium only when source reconciliation repeatedly fails. Reserve Astra 6 high for a specific consequential ambiguity requiring careful review. Source access and factual verification remain necessary regardless of model.

## Review and cost control

Track model, thinking level, task scope, attempts, reported usage if available, and validation outcome. Do not invent dollar costs when billing rates or tool usage are unavailable.

Escalation is tied to a failure, not preference:

1. One focused retry with a corrected brief or reproduction.
2. Escalate the bounded problem from Sol 6.1 to Sol 6.2 high.
3. Use Astra 6 high for a persistent reasoning/architecture issue.
4. Return to the normal worker once the issue is understood.

Stop repeating checks after the relevant checks pass unless a new change or unresolved issue justifies another run.
