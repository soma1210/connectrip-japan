import type { Metadata } from "next";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { pageBreadcrumbJsonLd } from "@/website-v1/structuredData";
import { routeHref } from "@/website-v1/routes";
import { getHomeViewModel } from "@/website-v1/content/home";
import { HowItWorks } from "@/website-v1/views/HomeView";

export const metadata: Metadata = {
  title: "How It Works",
  description: "How to book a ready-made experience or plan a private guide day in Kansai with Connectrip Japan.",
  alternates: { canonical: routeHref("howItWorks") },
};

/** How It Works (2026-11-22): the scene that used to be on Home, reached from the menu. */
export default function V1HowItWorksPage() {
  const section = getHomeViewModel().content.howItWorks;
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd("How It Works", routeHref("howItWorks"))} />
      <HowItWorks section={section} />
    </>
  );
}
