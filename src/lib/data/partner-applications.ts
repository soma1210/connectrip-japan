import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sql, isDbConfigured } from "@/lib/db";
import {
  DEFAULT_PARTNER_PIPELINE_STATUSES,
  INITIAL_PARTNER_STATUS,
} from "@/features/partner-survey/config/pipeline";
import { generateReceiptNo } from "@/features/partner-survey/receipt";
import type {
  PartnerApplication,
  PartnerApplicationAdminFields,
  PartnerApplicationFilters,
  PartnerApplicationInput,
} from "@/features/partner-survey/types";

/**
 * Where partner applications are stored (same rules as guide applications):
 * - "postgres"   — Neon Postgres (POSTGRES_URL set). Always used in production.
 * - "local-file" — .data/partner-applications.json, only in local development
 *                  without a database, so the form can be tried end to end.
 * - "none"       — production without a database: submissions are refused.
 */
export const partnerStorageMode: "postgres" | "local-file" | "none" = isDbConfigured
  ? "postgres"
  : process.env.NODE_ENV === "production"
    ? "none"
    : "local-file";

export class PartnerStorageUnavailableError extends Error {
  constructor() {
    super("Partner application storage is not configured (POSTGRES_URL is missing).");
  }
}

export interface SaveResult {
  id: string;
  receipt_no: string;
  /** True when this submission_id was already saved (a retried submit). */
  duplicate: boolean;
}

const LIST_LIMIT = 1000;
const RECEIPT_ATTEMPTS = 8;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const COLUMNS = `
  id, submission_id, receipt_no,
  company_name, industry, area, website_url,
  experience, languages, capacity, duration,
  price, commission, conditions, booking, cancellation,
  contact_name, email, phone,
  to_char(next_contact_date, 'YYYY-MM-DD') AS next_contact_date, notes,
  privacy_consent, privacy_consented_at, source,
  pipeline_status, internal_rating, internal_notes, created_at, updated_at
`;

const toIso = (value: unknown) =>
  value instanceof Date ? value.toISOString() : String(value ?? "");

function fromRow(row: Record<string, unknown>): PartnerApplication {
  return {
    ...(row as unknown as PartnerApplication),
    internal_rating: row.internal_rating == null ? null : Number(row.internal_rating),
    privacy_consented_at: toIso(row.privacy_consented_at),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

function isUniqueViolation(error: unknown, constraint: string) {
  const e = error as { code?: string; constraint?: string; message?: string };
  return e?.code === "23505" && (e.constraint === constraint || Boolean(e.message?.includes(constraint)));
}

// --- local development file store -----------------------------------------

const LOCAL_FILE = join(process.cwd(), ".data", "partner-applications.json");

async function readLocal(): Promise<PartnerApplication[]> {
  try {
    return JSON.parse(await readFile(LOCAL_FILE, "utf8")) as PartnerApplication[];
  } catch {
    return [];
  }
}

async function writeLocal(rows: PartnerApplication[]) {
  await mkdir(join(process.cwd(), ".data"), { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(rows, null, 2));
}

function matchesFilters(app: PartnerApplication, filters: PartnerApplicationFilters) {
  if (filters.pipeline_status && app.pipeline_status !== filters.pipeline_status) return false;
  if (filters.industry && app.industry !== filters.industry) return false;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const haystack = [app.company_name, app.contact_name, app.email, app.phone, app.area, app.receipt_no]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

// --- public API --------------------------------------------------------------

export async function getPartnerPipelineStatuses(): Promise<string[]> {
  if (partnerStorageMode !== "postgres") return [...DEFAULT_PARTNER_PIPELINE_STATUSES];
  const { rows } = await sql.query(
    "SELECT name FROM partner_pipeline_statuses ORDER BY sort_order ASC, name ASC",
  );
  return rows.map((row) => row.name as string);
}

/**
 * Save one submission. Idempotent per submission_id: sending the same form
 * twice returns the first receipt instead of creating a second row.
 */
export async function createPartnerApplication(
  input: PartnerApplicationInput,
  submissionId: string,
): Promise<SaveResult> {
  if (partnerStorageMode === "none") throw new PartnerStorageUnavailableError();

  if (partnerStorageMode === "local-file") {
    const rows = await readLocal();
    const existing = rows.find((row) => row.submission_id === submissionId);
    if (existing) return { id: existing.id, receipt_no: existing.receipt_no, duplicate: true };
    let receiptNo = generateReceiptNo();
    while (rows.some((row) => row.receipt_no === receiptNo)) receiptNo = generateReceiptNo();
    const now = new Date().toISOString();
    const application: PartnerApplication = {
      ...input,
      id: randomUUID(),
      submission_id: submissionId,
      receipt_no: receiptNo,
      source: "hp",
      privacy_consented_at: now,
      pipeline_status: INITIAL_PARTNER_STATUS,
      internal_rating: null,
      internal_notes: "",
      created_at: now,
      updated_at: now,
    };
    await writeLocal([...rows, application]);
    return { id: application.id, receipt_no: receiptNo, duplicate: false };
  }

  for (let attempt = 1; attempt <= RECEIPT_ATTEMPTS; attempt++) {
    const receiptNo = generateReceiptNo();
    try {
      const { rows } = await sql.query(
        `INSERT INTO partner_applications (
           submission_id, receipt_no,
           company_name, industry, area, website_url,
           experience, languages, capacity, duration,
           price, commission, conditions, booking, cancellation,
           contact_name, email, phone, next_contact_date, notes,
           privacy_consent, source, pipeline_status
         ) VALUES (
           $1, $2,
           $3, $4, $5, $6,
           $7, $8, $9, $10,
           $11, $12, $13, $14, $15,
           $16, $17, $18, $19::date, $20,
           $21, 'hp', $22
         )
         ON CONFLICT (submission_id) DO NOTHING
         RETURNING id, receipt_no`,
        [
          submissionId, receiptNo,
          input.company_name, input.industry, input.area, input.website_url,
          input.experience, input.languages, input.capacity, input.duration,
          input.price, input.commission, input.conditions, input.booking, input.cancellation,
          input.contact_name, input.email, input.phone, input.next_contact_date, input.notes,
          input.privacy_consent, INITIAL_PARTNER_STATUS,
        ],
      );
      if (rows[0]) return { id: rows[0].id as string, receipt_no: rows[0].receipt_no as string, duplicate: false };

      // submission_id already saved: hand back the first receipt.
      const existing = await sql.query(
        "SELECT id, receipt_no FROM partner_applications WHERE submission_id = $1",
        [submissionId],
      );
      return {
        id: existing.rows[0].id as string,
        receipt_no: existing.rows[0].receipt_no as string,
        duplicate: true,
      };
    } catch (error) {
      // Same receipt number already used today: draw a new one.
      if (isUniqueViolation(error, "partner_applications_receipt_no_key") && attempt < RECEIPT_ATTEMPTS) continue;
      throw error;
    }
  }
  throw new Error("Could not allocate a unique receipt number.");
}

/** Newest first. */
export async function listPartnerApplications(
  filters: PartnerApplicationFilters = {},
): Promise<PartnerApplication[]> {
  if (partnerStorageMode === "none") return [];

  if (partnerStorageMode === "local-file") {
    return (await readLocal())
      .filter((app) => matchesFilters(app, filters))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, LIST_LIMIT);
  }

  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters.pipeline_status) {
    values.push(filters.pipeline_status);
    conditions.push(`pipeline_status = $${values.length}`);
  }
  if (filters.industry) {
    values.push(filters.industry);
    conditions.push(`industry = $${values.length}`);
  }
  if (filters.q) {
    values.push(`%${filters.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    const p = `$${values.length}`;
    conditions.push(
      `(company_name ILIKE ${p} OR contact_name ILIKE ${p} OR email ILIKE ${p} OR phone ILIKE ${p} OR area ILIKE ${p} OR receipt_no ILIKE ${p})`,
    );
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await sql.query(
    `SELECT ${COLUMNS} FROM partner_applications ${where} ORDER BY created_at DESC LIMIT ${LIST_LIMIT}`,
    values,
  );
  return rows.map(fromRow);
}

export async function getPartnerApplication(id: string): Promise<PartnerApplication | null> {
  if (!UUID_PATTERN.test(id) || partnerStorageMode === "none") return null;

  if (partnerStorageMode === "local-file") {
    return (await readLocal()).find((app) => app.id === id) ?? null;
  }

  const { rows } = await sql.query(`SELECT ${COLUMNS} FROM partner_applications WHERE id = $1`, [id]);
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function updatePartnerApplicationAdminFields(
  id: string,
  fields: PartnerApplicationAdminFields,
) {
  if (!UUID_PATTERN.test(id)) throw new Error("Invalid application id.");
  if (partnerStorageMode === "none") throw new PartnerStorageUnavailableError();

  if (partnerStorageMode === "local-file") {
    const rows = await readLocal();
    const index = rows.findIndex((app) => app.id === id);
    if (index === -1) throw new Error("Application not found.");
    rows[index] = { ...rows[index], ...fields, updated_at: new Date().toISOString() };
    await writeLocal(rows);
    return;
  }

  await sql.query(
    `UPDATE partner_applications
       SET pipeline_status = $2, internal_rating = $3, internal_notes = $4, updated_at = now()
     WHERE id = $1`,
    [id, fields.pipeline_status, fields.internal_rating, fields.internal_notes],
  );
}
