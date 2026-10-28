// 事業者・パートナー向けアンケート (/partner/survey) — the single source of truth
// for choice options. Stored values are stable English keys, so labels can be
// reworded here without touching saved data. A future admin screen should use
// optionLabel() / optionLabels() to show them.

export const OTHER = "other";

export interface ChoiceOption {
  value: string;
  label: string;
}

export const BUSINESS_CATEGORIES = [
  { value: "restaurant", label: "飲食店" },
  { value: "accommodation", label: "ホテル・宿泊施設" },
  { value: "activity", label: "体験・アクティビティ" },
  { value: "travel_agency", label: "旅行会社・旅行代理店" },
  { value: "attraction", label: "観光施設" },
  { value: OTHER, label: "その他" },
] as const satisfies readonly ChoiceOption[];

export const CUSTOMER_TYPES = [
  { value: "domestic", label: "国内のお客様" },
  { value: "inbound", label: "訪日外国人" },
  { value: "fit", label: "個人旅行者（FIT）" },
  { value: "group", label: "団体旅行" },
  { value: "family", label: "ファミリー" },
  { value: OTHER, label: "その他" },
] as const satisfies readonly ChoiceOption[];

export const INBOUND_EXPERIENCE = [
  { value: "regular", label: "日常的に受け入れている" },
  { value: "experienced", label: "受け入れ実績がある" },
  { value: "few", label: "まだ少ない" },
  { value: "rare", label: "これまではほとんどない" },
  { value: "want_to_grow", label: "これから増やしていきたい" },
] as const satisfies readonly ChoiceOption[];

/** Selecting this clears the other challenges, and the other way round. */
export const NO_CHALLENGES = "none";

export const CURRENT_CHALLENGES = [
  { value: "inbound_attraction", label: "外国人旅行者の集客" },
  { value: "awareness", label: "認知度向上" },
  { value: "language", label: "英語・外国語対応" },
  { value: "overseas_promotion", label: "海外への情報発信" },
  { value: "overseas_sales", label: "海外販売" },
  { value: "booking_management", label: "予約管理" },
  { value: "staffing", label: "人手不足" },
  { value: "industry_partnership", label: "旅行会社や観光事業者との連携" },
  { value: NO_CHALLENGES, label: "特にない" },
  { value: OTHER, label: "その他" },
] as const satisfies readonly ChoiceOption[];

export const INTERESTED_COLLABORATIONS = [
  { value: "referrals", label: "外国人旅行者の送客" },
  { value: "tour_inclusion", label: "ツアーへの組み込み" },
  { value: "co_development", label: "共同での商品・体験造成" },
  { value: "overseas_sales", label: "海外向け販売" },
  { value: "guide_collaboration", label: "ガイドとの連携" },
  { value: "pr", label: "SNS・WebでのPR" },
  { value: "networking", label: "情報交換・ネットワークづくり" },
  { value: "undecided", label: "まだ具体的には決まっていない" },
  { value: OTHER, label: "その他" },
] as const satisfies readonly ChoiceOption[];

export function optionLabel(options: readonly ChoiceOption[], value: string | null | undefined) {
  return options.find((option) => option.value === value)?.label ?? value ?? "";
}

export function optionLabels(options: readonly ChoiceOption[], values: readonly string[]) {
  return values.map((value) => optionLabel(options, value));
}

/** Character limits, checked in the browser and again by the API. */
export const LIMITS = {
  text: 200,
  textarea: 2000,
  socialAccounts: 5,
} as const;

/** What the form holds while it is being filled in. */
export interface FormValues {
  company_name: string;
  contact_name: string;
  business_category: string;
  business_category_other: string;
  area: string;
  website: string;
  social_accounts: string[];
  customer_types: string[];
  inbound_experience: string;
  strengths: string;
  current_challenges: string[];
  current_challenges_other: string;
  interested_collaborations: string[];
  interested_collaborations_other: string;
  email: string;
  phone: string;
  additional_notes: string;
}

export type FieldKey = keyof FormValues;

export const INITIAL_VALUES: FormValues = {
  company_name: "",
  contact_name: "",
  business_category: "",
  business_category_other: "",
  area: "",
  website: "",
  social_accounts: [""],
  customer_types: [],
  inbound_experience: "",
  strengths: "",
  current_challenges: [],
  current_challenges_other: "",
  interested_collaborations: [],
  interested_collaborations_other: "",
  email: "",
  phone: "",
  additional_notes: "",
};

/** Field order on the page, used to scroll to the first error. */
export const FIELD_ORDER: FieldKey[] = [
  "company_name",
  "contact_name",
  "business_category",
  "business_category_other",
  "area",
  "website",
  "social_accounts",
  "customer_types",
  "inbound_experience",
  "strengths",
  "current_challenges",
  "current_challenges_other",
  "interested_collaborations",
  "interested_collaborations_other",
  "email",
  "phone",
  "additional_notes",
];
