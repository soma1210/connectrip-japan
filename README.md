# Connectrip Japan Website

> Connectrip Japan Website V1 is the single source of truth. The legacy website is deprecated and must not be used as a reference for future development.

Next.js app for the Connectrip Japan website (Website V1) and its back office.

| Area | Path | Status |
|---|---|---|
| Website V1 pages | `src/app/v1`, `src/website-v1` | The website. Develop here |
| Booking requests | `src/app/api/v1/booking-requests`, `src/lib/booking-request`, `apps-script/booking-requests` | Google Apps Script → Google Sheets |
| Interface contracts | `src/contracts` | Shared types for V1 |
| Back office | `src/app/admin`, `src/admin`, `src/app/guide-community`, `src/app/api/{guide-applications,partner-*}`, `sql/` | Kept, not part of the website. Applications now use Google Forms |

```bash
bun run dev:v1          # preview at http://localhost:3002 (→ /v1)
bun run check:booking   # booking request checks
bun run build           # public mode unless NEXT_PUBLIC_WEBSITE_V1_PREVIEW=1
```

- Preview (`NEXT_PUBLIC_WEBSITE_V1_PREVIEW=1`): pages under `/v1`, all `noindex`.
- Public: the launch pages in `PUBLIC_PATHS` (`src/website-v1/routes.ts`) at the root; everything else 404. Legacy URL redirects: `next.config.ts`.
- Launch steps and the legacy retirement record: `.claude/audits/legacy-retirement.md`.
