@AGENTS.md

# Website V2 is the official version (2026-11-16)

Website V2 (the cinematic redesign) is the only website under development and the version to be published. Official branch: `claude/website-v2-cinematic`. Website V1 (`claude/website-v1-launch`) gets no new changes; its Git history is kept. V2 still lives in the `src/website-v1` / `src/app/v1` / `src/app/api/v1` paths below — the directory names were not renamed. Do not deploy to production until explicitly instructed. Project notes: Obsidian `04_TRAVEL/Website v2/`.

# Single source of truth (2026-11-15)

Connectrip Japan Website V1 is the single source of truth. The legacy website is deprecated and must not be used as a reference for future development.

- Develop in `src/website-v1`, `src/app/v1` and `src/app/api/v1` only. Company, officer, service, booking and policy data live in Website V1 (`src/website-v1/content`, including `content/data/` and `content/officers.ts`).
- Do not add features to the legacy website, update its company information, compare designs between the old and new sites, add new dependencies on the legacy multilingual data, or do work whose only purpose is keeping the two sites consistent.
- Exceptions: redirects from legacy URLs (next.config.ts) and keeping the currently running production site safe until the switch to V1.
- The legacy site's pages and data were removed from this branch. The back office (`src/app/admin`, `src/admin`, `src/app/guide-community`, the guide/partner application APIs, Postgres/Blob) is kept until a separate decision; see `.claude/audits/legacy-retirement.md`.
