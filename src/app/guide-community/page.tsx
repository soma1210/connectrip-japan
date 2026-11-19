import { GuideApplicationForm } from "@/components/guide-community/GuideApplicationForm";
import { routeHref } from "@/website-v1/routes";

// "Back to Connectrip Japan" goes to the Website v1 top (Human instruction 2026-10-27).
export default function GuideCommunityPage() {
  return <GuideApplicationForm homeHref={routeHref("home")} />;
}
