import type { ReactNode } from "react";
import type { Metadata } from "next";
import "../globals.css";
import "@/components/interview/interview-ui.css";

// Standalone root layout for the interview system's privacy policy (/privacy),
// served on the interview-only site and linked from the Google OAuth consent screen.

export const metadata: Metadata = {
  title: "Privacy Policy | Connectrip Japan Guide Interview",
  description: "How Connectrip Japan handles personal information in the guide application and interview booking system.",
  robots: { index: false, follow: false },
};

export default function PrivacyRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ background: "#f5f3ee", color: "#162e4c" }}>
        {children}
      </body>
    </html>
  );
}
