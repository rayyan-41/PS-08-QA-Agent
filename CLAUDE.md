# CLAUDE.md

All project instructions live in AGENTS.md so every coding agent on the team follows the same rules. Claude Code loads it through the import below.

@AGENTS.md

## Claude Code specifics

- Treat the "Hard rules" section of AGENTS.md as non-negotiable. If a request would break one (a hardcoded demo result, a committed key, a copied template), say so and stop.
- Before reading `data/ps08_data_entries.csv`, read `data/README.md`.
- When you change an API request or response shape, update `docs/api.md` in the same change.
- When you add code, update the "Repository layout" and "Commands" sections of AGENTS.md so they stay accurate.
- Do not commit or push unless asked. When you do commit, keep commits small and descriptive.
