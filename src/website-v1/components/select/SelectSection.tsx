import type { SelectAreaKey, SelectMapContent } from "@/contracts";
import { TbdText, textOr } from "../Tbd";
import { SelectMap } from "./SelectMap";

/**
 * Connectrip Select — Explore Osaka, its own Home section right after the
 * Hero. A short title strip, then the illustrated map as the main element
 * (about one screen on desktop). Tourist spots only, no filters, no
 * experience cards. The spot list is also in the HTML (visually hidden) for
 * search and screen readers.
 */
export function SelectSection({ content }: { content: SelectMapContent }) {
  const byArea = new Map<SelectAreaKey, string[]>();
  for (const spot of content.spots) byArea.set(spot.area, [...(byArea.get(spot.area) ?? []), spot.name]);

  return (
    <section id="connectrip-select" aria-label="Connectrip Select — Explore Osaka" className="bg-navy-dark py-12 md:py-20">
      <header className="mx-auto flex w-full max-w-(--container-app) flex-col gap-2 px-5 pb-6 md:flex-row md:items-end md:justify-between md:gap-8 md:px-10 md:pb-8">
        <div>
          <TbdText value={content.eyebrow} slot="Eyebrow" as="p" className="font-heading-en text-xs tracking-[0.3em] text-gold" />
          <TbdText value={content.heading} slot="Heading" as="h2" className="mt-1 font-heading-jp text-3xl leading-tight text-cream md:text-5xl" />
        </div>
        <TbdText value={content.description} slot="Description" as="p" className="text-sm leading-relaxed text-cream/75 md:min-w-0 md:pb-1 md:text-right md:text-[13px] md:leading-snug lg:whitespace-nowrap" />
      </header>
      <div className="mx-auto w-full max-w-(--container-app) px-3 md:px-10">
        <div className="relative h-[68svh] min-h-[460px] border border-gold/40 md:h-[min(76vh,820px)] md:min-h-[560px]">
          <SelectMap content={content} variant="embed" />
        </div>
      </div>
      <div className="sr-only">
        <h3>Tourist spots on the map</h3>
        <ul>
          {[...byArea.entries()].map(([area, names]) => (
            <li key={area}>
              {textOr(content.areas[area], area)}: {names.join(", ")}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
