import { useTranslations } from "next-intl";
import { CtaButton } from "@/components/ui/CtaButton";
import { FadeIn } from "@/components/ui/FadeIn";
import { heroSlides } from "@/data/images";
import { HeroBackgroundSlider } from "./HeroBackgroundSlider";

export function HeroSection() {
  const t = useTranslations("hero");
  const slideAlts = t.raw("slideAlts") as string[];

  return (
    <section className="relative flex h-screen min-h-[640px] items-center justify-center overflow-hidden">
      <HeroBackgroundSlider images={heroSlides} alts={slideAlts} />
      <div className="absolute inset-0 bg-navy-dark/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/10 to-transparent" />

      <FadeIn className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <p className="font-heading-en text-xs tracking-[0.35em] text-gold md:text-sm">
          {t("eyebrow")}
        </p>
        <h1 className="mt-6 font-heading-jp text-4xl leading-tight text-cream md:text-6xl">
          {t("heading")}
        </h1>
        <p className="mt-6 whitespace-pre-line text-sm leading-loose text-cream/85 md:text-base">
          {t("description")}
        </p>
        <CtaButton href="/reservation" className="mt-10">
          {t("cta")}
        </CtaButton>
      </FadeIn>
    </section>
  );
}
