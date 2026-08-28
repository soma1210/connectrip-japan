// Canonical business details used for structured data (JSON-LD). Kept
// separate from the translated `company.rows` display copy so structured
// data stays stable even if that copy's wording changes.
export const businessInfo = {
  legalNameJa: "Connectrip Japan 株式会社",
  legalNameEn: "Connectrip Japan Inc.",
  foundingDate: "2026-09-07",
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
