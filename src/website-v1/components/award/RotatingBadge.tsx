/**
 * A slowly turning ring of text (existing words only), with an enji dot at
 * its centre. Turns faster while the page is scrolled fast (--wd-v from
 * SmoothScroll via CSS). Decorative: aria-hidden.
 */
export function RotatingBadge({ text, className = "" }: { text: string; className?: string }) {
  const id = `rb-${text.length}`;
  return (
    <div aria-hidden className={`aw-badge pointer-events-none select-none ${className}`}>
      <svg viewBox="0 0 200 200" className="aw-badge__ring h-full w-full">
        <defs>
          <path id={id} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text className="fill-current font-sans text-[13.5px] font-medium tracking-[0.32em] uppercase">
          <textPath href={`#${id}`}>{text}</textPath>
        </text>
      </svg>
      <span className="aw-badge__dot" />
    </div>
  );
}
