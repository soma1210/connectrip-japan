import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Shippori_Mincho_B1 } from "next/font/google";
import { getLayoutViewModel, getRecruitNav } from "@/website-v1/content/pages";
import { PreviewBanner, V1Footer, V1Header } from "@/website-v1/components/Layout";
import { openingBootScript } from "@/website-v1/components/opening/openingBoot";
import { routeHref } from "@/website-v1/routes";
import "../globals.css";

// Same font setup as the current site.
const shipporiMinchoB1 = Shippori_Mincho_B1({
  variable: "--font-shippori-mincho-b1",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: "Website v1 Preview", template: "%s | Website v1 Preview" },
  robots: { index: false, follow: false },
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
    <html lang="en" className={`${shipporiMinchoB1.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-navy text-cream">
        {/* Home Opening Experience: decides before first paint whether to play (Home, first load per session). */}
        <script dangerouslySetInnerHTML={{ __html: openingBootScript(routeHref("home")) }} />
        <PreviewBanner />
        <V1Header layout={layout} recruit={recruit} />
        <main className="flex-1">{children}</main>
        <V1Footer layout={layout} recruit={recruit} />
      </body>
    </html>
  );
}
