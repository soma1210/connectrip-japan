// Canonical business details used for structured data (JSON-LD). Kept
// separate from the translated `company.rows` display copy so structured
// data stays stable even if that copy's wording changes.
export const businessInfo = {
  legalNameJa: "Connectrip Japan 株式会社",
  // English company name: management decision 2026-11-18 (registered name: Connectrip Japan 株式会社).
  legalNameEn: "Connectrip Japan Co., Ltd.",
  // Same as the Founded row in website-v1/content/data/company.ts (2026-11-15); registry check pending.
  foundingDate: "2026-11-16",
  email: "contact@connectripjapan.com",
  telephone: "+81-90-8269-1398",
  address: {
    streetAddress: "中島1丁目15番25号",
    addressLocality: "大阪市西淀川区",
    addressRegion: "Osaka",
    addressCountry: "JP",
  },
  areaServed: ["Osaka", "Kyoto", "Nara", "Hyogo"],
} as const;
