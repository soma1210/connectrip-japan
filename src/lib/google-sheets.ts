// Google Sheets access for Guide Admin (server only). Read only.
//
// Uses the sheet owner's own Google account through an OAuth 2.0 refresh
// token with the single scope spreadsheets.readonly, so even a bug here cannot
// change the sheet, the form behind it, its Apps Script or the calendar.
//
// Environment (values never go in Git):
//   GOOGLE_SHEETS_CLIENT_ID / GOOGLE_SHEETS_CLIENT_SECRET   OAuth client used only for Sheets
//   GOOGLE_SHEETS_REFRESH_TOKEN                             refresh token for spreadsheets.readonly
//   (Calendar / Meet keep their own GOOGLE_OAUTH_* / GOOGLE_CALENDAR_* credentials.)
//
// Get a refresh token with scripts/google-sheets-auth.mjs.

const { GOOGLE_SHEETS_CLIENT_ID, GOOGLE_SHEETS_CLIENT_SECRET, GOOGLE_SHEETS_REFRESH_TOKEN } = process.env;

const API = "https://sheets.googleapis.com/v4/spreadsheets";
const REQUEST_TIMEOUT_MS = 8_000;

export const isSheetsConfigured = Boolean(GOOGLE_SHEETS_CLIENT_ID && GOOGLE_SHEETS_CLIENT_SECRET && GOOGLE_SHEETS_REFRESH_TOKEN);

/** Not configured, or the refresh token was revoked / expired: someone must reconnect. */
export class SheetsAuthError extends Error {}
/** Google answered with an error, or did not answer in time. */
export class SheetsApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

// --- access token ------------------------------------------------------------

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (!isSheetsConfigured) throw new SheetsAuthError("Google Sheets is not configured.");
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  let response: Response;
  try {
    response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: GOOGLE_SHEETS_CLIENT_ID!,
        client_secret: GOOGLE_SHEETS_CLIENT_SECRET!,
        refresh_token: GOOGLE_SHEETS_REFRESH_TOKEN!,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new SheetsApiError(`Token request failed: ${(error as Error).message}`);
  }

  const body = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!response.ok || !body.access_token) {
    // invalid_grant: the refresh token was revoked or has expired.
    if (body.error === "invalid_grant" || body.error === "invalid_client" || body.error === "unauthorized_client") {
      throw new SheetsAuthError(`Google rejected the Sheets credentials (${body.error}).`);
    }
    throw new SheetsApiError(`Token request failed (${response.status} ${body.error ?? ""}).`, response.status);
  }

  cachedToken = { value: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return body.access_token;
}

// --- values ------------------------------------------------------------------

/**
 * Every row of one tab, as the sheet displays it (formatted values). Trailing
 * empty cells are omitted by Google, so rows can be shorter than the header.
 */
export async function getSheetValues(spreadsheetId: string, tabName: string): Promise<string[][]> {
  const token = await accessToken();
  const range = encodeURIComponent(`'${tabName.replace(/'/g, "''")}'`);
  const url = `${API}/${encodeURIComponent(spreadsheetId)}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new SheetsApiError(`Reading "${tabName}" failed or timed out.`);
  }
  if (response.status === 401) {
    cachedToken = null;
    throw new SheetsAuthError("Google Sheets access was denied (401).");
  }
  if (!response.ok) throw new SheetsApiError(`Reading "${tabName}" failed (${response.status}).`, response.status);

  const body = (await response.json()) as { values?: unknown[][] };
  return (body.values ?? []).map((row) => row.map((cell) => String(cell ?? "")));
}
