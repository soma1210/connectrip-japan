// Every choice list used by the Guide Community application form.
//
// `value` is what gets stored in the database — a stable English key that
// never changes once data exists, so filters and future analysis keep working.
// `label` is what applicants and admins see. Relabel freely; never edit a
// `value` without migrating existing rows.

export type Option<V extends string = string> = {
  value: V;
  label: string;
};

/** Value used for every "その他" choice; selecting it reveals a free-text input. */
export const OTHER = "Other";

export const AGE_RANGES = [
  { value: "18-22", label: "18〜22歳" },
  { value: "23-29", label: "23〜29歳" },
  { value: "30-39", label: "30〜39歳" },
  { value: "40-49", label: "40〜49歳" },
  { value: "50+", label: "50歳以上" },
  { value: "Prefer not to say", label: "回答しない" },
] as const satisfies readonly Option[];

export const LANGUAGES = [
  { value: "English", label: "英語" },
  { value: "Chinese", label: "中国語" },
  { value: "Korean", label: "韓国語" },
  { value: "French", label: "フランス語" },
  { value: "Spanish", label: "スペイン語" },
  { value: "German", label: "ドイツ語" },
  { value: "Italian", label: "イタリア語" },
  { value: "Portuguese", label: "ポルトガル語" },
  { value: "Vietnamese", label: "ベトナム語" },
  { value: "Thai", label: "タイ語" },
  { value: "Arabic", label: "アラビア語" },
  { value: "Japanese", label: "日本語" },
  { value: OTHER, label: "その他" },
] as const satisfies readonly Option[];

/**
 * Ordered from lowest to highest — the admin "言語レベル" filter treats a
 * level as a minimum ("this level or above"), so keep this order meaningful.
 */
export const LANGUAGE_LEVELS = [
  { value: "Conversational", label: "日常会話" },
  { value: "Guide/Customer Service", label: "ガイド・接客可能" },
  { value: "Business", label: "ビジネス" },
  { value: "Native", label: "ネイティブ／ネイティブレベル" },
] as const satisfies readonly Option[];

export const GUIDE_EXPERIENCE = [
  { value: "None", label: "未経験" },
  { value: "Some", label: "少し経験あり" },
  { value: "Currently active", label: "現在ガイドとして活動中" },
  { value: "Previously active", label: "過去にガイドとして活動していた" },
] as const satisfies readonly Option[];

/** Q9 and Q10 appear for every guide_experience except this one. */
export const NO_GUIDE_EXPERIENCE = "None";

export const GUIDE_EXPERIENCE_YEARS = [
  { value: "<1", label: "1年未満" },
  { value: "1-2", label: "1〜2年" },
  { value: "3-5", label: "3〜5年" },
  { value: "5+", label: "5年以上" },
] as const satisfies readonly Option[];

export const AREAS = [
  { value: "Osaka", label: "大阪" },
  { value: "Kyoto", label: "京都" },
  { value: "Kobe/Hyogo", label: "神戸・兵庫" },
  { value: "Nara", label: "奈良" },
  { value: "Shiga", label: "滋賀" },
  { value: "Wakayama", label: "和歌山" },
  { value: OTHER, label: "その他" },
] as const satisfies readonly Option[];

export const DAYS = [
  { value: "Mon", label: "月曜日" },
  { value: "Tue", label: "火曜日" },
  { value: "Wed", label: "水曜日" },
  { value: "Thu", label: "木曜日" },
  { value: "Fri", label: "金曜日" },
  { value: "Sat", label: "土曜日" },
  { value: "Sun", label: "日曜日" },
  { value: "Irregular", label: "不定期" },
] as const satisfies readonly Option[];

export const TIME_SLOTS = [
  { value: "Morning", label: "午前" },
  { value: "Afternoon", label: "午後" },
  { value: "Evening", label: "夜" },
  { value: "All day", label: "終日" },
] as const satisfies readonly Option[];

export const MONTHLY_AVAILABILITY = [
  { value: "1-2", label: "1〜2日" },
  { value: "3-5", label: "3〜5日" },
  { value: "6-10", label: "6〜10日" },
  { value: "11-15", label: "11〜15日" },
  { value: "16+", label: "16日以上" },
  { value: "Depends", label: "案件次第" },
] as const satisfies readonly Option[];

export const EMPLOYMENT_STATUSES = [
  { value: "Company employee", label: "会社員" },
  { value: "Public servant", label: "公務員" },
  { value: "Self-employed", label: "自営業・個人事業主" },
  { value: "Freelancer", label: "フリーランス" },
  { value: "Student", label: "学生" },
  { value: "Homemaker", label: "主婦・主夫" },
  { value: "Part-time", label: "アルバイト・パート" },
  { value: "Job seeking", label: "求職中" },
  { value: "Retired", label: "退職済み" },
  { value: OTHER, label: "その他" },
] as const satisfies readonly Option[];

export const GUIDE_PURPOSES = [
  { value: "Side income", label: "副業として収入を得たい" },
  { value: "Grow freelance work", label: "フリーランスの仕事として増やしたい" },
  { value: "Make it my main job", label: "将来的に本業にしたい" },
  { value: "Gain guide experience", label: "ガイドとして経験を積みたい" },
  { value: "Use language skills", label: "語学力を活かしたい" },
  { value: "Meet international people", label: "外国人との交流を増やしたい" },
  { value: "Share Japan/Kansai", label: "日本・関西の魅力を伝えたい" },
  { value: "Become a guide in future", label: "将来的にガイドとして活動したい" },
  { value: "Use free time", label: "空いている時間を活用したい" },
  { value: OTHER, label: "その他" },
] as const satisfies readonly Option[];

export const COMMITMENT_PERIODS = [
  { value: "One-off/Short-term", label: "単発・短期で参加したい" },
  { value: "Continue if good jobs", label: "良い案件があれば継続したい" },
  { value: "6+ months", label: "半年以上継続したい" },
  { value: "1+ year", label: "1年以上継続したい" },
  { value: "Long-term", label: "長期的にガイドとして活動したい" },
  { value: "Undecided", label: "まだ分からない" },
] as const satisfies readonly Option[];

export const INTERNATIONAL_EXPERIENCE = [
  { value: "Little", label: "ほとんどない" },
  { value: "Through travel", label: "旅行などで交流したことがある" },
  { value: "Studied abroad", label: "留学経験がある" },
  { value: "Lived abroad", label: "海外在住経験がある" },
  { value: "Daily contact", label: "日常的に外国人と接している" },
  { value: "Worked with foreigners", label: "外国人向けの仕事経験がある" },
] as const satisfies readonly Option[];

export const INTERESTS = [
  { value: "Food", label: "グルメ" },
  { value: "History", label: "歴史" },
  { value: "Japanese culture", label: "日本文化" },
  { value: "Anime/Games", label: "アニメ・ゲーム" },
  { value: "Nightlife", label: "ナイトライフ" },
  { value: "Nature", label: "自然" },
  { value: "Photography", label: "写真" },
  { value: "Sports", label: "スポーツ" },
  { value: "Shopping", label: "ショッピング" },
  { value: "Family/Kids", label: "ファミリー・子ども対応" },
  { value: "Local experiences", label: "ローカル体験" },
  { value: "Traditional culture", label: "伝統文化" },
  { value: OTHER, label: "その他" },
] as const satisfies readonly Option[];

export const INTERVIEW_PREFERENCES = [
  { value: "Wants interview", label: "面談を希望する" },
  { value: "Wants details first", label: "まず詳しい話を聞きたい" },
  { value: "Contact when jobs available", label: "案件があれば連絡してほしい" },
] as const satisfies readonly Option[];

export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県", "海外",
].map((name) => ({ value: name, label: name })) satisfies Option[];

/** Look up the display label for a stored value; unknown values are shown as-is. */
export function labelOf(options: readonly Option[], value: string | null | undefined) {
  if (!value) return "";
  return options.find((option) => option.value === value)?.label ?? value;
}

export function valuesOf(options: readonly Option[]): string[] {
  return options.map((option) => option.value);
}
