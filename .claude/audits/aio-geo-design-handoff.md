# AIO / GEO audit: design handoff (2026-11-26)

From the AIO / GEO technical audit of https://connectripjapan.com (2026-11-26). The items below
change what visitors see, so they belong to the design work (localhost:3081), not to the SEO
branch. **Facts marked "owner decision" must come from the owner: do not invent prices,
languages, contact details or conditions.** Merge rules: `design-merge-checklist.md`.

| # | Issue (found on production) | What to do | Owner decision needed |
|---|---|---|---|
| 1 | **No page links to `/company`** (only the sitemap). | Add a link: footer INFORMATION column, or from About's Company Overview. | Where the link goes. |
| 2 | **How It Works is thin** (about 280 characters: step titles only, e.g. "Tell Us What You Want"). | Add one or two sentences under each step: what the traveller does, what Connectrip does, and when. Use only the booking rules already approved (request → reply within 2 business days → Stripe invoice in JPY → confirmed after payment). | Wording. |
| 3 | **6-hour guide has no price.** The request form and FAQ offer 4, 6 or 8 hours; the Private Guide price table and "What's Included" show only 4 and 8 hours (`content/privateGuidePricing.ts` notes this). | Show the 6-hour price, or explain how it is priced. | **6-hour price and conditions.** |
| 4 | **Languages are unclear.** Pages say "English-speaking local guide" only; the pricing note says prices "may vary depending on … language". | State the guide languages offered. | **Which languages** (English only, or others on request). |
| 5 | **Contact details are unclear.** Only the inquiry form and a WhatsApp icon (no number shown); no e-mail address. | Say how to reach the company (form, WhatsApp, e-mail) on Inquiry / Company / footer. | **Which contact details are public** (e-mail? WhatsApp number as text?). |
| 6 | **Letter animation joins words in the HTML text.** "Your Kansai.Your Way.", "Kansai TravelUpdates", "Connectrip JapanSelect関西" (Home). AI systems and some crawlers read the text without the visual line breaks. | Keep a real space (or `aria-label` + `aria-hidden` letters, as the H1s already do) between words split across lines. | None. |
| 7 | **Semantic HTML.** No `<article>` on the experience pages; no visible breadcrumbs outside Explore; Home has Select card headings twice (carousel copies). | Wrap each tour page body in `<article>`; mark carousel copies `aria-hidden`; add visible breadcrumbs (Home › Experiences › tour) if the design allows. BreadcrumbList structured data will follow visible breadcrumbs only. | Breadcrumb design. |
| 8 | **Weak links between tours.** `/experiences/osaka-like-a-local` is linked only from Home; `/experiences/osaka-tenmangu-tenjinbashisuji` only from `/experiences`, and `/experiences` doesn't list Osaka Like a Local. | List both tours on `/experiences`; link each tour page to the other and to Private Guide. | None. |

## Not to do (owner instruction 2026-11-26)

llms.txt, hidden text for AI, extra keywords for AI, publishing unapproved articles, multilingual
pages, LocalBusiness / TravelAgency markup.

## Photo rights (owner decision, not design)

No image on the public site has a rights confirmation on record (audit 2026-11-26). Photos shown with
"Preview · rights not verified" must not be kept public by removing that label: replace the photo
with a rights-confirmed one, or hide it (`displayPhoto` / `rightsConfirmed` in content). The audit
report lists the files and pages.
