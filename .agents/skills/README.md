# Project design skills

Skills in this directory are available to compatible coding agents working in InfoHub. Restart the agent session after updating them. Project and user instructions take precedence over upstream defaults.

- `design-taste-frontend`: [Taste Skill](https://github.com/Leonxlnx/taste-skill), upstream commit `952435f63acece7d2fcb4b4d3c1786c1c43603e0`, MIT. Its browser checks require Node 22+ and Chrome, Edge, or Chromium.
- `impeccable`: [Impeccable](https://github.com/pbakaus/impeccable), upstream commit `2fc5e1459efbbf06d92c7306517c286bf12490cf`, Apache-2.0. Its launcher may download a verified engine binary on first use. This manual installation does not enable its optional design hook or subagents.
- `unslop` and `emil-design-eng` were already installed. See their skill files for attribution and usage.

To update a vendored skill, replace the whole skill directory from the upstream Codex-compatible distribution, retain its license, update the commit above, and verify its referenced files and scripts.
