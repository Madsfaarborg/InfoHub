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
- Keep model discovery separate from the maximum of three curated task picks. An imported identity or benchmark label does not verify provider access, thinking controls, or task fit.
- Keep Artificial Analysis retrieval on the host command. Use only documented feeds and preserve visible attribution, source coverage notes, and the separation from published task guidance.

## Design

- Generous whitespace is a user requirement. Keep the main action obvious, explanation text short, and secondary information expandable.
- Use the recorded porcelain/graphite/vermilion palette and system fonts.
- Read the installed apple-design, emil-design-eng, and unslop skills when changing UI. Also use design-taste-frontend or impeccable when relevant to the requested design work; preserve InfoHub's existing product identity and the user's instructions if an upstream default conflicts.
- Prefer semantic HTML, visible focus, keyboard support, and reduced motion. Use plain CSS tokens; avoid a dependency for a simple control.

## Engineering

- When a solution is ready for the owner to test in preview and consider for production, commit the relevant changes, push the branch, and open a pull request without waiting to be asked. Include the pull request and preview links when available; report any blocker or incomplete validation. Do not merge or deploy to production unless authorized.
- Keep filesystem reads and publishing out of client components.
- Validate operational content before publishing. Use the checked pull request path for public releases. Opted-in scheduled publishing uses confirmed news and high-confidence catalog edits from current public evidence. Keep raw automation output, client information, and licensed catalog data out of Git.
- Keep dependencies pinned, single-owner shared contracts, and isolated subagent file ownership.
- Reserve 6-Astra for complex tasks. Use Sol for routine implementation, content, tests, and reviews, and use Terra when visual inspection is the main task.
- Run `npm run ci` before releases. GitHub and Vercel use this same command to validate public content, check types, run tests, build, and smoke-test the production server. Verify affected interactive flows in the browser.
- Record limits honestly. A prepared Dockerfile is not evidence that the container has been run.

The root AGENTS.md and sources directory are synced reference material and must remain untouched.
