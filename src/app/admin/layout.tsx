import type { ReactNode } from "react";
import "../globals.css";

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body
        className="antialiased"
        style={{ background: "#f5f3ee", color: "#162e4c" }}
      >
        {children}
      </body>
    </html>
  );
}
