// Partner survey questions — the single source of truth for the form, the
// review screen, the API validation, the admin screens and the notification
// email. Wording, examples and required flags are carried over unchanged from
// the original survey (connectrip-partner-survey.riku20010125.chatgpt.site).

export const OTHER = "other";

/** Industry options. Stored values are stable English keys; labels live here. */
export const INDUSTRIES = [
  { value: "activity", label: "体験・アクティビティ" },
  { value: "restaurant", label: "飲食店" },
  { value: "accommodation", label: "宿泊施設" },
  { value: "transport", label: "交通・送迎" },
  { value: "guide", label: "ガイド" },
  { value: "travel_agency", label: "旅行会社" },
  { value: "retail", label: "物販・お土産" },
  { value: OTHER, label: "その他" },
] as const;

export type Industry = (typeof INDUSTRIES)[number]["value"];

export function industryLabel(value: string | null | undefined) {
  return INDUSTRIES.find((option) => option.value === value)?.label ?? value ?? "";
}

/** Same limit as the original survey's inputs. */
export const MAX_LENGTH = 4000;

export type FieldKind = "text" | "textarea" | "select" | "url" | "email" | "tel" | "date";

export const FIELD_KEYS = [
  "company_name",
  "industry",
  "area",
  "website_url",
  "experience",
  "languages",
  "capacity",
  "duration",
  "price",
  "commission",
  "conditions",
  "booking",
  "cancellation",
  "contact_name",
  "email",
  "phone",
  "next_contact_date",
  "notes",
] as const;

export type FieldKey = (typeof FIELD_KEYS)[number];

export interface FieldDef {
  key: FieldKey;
  label: string;
  hint: string;
  placeholder: string;
  kind: FieldKind;
  required: boolean;
  autoComplete?: string;
}

const field = (def: FieldDef) => def;

export const FIELDS: Record<FieldKey, FieldDef> = {
  company_name: field({
    key: "company_name",
    label: "会社名・施設名・屋号",
    hint: "個人事業主の方は屋号またはお名前を入力してください。",
    placeholder: "例：京都 茶の庭",
    kind: "text",
    required: true,
    autoComplete: "organization",
  }),
  industry: field({
    key: "industry",
    label: "業種",
    hint: "主な事業に最も近いものを選択してください。",
    placeholder: "",
    kind: "select",
    required: true,
  }),
  area: field({
    key: "area",
    label: "エリア・所在地",
    hint: "都道府県・市区町村や、サービス提供エリアをご記入ください。",
    placeholder: "例：京都府京都市東山区",
    kind: "text",
    required: true,
  }),
  website_url: field({
    key: "website_url",
    label: "Webサイト・SNS",
    hint: "Webサイトがない場合は、SNSのURLでも構いません。",
    placeholder: "https://",
    kind: "url",
    required: false,
    autoComplete: "url",
  }),
  experience: field({
    key: "experience",
    label: "体験できること・提供サービス",
    hint: "内容、特徴、他にはない強みなどを具体的に教えてください。",
    placeholder: "例：英語で楽しめる茶道体験。お点前の見学後に、ご自身で抹茶を点てていただけます。",
    kind: "textarea",
    required: true,
  }),
  languages: field({
    key: "languages",
    label: "対応言語",
    hint: "通訳が必要な場合は、その旨をご記入ください。",
    placeholder: "例：日本語・英語（その他は通訳が必要）",
    kind: "text",
    required: true,
  }),
  capacity: field({
    key: "capacity",
    label: "受入人数",
    hint: "最少催行人数・最大人数をご記入ください。",
    placeholder: "例：2〜8名 / 貸切は最大12名",
    kind: "text",
    required: true,
  }),
  duration: field({
    key: "duration",
    label: "所要時間",
    hint: "体験やサービスの標準的な所要時間をご記入ください。",
    placeholder: "例：約90分 / 該当なし",
    kind: "text",
    required: true,
  }),
  price: field({
    key: "price",
    label: "料金・仕入価格",
    hint: "税込・税別、1名／1組などの単位もご記入ください。",
    placeholder: "例：一般料金 1名5,000円（税込）/ 提携料金4,000円",
    kind: "textarea",
    required: true,
  }),
  commission: field({
    key: "commission",
    label: "紹介手数料・掛け率",
    hint: "紹介料や販売手数料の条件がなければ「要相談」とご記入ください。",
    placeholder: "例：販売額の15% / 要相談",
    kind: "text",
    required: true,
  }),
  conditions: field({
    key: "conditions",
    label: "提携条件・支払条件",
    hint: "精算方法・支払時期・その他の条件をご記入ください。",
    placeholder: "例：月末締め、翌月末払い。最低送客数の条件なし。",
    kind: "textarea",
    required: true,
  }),
  booking: field({
    key: "booking",
    label: "予約方法・予約締切",
    hint: "予約の連絡手段、何日前まで受付可能かをご記入ください。",
    placeholder: "例：メールで3日前まで。空きがあれば前日予約も相談可。",
    kind: "textarea",
    required: true,
  }),
  cancellation: field({
    key: "cancellation",
    label: "キャンセル条件",
    hint: "いつから、どの程度のキャンセル料がかかるかをご記入ください。",
    placeholder: "例：前日50%、当日100%。荒天時は個別相談。",
    kind: "textarea",
    required: true,
  }),
  contact_name: field({
    key: "contact_name",
    label: "担当者名",
    hint: "部署・役職もあればご記入ください。",
    placeholder: "例：山田 太郎 / 営業担当",
    kind: "text",
    required: true,
    autoComplete: "name",
  }),
  email: field({
    key: "email",
    label: "メールアドレス",
    hint: "提携に関するご連絡に使用します。",
    placeholder: "partner@example.com",
    kind: "email",
    required: true,
    autoComplete: "email",
  }),
  phone: field({
    key: "phone",
    label: "電話番号",
    hint: "ご連絡可能な電話番号を入力してください。",
    placeholder: "例：075-000-0000",
    kind: "tel",
    required: true,
    autoComplete: "tel",
  }),
  next_contact_date: field({
    key: "next_contact_date",
    label: "次回連絡の希望日",
    hint: "ご希望がある場合のみ選択してください。連絡日の確約ではありません。",
    placeholder: "",
    kind: "date",
    required: false,
  }),
  notes: field({
    key: "notes",
    label: "補足・ご相談事項",
    hint: "ご連絡可能な時間帯や、事前に伝えたいことをご記入ください。",
    placeholder: "例：平日14〜17時にご連絡いただけると幸いです。",
    kind: "textarea",
    required: false,
  }),
};

export interface StepDef {
  id: "basic" | "service" | "terms" | "contact";
  title: string;
  subtitle: string;
  fields: FieldKey[];
}

/** The four input steps. The fifth step is the review & consent screen. */
export const STEPS: StepDef[] = [
  {
    id: "basic",
    title: "基本情報",
    subtitle: "貴社・施設について教えてください。",
    fields: ["company_name", "industry", "area", "website_url"],
  },
  {
    id: "service",
    title: "体験・サービス",
    subtitle: "旅行者に届けたい体験やサービスを教えてください。",
    fields: ["experience", "languages", "capacity", "duration"],
  },
  {
    id: "terms",
    title: "料金・提携条件",
    subtitle: "現在の条件をご記入ください。未確定の項目は「要相談」で構いません。",
    fields: ["price", "commission", "conditions", "booking", "cancellation"],
  },
  {
    id: "contact",
    title: "ご連絡先",
    subtitle: "提携のご相談ができる担当者様の情報をお願いします。",
    fields: ["contact_name", "email", "phone", "next_contact_date", "notes"],
  },
];

/** Q1, Q2 … numbering in form order, used by the admin detail screen. */
export const QUESTION_NUMBERS = Object.fromEntries(
  STEPS.flatMap((step) => step.fields).map((key, index) => [key, index + 1]),
) as Record<FieldKey, number>;

export const REVIEW_STEP_TITLE = "確認・送信";
export const STEP_COUNT = STEPS.length + 1;

export type FormValues = Record<FieldKey, string>;

export const INITIAL_VALUES: FormValues = {
  ...(Object.fromEntries(FIELD_KEYS.map((key) => [key, ""])) as FormValues),
  // The original survey preselects the first industry.
  industry: INDUSTRIES[0].value,
};

export const CONSENT_TEXT = "上記の利用目的を確認し、入力した連絡先・事業情報の提供に同意します。";
