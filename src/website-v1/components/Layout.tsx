import Image from "next/image";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp, FaYoutube } from "react-icons/fa";
import Link from "next/link";
import type { Brand, LayoutViewModel } from "@/contracts";
import { Container } from "@/components/ui/Container";
import { routeHref } from "../routes";
import { CtaLink } from "./CtaLink";
import type { RecruitNav } from "../content/pages";
import { MobileMenu } from "./MobileMenu";
import { RecruitDropdown } from "./RecruitMenu";
import { TbdText } from "./Tbd";

const SOCIAL_ICONS = {
  tiktok: FaTiktok,
  instagram: FaInstagram,
  whatsapp: FaWhatsapp,
  facebook: FaFacebookF,
  youtube: FaYoutube,
} as const;

/** Preview notice. The v1 preview is noindex and not approved content. */
export function PreviewBanner() {
  return (
    <div className="bg-gold px-4 py-2 text-center font-sans text-[11px] leading-snug tracking-[0.06em] text-navy">
      WEBSITE V1 PREVIEW — Not public. Dashed “TBD” boxes are undecided; other text is a Working Baseline, not approved copy.
    </div>
  );
}

function BrandMark({ brand }: { brand: Brand }) {
  const words = brand.name.status === "TBD" ? [] : brand.name.value.toUpperCase().split(" ");
  return (
    <Link href={routeHref("home")} className="flex items-center gap-3">
      {brand.logo.status !== "TBD" ? (
        <Image src={brand.logo.value.src} alt={brand.logo.value.alt} width={200} height={200} className="h-14 w-14 md:h-16 md:w-16" priority />
      ) : null}
      {words.length > 0 ? (
        <span className="flex flex-col leading-none">
          {words.map((word) => (
            <span key={word} className="font-heading-en text-lg tracking-[0.12em] text-cream">
              {word}
            </span>
          ))}
        </span>
      ) : (
        <TbdText value={brand.name} slot="Brand name" />
      )}
    </Link>
  );
}

/** Same structure and styles as the current site's Header. */
export function V1Header({ layout, recruit }: { layout: LayoutViewModel; recruit: RecruitNav }) {
  const { nav } = layout;
  return (
    <header className="sticky top-0 z-50 border-b border-dashed border-gold/30 bg-navy/95 backdrop-blur">
      <Container className="flex h-20 items-center justify-between max-w-[1340px]!">
        <BrandMark brand={layout.brand} />

        <nav className="hidden items-center gap-10 xl:flex">
          {nav.primary.map((item) => (
            <Link key={item.id} href={item.href} className="text-xs tracking-[0.1em] text-cream/80 transition-colors hover:text-gold">
              <TbdText value={item.label} slot="Nav label" />
            </Link>
          ))}
          <RecruitDropdown recruit={recruit} />
        </nav>

        <div className="hidden xl:block">
          <CtaLink cta={nav.headerCta} size="sm" />
        </div>

        <MobileMenu items={nav.primary} recruit={recruit}>
          <CtaLink cta={nav.headerCta} size="sm" />
        </MobileMenu>
      </Container>
    </header>
  );
}

/** Same structure and styles as the current site's Footer. */
export function V1Footer({ layout, recruit }: { layout: LayoutViewModel; recruit: RecruitNav }) {
  const { footer } = layout.nav;
  return (
    <footer className="border-t border-dashed border-gold/30 bg-navy-dark">
      <Container className="grid gap-10 py-14 md:grid-cols-3 md:gap-8">
        <div>
          <BrandMark brand={layout.brand} />
          <div className="mt-6">
            <p className="font-heading-en text-xs tracking-[0.15em] text-cream/50 italic">SNS</p>
            <div className="mt-4">
              {footer.social.status === "TBD" ? (
                <TbdText value={footer.social} slot="SNS links" />
              ) : (
                // Same icon buttons as the current site's Footer.
                <div className="flex flex-wrap gap-3">
                  {footer.social.value.map((link) => {
                    const Icon = SOCIAL_ICONS[link.platform];
                    const name = link.label.status === "TBD" ? link.platform : link.label.value;
                    return (
                      <a
                        key={link.platform}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={name}
                        title={name}
                        className="flex h-10 w-10 items-center justify-center border border-cream/20 text-cream/70 transition-colors hover:border-gold hover:text-gold"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="font-heading-en text-xs tracking-[0.15em] text-cream/50 italic">NAVIGATION</p>
          <nav className="mt-4 flex flex-col gap-3">
            {footer.links.map((item) => (
              <Link key={item.id} href={item.href} className="text-sm text-cream/70 transition-colors hover:text-gold">
                <TbdText value={item.label} slot="Nav label" />
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="font-heading-en text-xs tracking-[0.15em] text-cream/50 italic">INFORMATION</p>
          <nav className="mt-4 flex flex-col gap-3">
            {footer.legal.map((item) => (
              <Link key={item.id} href={item.href} className="text-sm text-cream/70 transition-colors hover:text-gold">
                <TbdText value={item.label} slot="Nav label" />
              </Link>
            ))}
            {/* Same targets as the header RECRUIT menu; Guide Community needs a full page load. */}
            {recruit.items.map((item) =>
              item.external ? (
                <a key={item.id} href={item.href} className="text-sm text-cream/70 transition-colors hover:text-gold">
                  {item.label}
                </a>
              ) : (
                <Link key={item.id} href={item.href} className="text-sm text-cream/70 transition-colors hover:text-gold">
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      </Container>

      <Container className="flex flex-col gap-2 border-t border-cream/10 py-6 text-xs text-cream/40 md:flex-row md:items-center md:justify-between">
        <span>Website v1 preview</span>
        <span className="font-heading-en tracking-[0.1em]">CONNECTRIP JAPAN</span>
      </Container>
    </footer>
  );
}
