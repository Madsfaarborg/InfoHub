# Implementation learnings

## 24 November 2026

- Sol 6.1 medium subagent dispatch succeeded in this session. Lower-tier delegation is available; actual billing savings are not exposed by the tools.
- The workspace is a ChatGPT mirror. The root AGENTS.md and sources are synced references, so persistent build guidance belongs in a separate tracked file.
- The initial palette's checked contrast ratios are 4.61:1 for white on vermilion, 15.01:1 for graphite on porcelain, and 4.83:1 for metadata on porcelain.
- Package versions must be checked against the registry when building; the design plan deliberately did not pin a future version.
- Keep model execution names separate from public product facts. Use a primary source to verify each model ID, setting, and price.
- Sol 6.1 medium handled catalog research, recommendation logic, and content publishing in separate file sets. These tracks did not require 6-Astra.
- Use `node --import tsx` for tests and publishing. The direct tsx command attempted to open an IPC socket that was unavailable in this workspace.
- Run `next typegen` before type checking so fresh checkouts have route types. Keep generated Next.js files out of Git.
- Next.js standalone output needs its static and public directories alongside the server. The local launcher and Dockerfile both copy them explicitly.
- Set the container UID and GID to the host publisher's identity when sharing its owner-only JSON file. Test that boundary independently of static starter fallback.
- Browser testing exposed “locally only” as a missing constraint phrase. The interpreter now handles it and “only locally,” with regression coverage for negated wording and routine mentions of local files.
- Verified the production build and standalone launch, 114 automated tests, and a local Docker Compose run against an owner-only test bundle. A reviewed news update and rollback both reached the running container without a restart.
- Browser checks covered task recommendations, hosted and local Qwen listings, the cost calculator, the measured chart and table with disposable fixture data, and mobile news filtering. The comparison view fit at 390, 768, and 1440 px without page overflow. The disposable data was kept outside the repository.
- The team pilot, real benchmark population, routine scheduler, and company host rollout are separate from this local verification.
- Creative tool documentation changes quickly. Check the exact endpoint schema as well as the overview. For example, Ideogram 4.6 uses the string `off` for its prompt rewriting control, and its browser credits differ from the API rate.
- Routine Sol 6.1 delegation covered provider research and business examples. Browser checks verified all three image workflows, hosted/local filtering, marketing and sales, presentation and spreadsheet searches, and the mobile catalog. The 117 automated checks include an existing-catalog upgrade and rollback.
- Artificial Analysis's documented language endpoint is paginated. Music and speech-to-text identities can omit the slug, so use the stable source ID for deduplication and keep names intact as published. Media API coverage can be narrower than the public lists.
- Verified the separate directory with 34 synthetic entries in the production browser build. Search, category filters, pagination, source links without a snapshot, and the three model-and-setting choices worked. All 121 automated tests passed. A live API sync still requires the organization's authorized key.
