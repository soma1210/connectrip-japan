import type { Metadata } from "next";
import { PartnerRecruitView } from "@/website-v1/views/PartnerViews";

// The whole preview is noindex (see toMetadata).
export const metadata: Metadata = {
  title: "パートナー募集",
  description:
    "Connectrip Japanでは、地域の体験・サービスを訪日旅行者へ一緒に届けるパートナー事業者様を募集しています。パートナーアンケートから貴社の情報と提携条件をお聞かせください。",
  robots: { index: false, follow: false },
};

export default function V1PartnerPage() {
  return <PartnerRecruitView />;
}
