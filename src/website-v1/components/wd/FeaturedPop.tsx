import { Fragment, type ReactNode } from "react";
import f from "./FeaturedPop.module.css";

/**
 * Featured Experiences tour panel, editorial version (Human instruction 2026-11-22: "pop but
 * elegant", after luxury-hotel editorial sites). Type-led and quiet: an index line, a light
 * large title revealed word by word, hairline-ruled facts, a thin gold frame and a vertical
 * caption on the photo. The one "pop" is a vermilion hanko seal (大阪) that is stamped on the
 * seam between photo and panel. Static markup; ShowreelMotion animates the data hooks:
 *   [data-sr-word]  words rise out of their masks
 *   [data-sr-line]  hairlines draw from the left
 *   [data-sr-frame] gold frame / caption on the photo settle in
 *   [data-sr-seal]  the seal is stamped
 */

export function FeaturedIndex({ n, label }: { n: string; label: string }) {
  return (
    <p className={f.index}>
      <span className={f.no}>N°{n}</span>
      <span data-sr-line="" className={f.rule} aria-hidden />
      <span>{label}</span>
    </p>
  );
}

/** The tour name, word by word; the part up to ":" in gold. */
export function FeaturedTitle({ title }: { title: string }) {
  const at = title.indexOf(":");
  const lead = at > 0 ? title.slice(0, at + 1) : "";
  const rest = at > 0 ? title.slice(at + 1).trim() : title;
  const words = (text: string, gold: boolean) =>
    text.split(/\s+/).map((w, i) => (
      <Fragment key={`${gold}-${i}`}>
        <span className={f.mask}>
          <span data-sr-word="" className={gold ? f.gold : undefined}>
            {w}
          </span>
        </span>{" "}
      </Fragment>
    ));
  return (
    <span aria-hidden>
      {lead ? words(lead, true) : null}
      {lead ? <br className={f.br} /> : null}
      {words(rest, false)}
    </span>
  );
}

export function FeaturedFacts({ facts }: { facts: { label: string; value: string }[] }) {
  return (
    <dl className={f.facts}>
      {facts.map((x) => (
        <div key={x.label} className={f.fact}>
          <span data-sr-line="" className={f.factRule} aria-hidden />
          <dt>{x.label}</dt>
          <dd>{x.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Thin gold frame and a vertical caption laid over the photo. */
export function FeaturedPhotoFrame({ caption }: { caption: string }) {
  return (
    <div data-sr-frame="" className={f.frame} aria-hidden>
      <span className={f.caption}>{caption}</span>
    </div>
  );
}

export function FeaturedSeal({ children }: { children: ReactNode }) {
  return (
    <span data-sr-seal="" className={f.seal} aria-hidden>
      <span className={f.sealInk}>{children}</span>
    </span>
  );
}
