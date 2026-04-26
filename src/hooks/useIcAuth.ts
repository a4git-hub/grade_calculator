// Cookie capture + IcClient construction. The actual WebView lives in
// SignInWebViewScreen — this hook is just the post-login plumbing so the
// screen stays focused on UI.

import NitroCookies from 'react-native-nitro-cookies';
import { IcClient, SRVUSD_ORIGIN } from '../services/icClient';

type CookieMap = Record<string, { value: string }>;

/**
 * Read cookies for the given IC origin via WKHTTPCookieStore (useWebKit:true
 * is REQUIRED — without it we get document.cookie semantics which can't see
 * HttpOnly cookies like JSESSIONID).
 *
 * Returns a fully-constructed IcClient with the cookie header baked in. The
 * client lives in DataContext from this point onward; cookies never escape
 * to disk or any other layer.
 */
export async function captureIcClient(
  origin: string = SRVUSD_ORIGIN,
): Promise<IcClient> {
  const cookies = (await NitroCookies.get(origin, true)) as CookieMap;
  if (!('JSESSIONID' in cookies)) {
    throw new Error(
      'No JSESSIONID in WKHTTPCookieStore — login may not have completed',
    );
  }
  const cookieHeader = Object.entries(cookies)
    .map(([name, c]) => `${name}=${c.value}`)
    .join('; ');
  return new IcClient(origin, cookieHeader);
}

/**
 * Heuristic for "WebView reached IC's authenticated SPA shell, cookies are
 * durable in WKHTTPCookieStore". Empirically tuned against SRVUSD on
 * 2026-04-26 — order matters, only TERMINAL signals (post-redirect, cookies
 * persisted) qualify:
 *   - /campus/nav-wrapper  ← modern IC SPA shell (only loads post-auth)
 *   - appName=...          ← post-login query string on most tenants
 *   - /portal/main.jsp     ← legacy non-SPA installs (fallback)
 *
 * NOT included (intentionally): /campus/SSO/{schoolKey}/SIS/?... — that's
 * the SAML receiver path, fires DURING the 302 redirect while Set-Cookie
 * headers are still being processed by WebKit. Capturing there returns
 * stale cookies (no JSESSIONID yet) and produces a spurious "no session"
 * error before the next nav event succeeds. Wait for nav-wrapper instead.
 */
export function isPostLoginUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (!lower.includes('infinitecampus.org')) return false;
  if (lower.includes('/campus/nav-wrapper')) return true;
  if (lower.includes('appname=')) return true;
  if (lower.includes('/portal/main.jsp')) return true;
  return false;
}
