import { NextResponse } from "next/server";

/**
 * Old partner survey endpoint (/partner/apply). Closed 2026-10-28: the new partner
 * survey (/partner/survey, /api/partner-registrations) replaces it.
 *
 * Every POST answers 410 Gone and stores nothing. The `partner_applications` table,
 * its data, src/lib/data/partner-applications.ts, sql/partner-applications.sql and the
 * admin pages are kept. The previous handler is in git history.
 */
export function POST() {
  return NextResponse.json(
    { success: false, code: "FORM_CLOSED", message: "このフォームの受付は終了しました。" },
    { status: 410 },
  );
}
