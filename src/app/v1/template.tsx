import type { ReactNode } from "react";
import { PageCurtain } from "@/website-v1/components/wd/PageCurtain";

/**
 * Remounts on every navigation inside Website V1: plays the page transition
 * curtain (components/wd/PageCurtain). No wrapper element and no transform, so
 * sticky / fixed elements on the pages keep working.
 */
export default function V1Template({ children }: { children: ReactNode }) {
  return (
    <>
      <PageCurtain />
      {children}
    </>
  );
}
