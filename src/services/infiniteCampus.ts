// District registry for the IC integration WebView entry point.
//
// IC portal URLs follow `/campus/portal/students/{schoolKey}.jsp` where
// `schoolKey` is set per IC tenant configuration — there is no naming
// convention and it MUST be looked up per district. Wrong schoolKeys
// return 404 (verified during the spike against SRVUSD).
//
// Only `srvusd` is verified working (sanRamon.jsp). The other 4 entries
// are best-guess from district id and are flagged for verification.

export interface District {
  id: string;
  name: string;
  sub: string;
  /** Portal entry URL — first page the WebView loads. */
  portalUrl: string;
  /** SSO provider hint (only for display). */
  sso: 'classlink' | 'azure' | 'campus';
}

export const DISTRICTS: District[] = [
  {
    id: 'srvusd',
    name: 'San Ramon Valley USD',
    sub: 'ClassLink · CA',
    // Verified 2026-04-26 against real SRVUSD ClassLink flow.
    portalUrl: 'https://srvusd.infinitecampus.org/campus/portal/students/sanRamon.jsp',
    sso: 'classlink',
  },
  // TODO(verify): the schoolKey portion of these URLs is best-guess from
  // district id. Each must be verified against the real IC tenant before
  // shipping (a 404 here returns a "page not found" inside the WebView).
  {
    id: 'westview',
    name: 'Westview Unified',
    sub: 'Campus · CA',
    portalUrl: 'https://westview.infinitecampus.org/campus/portal/students/westview.jsp',
    sso: 'classlink',
  },
  {
    id: 'walnut',
    name: 'Walnut Creek SD',
    sub: 'Campus · CA',
    portalUrl: 'https://walnutcreek.infinitecampus.org/campus/portal/students/walnutcreek.jsp',
    sso: 'campus',
  },
  {
    id: 'mdusd',
    name: 'Mt. Diablo USD',
    sub: 'Azure SSO · CA',
    portalUrl: 'https://mdusd.infinitecampus.org/campus/portal/students/mdusd.jsp',
    sso: 'azure',
  },
  {
    id: 'dublin',
    name: 'Dublin Unified',
    sub: 'Campus · CA',
    portalUrl: 'https://dublin.infinitecampus.org/campus/portal/students/dublin.jsp',
    sso: 'campus',
  },
];
