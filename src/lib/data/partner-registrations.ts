import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sql, isDbConfigured } from "@/lib/db";
import type {
  PartnerRegistration,
  PartnerRegistrationAdminFields,
  PartnerRegistrationInput,
} from "@/features/partner-registration/types";

/**
 * Where partner survey answers (/partner/survey) are stored (same rules as the
 * other forms):
 * - "postgres"   — Neon Postgres (POSTGRES_URL set). Always used in production.
 * - "local-file" — .data/partner-registrations.json, only in local development
 *                  without a database, so the form can be tried end to end.
 * - "none"       — production without a database: submissions are refused.
 *
 * The admin screen (/admin/partner-registrations) reads and updates rows here.
 * Its columns priority / next_action / next_action_at come from
 * sql/partner-registrations-admin.sql, which must be applied before the admin
 * screen is used against Postgres. Saving a submission does not use them.
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
      priority: null,
      internal_notes: "",
      next_action: null,
      next_action_at: null,
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

// ---------------------------------------------------------------------------
// Admin: list / get / update
// ---------------------------------------------------------------------------

const SELECT_COLUMNS = `
  id, submission_id,
  company_name, contact_name, business_category, business_category_other,
  area, website, social_accounts,
  customer_types, inbound_experience, strengths,
  current_challenges, current_challenges_other,
  interested_collaborations, interested_collaborations_other,
  email, phone, additional_notes,
  source, status, priority, internal_notes, next_action,
  to_char(next_action_at, 'YYYY-MM-DD') AS next_action_at,
  created_at, updated_at`;

/** Postgres returns Date objects for timestamps. The screens use ISO strings. */
function fromDb(row: Record<string, unknown>): PartnerRegistration {
  const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value));
  return { ...(row as unknown as PartnerRegistration), created_at: iso(row.created_at), updated_at: iso(row.updated_at) };
}

/** Rows saved before the admin columns existed have no value for them. */
function withAdminDefaults(row: PartnerRegistration): PartnerRegistration {
  return {
    ...row,
    priority: row.priority ?? null,
    next_action: row.next_action ?? null,
    next_action_at: row.next_action_at ?? null,
  };
}

/** Every answer, newest first. Filtering and sorting happen in the list screen. */
export async function listPartnerRegistrations(): Promise<PartnerRegistration[]> {
  if (partnerRegistrationStorageMode === "none") return [];
  if (partnerRegistrationStorageMode === "local-file") {
    const rows = await readLocal();
    return rows.map(withAdminDefaults).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const { rows } = await sql.query(`SELECT ${SELECT_COLUMNS} FROM partner_registrations ORDER BY created_at DESC`);
  return rows.map(fromDb);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getPartnerRegistration(id: string): Promise<PartnerRegistration | null> {
  if (partnerRegistrationStorageMode === "none" || !UUID_PATTERN.test(id)) return null;
  if (partnerRegistrationStorageMode === "local-file") {
    const row = (await readLocal()).find((item) => item.id === id);
    return row ? withAdminDefaults(row) : null;
  }
  const { rows } = await sql.query(`SELECT ${SELECT_COLUMNS} FROM partner_registrations WHERE id = $1`, [id]);
  return rows[0] ? fromDb(rows[0]) : null;
}

/** Saves the admin-only fields. Returns false when the row does not exist. */
export async function updatePartnerRegistrationAdminFields(
  id: string,
  fields: PartnerRegistrationAdminFields,
): Promise<boolean> {
  if (partnerRegistrationStorageMode === "none") throw new PartnerRegistrationStorageUnavailableError();
  if (!UUID_PATTERN.test(id)) return false;

  if (partnerRegistrationStorageMode === "local-file") {
    const rows = await readLocal();
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return false;
    rows[index] = { ...rows[index], ...fields, updated_at: new Date().toISOString() };
    await writeLocal(rows);
    return true;
  }

  const { rowCount } = await sql.query(
    `UPDATE partner_registrations
        SET status = $2, priority = $3, internal_notes = $4,
            next_action = $5, next_action_at = $6::date, updated_at = now()
      WHERE id = $1`,
    [id, fields.status, fields.priority, fields.internal_notes, fields.next_action, fields.next_action_at],
  );
  return (rowCount ?? 0) > 0;
}
