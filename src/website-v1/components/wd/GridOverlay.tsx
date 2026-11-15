/**
 * Fine vertical grid lines over the whole site (white-desert.com `grid-overlay`):
 * fixed, on top of everything, blended with `difference` so they read on both
 * photos and navy. Purely decorative. The lines follow the app container
 * (1200px): six columns on wide screens, four on phones. Styles: wd.css.
 */
export function GridOverlay() {
  return (
    <div aria-hidden className="wd-grid-overlay">
      <div className="wd-grid-overlay__inner">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className={i === 2 || i === 4 ? "max-md:hidden" : undefined} data-line={i} />
        ))}
      </div>
    </div>
  );
}
