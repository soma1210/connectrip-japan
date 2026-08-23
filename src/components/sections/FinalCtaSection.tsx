import { useTranslations } from "next-intl";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { CtaButton } from "@/components/ui/CtaButton";
import { FadeIn } from "@/components/ui/FadeIn";
import { finalCtaImage } from "@/data/images";

export function FinalCtaSection() {
  const t = useTranslations("finalCta");

  return (
    <section className="relative flex min-h-[500px] items-center justify-center overflow-hidden md:min-h-[600px]">
      <PlaceholderImage src={finalCtaImage} alt={t("imageAlt")} sizes="100vw" />
      <div className="absolute inset-0 bg-navy-dark/60" />

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-20 text-center md:py-0">
        <FadeIn>
          <h2 className="whitespace-pre-line font-heading-jp text-2xl leading-snug tracking-wide text-cream sm:text-3xl md:text-5xl">
            {t("heading")}
          </h2>
        </FadeIn>
        <FadeIn delay={0.15}>
          <p className="mt-6 whitespace-pre-line text-sm leading-loose text-cream/85 md:text-base">
            {t("description")}
          </p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <CtaButton href="#contact" className="mt-10">
            {t("cta")}
          </CtaButton>
        </FadeIn>
      </div>
    </section>
  );
}
