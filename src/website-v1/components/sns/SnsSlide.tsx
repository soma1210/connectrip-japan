import { SnsMotion } from "../wd/SnsMotion";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import type { SnsAccountPlatform } from "@/contracts";
import { cn } from "@/lib/cn";
import { SNS_SLIDE_COPY } from "../../content/data/sns";
import { reveal, revealGroup } from "../motion/reveal";

const ICONS = { tiktok: FaTiktok, instagram: FaInstagram, facebook: FaFacebookF, whatsapp: FaWhatsapp } as const;
const ICON_TILES = {
  tiktok: "bg-black",
  instagram: "bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5]",
  facebook: "bg-[#1877F2]",
  whatsapp: "bg-[#25D366]",
} as const;

/**
 * Home SNS slide (minimal redesign, 2026-11-15): plain dark navy, thin-bordered
 * transparent cards, icon + name + one line always visible, the whole card is
 * the link, a light lift on hover. Account URLs come in from the content model
 * (`socialLinks`, src/data/social-links.ts) unchanged.
 */
export function SnsSlide({ accounts }: { accounts: { platform: SnsAccountPlatform; label: string; href?: string }[] }) {
  const c = SNS_SLIDE_COPY;
  return (
    <section id="sns" aria-labelledby="sns-title" {...revealGroup} className="overflow-x-clip bg-navy-dark py-16 md:flex md:min-h-[78svh] md:items-center md:py-24">
      <div className="mx-auto w-full max-w-(--container-app) px-5 md:px-10">
        <p {...reveal("fade", 0, "font-heading-en text-xs tracking-[0.28em] text-gold uppercase md:text-sm")}>{c.eyebrow}</p>
        <h2
          id="sns-title"
          data-wd-letters
          aria-label={c.heading}
          className="mt-3 font-heading-en text-[clamp(2.3rem,9vw,3.2rem)] leading-[1.05] text-cream [perspective:600px] md:text-[clamp(3.4rem,6vw,6rem)]"
        >
          {c.heading.split(" ").map((word, w, all) => (
            <span key={w} aria-hidden className="inline-block whitespace-nowrap">
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
          <p className="font-heading-en text-sm text-cream/80 italic md:text-lg">{c.tagline}</p>
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
              <li key={a.platform} data-sns-card data-wd-tilt style={{ "--k": i - (accounts.length - 1) / 2 } as CSSProperties} className="flex will-change-transform">
                <a
                  href={a.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${text.action} (opens in a new tab)`}
                  className="group flex w-full flex-col items-center rounded-xl border border-cream/20 bg-transparent px-3 py-6 text-center max-md:items-start max-md:border-gold/35 max-md:bg-navy max-md:px-3 max-md:py-3.5 max-md:text-left max-md:shadow-[0_18px_40px_-12px_rgba(3,8,20,0.75)] transition-[transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-gold/60 focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-5 md:py-9"
                >
                  <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-white max-md:h-10 max-md:w-10 md:h-14 md:w-14", ICON_TILES[a.platform])} aria-hidden>
                    <Icon className="h-6 w-6 md:h-7 md:w-7" />
                  </span>
                  <span className="mt-4 font-heading-en text-lg text-cream max-md:mt-3 max-md:text-[15px] max-md:leading-tight md:mt-5 md:text-2xl">{a.label}</span>
                  <span className="mt-1.5 mb-5 font-heading-en text-xs leading-snug text-cream/70 italic max-md:mb-3 max-md:text-[11px] md:mb-6 md:text-sm">{text.description}</span>
                  <span className="mt-auto inline-flex items-center gap-2 rounded-full whitespace-nowrap border border-gold/70 px-3 py-1.5 font-heading-en text-[11px] tracking-[0.04em] text-cream transition-colors group-hover:border-gold group-hover:text-gold md:px-5 md:py-2 md:text-sm">
                    {/* Phones: the short verb (the card's aria-label still names the platform). */}
                    <span className="sm:hidden">{text.short}</span>
                    <span className="max-sm:hidden">{text.action}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gold md:h-4 md:w-4" aria-hidden />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <SnsMotion />
    </section>
  );
}
