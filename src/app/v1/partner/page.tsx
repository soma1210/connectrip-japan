import type { Metadata } from "next";
import { PartnerRecruitView } from "@/website-v1/views/PartnerViews";

// The whole preview is noindex (see toMetadata).
export const metadata: Metadata = {
  title: "Become a Partner",
  description:
    "Connectrip Japan is looking for partner businesses to bring unique local experiences and services to international visitors to Japan. We are expanding our work with tourism businesses such as restaurants, accommodations, experience providers, travel companies and tourist attractions.",
  robots: { index: false, follow: false },
};

export default function V1PartnerPage() {
  return <PartnerRecruitView />;
}
