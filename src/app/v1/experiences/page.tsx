import { getExperiencesListViewModel } from "@/website-v1/content/experiences";
import { toMetadata } from "@/website-v1/metadata";
import { ExperiencesView } from "@/website-v1/views/ExperienceViews";

export function generateMetadata() {
  return toMetadata(getExperiencesListViewModel().seo);
}

export default function V1ExperiencesPage() {
  return <ExperiencesView vm={getExperiencesListViewModel()} />;
}
