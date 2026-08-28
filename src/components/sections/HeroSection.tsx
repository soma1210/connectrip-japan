import { useTranslations } from "next-intl";
import { CtaButton } from "@/components/ui/CtaButton";
import { FadeIn } from "@/components/ui/FadeIn";
import { heroSlides } from "@/data/images";
import { HeroBackgroundSlider } from "./HeroBackgroundSlider";

export function HeroSection() {
  const t = useTranslations("hero");
  const slideAlts = t.raw("slideAlts") as string[];

  return (
    <section className="relative flex h-[92vh] min-h-[560px] items-center justify-center overflow-hidden md:h-screen md:min-h-[640px]">
      <HeroBackgroundSlider images={heroSlides} alts={slideAlts} />
      <div className="absolute inset-0 bg-navy-dark/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/90 via-navy-dark/5 to-transparent" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <FadeIn delay={1.5} direction="depth">
          <p className="font-heading-en text-sm tracking-[0.35em] text-gold md:text-base">
            {t("eyebrow")}
          </p>
        </FadeIn>
        <FadeIn delay={0.8} direction="depth">
          <h1 className="mt-6 font-heading-jp text-5xl leading-tight text-cream md:text-7xl">
            {t("heading")}
          </h1>
        </FadeIn>
        <FadeIn delay={1.8} direction="depth">
          <p className="mt-6 whitespace-pre-line text-sm leading-loose text-cream/85 md:text-base">
            {t("description")}
          </p>
        </FadeIn>
        <FadeIn delay={2.1} direction="depth">
          <CtaButton
            href="/reservation"
            className="mt-10"
            ctaId="home_hero_reserve"
            ctaPosition="hero"
          >
            {t("cta")}
          </CtaButton>
        </FadeIn>
      </div>
    </section>
  );
}
