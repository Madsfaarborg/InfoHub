# InfoHub implementation guidance

Read ../docs/DECISIONS.md and ../docs/LEARNINGS.md before substantial work. Update them when a decision or reproducible finding changes how this application should be maintained.

## Product boundaries

- English, local hosting, no sign-in. Keep browser readers separate from the host-side publishing tool.
- Task search stays in browser memory. Do not send task descriptions to providers, logs, URLs, or analytics.
- Recommend a real model, provider, and supported settings together. Label editorial fit, provider facts, and measured evidence separately.
- Never invent current model prices, benchmark scores, or news. Preserve source links and check dates.
- Local Qwen requires a configured deployment; do not portray an unconfigured model as ready to use or free.
- Unknown or stale cost is not zero. Never ignore a local-only constraint.
- Match image models to the requested workflow and keep image output rates, credits, and local infrastructure separate from language token costs. Record the size, quality, region, and source that apply.
- Add bundled guidance to existing published catalogs through the reviewed additive upgrade. Preserve team content and validate both older and current bundle formats.

## Design

- Generous whitespace is a user requirement. Keep the main action obvious, explanation text short, and secondary information expandable.
- Use the recorded porcelain/graphite/vermilion palette and system fonts.
- Read the installed apple-design, emil-design-eng, and unslop skills when changing UI.
- Prefer semantic HTML, visible focus, keyboard support, and reduced motion. Use plain CSS tokens; avoid a dependency for a simple control.

## Engineering

- Keep filesystem reads and publishing out of client components.
- Validate operational content before publishing. Writes belong to the local CLI, not unauthenticated web routes.
- Keep dependencies pinned, single-owner shared contracts, and isolated subagent file ownership.
- Reserve 6-Astra for complex tasks. Use Sol for routine implementation, content, tests, and reviews, and use Terra when visual inspection is the main task.
- Run type checks, meaningful core/import tests, and the production build after relevant changes; verify user flows in the browser.
- Record limits honestly. A prepared Dockerfile is not evidence that the container has been run.

The root AGENTS.md and sources directory are synced reference material and must remain untouched.
