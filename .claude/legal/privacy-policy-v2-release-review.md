# Website V2 Privacy Policy — PR #4 release review (2026-11-19)

## Authority and scope

The owner explicitly requested public-mode body rendering of the existing approved 14-section policy, testing, and a commit/push to PR #4 on 2026-11-19. No merge or production deployment is authorized. This records content/display authorization, not a legal opinion or a claim that the checks below are done. Historical approval papers and the original `privacy-policy-v1-draft.md` remain unchanged as evidence; they contain older uncompleted checks and are not the current public text.

Current text: `src/website-v1/content/privacyPolicy.ts`. Readable copy: `privacy-policy-v2-public-text.md`.

## Changes from the existing text (only substantive differences)

- Section 3: “Payments are processed by our payment service provider, Stripe. When you pay a Stripe invoice” becomes “If you pay an invoice through Stripe”. Section 7 labels Stripe “when used for payment”. This avoids asserting an active account without evidence; it does not assert that Stripe is unused.
- Section 7: remove the country column rather than invent Resend, Microsoft 365, Google Forms or Stripe countries. Preserve the repository's confirmed Singapore configuration as a narrowly worded application-processing/database-storage statement; it does not claim that all provider processing occurs there. Identify the existing past-application store as Neon instead of presenting “Past application data” as a provider.
- Sections 8 and 11: remove references to a complete country table that no longer exists. The Article 28 consent/safeguards requirements and security obligations remain unchanged.
- “Last updated” is the actual text revision date, 2026-11-19, not an invented production effective date. Before deployment, confirm the owner's effective-date requirement from the 2026-11-18 approval paper.

All other policy sections and promises remain unchanged. No storage country, contracting entity, verification result, or legal approval is invented.

## Unresolved before production release

1. **Material legal issue — overseas processing:** for each actual provider, confirm the applicable contract/entity, relevant processing locations, and whether the arrangement is no-handling storage, an Article 28 compliant system, or consent-based transfer. Record the necessary continuing measures and information-request process, or implement informed consent if required. Section 8's policy statement alone does not establish that this work is complete.
2. **Country disclosure / external environment:** removing the incomplete country column is not a legal remedy. Determine and make available the required country and safeguards information. The PPC FAQ below addresses cloud storage even where there is no third-party “provision”. Vercel/Neon region configuration does not establish all provider/subprocessor locations.
3. **Stripe:** account operation, contracting entity and actual payment handling remain unverified. The conditional wording is not verification.
4. **Contact mailbox:** sending/receiving, assigned reader and response handling remain unverified. `PRIVACY_TECH_CHECKS` stays false; no email was sent during this work.
5. **Publication date:** no production deployment has happened in this task. Do not treat the revision date as proof of publication.

`privacyPolicyContentReady()` permits the requested body display. `privacyPolicyPublishable()` intentionally remains false because the existing Section 8 pending item and mailbox check are still unresolved. No automated deployment gate is claimed: do not merge/deploy this PR until the release items have been resolved. The branch's existing Vercel auto-deployment disablement is preserved.

## Primary sources checked 2026-11-19

- PPC foreign-transfer guidelines: https://www.ppc.go.jp/personalinfo/legal/guidelines_offshore/
- PPC cloud storage / external environment FAQ Q10-25: https://www.ppc.go.jp/all_faq_index/faq1-q10-25/

These sources define requirements; they do not verify this company's contracts or operations.

## Validation

- Production build (`next build --webpack`), including TypeScript: passed.
- ESLint on changed source/test files: passed.
- Privacy regression checks: 14 sections, no unresolved body tokens, visible in public mode, legal/technical readiness still false: passed.
- Existing booking, form notification, inquiry database, inquiry admin and session tests: passed.
- Build and tests ran in an isolated copy without production environment files; no production database or real SMTP was used.

## GitHub state discovered during implementation

PR #4 had already been merged at 2026-11-19 21:09:59 JST (merge commit `9e862cee5e7bfa4e3bd85e9748558b02c820c626`). This task did not merge it. A new commit on its old head branch cannot become part of the already merged PR's diff. Production deployment status is not verified by this task.

The privacy document opts out of PageMotion (`data-wd-skip`): all paragraphs and lists must stay readable immediately, without waiting for scroll-triggered animations. This fixes the visible headings-only failure found during browser verification.

- Final browser verification at 1440px and 390px: all 14 sections rendered; no hidden policy paragraphs/list items, no horizontal page overflow, no DRAFT/TBD/TO CONFIRM notices; browser error log empty. Contents navigation to Section 2 works.
- HTTP `/privacy`: 200; every paragraph, list item, definition and provider table cell matches the source text in the returned HTML.
- After PR #4's merged state was reported, the owner explicitly authorized push to the original branch and creation of a follow-up draft PR. No merge/deploy is authorized.
