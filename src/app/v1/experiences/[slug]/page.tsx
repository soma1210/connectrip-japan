import { notFound } from "next/navigation";
import { getExperienceDetailViewModel, getExperienceSlugs } from "@/website-v1/content/experiences";
import { toMetadata } from "@/website-v1/metadata";
import { ExperienceDetailView } from "@/website-v1/views/ExperienceViews";
import { ExperienceProductView } from "@/website-v1/views/ExperienceProductView";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { tenmanguTourJsonLd } from "@/website-v1/structuredData";
import { TENMANGU_SLUG } from "@/website-v1/content/experienceTenmangu";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
// The USD reference hides itself once the exchange rate is out of date (content/exchangeRate.ts): re-check daily.
export const revalidate = 86400;

export function generateStaticParams() {
  return getExperienceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const vm = getExperienceDetailViewModel((await params).slug);
  return vm ? toMetadata(vm.seo) : {};
}

export default async function V1ExperienceDetailPage({ params }: Props) {
  const slug = (await params).slug;
  const vm = getExperienceDetailViewModel(slug);
  if (!vm) notFound();
  // Product records (with places) use the product layout; anything else the generic template.
  return (
    <>
      {slug === TENMANGU_SLUG ? <JsonLd data={tenmanguTourJsonLd()} /> : null}
      {vm.content.places ? <ExperienceProductView vm={vm} /> : <ExperienceDetailView vm={vm} />}
    </>
  );
}
