/**
 * Officer names and titles (Human instruction 2026-11-15). The only place
 * that spells them; the Privacy Policy and About read from here.
 *
 * - Riku Ohizumi: 代表取締役 / Representative Director & CEO (the legal
 *   representative of the company).
 * - Soma Beppu: 取締役副代表 / Director & Deputy Representative | EVP
 *   (official title, Human instruction 2026-11-21; replaces "Director &
 *   Deputy Head"). EVP = Executive Vice President; business cards use "EVP".
 */
export type OfficerKey = "representative" | "deputy";

export const OFFICERS = {
  representative: { name: "Riku Ohizumi", titleJa: "代表取締役", titleEn: "Representative Director & CEO" },
  deputy: { name: "Soma Beppu", nameJa: "別府壮真", titleJa: "取締役副代表", titleEn: "Director & Deputy Representative | EVP" },
} as const;

/**
 * Personal Information Management Officer (個人情報管理責任者): Soma Beppu,
 * appointed by management decision of 2026-11-15. The Privacy Policy reads
 * the name and title from here (Sections 1, 11 and 14).
 */
export const PRIVACY_OFFICER: OfficerKey = "deputy";
export const PRIVACY_OFFICER_DECISION = { decidedAt: "2026-11-15", by: "Management decision (経営判断)" } as const;

/**
 * "Riku Ohizumi, Representative Director & CEO". " | " is glued to its
 * neighbours (no-break spaces, plus a word joiner because browsers may break
 * after "|" even before a no-break space), so a narrow screen never leaves
 * "EVP" alone on a line: "Representative | EVP" wraps as one unit.
 */
export function officerLine(key: OfficerKey): string {
  const o = OFFICERS[key];
  return `${o.name}, ${o.titleEn.replace(/ \| /g, " |⁠ ")}`;
}

/**
 * The founders on the About page (Human instruction 2026-11-16): one photo of
 * both founders, used as supplied (not cropped; metadata removed), with the
 * names only. Left: Soma Beppu. Right: Riku Ohizumi.
 *
 * The name is spelled "Riku Ohizumi" everywhere on the site (Human instruction
 * 2026-11-25: About, the company table, the Privacy Policy and the Domestic
 * Travel Services Manager all use this one spelling; "Riku Ohizumi" is retired).
 * To replace the photo, overwrite the file at `src` (same name) or change it here.
 */
export const FOUNDERS_PHOTO = {
  src: "/images/v1/about/founders/connectrip-founders.jpg",
  alt: "Soma Beppu (left) and Riku Ohizumi (right), the founders of Connectrip Japan, in Shinsekai, Osaka, with Tsutenkaku Tower behind them",
  width: 1536,
  height: 2048,
  /** Names in photo order, left to right. */
  names: ["Soma Beppu", "Riku Ohizumi"],
} as const;
