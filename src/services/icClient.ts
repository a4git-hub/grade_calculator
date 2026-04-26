import type {
  RawUserAccount, RawGradesResponse, RawRecentlyScored, RawRosterEntry,
  RawGpaResponse, RawCategoriesResponse,
} from './icTypes';

/**
 * Typed HTTP client for Infinite Campus's portal API.
 * Holds the cookie header in a closure (memory only — never persisted).
 * Each method does a native RN fetch with explicit Cookie header,
 * throws IcClientError on non-2xx, returns parsed JSON.
 */
export class IcClient {
  constructor(
    private readonly origin: string,
    private readonly cookieHeader: string,
  ) {}

  private async getJson<T>(path: string): Promise<T> {
    const url = `${this.origin}${path}${path.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Cookie: this.cookieHeader,
        Accept: 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache, no-store',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new IcClientError(res.status, path, body);
    }
    return res.json() as Promise<T>;
  }

  getUserAccount(): Promise<RawUserAccount> {
    return this.getJson<RawUserAccount>('/campus/resources/my/userAccount');
  }

  getGrades(modifiedDateIso?: string): Promise<RawGradesResponse> {
    const q = modifiedDateIso ? `?modifiedDate=${encodeURIComponent(modifiedDateIso)}` : '';
    return this.getJson<RawGradesResponse>(`/campus/resources/portal/grades${q}`);
  }

  getRecentlyScored(modifiedDateIso?: string): Promise<RawRecentlyScored[]> {
    const q = modifiedDateIso ? `?modifiedDate=${encodeURIComponent(modifiedDateIso)}` : '';
    return this.getJson<RawRecentlyScored[]>(`/campus/api/portal/assignment/recentlyScored${q}`);
  }

  /**
   * Full assignment list for the student — every section, every assignment
   * since school year start. Same row shape as recentlyScored but no
   * modifiedDate filter (returns everything). Preferred over recentlyScored
   * for any "complete picture" UI; recentlyScored is only useful as a
   * delta-since-X optimization which we don't need under in-memory-only.
   */
  getAssignmentListView(): Promise<RawRecentlyScored[]> {
    return this.getJson<RawRecentlyScored[]>('/campus/api/portal/assignment/listView');
  }

  getRoster(dateIso?: string): Promise<RawRosterEntry[]> {
    const expand = '_expand=' + encodeURIComponent('{sectionPlacements-{term}}');
    const date = dateIso ? `&_date=${encodeURIComponent(dateIso)}` : '';
    return this.getJson<RawRosterEntry[]>(`/campus/resources/portal/roster?${expand}${date}`);
  }

  /**
   * IC's official GPA. Returns an array — typically one Cumulative entry,
   * possibly with both unweighted+weighted variants. Path's redundant-looking
   * suffix (`gpas/my/gpa`) reflects IC's REST shape: collection / selector /
   * single resource.
   */
  getGpa(): Promise<RawGpaResponse> {
    return this.getJson<RawGpaResponse>('/campus/api/campus/grading/gpas/my/gpa');
  }

  /**
   * Per-section category weights ("Tests 40%, Quizzes 20%, ..."). Note the
   * path is /campus/api/campus/grading/categories — not /instruction/categories
   * which is a different (admin-side) endpoint. Returns category definitions
   * only; the student's per-category percent score comes from /grades/detail.
   */
  getCategoriesForSection(sectionID: number | string): Promise<RawCategoriesResponse> {
    return this.getJson<RawCategoriesResponse>(
      `/campus/api/campus/grading/categories?sectionID=${encodeURIComponent(String(sectionID))}`,
    );
  }
}

export class IcClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly body: string,
  ) {
    super(`IC ${status} on ${path}`);
    this.name = 'IcClientError';
  }
}

export const SRVUSD_ORIGIN = 'https://srvusd.infinitecampus.org';
export const SRVUSD_PORTAL_URL =
  'https://srvusd.infinitecampus.org/campus/portal/students/sanRamon.jsp';
