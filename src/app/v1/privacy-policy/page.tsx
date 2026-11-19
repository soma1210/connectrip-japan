import { notFound } from "next/navigation";
import { JsonLd } from "@/website-v1/components/JsonLd";
import { pageBreadcrumbJsonLd } from "@/website-v1/structuredData";
import { routeHref } from "@/website-v1/routes";
import { pageSeo } from "@/website-v1/content/shared";
import { PRIVACY_POLICY_VISIBLE } from "@/website-v1/content/privacyPolicy";
import { toMetadata } from "@/website-v1/metadata";
import { PrivacyPolicyView } from "@/website-v1/views/PrivacyPolicyView";

/**
 * Privacy Policy V1 (2026-11-14). Preview only while it is a draft: not in
 * PUBLIC_PATHS, and 404 here too unless the policy is publishable
 * (content/privacyPolicy.ts). Always noindex in the preview.
 */
export function generateMetadata() {
  if (!PRIVACY_POLICY_VISIBLE) return {};
  return toMetadata(pageSeo("Privacy Policy", routeHref("privacy")));
}

export default function V1PrivacyPolicyPage() {
  if (!PRIVACY_POLICY_VISIBLE) notFound();
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd("Privacy Policy", routeHref("privacy"))} />
      <PrivacyPolicyView />
    </>
  );
}
