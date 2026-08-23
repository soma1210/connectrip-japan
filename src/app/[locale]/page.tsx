import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { HeroSection } from "@/components/sections/HeroSection";
import { IssuesSection } from "@/components/sections/IssuesSection";
import { ServiceSection } from "@/components/sections/ServiceSection";
import { ValueSection } from "@/components/sections/ValueSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { ReviewsSection } from "@/components/sections/ReviewsSection";
import { PlanSection } from "@/components/sections/PlanSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { VlogSection } from "@/components/sections/VlogSection";
import { SnsSection } from "@/components/sections/SnsSection";
import { FinalCtaSection } from "@/components/sections/FinalCtaSection";
import { ContactSection } from "@/components/sections/ContactSection";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <IssuesSection />
      <ServiceSection />
      <ValueSection />
      <ProcessSection />
      <ReviewsSection />
      <PlanSection />
      <FaqSection />
      <GallerySection />
      <VlogSection />
      <SnsSection />
      <FinalCtaSection />
      <ContactSection />
    </>
  );
}
