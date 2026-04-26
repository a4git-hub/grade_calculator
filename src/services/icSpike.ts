// Cookie-capture spike — pure logic only.
// All UI lives in IcSpikeScreen.tsx. Delete this file when the spike is
// promoted to Phase 1 (icClient.ts) or rolled back.

import CookieManager from '@react-native-cookies/cookies';

/**
 * SRVUSD portal entry URL.
 * NOTE: schoolKey here is `sanRamon` (verified via the prior Capacitor app's
 * working URL in docs/ref/Login.jsx.txt:11), NOT `srvusd` as the existing
 * DISTRICTS[2] entry in services/infiniteCampus.ts incorrectly guessed.
 * IC portal URLs use a per-tenant schoolKey set at IC install time — there
 * is no naming convention, it has to be looked up per district. The other
 * 4 entries in DISTRICTS likely have the same bug; flag for Phase 1 cleanup.
 */
export const SPIKE_PORTAL_URL =
  'https://srvusd.infinitecampus.org/campus/portal/students/sanRamon.jsp';

/** Origin used for cookie reads + fetch base. Origin = scheme + host. */
export const SPIKE_ORIGIN = 'https://srvusd.infinitecampus.org';

/** Single endpoint we hit to validate the cookie-based architecture. */
export const STUDENTS_ENDPOINT = '/campus/resources/portal/students';

/** Shape returned by CookieManager.get(). */
type CookieMap = Record<string, { value: string; name?: string }>;

/**
 * Serialize a CookieManager response into an HTTP Cookie header.
 * Example output: "JSESSIONID=ABC123; ic_sis_login_session=xyz"
 */
export function buildCookieHeader(cookies: CookieMap): string {
  return Object.entries(cookies)
    .map(([name, c]) => `${name}=${c.value}`)
    .join('; ');
}

/**
 * Returns true when a navigation URL indicates IC's authenticated SPA shell
 * has loaded. Empirically verified against SRVUSD on 2026-04-26:
 *
 *   /campus/nav-wrapper             ← IC Angular SPA shell — ONLY loads post-auth
 *   /campus/nav-wrapper/...         ← any sub-route inside the SPA
 *   /campus/SSO/{schoolKey}/SIS/... ← SAML receiver (cookies set in this 302)
 *   appName={schoolKey}             ← post-login query (e.g. appName=sanRamon)
 *
 * Older IC docs reference /portal/main.jsp + appName=portal — those patterns
 * apply only to legacy non-SPA IC installs and are kept here as fallbacks for
 * other districts. Diagnose mismatches via the on-screen nav URL panel.
 */
export function isLoginUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (!lower.includes('infinitecampus.org')) return false;
  // Modern IC SPA shell — definitive post-login signal.
  if (lower.includes('/campus/nav-wrapper')) return true;
  // SAML receiver — cookies have just been set by the 302 response.
  if (lower.includes('/campus/sso/') && lower.includes('/sis/')) return true;
  // Any IC URL with an appName query (post-login state on most tenants).
  if (lower.includes('appname=')) return true;
  // Legacy IC fallbacks — not used by SRVUSD but kept for portability.
  if (lower.includes('/portal/main.jsp')) return true;
  return false;
}

export interface CookieCaptureResult {
  /** Names only — values omitted from logging for privacy. */
  cookieNames: string[];
  /** Pass criterion #1: HttpOnly session cookie was readable. */
  hasJSESSIONID: boolean;
  /** Ready to drop into a fetch() Cookie header. */
  cookieHeader: string;
}

/**
 * Read cookies for the given origin via WKHTTPCookieStore.
 * useWebKit:true is REQUIRED — without it we get document.cookie semantics
 * which cannot see HttpOnly cookies.
 */
export async function extractIcCookies(
  origin: string = SPIKE_ORIGIN,
): Promise<CookieCaptureResult> {
  const cookies = (await CookieManager.get(origin, true)) as CookieMap;
  return {
    cookieNames: Object.keys(cookies),
    hasJSESSIONID: 'JSESSIONID' in cookies,
    cookieHeader: buildCookieHeader(cookies),
  };
}

export interface FetchStudentsResult {
  /** Pass criterion #2: HTTP 200 from a real authenticated endpoint. */
  status: number;
  ok: boolean;
  /** Parsed JSON if the body parsed cleanly, else null. */
  body: unknown;
  /** Raw response text — populated when JSON parse fails so we can debug. */
  rawText: string | null;
  /** Pass criterion #3: a personID we can use for downstream calls. */
  personID: string | number | null;
}

/**
 * Native RN fetch with the explicit Cookie header. NSURLSession on iOS —
 * no CORS, no DOM, no popup weirdness.
 */
export async function fetchStudents(
  cookieHeader: string,
  origin: string = SPIKE_ORIGIN,
): Promise<FetchStudentsResult> {
  const url = `${origin}${STUDENTS_ENDPOINT}?_t=${Date.now()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Cookie: cookieHeader,
      Accept: 'application/json',
      'Cache-Control': 'no-cache, no-store',
      Pragma: 'no-cache',
    },
  });
  const rawText = await res.text();
  let body: unknown = null;
  let personID: string | number | null = null;
  let parseFailed = false;
  try {
    body = JSON.parse(rawText);
    if (Array.isArray(body) && body.length > 0) {
      const first = body[0] as { personID?: string | number; studentPersonID?: string | number };
      personID = first.personID ?? first.studentPersonID ?? null;
    }
  } catch {
    parseFailed = true;
  }
  return {
    status: res.status,
    ok: res.ok,
    body: parseFailed ? null : body,
    rawText: parseFailed ? rawText : null,
    personID,
  };
}
