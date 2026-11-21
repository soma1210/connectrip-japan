import type { CSSProperties, ElementType, ReactNode } from "react";
import { KATOMADO_FRAME } from "./katomado";

/**
 * Heading split into characters (same text): each character sits in its own
 * mask and rises with AwardMotion (`data-aw-chars` on the heading). Words never
 * break inside. Screen readers read the heading's aria-label.
 */
export function SplitChars({ text, as: Tag = "h2", className = "", style, id, drift = false }: { text: string; as?: ElementType; className?: string; style?: CSSProperties; id?: string; drift?: boolean }) {
  const words = text.split(" ");
  return (
    <Tag id={id} data-aw-chars data-aw-drift={drift || undefined} aria-label={text} className={className} style={style}>
      {words.map((word, w) => (
        <span key={w} aria-hidden className="inline-block whitespace-nowrap">
          {[...word].map((ch, i) => (
            <span key={i} className="inline-block overflow-clip [overflow-clip-margin:0.12em] pb-[0.06em] align-top">
              <span data-aw-char className="inline-block">
                {ch}
              </span>
            </span>
          ))}
          {w < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}

/** Small section label: number in enji, name in caps, a hairline that draws in. */
export function SectionLabel({ index, children, className = "", tone = "ink" }: { index: string; children: ReactNode; className?: string; tone?: "ink" | "snow" }) {
  const ink = tone === "ink";
  return (
    <div className={`flex items-center gap-5 ${className}`}>
      <span className="font-sans text-[11px] font-medium tracking-[0.3em] text-enji">({index})</span>
      <span className={`font-sans text-[11px] font-medium tracking-[0.3em] uppercase ${ink ? "text-ink/70" : "text-snow/70"}`}>{children}</span>
      <span data-wd-rule aria-hidden className={`h-px flex-1 ${ink ? "bg-ink/15" : "bg-snow/20"}`} />
    </div>
  );
}

/** The katomado shape for framed photos: `style={{ clipPath: "url(#aw-kato)" }}`. Render once per page. */
export function KatomadoDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <defs>
        <clipPath id="aw-kato" clipPathUnits="objectBoundingBox">
          <path d={KATOMADO_FRAME} />
        </clipPath>
      </defs>
    </svg>
  );
}
