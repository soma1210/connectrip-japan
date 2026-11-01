import type { FieldKey } from "./config";

/** One Form answer as it appears in the sheet: header text and cell text. */
export type SheetAnswer = { header: string; value: string };

export type SheetApplication = {
  /** Application ID, or "row-N" while the sheet has not given the row an ID yet. */
  key: string;
  /** 1-based row number in the sheet (row 1 is the header). */
  rowNumber: number;
  fields: Record<FieldKey, string>;
  /** Checkbox answers split into their choices. */
  languages: string[];
  areas: string[];
  /** Columns whose header this app does not know, in sheet order. */
  extraAnswers: SheetAnswer[];
};

export type InterviewRequest = {
  requestId: string;
  applicationId: string;
  requestedStart: string;
  requestedEnd: string;
  approvalStatus: string;
  confirmedAt: string;
  createdAt: string;
  notes: string;
};

export type GuideSheetSource = "sheets" | "sample" | "none";

export type GuideSheetData = {
  source: GuideSheetSource;
  applications: SheetApplication[];
  interviewRequests: InterviewRequest[];
  /** ISO time the data was read. */
  fetchedAt: string;
  /** Known headers that the sheet no longer has. */
  missingHeaders: string[];
  /** Problems worth showing at the top of the screen (the data may still be partial). */
  errors: string[];
  /** Link to open the spreadsheet in Google Sheets (null for sample data). */
  sheetUrl: string | null;
};
