import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sql, isDbConfigured } from "@/lib/db";
import {
  DEFAULT_PIPELINE_STATUSES,
  INITIAL_PIPELINE_STATUS,
} from "@/features/guide-community/config/pipeline";
import { buildWhereClause, matchesFilters } from "@/features/guide-community/filters";
import type {
  GuideApplication,
  GuideApplicationAdminFields,
  GuideApplicationFilters,
  GuideApplicationInput,
} from "@/features/guide-community/types";

/**
 * Where applications are stored:
 * - "postgres"   — Vercel Postgres (POSTGRES_URL set). Always used in production.
 * - "local-file" — .data/guide-applications.json, only in local development
 *                  without a database, so the form can be tried end to end.
 * - "none"       — production without a database: submissions are refused
 *                  rather than silently lost.
 */
export const guideStorageMode: "postgres" | "local-file" | "none" = isDbConfigured
  ? "postgres"
  : process.env.NODE_ENV === "production"
    ? "none"
    : "local-file";

export class GuideStorageUnavailableError extends Error {
  constructor() {
    super("Guide application storage is not configured (POSTGRES_URL is missing).");
  }
}

const LIST_LIMIT = 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const COLUMNS = `
  id, name, age_range, prefecture, city, email, phone, languages,
  guide_experience, guide_experience_detail, guide_experience_years,
  available_areas, available_areas_other, available_days, available_times, monthly_availability,
  employment_status, employment_status_other, occupation_detail,
  guide_purposes, guide_purposes_other, commitment_period,
  international_experience, interests, interests_other,
  motivation, desired_guide_type, self_introduction, interview_preference,
  privacy_consent, privacy_consented_at,
  pipeline_status, internal_rating, internal_notes, created_at, updated_at
`;

const toIso = (value: unknown) =>
  value instanceof Date ? value.toISOString() : String(value ?? "");

function fromRow(row: Record<string, unknown>): GuideApplication {
  return {
    ...(row as unknown as GuideApplication),
    internal_rating: row.internal_rating == null ? null : Number(row.internal_rating),
    privacy_consented_at: toIso(row.privacy_consented_at),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

// --- local development file store -----------------------------------------

const LOCAL_FILE = join(process.cwd(), ".data", "guide-applications.json");

async function readLocal(): Promise<GuideApplication[]> {
  try {
    return JSON.parse(await readFile(LOCAL_FILE, "utf8")) as GuideApplication[];
  } catch {
    return [];
  }
}

async function writeLocal(rows: GuideApplication[]) {
  await mkdir(join(process.cwd(), ".data"), { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(rows, null, 2));
}

// --- public API --------------------------------------------------------------

export async function getPipelineStatuses(): Promise<string[]> {
  if (guideStorageMode !== "postgres") return [...DEFAULT_PIPELINE_STATUSES];
  const { rows } = await sql.query(
    "SELECT name FROM guide_pipeline_statuses ORDER BY sort_order ASC, name ASC",
  );
  return rows.map((row) => row.name as string);
}

export async function createGuideApplication(input: GuideApplicationInput): Promise<string> {
  if (guideStorageMode === "none") throw new GuideStorageUnavailableError();

  if (guideStorageMode === "local-file") {
    const now = new Date().toISOString();
    const application: GuideApplication = {
      ...input,
      id: randomUUID(),
      privacy_consented_at: now,
      pipeline_status: INITIAL_PIPELINE_STATUS,
      internal_rating: null,
      internal_notes: "",
      created_at: now,
      updated_at: now,
    };
    await writeLocal([...(await readLocal()), application]);
    return application.id;
  }

  const { rows } = await sql.query(
    `INSERT INTO guide_applications (
       name, age_range, prefecture, city, email, phone, languages,
       guide_experience, guide_experience_detail, guide_experience_years,
       available_areas, available_areas_other, available_days, available_times, monthly_availability,
       employment_status, employment_status_other, occupation_detail,
       guide_purposes, guide_purposes_other, commitment_period,
       international_experience, interests, interests_other,
       motivation, desired_guide_type, self_introduction, interview_preference,
       privacy_consent, pipeline_status
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7::jsonb,
       $8, $9, $10,
       $11, $12, $13, $14, $15,
       $16, $17, $18,
       $19, $20, $21,
       $22, $23, $24,
       $25, $26, $27, $28,
       $29, $30
     ) RETURNING id`,
    [
      input.name, input.age_range, input.prefecture, input.city, input.email, input.phone,
      JSON.stringify(input.languages),
      input.guide_experience, input.guide_experience_detail, input.guide_experience_years,
      input.available_areas, input.available_areas_other, input.available_days,
      input.available_times, input.monthly_availability,
      input.employment_status, input.employment_status_other, input.occupation_detail,
      input.guide_purposes, input.guide_purposes_other, input.commitment_period,
      input.international_experience, input.interests, input.interests_other,
      input.motivation, input.desired_guide_type, input.self_introduction,
      input.interview_preference,
      input.privacy_consent, INITIAL_PIPELINE_STATUS,
    ],
  );
  return rows[0].id as string;
}

/** Newest first. */
export async function listGuideApplications(
  filters: GuideApplicationFilters = {},
): Promise<GuideApplication[]> {
  if (guideStorageMode === "none") return [];

  if (guideStorageMode === "local-file") {
    return (await readLocal())
      .filter((app) => matchesFilters(app, filters))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, LIST_LIMIT);
  }

  const { where, values } = buildWhereClause(filters);
  const { rows } = await sql.query(
    `SELECT ${COLUMNS} FROM guide_applications ${where} ORDER BY created_at DESC LIMIT ${LIST_LIMIT}`,
    values,
  );
  return rows.map(fromRow);
}

export async function getGuideApplication(id: string): Promise<GuideApplication | null> {
  if (!UUID_PATTERN.test(id) || guideStorageMode === "none") return null;

  if (guideStorageMode === "local-file") {
    return (await readLocal()).find((app) => app.id === id) ?? null;
  }

  const { rows } = await sql.query(
    `SELECT ${COLUMNS} FROM guide_applications WHERE id = $1`,
    [id],
  );
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function updateGuideApplicationAdminFields(
  id: string,
  fields: GuideApplicationAdminFields,
) {
  if (!UUID_PATTERN.test(id)) throw new Error("Invalid application id.");
  if (guideStorageMode === "none") throw new GuideStorageUnavailableError();

  if (guideStorageMode === "local-file") {
    const rows = await readLocal();
    const index = rows.findIndex((app) => app.id === id);
    if (index === -1) throw new Error("Application not found.");
    rows[index] = { ...rows[index], ...fields, updated_at: new Date().toISOString() };
    await writeLocal(rows);
    return;
  }

  await sql.query(
    `UPDATE guide_applications
       SET pipeline_status = $2, internal_rating = $3, internal_notes = $4, updated_at = now()
     WHERE id = $1`,
    [id, fields.pipeline_status, fields.internal_rating, fields.internal_notes],
  );
}
