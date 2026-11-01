// Guide Admin (Google Sheets) — which sheet column means what.
//
// Columns are matched by the header text in row 1, never by position, so
// reordering or adding Form questions does not break the screen. Headers this
// file does not know are still shown on the detail page under "その他の回答".

/** Tabs of the "Connectrip Guide Applications" spreadsheet. */
export const APPLICATIONS_TAB = "Guide Applications";
export const INTERVIEW_REQUESTS_TAB = "Interview Requests";

export type DetailSection = "basic" | "guide" | "profile";

export type FieldKey =
  | "submittedAt"
  | "name"
  | "age"
  | "prefecture"
  | "city"
  | "email"
  | "phone"
  | "languages"
  | "mainLanguage"
  | "languageLevel"
  | "guideExperience"
  | "areas"
  | "days"
  | "times"
  | "monthlyAvailability"
  | "occupation"
  | "occupationDetail"
  | "purposes"
  | "commitment"
  | "internationalExperience"
  | "interests"
  | "motivation"
  | "desiredGuide"
  | "selfIntroduction"
  | "interviewPreference"
  | "privacyConsent"
  | "applicationId"
  | "status"
  | "interviewStatus"
  | "evaluation"
  | "notes"
  | "createdAt"
  | "updatedAt";

export type FieldDef = {
  key: FieldKey;
  header: string;
  /** Checkbox question: Google Forms joins the choices with ", ". */
  multi?: boolean;
  /** Long free text: keep line breaks on the detail page. */
  prose?: boolean;
  /** Where the answer appears on the detail page. Admin columns have none. */
  section?: DetailSection;
};

export const FIELDS: readonly FieldDef[] = [
  { key: "submittedAt", header: "タイムスタンプ" },
  { key: "name", header: "お名前" },
  { key: "age", header: "年齢", section: "basic" },
  { key: "prefecture", header: "お住まいの都道府県", section: "basic" },
  { key: "city", header: "市区町村", section: "basic" },
  { key: "email", header: "メールアドレス", section: "basic" },
  { key: "phone", header: "電話番号", section: "basic" },
  { key: "occupation", header: "現在の職業・立場", section: "basic" },
  { key: "occupationDetail", header: "現在のお仕事・活動内容", section: "basic", prose: true },
  { key: "languages", header: "話せる言語", section: "guide", multi: true },
  { key: "mainLanguage", header: "主に使用できる外国語", section: "guide" },
  { key: "languageLevel", header: "その言語レベル", section: "guide" },
  { key: "guideExperience", header: "ガイド経験", section: "guide" },
  { key: "areas", header: "対応可能エリア", section: "guide", multi: true },
  { key: "days", header: "対応できる曜日", section: "guide", multi: true },
  { key: "times", header: "活動できる時間帯", section: "guide", multi: true },
  { key: "monthlyAvailability", header: "月にどのくらいガイドできますか？", section: "guide" },
  { key: "commitment", header: "今後どのくらい継続して活動したいですか？", section: "guide" },
  { key: "purposes", header: "ガイド案件を受ける目的", section: "profile", multi: true },
  { key: "internationalExperience", header: "外国人との交流経験", section: "profile", multi: true },
  { key: "interests", header: "得意・好きなジャンル", section: "profile", multi: true },
  { key: "motivation", header: "ガイドに興味を持った理由", section: "profile", prose: true },
  { key: "desiredGuide", header: "どんなガイドをしてみたいですか？", section: "profile", prose: true },
  { key: "selfIntroduction", header: "自己紹介・アピールポイント", section: "profile", prose: true },
  { key: "interviewPreference", header: "オンライン面談について", section: "profile" },
  { key: "privacyConsent", header: "個人情報の取り扱いへの同意", section: "profile" },
  { key: "applicationId", header: "Application ID" },
  { key: "status", header: "Status" },
  { key: "interviewStatus", header: "Interview Status" },
  { key: "evaluation", header: "Evaluation" },
  { key: "notes", header: "Notes", prose: true },
  { key: "createdAt", header: "Created At" },
  { key: "updatedAt", header: "Updated At" },
];

/** Without these the list cannot work; a missing one is shown as a warning. */
export const REQUIRED_KEYS: readonly FieldKey[] = ["name", "email", "applicationId", "status"];

export const SECTIONS: readonly { value: DetailSection; title: string }[] = [
  { value: "basic", title: "① 基本情報" },
  { value: "guide", title: "② ガイド対応" },
  { value: "profile", title: "③ 志望・人物" },
];

export type Choice = { value: string; label: string; tone: string };

const NEUTRAL = "bg-slate-100 text-slate-700 ring-slate-200";

/** Status values written by the sheet's Apps Script (same order as its Dashboard tab). */
export const STATUSES: readonly Choice[] = [
  { value: "NEW", label: "新規", tone: "bg-sky-50 text-sky-900 ring-sky-200" },
  { value: "REVIEWING", label: "確認中", tone: "bg-amber-50 text-amber-900 ring-amber-200" },
  { value: "INTERVIEW_INVITED", label: "面談案内済み", tone: "bg-violet-50 text-violet-900 ring-violet-200" },
  { value: "INTERVIEW_BOOKED", label: "面談予約済み", tone: "bg-indigo-50 text-indigo-900 ring-indigo-200" },
  { value: "INTERVIEW_COMPLETED", label: "面談済み", tone: "bg-teal-50 text-teal-900 ring-teal-200" },
  { value: "ACCEPTED", label: "採用", tone: "bg-emerald-600 text-white ring-emerald-600" },
  { value: "REJECTED", label: "不採用", tone: "bg-slate-200 text-slate-600 ring-slate-300" },
];

/** Labels for the interview status values known so far. Unknown values are shown as written. */
export const INTERVIEW_STATUSES: readonly Choice[] = [
  { value: "NOT_INVITED", label: "未案内", tone: NEUTRAL },
  { value: "INVITED", label: "案内済み", tone: "bg-violet-50 text-violet-900 ring-violet-200" },
  { value: "REQUESTED", label: "希望日時あり", tone: "bg-amber-50 text-amber-900 ring-amber-200" },
  { value: "BOOKED", label: "予約確定", tone: "bg-indigo-50 text-indigo-900 ring-indigo-200" },
  { value: "COMPLETED", label: "実施済み", tone: "bg-teal-50 text-teal-900 ring-teal-200" },
  { value: "CANCELLED", label: "キャンセル", tone: "bg-slate-200 text-slate-600 ring-slate-300" },
];

export function choiceOf(choices: readonly Choice[], value: string): Choice {
  return choices.find((choice) => choice.value === value) ?? { value, label: value, tone: NEUTRAL };
}
