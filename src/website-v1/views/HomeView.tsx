import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { getExploreHomeSlides } from "../content/explore/home";
import { ExploreKansaiSlides } from "../components/explore/ExploreKansaiSlides";
import type { HomeContent, HomeSectionKey, HomeViewModel } from "@/contracts";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ValueCard } from "@/components/cards/ValueCard";
import { SnsSlide } from "../components/sns/SnsSlide";
import { Section, SectionTitle, TbdBlock } from "../components/Blocks";
import { CtaLink } from "../components/CtaLink";
import { FlowSteps } from "../components/FlowSteps";
import { TbdImage, TbdText, textOr } from "../components/Tbd";
import { HERO_MOSAIC, HERO_MOSAIC_CENTER, heroFocus, heroMeta, type MosaicPhoto } from "../assets/heroImages";
import { V1_PREVIEW } from "../config";
import { HomeOpeningExperience } from "../components/opening/HomeOpeningExperience";
import openingStyles from "../components/opening/HomeOpeningExperience.module.css";
import { SocialProofBlock } from "./SocialProofBlock";
import cinematic from "../components/hero/CinematicHero.module.css";
import { reveal, revealGroup, revealGroupLate } from "../components/motion/reveal";
import { RevealObserver } from "../components/motion/RevealObserver";
import mosaic from "../components/wd/HeroMosaic.module.css";
import { HeroMosaicMotion } from "../components/wd/HeroMosaicMotion";
import { MistRise } from "../components/wd/MistRise";
import { FixedBannerMotion } from "../components/wd/FixedBannerMotion";
import { ShowreelMotion } from "../components/wd/ShowreelMotion";
import { HowItWorksScene } from "../components/wd/HowItWorksScene";
import { PrivateGuideMotion } from "../components/wd/PrivateGuideMotion";
import { PrefectureScene } from "../components/wd/PrefectureScene";
import { KANSAI_PREFECTURES } from "../content/prefectures";
import { KineticCta } from "../components/wd/KineticCta";
import { ImageTrail } from "../components/wd/ImageTrail";
import { TRAIL_EXTRA_IMAGES } from "../assets/trailImages";
import { CinematicHeroSlider } from "../components/hero/CinematicHeroSlider";
import { getFeaturedTour } from "../content/featuredTour";
import { PRIVATE_DAY_DESCRIPTION } from "../content/home";
import { PLAN_AREAS, PLAN_DURATIONS, PLAN_INTERESTS, PLAN_STYLES } from "../booking/privateDayPlan";
import { ACTIVITY_LABELS, AREA_LABELS } from "../content/privateGuide";
import { PhilosophySection } from "../components/globe/PhilosophySection";
import { OurValueCinematicSection } from "../components/our-value/OurValueCinematicSection";

/**
 * Not shown in public mode (launch scope 2026-11-11): DEMO experiences with TBD
 * prices and "Book Now", the old Inquiry-first steps ("Confirm Your Day"), and
 * DEMO Travel Guide articles.
 */
const PREVIEW_ONLY_SECTIONS: ReadonlySet<HomeSectionKey> = new Set(["featuredExperiences", "howItWorks", "travelGuide"]);

/** Used only while `sectionOrder` is TBD (T-05 Home Working Baseline). */
const BASELINE_ORDER: HomeSectionKey[] = [
  "hero",
  "featuredExperiences",
  "privateGuide",
  "howItWorks",
  "travelGuide",
  "whyConnectrip",
  "sns",
  "finalCta",
];

/**
 * Cinematic Hero (Human instruction 2026-11-14): twelve Kansai scenes, each
 * with its own camera move (components/hero/heroDirection.ts). On the photo:
 * the headline and the two CTAs only (fixed, HTML), plus the location of the
 * current photo at the bottom right. The supporting copy stays in the content
 * model but is not shown here. The approved Opening overlay plays on top on
 * the first visit; the camera, text and rotation start when it ends.
 */
const HEADLINE_CLASS =
  "max-w-[9.4em] font-heading-jp text-[clamp(2.25rem,9.6vw,3rem)] leading-[1.08] text-cream drop-shadow-[0_2px_28px_rgba(5,11,24,0.6)] max-md:mx-auto md:text-[clamp(2.9rem,4.4vw,4.9rem)]";

/** One photo of the 3 × 3 mosaic around the slider (assets/heroImages.ts HERO_MOSAIC). */
function MosaicCell({ photo }: { photo: MosaicPhoto }) {
  return (
    <div className={mosaic.cell} aria-hidden>
      <div data-mosaic-neighbour className={mosaic.neighbour}>
        <Image src={photo.src} alt="" fill loading="eager" fetchPriority="low" sizes="80vw" className="object-cover" style={{ objectPosition: photo.focus }} />
      </div>
    </div>
  );
}

function Hero({ hero }: { hero: HomeContent["hero"] }) {
  const photos = hero.images.status === "TBD" ? [] : hero.images.value;
  const first = photos[0];
  const slides = photos.map((p) => {
    const meta = heroMeta(p.src);
    return { src: p.src, alt: p.alt, focus: meta?.focus, focusMobile: meta?.focusMobile, location: meta?.location ?? "" };
  });
  const line = (i: number) => ({ className: cinematic.line, style: { "--i": i } as CSSProperties });
  const words = hero.headline.status === "TBD" ? [] : hero.headline.value.split(" ");
  return (
    <section id="home-hero" data-v1-hero className={`touch-pan-y ${mosaic.component}`}>
      {/* Home Opening Experience (W1-D21): overlay on top; the Hero below is always in the HTML. */}
      {first ? <HomeOpeningExperience image={{ src: first.src, focus: heroFocus(first.src) }} /> : null}

      {/* The stage: one screen held while the camera pulls back from the slider into the 3 × 3 mosaic. */}
      <div data-mosaic-stage className={mosaic.sticky}>
        <div data-mosaic-grid className={mosaic.grid}>
          {HERO_MOSAIC.slice(0, 4).map((p) => (
            <MosaicCell key={p.src} photo={p} />
          ))}
          {/* Centre: the Cinematic Hero slider; Osaka Castle settles in as the camera pulls back. */}
          <div className={mosaic.cell}>
            {slides.length > 0 ? (
              <CinematicHeroSlider slides={slides} heroId="home-hero" />
            ) : (
              <TbdImage value={{ status: "TBD", note: "Hero photos TBD" }} slot="Hero photos" />
            )}
            <div data-mosaic-castle className={mosaic.castle} aria-hidden>
              <Image src={HERO_MOSAIC_CENTER.src} alt="" fill sizes="100vw" className="object-cover" style={{ objectPosition: HERO_MOSAIC_CENTER.focus }} />
            </div>
            {/* Only as much shade as the text needs; it lifts with the text as the camera pulls back. */}
            <div data-mosaic-shade className="pointer-events-none absolute inset-0 z-[3]">
              <div className="absolute inset-0 bg-gradient-to-r from-navy-dark/60 via-navy-dark/15 via-45% to-transparent max-md:from-navy-dark/35 max-md:via-navy-dark/25 max-md:to-navy-dark/15" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/90 via-navy-dark/35 via-40% to-navy-dark/15 max-md:from-navy-dark/90 max-md:via-navy-dark/45 max-md:via-45%" />
            </div>
            <div className={`pointer-events-none absolute inset-0 z-[3] ${cinematic.veil}`} />
          </div>
          {HERO_MOSAIC.slice(4, 8).map((p) => (
            <MosaicCell key={p.src} photo={p} />
          ))}
        </div>
      </div>

      {/* Headline + CTAs: held on screen over the stage, faded by the scroll (HeroMosaicMotion). */}
      <div data-mosaic-content className={mosaic.content}>
        <div className={mosaic.contentSticky}>
          <div data-mosaic-copy className={`mx-auto w-full max-w-(--container-app) px-6 pb-20 md:px-12 md:pb-[13svh] ${openingStyles.heroCopy}`}>
            <div className="max-md:text-center">
              {words.length > 0 ? (
                // Same headline text; each word rises out of its own mask.
                <h1 className={HEADLINE_CLASS}>
                  {words.map((word, i) => (
                    <span key={i}>
                      <span className={mosaic.word}>
                        <span style={{ "--w": i } as CSSProperties}>{word}</span>
                      </span>
                      {i < words.length - 1 ? " " : null}
                    </span>
                  ))}
                </h1>
              ) : (
                <div {...line(0)}>
                  <TbdText value={hero.headline} slot="Hero headline" as="h1" className={HEADLINE_CLASS} />
                </div>
              )}
              <span aria-hidden className={mosaic.rule} />
              <div style={line(2).style} className={`${cinematic.line} mt-8 flex flex-col items-center gap-4 sm:flex-row max-md:justify-center md:mt-10`}>
                <CtaLink cta={hero.primaryCta} pair />
                {/* Same gold-outline CTA; a navy backing keeps it readable on bright photos. */}
                {hero.secondaryCta ? <CtaLink cta={hero.secondaryCta} pair className="bg-navy-dark/45 backdrop-blur-[2px]" /> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      <HeroMosaicMotion targetId="home-hero" />
    </section>
  );
}

/** Letters of a heading as masked spans (same text; screen readers read the heading's aria-label). */
function Letters({ text, attr = "data-wd-l" }: { text: string; attr?: string }) {
  return (
    <>
      {text.split(" ").map((word, w, words) => (
        <span key={w} className="inline-block whitespace-nowrap" aria-hidden>
          {[...word].map((ch, i) => (
            <span key={i} className="inline-block" {...{ [attr]: "" }}>
              {ch}
            </span>
          ))}
          {w < words.length - 1 ? "\u00a0" : null}
        </span>
      ))}
    </>
  );
}

/**
 * Section title for Home scenes: same heading and supporting copy as SectionTitle, set larger; the letters
 * flip up in 3D one after another with the scroll and a gold hand-drawn line is traced underneath
 * (components/wd). Falls back to SectionTitle while the heading is TBD.
 */
function SceneTitle({
  heading,
  supporting,
  slot,
  headingSizeClassName = "text-5xl md:text-7xl",
}: {
  heading: HomeContent["featuredExperiences"]["heading"];
  supporting?: HomeContent["featuredExperiences"]["supporting"];
  slot: string;
  headingSizeClassName?: string;
}) {
  if (heading.status === "TBD") return <SectionTitle heading={heading} supporting={supporting} slot={slot} headingSizeClassName={headingSizeClassName} />;
  return (
    <div className="mb-8 md:mb-12">
      <div className="mt-6 md:mt-14">
        <h2 data-wd-letters aria-label={heading.value} className={`ml-6 font-heading-en font-bold tracking-[0.08em] text-gold [perspective:600px] md:ml-10 ${headingSizeClassName}`}>
          <Letters text={heading.value} />
        </h2>
      </div>
      {supporting ? (
        <div {...reveal("up", 0.25, "mt-6")}>
          <TbdText value={supporting} slot={`${slot} supporting copy`} as="p" className="max-w-2xl text-sm leading-relaxed text-cream/75 md:text-base" />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Featured Experiences as a showreel scene (components/wd/ShowreelMotion): wide screens hold the stage
 * while a giant title assembles, a small window behind it opens onto the tour photo at full screen, then
 * the photo slides left and the tour panel arrives from the right. Same tour, copy, facts and CTAs.
 * One tour on sale (Human instruction 2026-11-13).
 */
function FeaturedExperiences({ section }: { section: HomeContent["featuredExperiences"] }) {
  const tour = getFeaturedTour();
  const item = "data-sr-item";
  return (
    <section id="experiences" data-showreel className="relative bg-navy md:h-[320svh]">
      <div className="flex flex-col pt-14 md:block md:sticky md:top-0 md:h-svh md:overflow-clip md:pt-0">
        {/* The window onto the tour photo (opens to full bleed, then slides left). */}
        <div data-sr-photo data-cursor="photo" className="relative mx-5 aspect-[3/2] overflow-hidden md:absolute md:inset-0 md:mx-0 md:aspect-auto">
          <div data-sr-cam className="absolute inset-0 will-change-transform">
            <Image src={tour.image.src} alt={tour.image.alt} fill sizes="100vw" className="object-cover" style={{ objectPosition: tour.imagePosition }} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/45 via-transparent to-navy-dark/25" />
        </div>
        {/* Navy behind the panel once the photo has moved left. */}
        <div data-sr-shade aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] bg-gradient-to-r from-navy-dark/0 via-navy to-navy md:block md:opacity-0" />

        {/* Giant title (difference blend: it inverts over the photo as the window opens behind it). */}
        <div data-sr-title className="pointer-events-none order-first px-5 md:absolute md:inset-0 md:flex md:flex-col md:items-center md:justify-center md:px-0 md:mix-blend-difference">
          {section.heading.status === "TBD" ? (
            <SectionTitle heading={section.heading} supporting={section.supporting} slot="Featured Experiences" />
          ) : (
            <>
              <h2
                aria-label={section.heading.value}
                className="mb-6 font-heading-en text-[clamp(2.4rem,12vw,4rem)] leading-[0.92] font-bold tracking-[0.02em] text-gold [perspective:900px] md:mb-0 md:text-center md:text-[min(11.5vw,13rem)] md:text-cream"
              >
                <Letters text={section.heading.value} attr="data-sr-l" />
              </h2>
              {section.supporting ? (
                <TbdText value={section.supporting} slot="Featured Experiences supporting copy" as="p" className="mb-8 max-w-2xl text-sm leading-relaxed text-cream/75 md:mt-8 md:mb-0 md:text-center md:text-base" />
              ) : null}
            </>
          )}
        </div>

        {/* The tour panel. */}
        <div data-sr-panel className="flex flex-col gap-6 px-5 py-10 md:absolute md:inset-y-0 md:right-0 md:w-[46%] md:justify-center md:px-12 md:py-0 lg:px-16 xl:pr-24">
          <h3 {...{ [item]: "" }} className="font-heading-en text-2xl leading-snug tracking-wide text-gold md:text-[2.1rem] md:leading-[1.2]">
            {tour.title}
          </h3>
          <p {...{ [item]: "" }} className="text-sm leading-relaxed text-cream/80 md:text-[0.98rem]">
            {tour.summary}
          </p>
          <dl {...{ [item]: "" }} className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-cream/15 pt-6 text-sm">
            {tour.facts.map((f) => (
              <div key={f.label}>
                <dt className="font-heading-en text-[11px] tracking-[0.15em] text-cream/45 uppercase">{f.label}</dt>
                <dd className="mt-1 text-cream/90">{f.value}</dd>
              </div>
            ))}
          </dl>
          <div {...{ [item]: "" }} className="flex flex-col gap-3 pt-2 sm:flex-row md:flex-col xl:flex-row">
            <CtaLink cta={tour.detailCta} pair />
            <CtaLink cta={tour.bookingCta} pair />
          </div>
          {V1_PREVIEW ? (
            <p {...{ [item]: "" }} className="text-[11px] text-cream/45">
              Preview: booking requests for this tour are not open yet, so the booking button is inactive.
            </p>
          ) : null}
        </div>
      </div>
      <ShowreelMotion targetId="experiences" />
    </section>
  );
}

/** Text-only summary of what the request form lets travellers choose (Human instruction 2026-11-13). */
const PRIVATE_DAY_OPTIONS: { label: string; items: string[] }[] = [
  { label: "DESTINATIONS", items: PLAN_AREAS.map((k) => textOr(AREA_LABELS[k], k)) },
  { label: "EXPERIENCES", items: PLAN_INTERESTS.map((k) => textOr(ACTIVITY_LABELS[k], k)) },
  { label: "DURATION", items: PLAN_DURATIONS.map((d) => d.label) },
  { label: "TRAVEL STYLE", items: PLAN_STYLES.map((s) => s.label) },
];

function PrivateGuide({ section }: { section: HomeContent["privateGuide"] }) {
  // Choices are made in the request form, not here: the CTA opens it directly.
  const cta = { ...section.cta, href: `${section.cta.href}#request` };
  // Public mode: no photo while its licence is undecided; the text then stands alone.
  const showPhoto = V1_PREVIEW || section.image.status !== "TBD";
  return (
    /*
     * Scene (Human instruction 2026-11-14): left text, right a large photo that bleeds to the screen edge.
     * Wide screens: the photo opens from the right edge with the scroll (--p) while its camera eases back
     * and drifts (parallax); the heading rises out of a mask once the photo is under way, then copy → options → CTA.
     * Phones (< md, 2026-11-15): the same photo lies under the whole section, behind a navy veil, and the
     * text sits on it (no separate photo block). Wide screens are unchanged.
     */
    <section id="private-guide" className="relative isolate overflow-hidden bg-navy-dark md:h-[240svh] md:overflow-visible">
      <div className="relative flex md:sticky md:top-0 md:h-svh md:items-center md:overflow-clip">
        {showPhoto ? (
          // Wide screens: the night street assembles from seven vertical strips that rise out of order, then the camera eases back.
          <div data-pg-photo className="absolute inset-y-0 right-0 -z-10 hidden w-[58%] md:flex" data-cursor="photo">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} data-pg-strip className="relative -mr-px h-full flex-1 overflow-hidden" aria-hidden={i > 0 || undefined}>
                <div data-pg-cam className="absolute inset-y-0" style={{ width: "700%", left: `${-i * 100}%` }}>
                  <TbdImage value={section.image} slot="Private Guide photo" sizes="58vw" />
                </div>
              </div>
            ))}
            {/* The photo dissolves into the navy on the text side. */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-dark via-navy-dark/45 via-30% to-transparent to-60%" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-dark/55 via-transparent via-30%" />
          </div>
        ) : null}
        {showPhoto ? (
          // Phones only: the night street as the section background. Lamps and the street sit low in the frame, under the options and the CTA.
          <div className="absolute inset-0 -z-10 md:hidden" aria-hidden>
            <TbdImage value={section.image} slot="Private Guide photo" sizes="100vw" className="object-[64%_center]" />
            {/* Black veil (about 40%) for legible white text; the navy gradient is lighter in the middle so the lights still show. */}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-b from-navy-dark from-[4%] via-navy-dark/25 via-40% to-navy-dark/55" />
          </div>
        ) : null}
        <Container className="py-14 md:py-0">
          {/* Phones: a soft shadow keeps the words clear of the lights in the photo. */}
          <div className={showPhoto ? "max-md:[text-shadow:0_1px_14px_rgba(8,20,36,0.85)] max-md:[&_a]:[text-shadow:none] md:max-w-[46%]" : undefined}>
            <SceneTitle heading={section.heading} supporting={section.supporting} slot="Private Guide" headingSizeClassName="text-[2.5rem] leading-tight md:text-6xl" />
            <p data-pg-item className="-mt-4 mb-6 max-w-xl text-sm leading-relaxed text-cream/80 max-md:text-cream/90 md:-mt-6">
              {PRIVATE_DAY_DESCRIPTION}
            </p>
            {/* Phones: Duration and Travel Style share a row (two columns); wide screens keep one column. */}
            <dl className="grid max-w-xl grid-cols-2 gap-x-5 gap-y-3.5 md:flex md:flex-col md:gap-4">
              {PRIVATE_DAY_OPTIONS.map((group, i) => (
                <div key={group.label} data-pg-item className={i < 2 ? "col-span-2" : ""}>
                  {/* A gold rule is drawn across before each group appears (wide screens). */}
                  <span data-pg-line aria-hidden className="mb-2.5 hidden h-px w-full origin-left bg-gradient-to-r from-gold/70 to-gold/0 md:block" />
                  <dt className="font-heading-en text-[11px] tracking-[0.2em] text-gold/80 max-md:text-gold">{group.label}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-cream/80 max-md:text-cream/90">
                    {/* Phones: a line breaks only between choices ("8 Hours" stays whole). */}
                    {group.items.map((item, j) => (
                      <span key={item}>
                        {j > 0 ? " · " : null}
                        <span className="max-md:whitespace-nowrap">{item}</span>
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
            <div data-pg-item className="mt-8 flex flex-wrap gap-4">
              {/* Phones: full width. Same link, label and behaviour. */}
              <CtaLink cta={cta} pair className="max-md:w-full" />
              {section.learnMore ? <CtaLink cta={section.learnMore} /> : null}
            </div>
          </div>
        </Container>
      </div>
      <PrivateGuideMotion targetId="private-guide" />
    </section>
  );
}

/**
 * OUR VALUE (W1-D07, WORKING_BASELINE): same layout as the current site's
 * ValueSection — SectionHeading, 1 / 2 / 3-column grid, reused ValueCard.
 * The current site's CTA (to /reservation) is not ported.
 */
function WhyConnectrip({ section }: { section: HomeContent["whyConnectrip"] }) {
  // OUR VALUE Cinematic Section (Human instruction 2026-11-15, approved prototype). The plain
  // grid below stays as the fallback while the heading or the cards are still TBD.
  if (section.heading.status !== "TBD" && section.items.status !== "TBD") {
    return (
      <OurValueCinematicSection
        id="value"
        heading={section.heading.value}
        lead={section.supporting && section.supporting.status !== "TBD" ? section.supporting.value : undefined}
        cards={section.items.value.map((item) => ({
          title: textOr(item.title, ""),
          description: textOr(item.description, ""),
          image:
            item.image && item.image.status !== "TBD"
              ? { src: item.image.value.src, alt: item.image.value.alt }
              : { src: "", alt: "" },
        }))}
      />
    );
  }
  return (
    <section id="value" className="bg-navy-dark py-12 md:py-20">
      <Container>
        {section.heading.status === "TBD" ? (
          <SectionTitle heading={section.heading} supporting={section.supporting} slot="OUR VALUE" />
        ) : (
          <SectionHeading
            heading={section.heading.value}
            subheading={section.supporting && section.supporting.status !== "TBD" ? section.supporting.value : undefined}
          />
        )}
        {section.items.status === "TBD" ? (
          <TbdBlock value={section.items} slot="OUR VALUE items" />
        ) : (
          // 1 / 2 / 3 columns (3 × 2 on wide screens). The six cards fade in once, 0.1 s apart, as the grid scrolls in.
          <div {...revealGroup} className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3">
            {section.items.value.map((item, i) => (
              <ValueCard
                key={i}
                {...reveal("up", i * 0.1)}
                number={String(i + 1).padStart(2, "0")}
                title={textOr(item.title, "")}
                description={textOr(item.description, "")}
                image={item.image && item.image.status !== "TBD" ? item.image.value.src : ""}
                alt={item.image && item.image.status !== "TBD" ? item.image.value.alt : undefined}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

function HowItWorks({ section }: { section: HomeContent["howItWorks"] }) {
  // Pinned step-by-step scene (components/wd/HowItWorksScene); the plain two-box layout stays as the TBD fallback.
  if (section.heading.status !== "TBD") return <HowItWorksScene id="how-it-works" heading={section.heading.value} flows={section.flows} />;
  return (
    <Section id="how-it-works">
      <SceneTitle heading={section.heading} slot="How It Works" />
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sequential storytelling: each box's steps appear one after another. */}
        <FlowSteps flow={section.flows.readyMade} sequence />
        <FlowSteps flow={section.flows.privateGuide} sequence />
      </div>
    </Section>
  );
}

/**
 * Explore Kansai (2-Slide Redesign V1, 2026-11-15): two cinematic slides,
 * Connectrip Japan Select and Kansai Travel Updates
 * (components/explore/ExploreKansaiSlides.tsx). Preview only, like the rest
 * of Explore. The previous one-slide version (Journal design) is
 * KansaiTravelJournal with getExploreHomeSection(), kept for comparison.
 */
function TravelGuide() {
  return <ExploreKansaiSlides data={getExploreHomeSlides()} id="explore-kansai" />;
}

/**
 * SNS (W1-D08), minimal slide since 2026-11-15 (components/sns/SnsSlide.tsx).
 * Accounts and their URLs come from the content model (`socialLinks`) unchanged.
 */
function Sns({ section }: { section: NonNullable<HomeContent["sns"]> }) {
  return <SnsSlide accounts={section.accounts.map((a) => ({ platform: a.platform, label: textOr(a.label, ""), href: a.href }))} />;
}

function FinalCta({ section, trail }: { section: HomeContent["finalCta"]; trail: string[] }) {
  const image = section.image && section.image.status !== "TBD" ? section.image.value : undefined;
  return (
    // Closing scene (White Desert fixed banner): a rounded window opens to full bleed onto a picture that
    // stays still while the page slides over it; heading → copy → CTAs rise, then the picture darkens as it leaves.
    <section
      id="final-cta"
      data-fixed-banner
      {...revealGroupLate}
      className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-navy md:min-h-[100svh]"
    >
      {image ? (
        <div data-fb-frame className="absolute inset-0 bg-navy-dark [clip-path:inset(0)]">
          <div data-fb-media data-cursor="photo" className="fixed inset-0 h-lvh w-full">
            <PlaceholderImage src={image.src} alt={image.alt} sizes="100vw" />
            <div data-fb-dim className="absolute inset-0 bg-navy-dark opacity-70" />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-navy-dark/70" />
      )}
      <FixedBannerMotion targetId="final-cta" />
      {/* Moving the mouse leaves a trail of the Hero's Kansai photos. */}
      <ImageTrail targetId="final-cta" images={trail} />
      <div data-fb-copy className="pointer-events-none relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center [&_a]:pointer-events-auto">
        {section.heading.status === "TBD" ? (
          <TbdText value={section.heading} slot="Final CTA heading" as="h2" className="font-heading-jp text-3xl leading-snug text-cream md:text-5xl" />
        ) : (
          <KineticCta
            text={section.heading.value}
            className="font-heading-jp text-[clamp(2.4rem,9.5vw,3.4rem)] leading-[1.02] text-cream drop-shadow-[0_4px_40px_rgba(5,11,24,0.55)] md:text-[clamp(4rem,8.4vw,9rem)] md:leading-[0.98]"
          />
        )}
        {section.supporting ? (
          <div {...reveal("up", 0.4)}>
            <TbdText value={section.supporting} slot="Final CTA supporting copy" as="p" className="text-sm leading-loose text-cream/85 md:text-base" />
          </div>
        ) : null}
        <div {...reveal("up", 0.55, "mt-4 flex flex-col items-center gap-4 sm:flex-row")}>
          <CtaLink cta={section.browseExperiences} pair />
          <CtaLink cta={section.planPrivateDay} pair />
        </div>
      </div>
    </section>
  );
}

export function HomeView({ vm }: { vm: HomeViewModel }) {
  const c = vm.content;
  const order = c.sectionOrder.status === "TBD" ? BASELINE_ORDER : c.sectionOrder.value;

  const sections: Record<HomeSectionKey, ReactNode | null> = {
    hero: <Hero hero={c.hero} />,
    featuredExperiences: <FeaturedExperiences section={c.featuredExperiences} />,
    privateGuide: <PrivateGuide section={c.privateGuide} />,
    whyConnectrip: <WhyConnectrip section={c.whyConnectrip} />,
    howItWorks: <HowItWorks section={c.howItWorks} />,
    travelGuide: <TravelGuide />,
    // On hold since T-05 (W1-D05). Rendered only when content provides it.
    socialProof: c.socialProof ? (
      <Section id="social-proof">
        <SocialProofBlock content={c.socialProof} />
      </Section>
    ) : null,
    sns: c.sns ? <Sns section={c.sns} /> : null,
    finalCta: <FinalCta section={c.finalCta} trail={[...(c.hero.images.status === "TBD" ? [] : c.hero.images.value.map((p) => p.src)), ...TRAIL_EXTRA_IMAGES]} />,
  };

  return (
    <>
      {/* Scroll motion for the sections below the Hero (components/motion). The Hero does not use it. */}
      <RevealObserver />
      {order.map((key) =>
        sections[key] && (V1_PREVIEW || !PREVIEW_ONLY_SECTIONS.has(key)) ? (
          <div key={key} data-home-section={key}>
            {sections[key]}
            {/* Scene change: navy mist stands up over the end of the mosaic as the next scene arrives. */}
            {key === "hero" ? <MistRise /> : null}
            {/* The prefectures of Kansai, between the tour and the private day (content/prefectures.ts). */}
            {key === "featuredExperiences" ? <PrefectureScene id="kansai-prefectures" prefectures={KANSAI_PREFECTURES} /> : null}
          </div>
        ) : null,
      )}
      {/* Cinematic Globe Philosophy (preview only, Human instruction 2026-11-14): after all Home content, right before the footer. */}
      <PhilosophySection />
    </>
  );
}
