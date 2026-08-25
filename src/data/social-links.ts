// Official Connectrip Japan social accounts, referenced by both the SNS
// section and the Footer so there is a single place to update a URL.
// Currently a single set (the English-language accounts), shared across all
// site locales. If language-specific accounts are added later (Vietnamese,
// Traditional Chinese, Korean, etc.), this can grow into a per-locale map,
// e.g. `{ en: { tiktok: "...", instagram: "..." }, vi: { ... } }`.
export const socialLinks = {
  tiktok: "https://www.tiktok.com/@japan_travel_guide_ctj",
  instagram:
    "https://www.instagram.com/japan_travel_guide_ctj?igsi=OHN5YXZtNnBsdWln&utm_source=qr",
  facebook: "https://www.facebook.com/share/1JVtYszj9o/?mibextid=wwXIfr",
  whatsapp: "https://wa.me/819082691398",
} as const;
