// Infinite Campus public district lookup. Different from icClient because:
//   - Different host (www.infinitecampus.com, not the per-tenant {district}.infinitecampus.org)
//   - No authentication needed (public discovery endpoint)
//   - Used PRE-login to find the right tenant for the WebView SSO flow
//
// API contract pinned to capture from 2026-04-26 against `?state=CA&query=dublin`.

/** Single district record returned by the search endpoint. */
export interface IcDistrictResult {
  /** Mongo-style ObjectId — opaque to us, useful as a stable React key. */
  id: string;
  /** schoolKey portion of the portal URL — same string we needed for the WebView. */
  district_app_name: string;
  /** Tenant base URL, e.g. "https://icampus.dublinusd.org/campus/". */
  district_baseurl: string;
  /** Short opaque code IC uses internally. */
  district_code: string;
  /** Display name, e.g. "Dublin Unified". */
  district_name: string;
  /** WebView entry URL for staff. We don't use this. */
  staff_login_url: string;
  /** WebView entry URL for STUDENTS — this is what our SSO flow needs. */
  student_login_url: string;
  /** WebView entry URL for parents. We don't use this. */
  parent_login_url: string;
  /** US state code (e.g. "CA"). */
  state_code: string;
}

const SEARCH_BASE = 'https://www.infinitecampus.com/api/district';

/**
 * Search IC's public district registry. Throws on non-2xx; returns [] when
 * the query is shorter than the minimum length (UI enforces this — kept here
 * defensively so callers can't accidentally hammer the API with single chars).
 *
 * @param query  district / city / school keyword (case-insensitive on IC's end)
 * @param state  two-letter US state code; defaults to "CA"
 */
export async function searchDistricts(
  query: string,
  state: string = 'CA',
): Promise<IcDistrictResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  const url =
    `${SEARCH_BASE}?state=${encodeURIComponent(state)}&query=${encodeURIComponent(trimmed)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: '*/*' },
  });
  if (!res.ok) {
    throw new Error(`District search failed: HTTP ${res.status}`);
  }
  return (await res.json()) as IcDistrictResult[];
}
