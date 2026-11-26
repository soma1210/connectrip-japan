import { JsonLd } from "@/website-v1/components/JsonLd";
import { pageBreadcrumbJsonLd, privateGuideFaqJsonLd, privateGuideServiceJsonLd } from "@/website-v1/structuredData";
import { routeHref } from "@/website-v1/routes";
import { bookingStoreFromEnv } from "@/lib/booking-request/handler";
import { getPrivateGuideViewModel } from "@/website-v1/content/privateGuide";
import { getPrivateGuideRequestModel } from "@/website-v1/content/privateGuideRequest";
import { toMetadata } from "@/website-v1/metadata";
import { PrivateGuideView } from "@/website-v1/views/PageViews";

// The request form's selectable dates start tomorrow (Japan): regenerate daily.
export const revalidate = 86400;

export function generateMetadata() {
  return toMetadata(getPrivateGuideViewModel().seo);
}

export default function V1PrivateGuidePage() {
  // Live only when the booking backend is configured on the server; otherwise the
  // form stays a preview that sends nothing (never a form that always fails).
  const mode = bookingStoreFromEnv() ? "live" : "mock";
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd("Private Guide", routeHref("privateGuide"))} />
      <JsonLd data={privateGuideServiceJsonLd()} />
      <JsonLd data={privateGuideFaqJsonLd()} />
      <PrivateGuideView vm={getPrivateGuideViewModel()} request={getPrivateGuideRequestModel(new Date(), mode)} />
    </>
  );
}
