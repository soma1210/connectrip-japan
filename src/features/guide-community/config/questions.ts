// The application form, described as data.
//
// UI components render whatever is listed here and validation reads the same
// definitions, so a question's wording, options, required flag or position is
// changed in exactly one place. Sections drive the progress indicator.

import {
  AGE_RANGES,
  AREAS,
  COMMITMENT_PERIODS,
  DAYS,
  EMPLOYMENT_STATUSES,
  GUIDE_EXPERIENCE,
  GUIDE_EXPERIENCE_YEARS,
  GUIDE_PURPOSES,
  INTERESTS,
  INTERNATIONAL_EXPERIENCE,
  INTERVIEW_PREFERENCES,
  LANGUAGE_LEVELS,
  LANGUAGES,
  MONTHLY_AVAILABILITY,
  NO_GUIDE_EXPERIENCE,
  PREFECTURES,
  TIME_SLOTS,
  type Option,
} from "./options";

/** Raw, in-progress form state on the client (and the JSON body POSTed to the API). */
export type FormValues = {
  name: string;
  age_range: string;
  prefecture: string;
  city: string;
  email: string;
  phone: string;
  languages: string[];
  languages_other: string;
  /** language value → level value, for each selected language. */
  language_levels: Record<string, string>;
  guide_experience: string;
  guide_experience_detail: string;
  guide_experience_years: string;
  available_areas: string[];
  available_areas_other: string;
  available_days: string[];
  available_times: string[];
  monthly_availability: string;
  employment_status: string;
  employment_status_other: string;
  occupation_detail: string;
  guide_purposes: string[];
  guide_purposes_other: string;
  commitment_period: string;
  international_experience: string;
  interests: string[];
  interests_other: string;
  motivation: string;
  desired_guide_type: string;
  self_introduction: string;
  interview_preference: string;
  privacy_consent: boolean;
  /** Honeypot: hidden from people, bots fill it in. Non-empty → submission is dropped. */
  website: string;
};

export const INITIAL_VALUES: FormValues = {
  name: "",
  age_range: "",
  prefecture: "",
  city: "",
  email: "",
  phone: "",
  languages: [],
  languages_other: "",
  language_levels: {},
  guide_experience: "",
  guide_experience_detail: "",
  guide_experience_years: "",
  available_areas: [],
  available_areas_other: "",
  available_days: [],
  available_times: [],
  monthly_availability: "",
  employment_status: "",
  employment_status_other: "",
  occupation_detail: "",
  guide_purposes: [],
  guide_purposes_other: "",
  commitment_period: "",
  international_experience: "",
  interests: [],
  interests_other: "",
  motivation: "",
  desired_guide_type: "",
  self_introduction: "",
  interview_preference: "",
  privacy_consent: false,
  website: "",
};

type FieldKey = keyof FormValues;
type StringField = { [K in FieldKey]: FormValues[K] extends string ? K : never }[FieldKey];
type ArrayField = { [K in FieldKey]: FormValues[K] extends string[] ? K : never }[FieldKey];

type QuestionBase = {
  /** Shown as "Q1", "Q2"… — purely presentational. */
  number: number;
  label: string;
  required: boolean;
  /** Short helper text under the label. */
  hint?: string;
  /** Example answers, shown as a list under the input. */
  examples?: string[];
  /** Question is shown (and validated) only when this returns true. */
  visibleWhen?: (values: FormValues) => boolean;
};

export type TextQuestion = QuestionBase & {
  type: "text" | "email" | "tel";
  field: StringField;
  placeholder?: string;
  autoComplete?: string;
  maxLength: number;
};

export type TextareaQuestion = QuestionBase & {
  type: "textarea";
  field: StringField;
  placeholder?: string;
  maxLength: number;
  /** Shown as a soft guide with a character counter; never blocks submission. */
  recommendedLength?: { min: number; max: number };
};

export type SingleChoiceQuestion = QuestionBase & {
  /** "radio" for short lists, "select" for long ones (UI hint only). */
  type: "radio" | "select";
  field: StringField;
  options: readonly Option[];
  /** Free-text field revealed when the "Other" option is picked. */
  otherField?: StringField;
};

export type MultiChoiceQuestion = QuestionBase & {
  type: "checkbox";
  field: ArrayField;
  options: readonly Option[];
  otherField?: StringField;
};

export type LocationQuestion = QuestionBase & {
  type: "location";
  prefecture: { field: "prefecture"; label: string; options: readonly Option[] };
  city: { field: "city"; label: string; placeholder?: string; maxLength: number };
};

export type LanguageLevelsQuestion = QuestionBase & {
  type: "languageLevels";
  /** The multi-choice question whose selections this asks a level for. */
  sourceField: "languages";
  levels: readonly Option[];
};

export type Question =
  | TextQuestion
  | TextareaQuestion
  | SingleChoiceQuestion
  | MultiChoiceQuestion
  | LocationQuestion
  | LanguageLevelsQuestion;

export type Section = {
  id: string;
  title: string;
  /** Short English label shown beside the STEP number (display only). */
  subtitle?: string;
  description?: string;
  questions: Question[];
};

const hasGuideExperience = (values: FormValues) =>
  values.guide_experience !== "" && values.guide_experience !== NO_GUIDE_EXPERIENCE;

export const SECTIONS: Section[] = [
  {
    id: "basic",
    subtitle: "About you",
    title: "基本情報",
    description: "ご連絡先とお住まいについて教えてください。",
    questions: [
      { number: 1, type: "text", field: "name", label: "お名前", required: true, autoComplete: "name", maxLength: 100 },
      { number: 2, type: "radio", field: "age_range", label: "年齢", required: false, options: AGE_RANGES },
      {
        number: 3,
        type: "location",
        label: "お住まいのエリア",
        required: true,
        prefecture: { field: "prefecture", label: "都道府県", options: PREFECTURES },
        city: { field: "city", label: "市区町村", placeholder: "例：大阪市北区", maxLength: 100 },
      },
      {
        number: 4,
        type: "email",
        field: "email",
        label: "メールアドレス",
        required: true,
        placeholder: "example@email.com",
        autoComplete: "email",
        maxLength: 254,
      },
      {
        number: 5,
        type: "tel",
        field: "phone",
        label: "電話番号",
        required: true,
        hint: "海外の番号の場合は国番号から入力してください（例：+1 415 555 0100）",
        placeholder: "090-1234-5678",
        autoComplete: "tel",
        maxLength: 30,
      },
    ],
  },
  {
    id: "languages",
    subtitle: "Languages",
    title: "言語・スキル",
    description: "話せる言語と、それぞれのレベルを教えてください。",
    questions: [
      {
        number: 6,
        type: "checkbox",
        field: "languages",
        label: "話せる言語",
        required: true,
        hint: "複数選択できます",
        options: LANGUAGES,
        otherField: "languages_other",
      },
      {
        number: 7,
        type: "languageLevels",
        sourceField: "languages",
        label: "それぞれの言語レベル",
        required: true,
        hint: "選んだ言語ごとにレベルを選択してください",
        levels: LANGUAGE_LEVELS,
      },
    ],
  },
  {
    id: "experience",
    subtitle: "Your experience",
    title: "ガイド経験",
    description: "未経験の方も歓迎です。今の状況をそのまま選んでください。",
    questions: [
      { number: 8, type: "radio", field: "guide_experience", label: "ガイド経験", required: true, options: GUIDE_EXPERIENCE },
      {
        number: 9,
        type: "textarea",
        field: "guide_experience_detail",
        label: "ガイド経験の内容",
        required: false,
        placeholder: "例：京都で欧米からの個人旅行者向けに、寺社めぐりのガイドを担当していました",
        maxLength: 2000,
        visibleWhen: hasGuideExperience,
      },
      {
        number: 10,
        type: "radio",
        field: "guide_experience_years",
        label: "ガイド経験年数",
        required: false,
        options: GUIDE_EXPERIENCE_YEARS,
        visibleWhen: hasGuideExperience,
      },
    ],
  },
  {
    id: "availability",
    subtitle: "Around Kansai",
    title: "活動エリア・スケジュール",
    description: "無理のない範囲で、活動できる条件を選んでください。",
    questions: [
      {
        number: 11,
        type: "checkbox",
        field: "available_areas",
        label: "対応可能エリア",
        required: true,
        hint: "複数選択できます",
        options: AREAS,
        otherField: "available_areas_other",
      },
      { number: 12, type: "checkbox", field: "available_days", label: "対応できる曜日", required: true, hint: "複数選択できます", options: DAYS },
      { number: 13, type: "checkbox", field: "available_times", label: "活動できる時間帯", required: true, hint: "複数選択できます", options: TIME_SLOTS },
      { number: 14, type: "radio", field: "monthly_availability", label: "月にどのくらいガイドできますか？", required: true, options: MONTHLY_AVAILABILITY },
    ],
  },
  {
    id: "work",
    subtitle: "Work & purpose",
    title: "お仕事・活動の目的",
    questions: [
      {
        number: 15,
        type: "radio",
        field: "employment_status",
        label: "現在の職業・立場",
        required: true,
        options: EMPLOYMENT_STATUSES,
        otherField: "employment_status_other",
      },
      {
        number: 16,
        type: "textarea",
        field: "occupation_detail",
        label: "現在のお仕事・活動内容を簡単に教えてください",
        required: false,
        examples: ["IT企業で営業", "大学生", "英会話講師", "ホテル勤務", "フリーランスのカメラマン"],
        maxLength: 1000,
      },
      {
        number: 17,
        type: "checkbox",
        field: "guide_purposes",
        label: "ガイド案件を受ける目的",
        required: true,
        hint: "複数選択できます",
        options: GUIDE_PURPOSES,
        otherField: "guide_purposes_other",
      },
      { number: 18, type: "radio", field: "commitment_period", label: "今後どのくらい継続して活動したいですか？", required: true, options: COMMITMENT_PERIODS },
    ],
  },
  {
    id: "about",
    subtitle: "Your story",
    title: "あなたについて",
    questions: [
      { number: 19, type: "radio", field: "international_experience", label: "外国人との交流経験", required: true, options: INTERNATIONAL_EXPERIENCE },
      {
        number: 20,
        type: "checkbox",
        field: "interests",
        label: "得意・好きなジャンル",
        required: false,
        hint: "複数選択できます",
        options: INTERESTS,
        otherField: "interests_other",
      },
      {
        number: 21,
        type: "textarea",
        field: "motivation",
        label: "ガイドに興味を持った理由",
        required: true,
        placeholder: "例：海外の友人を案内したときに、関西の魅力を伝える楽しさを感じたから",
        maxLength: 2000,
      },
      {
        number: 22,
        type: "textarea",
        field: "desired_guide_type",
        label: "どんなガイドをしてみたいですか？",
        required: false,
        examples: ["グルメツアー", "街歩き", "家族向けツアー", "ナイトツアー", "日本文化体験", "アニメ・ゲーム関連", "写真撮影を含むツアー"],
        maxLength: 2000,
      },
      {
        number: 23,
        type: "textarea",
        field: "self_introduction",
        label: "自己紹介・アピールポイント",
        required: true,
        hint: "100〜500文字程度がおすすめです",
        placeholder: "例：大阪在住の会社員です。学生時代にカナダへ留学し、今も週末は海外の友人と食べ歩きをしています…",
        maxLength: 3000,
        recommendedLength: { min: 100, max: 500 },
      },
    ],
  },
  {
    id: "interview",
    subtitle: "Let’s meet",
    title: "オンライン面談",
    questions: [
      { number: 24, type: "radio", field: "interview_preference", label: "オンライン面談について", required: true, options: INTERVIEW_PREFERENCES },
    ],
  },
];

export const PRIVACY_NOTICE =
  "ご回答いただいた情報は、ガイド候補者とのご連絡、面談調整、案件のご案内、Connectripのガイド登録検討のために使用します。";
export const PRIVACY_CONSENT_LABEL = "上記の内容に同意します";

export const PAGE_COPY = {
  brand: "Connectrip Japan",
  siteName: "Connectrip Guide Community",
  heading: "Join Our Guide Community",
  tagline: "Connect travelers with the real Kansai.",
  intro: [
    "Connectripでは、大阪・京都・神戸・奈良を中心に、訪日外国人旅行者へ日本の魅力を伝えてくれるガイド仲間を募集しています。",
    "ガイド経験者はもちろん、未経験の方も歓迎しています。",
  ],
  estimatedTime: "約3〜5分で回答できます",
  welcome: "未経験の方も歓迎",
  areas: "大阪・京都・神戸・奈良",
  submit: "応募内容を送信する",
  submitting: "送信しています…",
  consentToSubmit: "個人情報の取り扱いに同意すると送信できます",
  trustNote:
    "ご入力いただいた情報は、ガイド候補者とのご連絡・面談調整・案件案内・登録検討の目的で使用します。",
  submitError: "送信できませんでした。時間をおいてもう一度お試しください。",
  fixErrors: "入力内容に不備があります。赤字の項目をご確認ください。",
  completeHeading: "Thank you! 🎉",
  completeBody: [
    "ご応募ありがとうございます。",
    "内容を確認後、Connectripからメールまたはお電話でご連絡させていただきます。",
  ],
} as const;

export function isVisible(question: Question, values: FormValues) {
  return question.visibleWhen ? question.visibleWhen(values) : true;
}
