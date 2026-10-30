import type { ReactNode } from "react";
import type { Metadata } from "next";
import "../globals.css";
import "@/components/interview/interview-ui.css";
import { BookingShell } from "@/components/interview/BookingShell";

// Standalone root layout for the applicant interview booking page
// (/interview/[token]).

export const metadata: Metadata = {
  title: "Guide Interview | Connectrip Japan",
  // Personal booking links: keep them out of search engines, and never send
  // the token-bearing URL to another site as a Referer.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function InterviewRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ background: "#f5f3ee", color: "#162e4c" }}>
        <BookingShell>{children}</BookingShell>
      </body>
    </html>
  );
}
