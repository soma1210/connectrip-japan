import type { Metadata } from "next";
import { PartnerRegistrationForm } from "@/components/partner-registration/PartnerRegistrationForm";

// 事業者・パートナー向けアンケート (replaces the 準備中 page, 2026-10-28).
// Saves to `partner_registrations` via /api/partner-registrations.
// The old /api/partner-applications stays at 410.
// The whole preview is noindex (see toMetadata).
export const metadata: Metadata = {
  title: "事業者・パートナー向けアンケート",
  description:
    "Connectrip Japan 事業者・パートナー向けアンケート。飲食店・宿泊施設・体験事業者・旅行会社・観光施設の皆さまへ。まずはお互いを知るための簡単なアンケートです（所要時間 約3分）。",
  robots: { index: false, follow: false },
};

export default function V1PartnerApplyPage() {
  return (
    <div lang="ja">
      <PartnerRegistrationForm />
    </div>
  );
}
