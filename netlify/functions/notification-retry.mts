/**
 * Netlify Scheduled Function (Phase 2, 2026-11-16): every 10 minutes, asks the
 * site to send due staff emails (src/lib/inquiries/retryJob.ts).
 * Needs CRON_SECRET (32+ characters) in the site's environment; Netlify sets URL.
 * Does nothing while CRON_SECRET is missing. Not active until the site is deployed.
 */
export default async function notificationRetry() {
  const secret = process.env.CRON_SECRET;
  const site = process.env.URL;
  if (!secret || secret.length < 32 || !site) return;
  const response = await fetch(`${site}/api/internal/notifications/retry`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  // Counts only, never message content.
  console.log(`notification retry: HTTP ${response.status} ${await response.text()}`);
}

export const config = { schedule: "*/10 * * * *" };
