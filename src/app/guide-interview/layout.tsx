import type { ReactNode } from "react";
import type { Metadata } from "next";
import "../globals.css";
import "@/components/interview/interview-ui.css";

// Standalone root layout for the public Guide Interview page (/guide-interview).
// It only explains the interview; booking stays on the personal
// /interview/[token] links, so nothing here touches the calendar.

export const metadata: Metadata = {
  title: "Guide Interview | Connectrip Japan",
  description:
    "How the Connectrip Japan guide interview works: a 30-minute online interview on Google Meet for people who want to guide travelers in Kansai. No guiding experience required.",
  // Not for search engines yet: the interview system goes live on its own site
  // before connectripjapan.com. Index it (and add a canonical and a sitemap
  // entry) once the page moves to the main domain.
  robots: { index: false, follow: false },
};

export default function GuideInterviewRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ background: "#f5f3ee", color: "#162e4c" }}>
        {children}
      </body>
    </html>
  );
}
