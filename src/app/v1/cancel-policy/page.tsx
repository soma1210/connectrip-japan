import { getCancellationPolicyViewModel } from "@/website-v1/content/currentSitePages";
import { toMetadata } from "@/website-v1/metadata";
import { CancellationPolicyView } from "@/website-v1/views/CurrentSiteViews";

export function generateMetadata() {
  return toMetadata(getCancellationPolicyViewModel().seo);
}

export default function V1CancelPolicyPage() {
  return <CancellationPolicyView vm={getCancellationPolicyViewModel()} />;
}
