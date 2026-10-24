import { getLegalViewModel } from "@/website-v1/content/pages";
import { toMetadata } from "@/website-v1/metadata";
import { LegalView } from "@/website-v1/views/PageViews";

export function generateMetadata() {
  return toMetadata(getLegalViewModel("privacy").seo);
}

export default function V1PrivacyPage() {
  return <LegalView vm={getLegalViewModel("privacy")} />;
}
