import type {
  RawUserAccount, RawGradesResponse, RawRecentlyScored, RawRosterEntry,
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

  getRoster(dateIso?: string): Promise<RawRosterEntry[]> {
    const expand = '_expand=' + encodeURIComponent('{sectionPlacements-{term}}');
    const date = dateIso ? `&_date=${encodeURIComponent(dateIso)}` : '';
    return this.getJson<RawRosterEntry[]>(`/campus/resources/portal/roster?${expand}${date}`);
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
