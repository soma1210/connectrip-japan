// One-time setup: connect the Google account that can view the
// "Connectrip Guide Applications" sheet and print a refresh token
// (GOOGLE_SHEETS_REFRESH_TOKEN) for Guide Admin.
//
// Run it yourself on your own machine — the token grants read access to your
// spreadsheets, so do not paste its output into chats, issues or commits.
//
//   GOOGLE_SHEETS_CLIENT_ID=... GOOGLE_SHEETS_CLIENT_SECRET=... node scripts/google-sheets-auth.mjs
//
// Google Cloud setup (once):
//   1. Enable the Google Sheets API.
//   2. OAuth consent screen: add the scope below, and set the publishing
//      status to "In production". In "Testing", refresh tokens expire after 7 days.
//   3. Credentials → OAuth client ID → "Desktop app". Use its client ID / secret.
// Then sign in with the sheet owner's Google account when the browser opens.
//
// Scope (read only; nothing can be written to Sheets, Forms, Apps Script or Calendar):
//   spreadsheets.readonly

import http from "node:http";
import { randomBytes, createHash } from "node:crypto";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

const { GOOGLE_SHEETS_CLIENT_ID: clientId, GOOGLE_SHEETS_CLIENT_SECRET: clientSecret } = process.env;
if (!clientId || !clientSecret) {
  console.error("Set GOOGLE_SHEETS_CLIENT_ID and GOOGLE_SHEETS_CLIENT_SECRET first (see the comment at the top).");
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

  console.log("\nSet this as GOOGLE_SHEETS_REFRESH_TOKEN (keep it secret, do not commit it):\n");
  console.log(body.refresh_token);
  console.log("");
});

// Fixed, so it can be listed exactly in a "Web application" client's
// "Authorized redirect URIs" (a "Desktop app" client accepts any loopback port).
const PORT = 53682;
const redirectUri = `http://localhost:${PORT}/oauth2callback`;
server.listen(PORT, "localhost", () => {
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
  console.log("Open this URL in your browser and sign in with the sheet owner's Google account:\n");
  console.log(auth.toString());
});
