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
import { heroFocus, heroMeta } from "../assets/heroImages";
import { V1_PREVIEW } from "../config";
import { HomeOpeningExperience } from "../components/opening/HomeOpeningExperience";
import openingStyles from "../components/opening/HomeOpeningExperience.module.css";
import { SocialProofBlock } from "./SocialProofBlock";
import cinematic from "../components/hero/CinematicHero.module.css";
import { parallax, reveal, revealGroup, revealGroupLate, revealStyles, sceneProgress } from "../components/motion/reveal";
import { RevealObserver } from "../components/motion/RevealObserver";
import { CinematicHeroParallax } from "../components/hero/CinematicHeroParallax";
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
  "whyConnectrip",
  "howItWorks",
  "travelGuide",
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
function Hero({ hero }: { hero: HomeContent["hero"] }) {
  const photos = hero.images.status === "TBD" ? [] : hero.images.value;
  const first = photos[0];
  const slides = photos.map((p) => {
    const meta = heroMeta(p.src);
    return { src: p.src, alt: p.alt, focus: meta?.focus, focusMobile: meta?.focusMobile, location: meta?.location ?? "" };
  });
  const line = (i: number) => ({ className: cinematic.line, style: { "--i": i } as CSSProperties });
  return (
    <section
      id="home-hero"
      data-v1-hero
      // Full screen under the sticky header; the preview banner (preview mode only) is subtracted too.
      className={`relative isolate flex min-h-[540px] touch-pan-y items-end overflow-hidden bg-navy-dark md:min-h-[600px] ${
        V1_PREVIEW ? "h-[calc(100svh-8.9rem)] md:h-[calc(100svh-7rem)]" : "h-[calc(100svh-4.5rem)] md:h-[calc(100svh-5rem)]"
      }`}
    >
      {/* Home Opening Experience (W1-D21): overlay on top; the Hero below is always in the HTML. */}
      {first ? <HomeOpeningExperience image={{ src: first.src, focus: heroFocus(first.src) }} /> : null}
      {slides.length > 0 ? (
        <>
          <CinematicHeroSlider slides={slides} heroId="home-hero" />
          <CinematicHeroParallax targetId="home-hero" />
        </>
      ) : (
        <TbdImage value={{ status: "TBD", note: "Hero photos TBD" }} slot="Hero photos" />
      )}
      {/* Only as much shade as the text needs: from the left behind the headline, and a low band for the label / next section. */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-navy-dark/60 via-navy-dark/15 via-45% to-transparent max-md:from-navy-dark/35 max-md:via-navy-dark/25 max-md:to-navy-dark/15" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-navy-dark/90 via-navy-dark/35 via-40% to-navy-dark/15 max-md:from-navy-dark/90 max-md:via-navy-dark/45 max-md:via-45%" />
      <div className={`pointer-events-none absolute inset-0 -z-10 ${cinematic.veil}`} />

      <div className={`mx-auto w-full max-w-(--container-app) px-6 pb-20 md:px-12 md:pb-[13svh] ${cinematic.copyParallax} ${openingStyles.heroCopy}`}>
        <div className="max-md:text-center">
          <div {...line(0)}>
            <TbdText
              value={hero.headline}
              slot="Hero headline"
              as="h1"
              // Two lines, broken after "Kansai": a compact block that stays clear of the subjects (lower left).
              className="max-w-[9.4em] font-heading-jp text-[clamp(2.25rem,9.6vw,3rem)] leading-[1.08] text-cream drop-shadow-[0_2px_28px_rgba(5,11,24,0.6)] max-md:mx-auto md:text-[clamp(2.9rem,4.4vw,4.9rem)]"
            />
          </div>
          <div style={line(2).style} className={`${cinematic.line} mt-8 flex flex-col items-center gap-4 sm:flex-row max-md:justify-center md:mt-10`}>
            <CtaLink cta={hero.primaryCta} pair />
            {/* Same gold-outline CTA; a navy backing keeps it readable on bright photos. */}
            {hero.secondaryCta ? <CtaLink cta={hero.secondaryCta} pair className="bg-navy-dark/45 backdrop-blur-[2px]" /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Section title for Home scenes: same markup and classes as SectionTitle / SectionHeading, but the heading
 * rises out of a mask and the supporting line follows (components/motion). Falls back to SectionTitle while
 * the heading is TBD.
 */
function SceneTitle({
  heading,
  supporting,
  slot,
  headingSizeClassName = "text-5xl md:text-6xl",
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
        <h2 {...reveal("title", 0, `ml-6 font-heading-en font-bold tracking-[0.08em] text-gold md:ml-10 ${headingSizeClassName}`)}>{heading.value}</h2>
      </div>
      {supporting ? (
        <div {...reveal("up", 0.25, "mt-4")}>
          <TbdText value={supporting} slot={`${slot} supporting copy`} as="p" className="max-w-2xl text-sm leading-relaxed text-cream/75 md:text-base" />
        </div>
      ) : null}
    </div>
  );
}

function FeaturedExperiences({ section }: { section: HomeContent["featuredExperiences"] }) {
  // One tour on sale (Human instruction 2026-11-13): a single wide card replaces
  // the three DEMO cards and the "Explore All Experiences" link (no live page yet).
  const tour = getFeaturedTour();
  return (
    <Section id="experiences">
      {/* "Experiences" is one long word at 48px: scale it down below ~410px so it fits 320px screens. */}
      <SceneTitle
        heading={section.heading}
        supporting={section.supporting}
        slot="Featured Experiences"
        headingSizeClassName="text-[clamp(2rem,calc(14vw-0.6rem),3rem)] md:text-6xl"
      />
      {/* Editorial reveal: the frame fades in, the photo opens from the left and settles, then title → copy → facts → CTAs. */}
      <div
        {...revealGroup}
        {...reveal("fade", 0, `mx-auto grid max-w-6xl overflow-hidden border border-gold/30 bg-navy-dark/40 lg:grid-cols-[1.12fr_1fr] ${revealStyles.hoverArea}`)}
      >
        <div {...reveal("maskFromLeft", 0.1, "relative aspect-[3/2] overflow-hidden lg:aspect-auto lg:min-h-[480px]")}>
          <div className={`absolute inset-0 ${revealStyles.settle}`}>
            {/* Depth: the photo is a little taller than its frame and drifts slower than the page. */}
            <div {...parallax(0.05)} className={`absolute inset-x-0 -inset-y-[7%] ${revealStyles.drift}`}>
            <div className={`absolute inset-0 ${revealStyles.hoverPhoto}`}>
              <Image
                src={tour.image.src}
                alt={tour.image.alt}
                fill
                sizes="(min-width: 1280px) 620px, (min-width: 1024px) 53vw, 100vw"
                className="object-cover"
                style={{ objectPosition: tour.imagePosition }}
              />
            </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:p-10 xl:p-12">
          <h3 {...reveal("up", 0.45, "font-heading-en text-2xl leading-snug tracking-wide text-gold md:text-[1.65rem]")}>{tour.title}</h3>
          <p {...reveal("up", 0.6, "text-sm leading-relaxed text-cream/80 md:text-[0.95rem]")}>{tour.summary}</p>
          <dl {...reveal("up", 0.75, "grid grid-cols-2 gap-x-6 gap-y-4 border-t border-cream/15 pt-6 text-sm")}>
            {tour.facts.map((f) => (
              <div key={f.label}>
                <dt className="font-heading-en text-[11px] tracking-[0.15em] text-cream/45 uppercase">{f.label}</dt>
                <dd className="mt-1 text-cream/90">{f.value}</dd>
              </div>
            ))}
          </dl>
          <div {...reveal("up", 0.9, "mt-auto flex flex-col gap-3 pt-2 sm:flex-row")}>
            <CtaLink cta={tour.detailCta} pair />
            <CtaLink cta={tour.bookingCta} pair />
          </div>
          {V1_PREVIEW ? (
            <p {...reveal("fade", 1.05, "text-[11px] text-cream/45")}>Preview: booking requests for this tour are not open yet, so the booking button is inactive.</p>
          ) : null}
        </div>
      </div>
    </Section>
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
    <section id="private-guide" className="relative isolate flex overflow-hidden bg-navy-dark md:min-h-[calc(100svh-5rem)] md:items-center">
      {showPhoto ? (
        <div {...sceneProgress(0.8)} className={`absolute inset-y-0 right-0 -z-10 hidden w-[58%] md:block ${revealStyles.wipeFromRight}`}>
          <div {...sceneProgress(0.8)} {...parallax(0.08)} className={`absolute inset-x-0 -inset-y-[9%] ${revealStyles.sceneCamera}`}>
            <TbdImage value={section.image} slot="Private Guide photo" sizes="(min-width: 768px) 58vw, 100vw" />
          </div>
          {/* The photo dissolves into the navy on the text side. */}
          <div className="absolute inset-0 bg-gradient-to-r from-navy-dark via-navy-dark/45 via-30% to-transparent to-60%" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/55 via-transparent via-30%" />
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
      <Container className="py-14 md:py-24">
        {/* Phones: a soft shadow keeps the words clear of the lights in the photo. */}
        <div {...revealGroupLate} className={showPhoto ? "max-md:[text-shadow:0_1px_14px_rgba(8,20,36,0.85)] max-md:[&_a]:[text-shadow:none] md:max-w-[46%]" : undefined}>
          <SceneTitle heading={section.heading} supporting={section.supporting} slot="Private Guide" headingSizeClassName="text-[2.5rem] leading-tight md:text-5xl" />
          <p {...reveal("up", 0.4, "-mt-4 mb-6 max-w-xl text-sm leading-relaxed text-cream/80 max-md:text-cream/90 md:-mt-8")}>{PRIVATE_DAY_DESCRIPTION}</p>
          {/* Phones: Duration and Travel Style share a row (two columns); wide screens keep one column. */}
          <dl className="grid max-w-xl grid-cols-2 gap-x-5 gap-y-3.5 md:flex md:flex-col md:gap-3.5">
            {PRIVATE_DAY_OPTIONS.map((group, i) => (
              <div key={group.label} {...reveal("up", 0.55 + i * 0.1, i < 2 ? "col-span-2" : "")}>
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
          <div {...reveal("up", 1.05, "mt-8 flex flex-wrap gap-4")}>
            {/* Phones: full width. Same link, label and behaviour. */}
            <CtaLink cta={cta} pair className="max-md:w-full" />
            {section.learnMore ? <CtaLink cta={section.learnMore} /> : null}
          </div>
        </div>
      </Container>
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

function FinalCta({ section }: { section: HomeContent["finalCta"] }) {
  const image = section.image && section.image.status !== "TBD" ? section.image.value : undefined;
  return (
    // Closing scene: the photo settles from a slight zoom while heading → copy → CTAs rise.
    <section {...revealGroupLate} className="relative flex min-h-[440px] items-center justify-center overflow-hidden bg-navy md:min-h-[560px]">
      {image ? (
        // Wide screens: the picture starts as a framed print and grows to full bleed with the scroll, its camera easing back.
        <div {...sceneProgress(0.9)} className={`absolute inset-0 bg-navy-dark ${revealStyles.insetExpand}`}>
          <div {...sceneProgress(0.9)} {...parallax(0.06)} className={`absolute inset-x-0 -inset-y-[10%] ${revealStyles.sceneCamera}`}>
            <PlaceholderImage src={image.src} alt={image.alt} sizes="100vw" />
          </div>
          <div className="absolute inset-0 bg-navy-dark/70" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-navy-dark/70" />
      )}
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center">
        <div {...reveal("title", 0.1)}>
          <TbdText value={section.heading} slot="Final CTA heading" as="h2" className="font-heading-jp text-3xl leading-snug text-cream md:text-5xl" />
        </div>
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
    finalCta: <FinalCta section={c.finalCta} />,
  };

  return (
    <>
      {/* Scroll motion for the sections below the Hero (components/motion). The Hero does not use it. */}
      <RevealObserver />
      {order.map((key) =>
        sections[key] && (V1_PREVIEW || !PREVIEW_ONLY_SECTIONS.has(key)) ? (
          <div key={key} data-home-section={key}>
            {sections[key]}
            {/* Scene change (wide screens): as the page leaves the Hero, the navy of the next scene rises over its last frame. Invisible at the top of the page. */}
            {key === "hero" ? (
              <div className="pointer-events-none relative z-[5] h-0" aria-hidden>
                <div
                  {...sceneProgress(0.7)}
                  data-progress-from="top"
                  className={`absolute inset-x-0 bottom-0 h-[46svh] bg-gradient-to-t from-navy from-8% via-navy/75 via-45% to-transparent ${revealStyles.dusk}`}
                />
              </div>
            ) : null}
          </div>
        ) : null,
      )}
      {/* Cinematic Globe Philosophy (preview only, Human instruction 2026-11-14): after all Home content, right before the footer. */}
      <PhilosophySection />
    </>
  );
}
