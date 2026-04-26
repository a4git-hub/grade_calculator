// Infinite Campus integration service.
//
// IC has no public API. Data is fetched by:
//   1. Opening the district's IC student portal in an inline WebView (WKWebView on iOS).
//   2. Letting the student authenticate via their district SSO (ClassLink / Azure / native IC login).
//   3. Once authed, posting fetch() requests to IC's internal portal endpoints
//      from inside the WebView and forwarding the JSON back to RN via postMessage.
//
// All credentials stay inside the WebView's cookie jar — RN never sees the password.

import { ClassItem, SubjectDetail } from '../types';

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
    id: 'srvusd',
    name: 'San Ramon Valley USD',
    sub: 'ClassLink · CA',
    portalUrl: 'https://srvusd.infinitecampus.org/campus/portal/students/srvusd.jsp',
    sso: 'classlink',
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

// ---------------------------------------------------------------------------
// Scraper script
// ---------------------------------------------------------------------------
// Injected into the WebView once the SPA loads. Polls IC's internal portal
// endpoints, posts each result back to RN, then signals completion.
//
// Endpoints used (all relative to portal origin, served once authed):
//   /campus/api/portal/students                   → roster / studentPersonID
//   /campus/resources/portal/grades?personID=...  → live grades + categories
//   /campus/resources/portal/assignments?personID=...
//   /campus/resources/portal/grades/history?personID=...
//
// All real parsing happens in `parseICPayload()` on the RN side so we can
// iterate without re-shipping injected JS.
export const IC_SCRAPER_JS = String.raw`
(function () {
  if (window.__luminaScraperInstalled) return;
  window.__luminaScraperInstalled = true;

  function post(type, payload) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload }));
    }
  }

  async function getJson(path) {
    try {
      const res = await fetch(path, { credentials: 'include', headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(path + ' → ' + res.status);
      return await res.json();
    } catch (e) {
      post('error', { path: path, message: String(e && e.message || e) });
      return null;
    }
  }

  function isAuthed() {
    // IC SPA renders the student switcher after login; bail if not yet present.
    // Fallback: presence of ic_sis_login_session cookie.
    return /JSESSIONID|ic_sis_login_session/.test(document.cookie || '');
  }

  async function run() {
    if (!isAuthed()) { post('await-auth', {}); return; }
    post('progress', { step: 'roster' });
    const students = await getJson('/campus/api/portal/students');
    if (!students || !students.length) { post('error', { message: 'no students' }); return; }
    const personID = students[0].personID || students[0].studentPersonID;
    post('progress', { step: 'grades', personID: personID });
    const grades       = await getJson('/campus/resources/portal/grades?personID=' + personID);
    post('progress', { step: 'assignments' });
    const assignments  = await getJson('/campus/resources/portal/assignments?personID=' + personID);
    post('progress', { step: 'history' });
    const history      = await getJson('/campus/resources/portal/grades/history?personID=' + personID);
    post('done', { students: students, grades: grades, assignments: assignments, history: history });
  }

  // Poll for auth completion up to 90s, then bail.
  let waited = 0;
  const tick = setInterval(function () {
    if (isAuthed() || waited > 90000) { clearInterval(tick); run(); }
    waited += 500;
  }, 500);
})();
true;
`;

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------
// Maps the IC raw payload → app domain shapes. Real IC payloads have hundreds
// of fields per assignment; we keep only what the dashboard / subject screens
// need. This intentionally tolerates missing fields — IC schema varies by
// district configuration.

export interface ICPayload {
  students?: any[];
  grades?: any[];
  assignments?: any[];
  history?: any[];
}

export interface ParsedICData {
  classes: ClassItem[];
  subjectDetails: Record<string, SubjectDetail>;
}

const TREND_TOLERANCE = 0.05;

function colorForPct(pct: number): 'good' | 'warn' | 'bad' {
  if (pct >= 87) return 'good';
  if (pct >= 75) return 'warn';
  return 'bad';
}

function letterForPct(pct: number): string {
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 60) return 'D';
  return 'F';
}

export function parseICPayload(raw: ICPayload): ParsedICData {
  const classes: ClassItem[] = [];
  const subjectDetails: Record<string, SubjectDetail> = {};

  for (const g of raw.grades ?? []) {
    const id      = String(g.sectionID ?? g.courseID ?? g.id ?? '');
    const code    = String(g.courseNumber ?? g.code ?? '');
    const name    = String(g.courseName ?? g.name ?? '');
    const teacher = String(g.teacherDisplay ?? g.teacher ?? '');
    const term    = String(g.termName ?? g.term ?? 'S2');
    const pct     = Number(g.gradedScore ?? g.percent ?? g.score ?? 0);
    const trend   = Number(g.trend ?? 0);

    classes.push({
      id, code, name, term, teacher,
      letter: g.letterGrade ?? letterForPct(pct),
      pct,
      trend: Math.abs(trend) < TREND_TOLERANCE ? 0 : trend,
      color: colorForPct(pct),
      next:  g.nextDue ?? '',
      flags: Array.isArray(g.flaggedAssignments) ? g.flaggedAssignments.length : 0,
    });

    const cats = (g.categories ?? []).map((ct: any) => ({
      name:   String(ct.name ?? ''),
      weight: Number(ct.weight ?? 0),
      pct:    Number(ct.percent ?? 0),
      count:  Number(ct.assignmentCount ?? 0),
    }));

    const assignmentsForClass = (raw.assignments ?? [])
      .filter((a: any) => String(a.sectionID ?? a.courseID) === id)
      .map((a: any) => {
        const earned   = Number(a.scorePoints ?? 0);
        const possible = Number(a.totalPoints ?? 0);
        const pctVal   = possible > 0 ? (earned / possible) * 100 : 0;
        return {
          name:  String(a.assignmentName ?? a.name ?? ''),
          score: `${earned} / ${possible}`,
          pct:   `${pctVal.toFixed(pctVal % 1 === 0 ? 0 : 1)}%`,
          cat:   String(a.categoryName ?? '').slice(0, 4) || 'HW',
          pos:   colorForPct(pctVal),
        };
      });

    const historyForClass = (raw.history ?? [])
      .filter((h: any) => String(h.sectionID ?? h.courseID) === id)
      .map((h: any) => ({
        d: String(h.dateLabel ?? h.date ?? ''),
        v: Number(h.percent ?? 0),
      }));

    subjectDetails[id] = {
      categories:  cats,
      history:     historyForClass,
      assignments: assignmentsForClass,
    };
  }

  return { classes, subjectDetails };
}

// ---------------------------------------------------------------------------
// Message types posted from the WebView back to RN.
// ---------------------------------------------------------------------------
export type ICMessage =
  | { type: 'await-auth'; payload: Record<string, never> }
  | { type: 'progress';   payload: { step: 'roster' | 'grades' | 'assignments' | 'history'; personID?: string } }
  | { type: 'error';      payload: { path?: string; message: string } }
  | { type: 'done';       payload: ICPayload };
