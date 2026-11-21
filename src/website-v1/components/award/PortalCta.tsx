import type { HomeContent } from "@/contracts";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { CtaLink } from "../CtaLink";
import { TbdText } from "../Tbd";
import { katomadoPath } from "./katomado";
import { PortalCtaMotion } from "./PortalCtaMotion";
import { ImageTrail } from "../wd/ImageTrail";

/**
 * Award Home · closing scene, "the gate" (2026-11-22). Pinned on white
 * paper: a katomado window shows the torii path; the heading sits large
 * around it in ink. Scrolling, the window opens to the full screen — we walk
 * through it — and the heading turns white over the photo, with the copy and
 * both CTAs. Same heading, copy, photo and CTAs.
 */
export function PortalCta({ section, trail = [] }: { section: HomeContent["finalCta"]; trail?: string[] }) {
  const image = section.image && section.image.status !== "TBD" ? section.image.value : undefined;
  const words = section.heading.status === "TBD" ? [] : section.heading.value.split(" ");
  const half = Math.ceil(words.length / 2);
  return (
    <section id="final-cta" className="relative h-[260svh] bg-paper">
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          <clipPath id="aw-portal" clipPathUnits="objectBoundingBox">
            <path data-portal-window d={katomadoPath({ cx: 0.5, w: 0.2, ys: 0.36, y1: 0.8 })} />
          </clipPath>
        </defs>
      </svg>
      <div className="sticky top-0 h-svh overflow-hidden">
        {image ? (
          <div data-portal-photo className="absolute inset-0" style={{ clipPath: "url(#aw-portal)" }}>
            <div data-portal-cam className="absolute inset-0">
              <PlaceholderImage src={image.src} alt={image.alt} sizes="100vw" />
            </div>
            <div data-portal-dim className="absolute inset-0 bg-ink-deep opacity-0" />
          </div>
        ) : null}

        <div className="relative z-[2] flex h-full flex-col items-center justify-center px-5 text-center">
          {words.length ? (
            <h2 aria-label={section.heading.status === "TBD" ? undefined : section.heading.value} className="pointer-events-none font-display text-[clamp(2.8rem,8.4vw,9rem)] leading-[0.95] tracking-[-0.03em]">
              <span data-portal-line="0" aria-hidden className="block text-ink">
                {words.slice(0, half).join(" ")}
              </span>
              <span data-portal-line="1" aria-hidden className="block text-ink">
                {words.slice(half).join(" ")}
              </span>
            </h2>
          ) : (
            <TbdText value={section.heading} slot="Final CTA heading" as="h2" />
          )}
          <div data-portal-after className="theme-dark absolute inset-x-0 bottom-[12svh] flex flex-col items-center gap-6 px-5">
            {section.supporting ? <TbdText value={section.supporting} slot="Final CTA supporting copy" as="p" className="max-w-xl text-sm leading-loose text-snow/85 md:text-base" /> : null}
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <CtaLink cta={section.browseExperiences} pair />
              <CtaLink cta={section.planPrivateDay} pair />
            </div>
          </div>
        </div>
      </div>
      {/* Moving the mouse over the open gate leaves a trail of Kansai photos. */}
      <ImageTrail targetId="final-cta" images={trail} />
      <PortalCtaMotion targetId="final-cta" />
    </section>
  );
}
