/**
 * Officer names and titles (Human instruction 2026-11-15). The only place
 * that spells them; the Privacy Policy and About read from here.
 *
 * - Riku Oizumi: 代表取締役 / Representative Director & CEO (the legal
 *   representative of the company).
 * - Soma Beppu: 取締役副代表 / Director & Deputy Head (official English title,
 *   Human instruction 2026-11-18). An internal title, not a representative
 *   director: it carries no statutory power of representation. Do not use
 *   "Vice President", "Deputy CEO", "Deputy Representative" or any wording
 *   that suggests a power of representation.
 */
export type OfficerKey = "representative" | "deputy";

export const OFFICERS = {
  representative: { name: "Riku Oizumi", titleJa: "代表取締役", titleEn: "Representative Director & CEO" },
  deputy: { name: "Soma Beppu", nameJa: "別府壮真", titleJa: "取締役副代表", titleEn: "Director & Deputy Head" },
} as const;

/**
 * Personal Information Management Officer (個人情報管理責任者): Soma Beppu,
 * appointed by management decision of 2026-11-15. The Privacy Policy reads
 * the name and title from here (Sections 1, 11 and 14).
 */
export const PRIVACY_OFFICER: OfficerKey = "deputy";
export const PRIVACY_OFFICER_DECISION = { decidedAt: "2026-11-15", by: "Management decision (経営判断)" } as const;

/** "Riku Oizumi, Representative Director & CEO". */
export function officerLine(key: OfficerKey): string {
  const o = OFFICERS[key];
  return `${o.name}, ${o.titleEn}`;
}

/**
 * The founders on the About page (Human instruction 2026-11-16): one photo of
 * both founders, used as supplied (not cropped; metadata removed), with the
 * names only. Left: Soma Beppu. Right: Riku Ohizumi.
 *
 * "Riku Ohizumi" is the spelling the owner confirmed for About (2026-11-16).
 * `OFFICERS.representative.name` (legal documents, Privacy Policy) still reads
 * "Riku Oizumi": unify both when the owner confirms the legal spelling.
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
