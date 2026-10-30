// Admin-facing (Japanese) messages for interview operations.

import type { AdminFailureCode } from "@/lib/interviews";

export const ADMIN_FAILURE_MESSAGES: Record<AdminFailureCode, string> = {
  NOT_FOUND: "面談が見つかりません。",
  WRONG_STATUS: "この面談はすでに処理されています。画面を再読み込みしてください。",
  OPEN_INTERVIEW_EXISTS: "この応募者には申請中または確定済みの面談があります。",
  SLOT_UNAVAILABLE: "この時間はすでに利用できません。別の時間を選択してください。",
  IN_PAST: "面談時刻を過ぎているため承認できません。",
  CALENDAR_AUTH: "Google Calendar の接続が切れています。再認証が必要です（環境変数のリフレッシュトークン）。",
  CALENDAR_ERROR: "Google Calendar でエラーが発生しました。時間をおいて再度お試しください。予定は作成されていません。",
  MEET_FAILED: "Google Meet を作成できませんでした。予定は取り消しました。再度お試しください。",
  DB_FAILED: "保存に失敗しました。Calendar の予定は取り消しました。再度お試しください。",
  PUBLIC_URL_NOT_CONFIGURED:
    "面談URLの基準（INTERVIEW_PUBLIC_BASE_URL）が未設定か、https の公開URLではありません。Netlify の環境変数を確認してください。リンクは発行していません。",
};
