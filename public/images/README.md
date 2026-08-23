# Image assets

Drop real photography in at these exact paths (matching `src/data/images.ts`) and it
will appear automatically — no code changes needed. Until a file exists, that spot on
the site shows a labeled placeholder box instead of a broken image.

| Section        | Path                                    | Suggested aspect |
| -------------- | ---------------------------------------- | ----------------- |
| Hero slider (x10, filled in) | `hero/slides/01-osaka-castle.jpg` … `10-nara-deer.jpg` | 16:9 or wider, landscape |
| Issues (x6)    | `issues/issue-1.jpg` … `issue-6.jpg`     | 4:3 |
| Service intro  | `service/service-intro.jpg`              | 4:3 |
| Service cards (x6) | `service/service-card-1.jpg` … `service-card-6.jpg` | 4:3 |
| Value cards (x6)   | `value/value-card-1.jpg` … `value-card-6.jpg`       | 4:3 (used as a subtle background) |
| Process steps (x5) | `process/step-1.jpg` … `step-5.jpg`     | wide banner |
| Plan cards (x3)    | `plan/plan-custom.jpg`, `plan-package.jpg`, `plan-vip.jpg` | 3:4 |
| Gallery (x3)       | `gallery/gallery-1.jpg` … `gallery-3.jpg`           | 4:3 |
| VLOG thumbnails (x3) | `vlog/vlog-1.jpg` … `vlog-3.jpg`                  | 4:3 |
| Final CTA banner   | `final-cta/final-cta-bg.jpg`                        | 16:9 or wider |
| Logo mark          | `logo/logo.png`                                     | square, transparent background |

Text content and alt text already live in `messages/ja.json` / `messages/en.json` per
section — only the images themselves are missing.
