import { getLegalViewModel } from "@/website-v1/content/pages";
import { toMetadata } from "@/website-v1/metadata";
import { LegalView } from "@/website-v1/views/PageViews";

export function generateMetadata() {
  return toMetadata(getLegalViewModel("terms").seo);
}

export default function V1TermsPage() {
  return <LegalView vm={getLegalViewModel("terms")} />;
}
