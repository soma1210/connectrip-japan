import Image from "next/image";
import type { CSSProperties } from "react";
import type { HomeContent } from "@/contracts";
import { textOr } from "../Tbd";
import { SectionLabel } from "./Split";
import { ValueStackMotion } from "./ValueStackMotion";

/**
 * Award Home · OUR VALUE as a held, cinematic scene (2026-11-22, third pass:
 * "too plain"). The stage stays on screen while the scroll walks through the
 * six values, one at a time:
 *   - the value's photo fills the background behind a deep veil, slowly
 *     pushing in; photos cross-fade between values;
 *   - the title is set very large; its letters rise in, the previous title's
 *     letters rise out;
 *   - a giant outlined numeral in enji rolls to the next figure;
 *   - the description sharpens in from a blur;
 *   - an index of all six runs along the foot, the current one lit, with a
 *     fine progress line.
 * Same headings, items and copy; photos are the items' own.
 */
export function ValueStack({ id, section }: { id: string; section: HomeContent["whyConnectrip"] }) {
  if (section.heading.status === "TBD" || section.items.status === "TBD") return null;
  const items = section.items.value;
  const n = items.length;
  return (
    <section id={id} data-vs className="relative bg-paper" style={{ height: `${100 + n * 70}svh` } as CSSProperties}>
      <div className="theme-dark sticky top-0 h-svh overflow-hidden bg-ink-deep text-snow">
        {/* Backgrounds. */}
        {items.map((item, i) =>
          item.image && item.image.status !== "TBD" ? (
            <div key={i} data-vs-bg={i} aria-hidden className="absolute inset-0 opacity-0">
              <div data-vs-cam className="absolute inset-0">
                <Image src={item.image.value.src} alt="" fill sizes="100vw" className="object-cover" />
              </div>
            </div>
          ) : null,
        )}
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(4,4,4,0.55),rgba(4,4,4,0.92)_75%)]" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />

        <div className="relative mx-auto flex h-full w-full max-w-[1440px] flex-col px-5 pt-24 pb-8 md:px-[5vw] md:pt-28">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionLabel index="06" tone="snow" className="w-[min(32rem,80vw)]">
                {null}
              </SectionLabel>
              <h2 className="mt-5 font-display text-[clamp(2.2rem,4.4vw,4.4rem)] leading-none tracking-[-0.03em] text-snow">{section.heading.value}</h2>
            </div>
            {section.supporting && section.supporting.status !== "TBD" ? (
              <p className="max-w-sm text-sm leading-relaxed text-snow/65 md:text-right">{section.supporting.value}</p>
            ) : null}
          </div>

          {/* Middle: the current title + description on the left, the giant numeral on the right (no overlap). */}
          <div className="mt-6 grid flex-1 grid-rows-[auto_1fr] gap-4 md:grid-cols-12 md:grid-rows-1 md:items-end md:gap-8">
            <div aria-hidden className="h-[clamp(5.5rem,20vw,19rem)] overflow-hidden md:order-2 md:col-span-4 md:justify-self-end md:self-end">
              <div data-vs-numbers className="will-change-transform">
                {items.map((_, i) => (
                  <span key={i} className="block h-[clamp(5.5rem,20vw,19rem)] font-display text-[clamp(5.5rem,20vw,19rem)] leading-[1] tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_rgba(179,52,63,0.95)] md:text-right">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative min-h-[14rem] self-end md:order-1 md:col-span-8 md:min-h-[18rem]">
              {items.map((item, i) => (
                <div key={i} data-vs-item={i} className="absolute inset-x-0 bottom-0" aria-hidden={i > 0 || undefined}>
                  <h3 className="font-display text-[clamp(2.4rem,6.4vw,7rem)] leading-[0.95] tracking-[-0.035em] text-snow">
                    {textOr(item.title, "")
                      .split(" ")
                      .map((word, w, all) => (
                        <span key={w} className="inline-block whitespace-nowrap">
                          <span className="inline-block overflow-clip [overflow-clip-margin:0.12em] pb-[0.05em] align-top">
                            <span data-vs-word className="inline-block">
                              {word}
                            </span>
                          </span>
                          {w < all.length - 1 ? "\u00a0" : null}
                        </span>
                      ))}
                  </h3>
                  <p data-vs-desc className="mt-4 max-w-md text-base leading-relaxed text-snow/75 md:text-lg">
                    {textOr(item.description, "")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Index of the six. */}
          <ol className="mt-8 grid grid-cols-3 gap-x-4 gap-y-6 border-t border-snow/15 pt-5 md:grid-cols-6">
            {items.map((item, i) => (
              <li key={i} data-vs-tab={i} className="relative text-[11px] leading-snug text-snow/40 transition-colors duration-500 data-[on]:text-snow md:text-xs">
                <span aria-hidden className="absolute -top-4 left-0 h-px w-full bg-snow/0">
                  <span data-vs-progress className="block h-full w-full origin-left scale-x-0 bg-enji" />
                </span>
                <span className="mr-2 font-medium text-enji">{String(i + 1).padStart(2, "0")}</span>
                {textOr(item.title, "")}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <ValueStackMotion targetId={id} count={n} />
    </section>
  );
}
