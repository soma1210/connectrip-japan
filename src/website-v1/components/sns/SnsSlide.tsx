import { SnsMotion } from "../wd/SnsMotion";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import type { SnsAccountPlatform } from "@/contracts";
import { cn } from "@/lib/cn";
import { SNS_SLIDE_COPY } from "../../content/data/sns";
import { reveal, revealGroup } from "../motion/reveal";

const ICONS = { tiktok: FaTiktok, instagram: FaInstagram, facebook: FaFacebookF, whatsapp: FaWhatsapp } as const;
// One colour per account (Human instruction 2026-11-24), calm traditional tones: TikTok ivory (as before),
// Instagram vermilion (朱), Facebook indigo (藍), WhatsApp dark green (深緑). See wd.css "SNS cards".
const CARD_THEMES = { tiktok: "ivory", instagram: "vermilion", facebook: "indigo", whatsapp: "green" } as const;
const CARD_TILT = [-3, 2.5, -2, 3];

/**
 * Home SNS slide (minimal redesign, 2026-11-15; dressed like the Featured Tour slide
 * since 2026-11-23): black, an "N°06" index line, a light heading with the lead words in
 * gold, cards with gold hairlines and the brand marks drawn in one colour inside a thin
 * ring. Icon + name + one line always visible, the whole card is the link. Account URLs come in from the content model
 * (`socialLinks`, src/data/social-links.ts) unchanged.
 */
export function SnsSlide({ accounts }: { accounts: { platform: SnsAccountPlatform; label: string; href?: string }[] }) {
  const c = SNS_SLIDE_COPY;
  return (
    <section id="sns" aria-labelledby="sns-title" {...revealGroup} className="overflow-x-clip border-t border-[#cfa95f]/25 bg-[#141210] py-16 md:flex md:min-h-[78svh] md:items-center md:py-24">
      <div className="mx-auto w-full max-w-(--container-app) px-5 md:px-10">
        {/* The "N°06 ── …" index line was removed (Human instruction 2026-11-24). */}
        <h2
          id="sns-title"
          data-wd-letters
          aria-label={c.heading}
          className="font-heading-en text-[clamp(2.4rem,10vw,3.3rem)] leading-[1.02] font-medium tracking-[-0.02em] text-cream [perspective:600px] md:text-[clamp(3rem,5.4vw,5.6rem)]"
        >
          {c.heading.split(" ").map((word, w, all) => (
            // As the Featured Tour title: the lead words in gold, the last in cream.
            <span key={w} aria-hidden className={cn("inline-block whitespace-nowrap", w < all.length - 1 && "text-[#cfa95f]")}>
              {[...word].map((ch, i) => (
                <span key={i} data-wd-l className="inline-block">
                  {ch}
                </span>
              ))}
              {w < all.length - 1 ? "\u00a0" : null}
            </span>
          ))}
        </h2>
        <div {...reveal("up", 0.25, "mt-5 flex items-center gap-5 md:mt-6 md:gap-8")}>
          <span className="h-px w-14 shrink-0 bg-gold md:w-20" aria-hidden />
          <p className="font-heading-en text-sm font-light text-cream/70 italic md:text-lg">{c.tagline}</p>
        </div>

        {/* Phones: a fanned hand of cards (wd.css "SNS fan"), opened by the scroll (components/wd/SnsMotion). */}
        <ul
          data-sns-deck
          style={{ "--n": accounts.length } as CSSProperties}
          className="mt-10 grid grid-cols-2 gap-3 [perspective:1200px] sm:gap-4 md:mt-14 lg:grid-cols-4 lg:gap-6"
        >
          {accounts.map((a, i) => {
            const Icon = ICONS[a.platform];
            const text = c.accounts[a.platform];
            return (
              // Cards fly in from scattered positions and settle into the grid (components/wd/SnsMotion); 3D tilt under the pointer.
              <li
                key={a.platform}
                data-sns-card
                data-sns-theme={CARD_THEMES[a.platform]}
                data-wd-tilt
                style={{ "--k": i - (accounts.length - 1) / 2, "--sns-r": `${CARD_TILT[i % CARD_TILT.length]}deg` } as CSSProperties}
                className="flex will-change-transform"
              >
                <a
                  href={a.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${text.action} (opens in a new tab)`}
                  className="group flex w-full flex-col items-center rounded-xl border border-cream/20 bg-transparent px-3 py-6 text-center max-md:items-start max-md:rounded-[3px] max-md:border-gold/35 max-md:bg-[#171513] max-md:px-3 max-md:py-3.5 max-md:text-left max-md:shadow-[0_18px_40px_-12px_rgba(3,8,20,0.75)] transition-[transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-gold/60 focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-5 md:py-9"
                >
                  <span data-sns-num aria-hidden className="hidden">
                    N°{String(i + 1).padStart(2, "0")}
                  </span>
                  <span data-sns-icon className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 text-cream max-md:h-10 max-md:w-10 md:h-14 md:w-14" aria-hidden>
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </span>
                  <span data-sns-name className="mt-4 font-heading-en text-lg font-light text-cream max-md:mt-3 max-md:text-[15px] max-md:leading-tight md:mt-5 md:text-2xl">{a.label}</span>
                  <span data-sns-desc className="mt-1.5 mb-5 font-heading-en text-xs leading-snug text-cream/70 italic max-md:mb-3 max-md:text-[11px] md:mb-6 md:text-sm">{text.description}</span>
                  <span data-sns-cta className="mt-auto inline-flex items-center gap-2 rounded-[2px] whitespace-nowrap border border-gold/70 px-3 py-1.5 font-heading-en text-[11px] tracking-[0.04em] text-cream transition-colors group-hover:border-gold group-hover:text-gold md:px-5 md:py-2 md:text-sm">
                    {/* Phones: the short verb (the card's aria-label still names the platform). */}
                    <span className="sm:hidden">{text.short}</span>
                    <span className="max-sm:hidden">{text.action}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gold md:h-4 md:w-4" aria-hidden />
                  </span>
                </a>
                {/* Back of the card for the PC 3D reveal (wd.css "SNS 3D"); not shown otherwise. */}
                <span data-sns-back aria-hidden />
              </li>
            );
          })}
        </ul>
      </div>
      <SnsMotion />
    </section>
  );
}
