import type { Metadata } from "next";
import { PartnerRecruitView } from "@/website-v1/views/PartnerViews";

// The whole preview is noindex (see toMetadata).
export const metadata: Metadata = {
  title: "パートナー募集",
  description:
    "Connectrip Japanでは、地域の体験・サービスを訪日旅行者へ一緒に届けるパートナー事業者様を募集しています。飲食店・宿泊施設・体験事業者・旅行会社・観光施設など、観光に関わる事業者様との連携を広げていきます。",
  robots: { index: false, follow: false },
};

export default function V1PartnerPage() {
  return <PartnerRecruitView />;
}
