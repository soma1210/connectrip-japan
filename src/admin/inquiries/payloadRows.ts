import { BOOKABLE_TOURS, bookableTour, languageLabel, timeLabel } from "@/lib/booking-request/tours";
import type { InquiryKind } from "@/lib/inquiries/status";

/**
 * The submitted form, as label / value rows for the admin detail page.
 * Reads the stored JSON defensively (unknown shape → plain text), and React
 * escapes every value when it renders.
 */
export type PayloadRow = { label: string; value: string | null };

const AREAS: Record<string, string> = { osaka: "大阪", kyoto: "京都", kobe: "神戸", nara: "奈良", other: "その他" };
const ACTIVITIES: Record<string, string> = {
  food: "グルメ",
  local_neighborhoods: "ローカルな街歩き",
  culture: "文化",
  famous_sights: "有名観光地",
  shopping: "ショッピング",
  family_activities: "家族向け",
  hidden_gems: "穴場",
  other: "その他",
};
const LOCALES: Record<string, string> = { en: "英語", ja: "日本語", "zh-TW": "繁体字中国語", ko: "韓国語" };

const str = (v: unknown): string | null => (v == null || v === "" ? null : typeof v === "object" ? JSON.stringify(v) : String(v));
const list = (v: unknown, labels: Record<string, string>): string | null =>
  Array.isArray(v) && v.length ? v.map((x) => labels[String(x)] ?? String(x)).join("、") : null;

export function payloadRows(kind: InquiryKind, p: Record<string, unknown>): PayloadRow[] {
  if (kind === "booking_request" && p.productType === "ready_made") {
    const tour = bookableTour(p.experienceId);
    const minutes = Number(p.durationMinutes);
    const guests = Number(p.adults ?? 0) + Number(p.children ?? 0);
    return [
      { label: "ツアー", value: tour?.title ?? str(p.experienceId) },
      { label: "ツアーID", value: str(p.experienceId) },
      { label: "希望日時", value: [str(p.date), typeof p.startTime === "string" ? timeLabel(p.startTime) : null].filter(Boolean).join(" ") || null },
      { label: "所要時間", value: Number.isFinite(minutes) ? `${minutes / 60}時間` : null },
      { label: "参加人数", value: Number.isFinite(guests) ? `${guests}名` : null },
      { label: "希望言語", value: languageLabel(tour, p.language) },
      { label: "電話番号", value: str(p.phone) },
      { label: "国・地域", value: str(p.country) },
      { label: "サイトの言語", value: LOCALES[String(p.locale)] ?? str(p.locale) },
      { label: "特別なリクエスト", value: str(p.notes) },
    ];
  }
  if (kind === "booking_request") {
    const minutes = Number(p.durationMinutes);
    return [
      { label: "第1希望日時", value: [str(p.date), str(p.startTime)].filter(Boolean).join(" ") || null },
      { label: "所要時間", value: Number.isFinite(minutes) ? `${minutes / 60}時間` : null },
      { label: "第2希望日時", value: p.alternateDate ? [str(p.alternateDate), str(p.alternateStartTime)].filter(Boolean).join(" ") : "なし" },
      { label: "大人", value: str(p.adults) },
      { label: "子ども", value: str(p.children) },
      { label: "希望エリア", value: list(p.areas, AREAS) },
      { label: "興味のあること", value: list(p.interests, ACTIVITIES) },
      { label: "電話番号", value: str(p.phone) },
      { label: "国・地域", value: str(p.country) },
      { label: "サイトの言語", value: LOCALES[String(p.locale)] ?? str(p.locale) },
      { label: "メッセージ", value: str(p.notes) },
    ];
  }
  return [
    { label: "希望日", value: str(p.preferredDate) },
    { label: "大人", value: str(p.adults) },
    { label: "子ども", value: str(p.children) },
    { label: "行きたい場所", value: list(p.destinations, AREAS) },
    { label: "やりたいこと", value: list(p.activities, ACTIVITIES) },
    { label: "すでに行きたい場所", value: str(p.placesToVisit) },
    { label: "理想の1日", value: str(p.idealDay) },
    { label: "その他・伝えたいこと", value: str(p.notes) },
  ];
}

/** `inquiries.service` → label: Private Guide, or a Ready-made tour (service = its product id). */
export const SERVICE_LABEL: Record<string, string> = {
  private_guide: "プライベートガイド",
  ...Object.fromEntries(BOOKABLE_TOURS.map((t) => [t.experienceId, `ツアー：${t.title}`])),
};
