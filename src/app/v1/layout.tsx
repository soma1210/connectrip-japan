import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter_Tight } from "next/font/google";
import { getLayoutViewModel, getRecruitNav } from "@/website-v1/content/pages";
import { PreviewBanner, V1Footer, V1Header } from "@/website-v1/components/Layout";
import { ORGANIZATION_NAME, V1_PREVIEW } from "@/website-v1/config";
import { OG_IMAGE } from "@/website-v1/metadata";
import { SITE_URL } from "@/lib/site";
import { openingBootScript } from "@/website-v1/components/opening/openingBoot";
import { routeHref } from "@/website-v1/routes";
import "../globals.css";
import "@/website-v1/components/wd/wd.css";
import { WdMotion } from "@/website-v1/components/wd/WdMotion";

// One gothic family for everything (Human instruction 2026-11-22): Inter Tight, light for display, regular for text.
const interTight = Inter_Tight({ variable: "--font-sans-ui", subsets: ["latin"], weight: ["200", "300", "400", "500", "600"] });

/**
 * Site defaults. Pages set their own title, description and canonical
 * (website-v1/metadata.ts). Indexing: the preview never; public mode yes,
 * except on *.netlify.app hosts, which get `X-Robots-Tag: noindex` from
 * next.config.ts / netlify.toml until the real domain is connected.
 */
export const metadata: Metadata = V1_PREVIEW
  ? {
      title: { default: "Website v1 Preview", template: "%s | Website v1 Preview" },
      robots: { index: false, follow: false },
    }
  : {
      metadataBase: new URL(SITE_URL),
      title: { default: ORGANIZATION_NAME, template: `%s | ${ORGANIZATION_NAME}` },
      robots: { index: true, follow: true },
      openGraph: { type: "website", siteName: ORGANIZATION_NAME, locale: "en_US", images: [OG_IMAGE] },
      twitter: { card: "summary", images: [OG_IMAGE.url] },
    };

/**
 * Root layout of the Website v1 preview. Separate from the current site's
 * `[locale]` layout so the current site is untouched. Language scope is TBD;
 * the preview renders in English.
 */
export default function WebsiteV1Layout({ children }: { children: ReactNode }) {
  const layout = getLayoutViewModel();
  const recruit = getRecruitNav();
  return (
    // suppressHydrationWarning: the opening boot script sets data-v1-opening / overflow on <html> before hydration.
    <html lang="en" className={`${interTight.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        {/* Home Opening Experience (W1-D21): decides before first paint whether to play (Home, first load per session). */}
        <script dangerouslySetInnerHTML={{ __html: openingBootScript(routeHref("home")) }} />
        {V1_PREVIEW ? <PreviewBanner /> : null}
        <V1Header layout={layout} recruit={recruit} />
        <main className="flex-1">{children}</main>
        <V1Footer layout={layout} recruit={recruit} />
        {/* White Desert–style motion layer (components/wd). */}
        <WdMotion />
      </body>
    </html>
  );
}
