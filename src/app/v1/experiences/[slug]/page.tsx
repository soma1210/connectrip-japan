import { notFound } from "next/navigation";
import { getExperienceDetailViewModel, getExperienceSlugs } from "@/website-v1/content/experiences";
import { toMetadata } from "@/website-v1/metadata";
import { ExperienceDetailView } from "@/website-v1/views/ExperienceViews";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getExperienceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const vm = getExperienceDetailViewModel((await params).slug);
  return vm ? toMetadata(vm.seo) : {};
}

export default async function V1ExperienceDetailPage({ params }: Props) {
  const vm = getExperienceDetailViewModel((await params).slug);
  if (!vm) notFound();
  return <ExperienceDetailView vm={vm} />;
}
