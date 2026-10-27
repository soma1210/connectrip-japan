import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Plus_Jakarta_Sans } from "next/font/google";
import "./guide-community.css";

// Standalone root layout: the Guide Community page does not share the main
// site's header, footer, fonts, stylesheet or i18n, so it can be redesigned on
// its own. Colors and shapes live in ./guide-community.css.

const bodyFont = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-gc-body",
  display: "swap",
  preload: false,
});

const headingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-gc-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Join Our Guide Community | Connectrip Japan",
  description:
    "大阪・京都・神戸・奈良を中心に、訪日外国人旅行者へ日本の魅力を伝えるガイド仲間を募集しています。未経験の方も歓迎、約3〜5分で回答できます。",
};

export const viewport: Viewport = {
  themeColor: "#f7f6f2",
};

export default function GuideCommunityLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={`${bodyFont.variable} ${headingFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
