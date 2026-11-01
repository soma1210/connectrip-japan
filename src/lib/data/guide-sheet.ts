import { missingRequiredHeaders, parseApplications, parseInterviewRequests } from "@/features/guide-sheet/admin";
import { APPLICATIONS_TAB, INTERVIEW_REQUESTS_TAB } from "@/features/guide-sheet/config";
import { SAMPLE_APPLICATION_VALUES, SAMPLE_INTERVIEW_REQUEST_VALUES } from "@/features/guide-sheet/sample";
import type { GuideSheetData, GuideSheetSource } from "@/features/guide-sheet/types";
import { SheetsApiError, SheetsAuthError, getSheetValues, isSheetsConfigured } from "@/lib/google-sheets";

const SPREADSHEET_ID = process.env.GUIDE_SHEET_SPREADSHEET_ID ?? "";

/**
 * Where Guide Admin reads applications from:
 * - "sheets" — the "Connectrip Guide Applications" spreadsheet (read only).
 * - "sample" — made-up rows, only in local development without credentials.
 * - "none"   — production without credentials: an error is shown, nothing is made up.
 */
export const guideSheetSource: GuideSheetSource =
  isSheetsConfigured && SPREADSHEET_ID ? "sheets" : process.env.NODE_ENV === "production" ? "none" : "sample";

function describe(error: unknown) {
  if (error instanceof SheetsAuthError) {
    return `Google の認証に失敗しました。refresh token を取り直してください（${error.message}）`;
  }
  if (error instanceof SheetsApiError) {
    if (error.status === 403) return "スプレッドシートを読めません。refresh token を発行した Google アカウントがこのシートを閲覧できるか確認してください。";
    if (error.status === 404) return "スプレッドシートまたはタブが見つかりません。ID とタブ名を確認してください。";
    return `Google Sheets の読み込みに失敗しました（${error.message}）`;
  }
  return "Google Sheets の読み込みに失敗しました。";
}

export async function loadGuideSheet(): Promise<GuideSheetData> {
  const fetchedAt = new Date().toISOString();

  if (guideSheetSource === "none") {
    return {
      source: "none",
      applications: [],
      interviewRequests: [],
      fetchedAt,
      missingHeaders: [],
      errors: ["Google Sheets が未設定です。GOOGLE_SHEETS_CLIENT_ID / GOOGLE_SHEETS_CLIENT_SECRET / GOOGLE_SHEETS_REFRESH_TOKEN / GUIDE_SHEET_SPREADSHEET_ID を設定してください。"],
      sheetUrl: null,
    };
  }

  const errors: string[] = [];
  let applicationValues: string[][] = [];
  let requestValues: string[][] = [];

  if (guideSheetSource === "sample") {
    applicationValues = SAMPLE_APPLICATION_VALUES;
    requestValues = SAMPLE_INTERVIEW_REQUEST_VALUES;
  } else {
    // The interview requests tab is extra information: if it fails, the list still shows.
    const [applications, requests] = await Promise.allSettled([
      getSheetValues(SPREADSHEET_ID, APPLICATIONS_TAB),
      getSheetValues(SPREADSHEET_ID, INTERVIEW_REQUESTS_TAB),
    ]);
    if (applications.status === "fulfilled") applicationValues = applications.value;
    else errors.push(describe(applications.reason));
    if (requests.status === "fulfilled") requestValues = requests.value;
    else if (applications.status === "fulfilled") errors.push(`「${INTERVIEW_REQUESTS_TAB}」タブ：${describe(requests.reason)}`);
  }

  const { applications, missingHeaders } = parseApplications(applicationValues);
  const missingRequired = applicationValues.length ? missingRequiredHeaders(missingHeaders) : [];
  if (missingRequired.length) errors.push(`必要な見出しが見つかりません：${missingRequired.join("、")}`);

  return {
    source: guideSheetSource,
    applications,
    interviewRequests: parseInterviewRequests(requestValues),
    fetchedAt,
    missingHeaders,
    errors,
    sheetUrl: guideSheetSource === "sheets" ? `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit` : null,
  };
}
