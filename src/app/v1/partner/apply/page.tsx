import type { Metadata } from "next";
import { PartnerApplyView } from "@/website-v1/views/PartnerViews";

// The whole preview is noindex (see toMetadata).
export const metadata: Metadata = {
  title: "パートナーアンケート",
  description:
    "Connectrip Japan パートナーアンケート。貴社の体験・サービスと提携条件をお聞かせください。ご回答いただいた内容をもとに、連携の可能性をご相談します。",
  robots: { index: false, follow: false },
};

export default function V1PartnerApplyPage() {
  return <PartnerApplyView />;
}
