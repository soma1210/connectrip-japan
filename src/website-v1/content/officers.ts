/**
 * Officer names and titles (Human instruction 2026-11-15). The only place
 * that spells them; the Privacy Policy and About read from here.
 *
 * - Riku Oizumi: 代表取締役 / Representative Director & CEO (the legal
 *   representative of the company).
 * - Soma Beppu: 取締役副代表 / Director & Deputy Representative. An internal
 *   title, not a representative director: it carries no statutory power of
 *   representation. Do not use "Vice President" for this role.
 */
export type OfficerKey = "representative" | "deputy";

export const OFFICERS = {
  representative: { name: "Riku Oizumi", titleJa: "代表取締役", titleEn: "Representative Director & CEO" },
  deputy: { name: "Soma Beppu", nameJa: "別府壮真", titleJa: "取締役副代表", titleEn: "Director & Deputy Representative" },
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
