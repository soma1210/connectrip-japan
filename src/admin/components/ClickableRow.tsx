"use client";

import type { MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * Table row that opens a detail page when clicked anywhere.
 * Real links inside the row (e.g. the name) still work as normal links,
 * including Cmd/Ctrl-click to open in a new tab, so keyboard and screen-reader
 * users keep a proper link to follow.
 */
export function ClickableRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLTableRowElement>) {
    if ((event.target as HTMLElement).closest("a, button, input, select, textarea")) return;
    if (window.getSelection()?.toString()) return; // let people select text without navigating
    if (event.metaKey || event.ctrlKey) {
      window.open(href, "_blank");
      return;
    }
    router.push(href);
  }

  return (
    <tr
      onClick={handleClick}
      className="group cursor-pointer align-top transition-colors hover:bg-slate-50"
    >
      {children}
    </tr>
  );
}
