import { NextResponse } from "next/server";

/**
 * Old partner survey endpoint (/partner/apply). Closed 2026-10-28: the simple survey
 * form was removed and a new partner survey replaces it.
 *
 * Every POST answers 410 Gone and stores nothing. The `partner_applications` table,
 * its data, src/lib/data/partner-applications.ts and sql/partner-applications.sql are
 * kept for reference. The previous handler is in commit 2c80cd2.
 */
export function POST() {
  return NextResponse.json(
    { success: false, code: "FORM_CLOSED", message: "このフォームの受付は終了しました。" },
    { status: 410 },
  );
}
