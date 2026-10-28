import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sql, isDbConfigured } from "@/lib/db";
import type { PartnerRegistration, PartnerRegistrationInput } from "@/features/partner-registration/types";

/**
 * Where partner survey answers (/partner/survey) are stored (same rules as the
 * other forms):
 * - "postgres"   — Neon Postgres (POSTGRES_URL set). Always used in production.
 * - "local-file" — .data/partner-registrations.json, only in local development
 *                  without a database, so the form can be tried end to end.
 * - "none"       — production without a database: submissions are refused.
 *
 * Only saving is implemented for now. The admin screen will add list / get /
 * update here against the same table (see sql/partner-registrations.sql).
 */
export const partnerRegistrationStorageMode: "postgres" | "local-file" | "none" = isDbConfigured
  ? "postgres"
  : process.env.NODE_ENV === "production"
    ? "none"
    : "local-file";

export class PartnerRegistrationStorageUnavailableError extends Error {
  constructor() {
    super("Partner registration storage is not configured (POSTGRES_URL is missing).");
  }
}

export interface SaveResult {
  id: string;
  /** True when this submission_id was already saved (a retried submit). */
  duplicate: boolean;
}

const LOCAL_FILE = join(process.cwd(), ".data", "partner-registrations.json");

async function readLocal(): Promise<PartnerRegistration[]> {
  try {
    return JSON.parse(await readFile(LOCAL_FILE, "utf8")) as PartnerRegistration[];
  } catch {
    return [];
  }
}

async function writeLocal(rows: PartnerRegistration[]) {
  await mkdir(join(process.cwd(), ".data"), { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(rows, null, 2));
}

/**
 * Save one submission. Idempotent per submission_id: sending the same form
 * twice keeps the first row instead of creating a second one.
 */
export async function createPartnerRegistration(
  input: PartnerRegistrationInput,
  submissionId: string,
): Promise<SaveResult> {
  if (partnerRegistrationStorageMode === "none") throw new PartnerRegistrationStorageUnavailableError();

  if (partnerRegistrationStorageMode === "local-file") {
    const rows = await readLocal();
    const existing = rows.find((row) => row.submission_id === submissionId);
    if (existing) return { id: existing.id, duplicate: true };
    const now = new Date().toISOString();
    const registration: PartnerRegistration = {
      ...input,
      id: randomUUID(),
      submission_id: submissionId,
      source: "hp",
      status: "new",
      internal_notes: "",
      created_at: now,
      updated_at: now,
    };
    await writeLocal([...rows, registration]);
    return { id: registration.id, duplicate: false };
  }

  const { rows } = await sql.query(
    `INSERT INTO partner_registrations (
       submission_id,
       company_name, contact_name, business_category, business_category_other,
       area, website, social_accounts,
       customer_types, inbound_experience, strengths,
       current_challenges, current_challenges_other,
       interested_collaborations, interested_collaborations_other,
       email, phone, additional_notes
     ) VALUES (
       $1,
       $2, $3, $4, $5,
       $6, $7, $8::text[],
       $9::text[], $10, $11,
       $12::text[], $13,
       $14::text[], $15,
       $16, $17, $18
     )
     ON CONFLICT (submission_id) DO NOTHING
     RETURNING id`,
    [
      submissionId,
      input.company_name, input.contact_name, input.business_category, input.business_category_other,
      input.area, input.website, input.social_accounts,
      input.customer_types, input.inbound_experience, input.strengths,
      input.current_challenges, input.current_challenges_other,
      input.interested_collaborations, input.interested_collaborations_other,
      input.email, input.phone, input.additional_notes,
    ],
  );
  if (rows[0]) return { id: rows[0].id as string, duplicate: false };

  // submission_id already saved: hand back the first row.
  const existing = await sql.query("SELECT id FROM partner_registrations WHERE submission_id = $1", [submissionId]);
  return { id: existing.rows[0].id as string, duplicate: true };
}
