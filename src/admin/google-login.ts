// "Sign in with Google" for the admin panel (server only): OpenID Connect,
// authorization code flow with PKCE.
//
// Its own OAuth client (ADMIN_GOOGLE_CLIENT_ID / ADMIN_GOOGLE_CLIENT_SECRET)
// with the scopes openid + email only. It is separate from the Sheets client
// (GOOGLE_SHEETS_*) and from Calendar (GOOGLE_OAUTH_* / GOOGLE_CALENDAR_*):
// signing in proves who someone is and grants no access to their Google data.
//
// The redirect URI is <site>/admin/auth/google/callback, where <site> is
// ADMIN_AUTH_URL when set, otherwise the origin the request came in on. Each
// one must be listed in the OAuth client's "Authorized redirect URIs".

import crypto from "node:crypto";
import { cookies } from "next/headers";

const { ADMIN_GOOGLE_CLIENT_ID, ADMIN_GOOGLE_CLIENT_SECRET } = process.env;

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const CALLBACK_PATH = "/admin/auth/google/callback";
const FLOW_COOKIE = "admin_oauth";
const FLOW_SECONDS = 10 * 60;
const REQUEST_TIMEOUT_MS = 8_000;

export const isGoogleLoginConfigured = Boolean(ADMIN_GOOGLE_CLIENT_ID && ADMIN_GOOGLE_CLIENT_SECRET);

function redirectUri(requestOrigin: string) {
  const site = process.env.ADMIN_AUTH_URL?.replace(/\/+$/, "") || requestOrigin;
  return `${site}${CALLBACK_PATH}`;
}

const random = () => crypto.randomBytes(32).toString("base64url");

/**
 * Start a sign-in: remember state / nonce / PKCE verifier in a short-lived
 * cookie and return Google's consent URL.
 */
export async function startGoogleLogin(requestOrigin: string): Promise<string> {
  const state = random();
  const nonce = random();
  const verifier = random();
  const uri = redirectUri(requestOrigin);

  (await cookies()).set(FLOW_COOKIE, JSON.stringify({ state, nonce, verifier, uri }), {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    // Lax: the cookie must come back on Google's top-level redirect to the callback.
    sameSite: "lax",
    path: "/admin/auth",
    maxAge: FLOW_SECONDS,
  });

  const params = new URLSearchParams({
    client_id: ADMIN_GOOGLE_CLIENT_ID!,
    redirect_uri: uri,
    response_type: "code",
    scope: "openid email",
    state,
    nonce,
    code_challenge: crypto.createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
    // Always show the account chooser, so someone denied can pick another account.
    prompt: "select_account",
  });
  return `${AUTHORIZE_URL}?${params}`;
}

export type GoogleLoginResult =
  | { ok: true; email: string }
  | { ok: false; reason: "cancelled" | "expired" | "failed" | "unverified" };

/** Finish a sign-in from the callback's query string. Returns the verified Google address. */
export async function finishGoogleLogin(query: URLSearchParams): Promise<GoogleLoginResult> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(FLOW_COOKIE)?.value;
  cookieStore.delete({ name: FLOW_COOKIE, path: "/admin/auth" });

  if (query.get("error")) return { ok: false, reason: "cancelled" };

  let flow: { state?: string; nonce?: string; verifier?: string; uri?: string };
  try {
    flow = raw ? JSON.parse(raw) : {};
  } catch {
    flow = {};
  }
  const state = query.get("state") ?? "";
  const code = query.get("code") ?? "";
  if (!flow.state || !flow.nonce || !flow.verifier || !flow.uri || !code) return { ok: false, reason: "expired" };
  const a = Buffer.from(state);
  const b = Buffer.from(flow.state);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, reason: "expired" };

  let body: { id_token?: string };
  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: ADMIN_GOOGLE_CLIENT_ID!,
        client_secret: ADMIN_GOOGLE_CLIENT_SECRET!,
        redirect_uri: flow.uri,
        code_verifier: flow.verifier,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return { ok: false, reason: "failed" };
    body = await response.json();
  } catch {
    return { ok: false, reason: "failed" };
  }

  // The ID token came straight from Google's token endpoint over TLS, so its
  // signature need not be checked (OpenID Connect Core 3.1.3.7); its claims are.
  let claims: { iss?: string; aud?: string; exp?: number; nonce?: string; email?: string; email_verified?: boolean | string };
  try {
    claims = JSON.parse(Buffer.from(body.id_token?.split(".")[1] ?? "", "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "failed" };
  }
  if (
    !ISSUERS.includes(claims.iss ?? "") ||
    claims.aud !== ADMIN_GOOGLE_CLIENT_ID ||
    typeof claims.exp !== "number" ||
    claims.exp * 1000 < Date.now() ||
    claims.nonce !== flow.nonce
  ) {
    return { ok: false, reason: "failed" };
  }
  if (!claims.email || (claims.email_verified !== true && claims.email_verified !== "true")) {
    return { ok: false, reason: "unverified" };
  }
  return { ok: true, email: claims.email };
}
