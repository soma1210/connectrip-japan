# Website v1 Preview

Frontend skeleton of Website v1, built on Interface Contract v1
(`src/contracts`). It runs next to the current site and does not change it.

```bash
bun run dev:v1   # http://localhost:3002 → redirects to /v1
```

`/v1` and everything under it is the preview. The current site keeps working
at `/` (`[locale]` routes). All preview pages are `noindex`.

## Layout

| Path | Role |
|---|---|
| `routes.ts` | Route Registry. The only place that knows URLs (all PROPOSED). Keep in sync with `src/app/v1/*` folders |
| `content/` | Builds contract view models. TBD / PROPOSED values only; APPROVED only with a recorded decision |
| `views/` | Page views. Take a view model, render it. Import types from `@/contracts` only |
| `components/` | Shared UI. Reuses the current site's components and class strings |
| `src/app/v1/` | Next.js routes: load a view model, render a view |

## Rules

- No invented copy, products, people, prices or reviews. Undecided values
  render as dashed `TBD · <slot>` boxes (reviewer note in the tooltip).
- PROPOSED text comes from Working Baselines (Sitemap page names, wording in
  the Business Decision) and is not approved copy.
- No hard-coded paths in components: hrefs come from the Route Registry
  through the view models.
- Booking is closed (Book Now disabled): products, prices and the booking
  backend are TBD. The Inquiry form submits to a mock handler only.
- Photos reused from the current site are marked rights / consent
  `NOT_VERIFIED`; they must be cleared before v1 goes public.
