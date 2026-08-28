import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ja", "en", "vi", "ko", "zh-TW"],
  defaultLocale: "ja",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
