import type { ReactNode } from "react";

/**
 * Remounts on every navigation inside Website V1. The page transition is now
 * PageTransition (components/wd, mounted once in WdMotion: it covers the page
 * before leaving, then lifts away), so nothing extra plays here.
 */
export default function V1Template({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
