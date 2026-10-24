import type { ReactNode } from "react";
import type { HomeContent, HomeSectionKey, HomeViewModel } from "@/contracts";
import { FadeIn } from "@/components/ui/FadeIn";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { HeroBackgroundSlider } from "@/components/sections/HeroBackgroundSlider";
import { Section, SectionTitle, TbdBlock } from "../components/Blocks";
import { ArticleCard, ExperienceCard, PersonCard } from "../components/Cards";
import { CtaLink } from "../components/CtaLink";
import { FlowSteps } from "../components/FlowSteps";
import { TbdImage, TbdMark, TbdText } from "../components/Tbd";
import { SocialProofBlock } from "./SocialProofBlock";

/** Used only while `sectionOrder` is TBD (T-05 Home Working Baseline). */
const BASELINE_ORDER: HomeSectionKey[] = [
  "hero",
  "featuredExperiences",
  "privateGuide",
  "whyConnectrip",
  "howItWorks",
  "travelGuide",
  "finalCta",
];

function Hero({ hero }: { hero: HomeContent["hero"] }) {
  return (
    <section className="relative flex min-h-[620px] items-center justify-center overflow-hidden md:h-[88vh]">
      {hero.images.status === "TBD" ? (
        <TbdImage value={hero.images} slot="Hero photos" />
      ) : (
        <HeroBackgroundSlider images={hero.images.value.map((i) => i.src)} alts={hero.images.value.map((i) => i.alt)} />
      )}
      <div className="absolute inset-0 bg-navy-dark/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/90 via-navy-dark/5 to-transparent" />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-20 text-center">
        {hero.core.length > 0 ? (
          <FadeIn delay={0.2}>
            <ul className="flex flex-wrap justify-center gap-2">
              {hero.core.map((item) => (
                <li key={item.key}>
                  <TbdText value={item.label} slot={`Core: ${item.key}`} className="font-heading-en text-xs tracking-[0.3em] text-gold" />
                </li>
              ))}
            </ul>
          </FadeIn>
        ) : null}
        <FadeIn delay={0.4}>
          <TbdText value={hero.headline} slot="Hero headline" as="h1" className="font-heading-jp text-5xl leading-tight text-cream md:text-7xl" />
        </FadeIn>
        <FadeIn delay={0.6}>
          <TbdText value={hero.supporting} slot="Hero supporting copy" as="p" className="text-sm leading-loose text-cream/85 md:text-base" />
        </FadeIn>
        {hero.positioning ? (
          <FadeIn delay={0.7}>
            <TbdText value={hero.positioning} slot="Positioning line" as="p" className="text-sm text-cream/70" />
          </FadeIn>
        ) : null}
        <FadeIn delay={0.9} className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <CtaLink cta={hero.primaryCta} />
          {hero.secondaryCta ? <CtaLink cta={hero.secondaryCta} /> : null}
        </FadeIn>
      </div>
    </section>
  );
}

function FeaturedExperiences({ section }: { section: HomeContent["featuredExperiences"] }) {
  return (
    <Section id="experiences">
      <SectionTitle heading={section.heading} supporting={section.supporting} slot="Featured Experiences" />
      {section.items.length === 0 ? (
        <TbdBlock value={{ status: "TBD", note: "No approved Ready-made Experiences yet" }} slot="Experiences" />
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {section.items.map((item, i) => (
            <ExperienceCard key={item.id} item={item} delay={i * 0.1} />
          ))}
        </div>
      )}
      <div className="mt-10">
        <CtaLink cta={section.viewAll} />
      </div>
    </Section>
  );
}

function PrivateGuide({ section }: { section: HomeContent["privateGuide"] }) {
  return (
    <Section id="private-guide" tone="navy-dark">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <SectionTitle heading={section.heading} supporting={section.supporting} slot="Private Guide" />
          {section.points ? (
            section.points.status === "TBD" ? (
              <TbdMark slot="Private Guide points" note={section.points.note} />
            ) : (
              <ul className="flex flex-col gap-2 text-sm text-cream/80">
                {section.points.value.map((p) => (
                  <li key={p}>— {p}</li>
                ))}
              </ul>
            )
          ) : null}
          {section.areas ? (
            <div className="mt-6">
              <p className="mb-3 font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">WHERE</p>
              <ul className="flex flex-wrap gap-2">
                {section.areas.map((area) => (
                  <li key={area.key} className="border border-gold/40 px-3 py-1.5 text-xs text-gold">
                    <TbdText value={area.label} slot={`Area: ${area.key}`} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {section.interests ? (
            <div className="mt-6">
              <p className="mb-3 font-heading-en text-xs tracking-[0.2em] text-cream/50 italic">INTERESTS</p>
              <ul className="flex flex-wrap gap-2">
                {section.interests.map((interest) => (
                  <li key={interest.key} className="border border-cream/20 px-3 py-1.5 text-xs text-cream/85">
                    <TbdText value={interest.label} slot={`Interest: ${interest.key}`} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-4">
            <CtaLink cta={section.cta} />
            {section.learnMore ? <CtaLink cta={section.learnMore} /> : null}
          </div>
        </div>
        <FadeIn className="relative aspect-[4/3] overflow-hidden border border-gold/30">
          <TbdImage value={section.image} slot="Private Guide photo" sizes="(min-width: 768px) 50vw, 100vw" />
        </FadeIn>
      </div>
    </Section>
  );
}

function WhyConnectrip({ section }: { section: HomeContent["whyConnectrip"] }) {
  return (
    <Section id="why">
      <SectionTitle heading={section.heading} slot="Why Connectrip" />
      {section.items.status === "TBD" ? (
        <TbdBlock value={section.items} slot="USP items" />
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {section.items.value.map((item, i) => (
            // ValueCard styling (number in red, title in gold) without a photo.
            <FadeIn key={i} delay={i * 0.1} className="flex flex-col gap-4 border border-gold/30 bg-navy-dark/40 p-6 md:p-8">
              <p className="font-medium text-gold text-lg md:text-xl">
                <span className="text-red">{i + 1}.</span> <TbdText value={item.title} slot="Pillar title" />
              </p>
              <TbdText value={item.description} slot="Pillar description" as="p" className="text-sm leading-relaxed text-cream/80" />
            </FadeIn>
          ))}
        </div>
      )}
    </Section>
  );
}

/** On hold since T-05 (W1-D05). Rendered only when content provides it. */
function Guides({ section }: { section: NonNullable<HomeContent["guides"]> }) {
  return (
    <Section id="guides" tone="navy-dark">
      <SectionTitle heading={section.heading} slot="Meet Our Guides" />
      <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
        {section.people.map((person, i) => (
          <PersonCard key={person.id} person={person} delay={i * 0.1} />
        ))}
      </div>
      {section.aboutLink ? (
        <div className="mt-10">
          <CtaLink cta={section.aboutLink} />
        </div>
      ) : null}
    </Section>
  );
}

function HowItWorks({ section }: { section: HomeContent["howItWorks"] }) {
  return (
    <Section id="how-it-works">
      <SectionTitle heading={section.heading} slot="How It Works" />
      <div className="grid gap-6 md:grid-cols-2">
        <FlowSteps flow={section.flows.readyMade} />
        <FlowSteps flow={section.flows.privateGuide} />
      </div>
      <div className="mt-10">
        <CtaLink cta={section.link} variant="text" />
      </div>
    </Section>
  );
}

function TravelGuide({ section }: { section: HomeContent["travelGuide"] }) {
  return (
    <Section id="travel-guide" tone="navy-dark">
      <SectionTitle heading={section.heading} supporting={section.supporting} slot="Osaka Travel Guide" />
      {section.articles.length === 0 ? (
        <TbdBlock value={{ status: "TBD", note: "No articles yet" }} slot="Articles" />
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          {section.articles.map((item, i) => (
            <ArticleCard key={item.id} item={item} delay={i * 0.1} />
          ))}
        </div>
      )}
      <div className="mt-10">
        <CtaLink cta={section.viewAll} />
      </div>
    </Section>
  );
}

function FinalCta({ section }: { section: HomeContent["finalCta"] }) {
  const image = section.image && section.image.status !== "TBD" ? section.image.value : undefined;
  return (
    <section className="relative flex min-h-[440px] items-center justify-center overflow-hidden md:min-h-[520px]">
      {image ? <PlaceholderImage src={image.src} alt={image.alt} sizes="100vw" /> : null}
      <div className="absolute inset-0 bg-navy-dark/70" />
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center">
        <TbdText value={section.heading} slot="Final CTA heading" as="h2" className="font-heading-jp text-3xl leading-snug text-cream md:text-5xl" />
        {section.supporting ? (
          <TbdText value={section.supporting} slot="Final CTA supporting copy" as="p" className="text-sm leading-loose text-cream/85 md:text-base" />
        ) : null}
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <CtaLink cta={section.browseExperiences} />
          <CtaLink cta={section.planPrivateDay} />
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
    guides: c.guides ? <Guides section={c.guides} /> : null,
    howItWorks: <HowItWorks section={c.howItWorks} />,
    travelGuide: <TravelGuide section={c.travelGuide} />,
    // On hold since T-05 (W1-D05). Rendered only when content provides it.
    socialProof: c.socialProof ? (
      <Section id="social-proof">
        <SocialProofBlock content={c.socialProof} />
      </Section>
    ) : null,
    finalCta: <FinalCta section={c.finalCta} />,
  };

  return (
    <>
      {order.map((key) =>
        sections[key] ? (
          <div key={key} data-home-section={key}>
            {sections[key]}
          </div>
        ) : null,
      )}
    </>
  );
}
