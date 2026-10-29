// One-time setup: connect the interviewer's Google Calendar for interview
// booking and print a refresh token (GOOGLE_CALENDAR_REFRESH_TOKEN).
//
// Run it yourself on your own machine — the token grants access to your
// calendar, so do not paste its output into chats, issues or commits.
//
//   GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... node scripts/google-calendar-auth.mjs
//
// Google Cloud setup (once):
//   1. Enable the Google Calendar API.
//   2. OAuth consent screen: add the two scopes below, and set the publishing
//      status to "In production". In "Testing", refresh tokens expire after 7 days.
//   3. Credentials → OAuth client ID → "Desktop app". Use its client ID / secret.
// Then sign in with the interviewer's Google account when the browser opens.
//
// Scopes (the minimum the booking system needs):
//   calendar.freebusy     — busy times only, no event details
//   calendar.events.owned — create / delete the interview events on own calendars

import http from "node:http";
import { randomBytes, createHash } from "node:crypto";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.events.owned",
];

const { GOOGLE_OAUTH_CLIENT_ID: clientId, GOOGLE_OAUTH_CLIENT_SECRET: clientSecret } = process.env;
if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET first (see the comment at the top).");
  process.exit(1);
}

const state = randomBytes(16).toString("hex");
const verifier = randomBytes(32).toString("base64url");
const challenge = createHash("sha256").update(verifier).digest("base64url");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404).end();
    return;
  }
  if (url.searchParams.get("state") !== state || !url.searchParams.get("code")) {
    res.writeHead(400).end("Authorization failed. You can close this tab.");
    console.error("Authorization failed:", url.searchParams.get("error") ?? "state mismatch");
    server.close();
    return;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: url.searchParams.get("code"),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });
  const body = await response.json();
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end("Done. You can close this tab and return to the terminal.");
  server.close();

  if (!response.ok || !body.refresh_token) {
    console.error("No refresh token returned:", body.error ?? response.status);
    console.error("If you connected before, remove the app's access at https://myaccount.google.com/permissions and run again.");
    process.exit(1);
  }
  const granted = String(body.scope ?? "").split(" ");
  const missing = SCOPES.filter((scope) => !granted.includes(scope));
  if (missing.length) console.warn("Warning: these scopes were not granted:", missing.join(", "));

  console.log("\nSet this as GOOGLE_CALENDAR_REFRESH_TOKEN (keep it secret, do not commit it):\n");
  console.log(body.refresh_token);
  console.log("");
});

let redirectUri = "";
server.listen(0, "127.0.0.1", () => {
  redirectUri = `http://127.0.0.1:${server.address().port}/oauth2callback`;
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  console.log("Open this URL in your browser and sign in with the interviewer's Google account:\n");
  console.log(auth.toString());
});
