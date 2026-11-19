import { redirect } from "next/navigation";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { V1_PREVIEW } from "@/website-v1/config";
import { pageBreadcrumbJsonLd } from "@/website-v1/structuredData";
import { routeHref } from "@/website-v1/routes";
import { getLegalViewModel } from "@/website-v1/content/pages";
import { toMetadata } from "@/website-v1/metadata";
import { LegalView } from "@/website-v1/views/PageViews";
import { PRIVACY_POLICY_VISIBLE } from "@/website-v1/content/privacyPolicy";
import { PrivacyPolicyView } from "@/website-v1/views/PrivacyPolicyView";

export function generateMetadata() {
  return toMetadata(getLegalViewModel("privacy").seo);
}

/** Render approved policy content; release checks are tracked separately. */
export default function V1PrivacyPage() {
  if (V1_PREVIEW) redirect(routeHref("privacy"));
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd("Privacy Policy", routeHref("privacy"))} />
      {PRIVACY_POLICY_VISIBLE ? <PrivacyPolicyView /> : <LegalView vm={getLegalViewModel("privacy")} />}
    </>
  );
}
