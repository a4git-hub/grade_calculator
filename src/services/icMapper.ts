import type {
  ClassItem, SubjectDetail, AttentionGroup, AttentionItem, Assignment,
} from '../types';
import type {
  RawUserAccount, RawGradesResponse, RawRecentlyScored,
  RawGradingTask, UserProfile, RawGpaResponse, RawCategory,
} from './icTypes';

export interface GpaSummary {
  /** Unweighted GPA on a 4.0 scale, 2 decimals. */
  uw: number;
  /** Weighted GPA: AP/Honors courses get +1.0. */
  w: number;
  /**
   * Week-over-week GPA delta. 0 in v1 — needs grade history endpoint
   * (Phase 1.5: /campus/resources/portal/grades/detail/{sid}). When that
   * lands, compute by recomputing GPA at "1 week ago" snapshot and
   * subtracting from current.
   */
  trend: number;
}

const TASK_PRIORITY: Record<string, number> = {
  'Semester Grade': 3,
  'Quarter Grade': 2,
  'Progress Grade': 1,
};

export function colorForPct(pct: number): 'good' | 'warn' | 'bad' {
  if (pct >= 87) return 'good';
  if (pct >= 75) return 'warn';
  return 'bad';
}

export function letterForPct(pct: number): string {
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

/** Standard 4.0-scale GPA points for each letter grade. */
export function letterToGpaPoints(letter: string): number {
  const L = letter.trim().toUpperCase();
  switch (L) {
    case 'A+': case 'A':  return 4.0;
    case 'A-':            return 3.7;
    case 'B+':            return 3.3;
    case 'B':             return 3.0;
    case 'B-':            return 2.7;
    case 'C+':            return 2.3;
    case 'C':             return 2.0;
    case 'C-':            return 1.7;
    case 'D+':            return 1.3;
    case 'D':             return 1.0;
    case 'D-':            return 0.7;
    default:              return 0.0;
  }
}

/** Detect AP / Honors / IB / dual-enrollment courses for the +1.0 weighted bump. */
export function isHonorsCourse(courseName: string): boolean {
  if (!courseName) return false;
  // Match whole words to avoid e.g. "Apparel" → AP. \b is the word boundary.
  return /\b(AP|Honors?|IB|Adv|Advanced|Dual)\b/i.test(courseName);
}

/**
 * Map IC's official GPA endpoint into the app's GpaSummary shape.
 *
 * IC returns an array containing both Cumulative entries (UW + W) and per-Term
 * entries (T1, T2, T3, T4 × UW/W). We extract:
 *   - uw / w: from the two Cumulative entries (matches what students see in IC)
 *   - trend:  weighted-GPA delta between the two most recent Term entries.
 *             Replaces the previously-mocked "this week +0.4" with a true
 *             term-over-term signal. Falls back to 0 when fewer than 2 terms
 *             exist (e.g. start of school year).
 *
 * IC's GPA reflects district-specific policy (which courses count, honors
 * bump amount, dual-enrollment treatment) so it ALWAYS wins over our
 * heuristic computeGpa when present.
 */
export function mapIcGpa(raw: RawGpaResponse, fallback: GpaSummary): GpaSummary {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;
  const parse = (s: string | null | undefined): number => {
    const n = parseFloat(s ?? '');
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
  };

  // --- Cumulative GPAs (uw + w) -------------------------------------------
  const cumulative = raw.filter(r => r.type === 'Cumulative');
  const cumSource = cumulative.length > 0 ? cumulative : raw;
  const cumUwRaw = cumSource.find(r => r.unweighted === true);
  const cumWRaw = cumSource.find(r => r.unweighted === false);
  const cumUw = cumUwRaw ? parse(cumUwRaw.gpa) : NaN;
  const cumW = cumWRaw ? parse(cumWRaw.gpa) : NaN;

  // --- Term-over-term trend (latest Term − previous Term, weighted) -------
  const weightedTerms = raw
    .filter(r => r.type === 'Term' && r.unweighted === false && r.termSeq != null)
    .slice()
    .sort((a, b) => (b.termSeq ?? 0) - (a.termSeq ?? 0));
  let trend = fallback.trend;
  if (weightedTerms.length >= 2) {
    const latest = parse(weightedTerms[0]!.gpa);
    const prev = parse(weightedTerms[1]!.gpa);
    if (Number.isFinite(latest) && Number.isFinite(prev)) {
      trend = Math.round((latest - prev) * 100) / 100;
    }
  }

  return {
    uw: Number.isNaN(cumUw) ? fallback.uw : cumUw,
    w: Number.isNaN(cumW) ? fallback.w : cumW,
    trend,
  };
}

/**
 * Compute unweighted + weighted GPA from the mapped class list.
 * GPA is the mean of per-course GPA points (uw) or +1.0-bumped points (w).
 * Excludes pass/fail or non-academic courses (heuristic: PE / Phys Ed).
 *
 * Used as a FALLBACK when IC's official GPA endpoint is unavailable. IC's
 * official numbers (mapIcGpa) win when present because they respect
 * district policy on weighting + course inclusion.
 */
export function computeGpa(classes: ClassItem[]): GpaSummary {
  const academic = classes.filter(c => !/\b(P\.?\s?E\.?|Phys(\.|\s)?\s?Ed)\b/i.test(c.name));
  if (academic.length === 0) return { uw: 0, w: 0, trend: 0 };

  let uwSum = 0;
  let wSum = 0;
  for (const c of academic) {
    const points = letterToGpaPoints(c.letter);
    uwSum += points;
    wSum += isHonorsCourse(c.name) ? points + 1.0 : points;
  }
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    uw: round2(uwSum / academic.length),
    w: round2(wSum / academic.length),
    trend: 0, // populated once history endpoint is wired
  };
}

/**
 * Pick the highest-priority scored grading task across all terms.
 * Order: latest term wins (T4 > T3 > T2 > T1) — within term, Semester > Quarter > Progress.
 * Returns null when no task has a percent value.
 */
export function pickActiveTermGrade(tasks: RawGradingTask[]): RawGradingTask | null {
  const scored = tasks.filter(t => t.progressPercent != null);
  if (scored.length === 0) return null;
  return scored.slice().sort((a, b) => {
    if (b.termSeq !== a.termSeq) return b.termSeq - a.termSeq;
    return (TASK_PRIORITY[b.taskName] ?? 0) - (TASK_PRIORITY[a.taskName] ?? 0);
  })[0]!;
}

/**
 * Map IC term naming (T1–T4) to semester labels.
 * T3/T4 → S2, T1/T2 → S1. Returns the input unchanged if format is unexpected.
 */
export function semesterFromTermName(termName: string): string {
  const n = parseInt(termName.replace(/^T/i, ''), 10);
  if (Number.isNaN(n)) return termName;
  return n >= 3 ? 'S2' : 'S1';
}

export function mapUserAccount(raw: RawUserAccount, grades?: RawGradesResponse): UserProfile {
  const enrollment = grades?.[0];
  const fullName = `${raw.firstName} ${raw.lastName}`.trim();
  const initials = `${raw.firstName[0] ?? ''}${raw.lastName[0] ?? ''}`.toUpperCase();
  // displayName looks like "25-26 [School Name]" — strip the YY-YY year prefix.
  const school = enrollment?.displayName
    ? enrollment.displayName.replace(/^\d{2}-\d{2}\s+/, '')
    : null;
  return {
    personID: raw.personID,
    firstName: raw.firstName,
    lastName: raw.lastName,
    fullName,
    initials,
    username: raw.username,
    school,
    gradeLevel: enrollment?.grade ?? null,
  };
}

/** Map RecentlyScored → Assignment (the per-class assignment row shape). */
function recentlyScoredToAssignment(item: RawRecentlyScored): Assignment {
  const earned = parseFloat(item.scorePoints ?? '');
  const possible = item.totalPoints ?? 0;
  const score = !Number.isNaN(earned) && possible > 0
    ? `${earned} / ${possible}`
    : (item.score ?? '—');
  const pctValue = parseFloat(item.scorePercentage ?? '');
  const pctStr = !Number.isNaN(pctValue)
    ? `${pctValue.toFixed(pctValue % 1 === 0 ? 0 : 1)}%`
    : '—';
  // Truncated category — actual category name comes from /categories endpoint.
  // Until that's wired, derive a 4-char hint from a simple keyword scan of
  // the assignment name (HW / Test / Quiz / Lab / Proj). Falls back to 'Item'.
  const name = item.assignmentName ?? '';
  const cat = /\b(homework|HW)\b/i.test(name) ? 'HW'
    : /\b(test|exam)\b/i.test(name)            ? 'Test'
    : /\b(quiz)\b/i.test(name)                 ? 'Quiz'
    : /\b(lab)\b/i.test(name)                  ? 'Lab'
    : /\b(project|proj)\b/i.test(name)         ? 'Proj'
    : 'Item';
  return {
    name,
    score,
    pct: pctStr,
    cat,
    pos: !Number.isNaN(pctValue) ? colorForPct(pctValue) : 'warn',
  };
}

/** Group recently-scored items by sectionID for piping into per-class assignments. */
export function groupRecentBySection(recent: RawRecentlyScored[]): Record<string, RawRecentlyScored[]> {
  const out: Record<string, RawRecentlyScored[]> = {};
  for (const item of recent) {
    const sid = String(item.sectionID);
    (out[sid] ??= []).push(item);
  }
  // Sort each group by scoreModifiedDate desc (most recent first).
  for (const sid of Object.keys(out)) {
    out[sid]!.sort((a, b) => (b.scoreModifiedDate ?? '').localeCompare(a.scoreModifiedDate ?? ''));
  }
  return out;
}

/**
 * Count flagged items (late/missing/cheated/incomplete/dropped) per sectionID.
 * Drives the red flag count badge on each ClassCard.
 */
export function flagsBySection(recent: RawRecentlyScored[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of recent) {
    const isFlagged = item.late || item.missing || item.cheated || item.dropped || item.incomplete;
    if (!isFlagged) continue;
    const sid = String(item.sectionID);
    out[sid] = (out[sid] ?? 0) + 1;
  }
  return out;
}

/**
 * Map IC grades response → app ClassItem list.
 * Optionally takes the recentlyScored array to populate per-course `flags` count.
 */
export function mapGradesToClasses(
  raw: RawGradesResponse,
  recent?: RawRecentlyScored[],
): ClassItem[] {
  const flagCounts = recent ? flagsBySection(recent) : {};
  const classes: ClassItem[] = [];
  for (const enrollment of raw) {
    for (const course of enrollment.courses) {
      if (course.dropped) continue;
      const task = pickActiveTermGrade(course.gradingTasks);
      const pct = task?.progressPercent ?? 0;
      const letter = task?.progressScore?.trim() || letterForPct(pct);
      const sid = String(course.sectionID);
      classes.push({
        id: sid,
        code: course.courseNumber,
        name: course.courseName,
        term: task ? semesterFromTermName(task.termName) : 'S2',
        teacher: course.teacherDisplay,
        letter,
        pct,
        // Trend needs history (grades/detail endpoint) — stays 0 until wired.
        trend: 0,
        color: colorForPct(pct),
        next: '',
        flags: flagCounts[sid] ?? 0,
      });
    }
  }
  return classes;
}

/**
 * Map IC's per-section category definitions into the app's Category shape.
 * pct + count default to 0 because the categories endpoint provides
 * DEFINITIONS only (name + weight). Per-category student performance lives
 * in /grades/detail/{sid} — when wired, those fields fill in from there.
 */
export function mapCategories(raw: RawCategory[]): Array<{ name: string; weight: number; pct: number; count: number }> {
  return raw
    .slice()
    .sort((a, b) => {
      // Higher-weighted categories first (Tests before Classwork). Tie-break on seq, then name.
      if (b.weight !== a.weight) return b.weight - a.weight;
      if (a.seq !== b.seq) return a.seq - b.seq;
      return a.name.localeCompare(b.name);
    })
    .map(c => ({
      name: c.name,
      weight: Math.round(c.weight * 100) / 100, // IC sends like 40.000 → render as 40
      pct: 0,    // populated when /grades/detail/{sid} lands
      count: 0,  // ditto
    }));
}

/**
 * Build a per-section grade trajectory from the assignment list. Each scored
 * assignment becomes a HistoryPoint sorted by scoreModifiedDate. We use the
 * raw assignment percentage rather than computing a running cumulative
 * average — IC's actual grade calc applies category weights, drop policies,
 * and multipliers server-side, and approximating that locally produces
 * misleading numbers. Plotting per-assignment percentages directly is the
 * honest visualization: it shows the student's score variance over time.
 */
function buildHistoryForSection(items: RawRecentlyScored[]): Array<{ d: string; v: number }> {
  const dated = items
    .filter(it => it.scoreModifiedDate && it.scorePercentage != null)
    .map(it => {
      const v = parseFloat(it.scorePercentage ?? '');
      return Number.isFinite(v) ? { date: it.scoreModifiedDate, v } : null;
    })
    .filter((x): x is { date: string; v: number } => x !== null);

  dated.sort((a, b) => a.date.localeCompare(b.date));

  // Trim to last 12 points so the sparkline doesn't get too dense.
  const recent = dated.slice(-12);

  return recent.map(({ date, v }, i) => {
    // Render as "Mon DD" for the first/last labels in the sparkline footer.
    // Intermediate points just need the date string; the chart plots them.
    const d = formatChartDate(date, i === 0 || i === recent.length - 1);
    return { d, v: Math.round(v * 100) / 100 };
  });
}

const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatChartDate(iso: string, labeled: boolean): string {
  if (!labeled) return iso.slice(0, 10); // Hidden axis points: cheap ISO date string
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return `${MON_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Build subject detail map keyed by sectionID.
 *
 * Sources data from up to three inputs:
 *   - grades:     enrollment + course list (which sections to include)
 *   - recent:     listView assignments → per-section assignments[] AND history[]
 *   - categoriesBySection: /grades/categories result → per-section categories[]
 *
 * categories[].pct + .count stay 0 (server-side computed; not in any endpoint
 * we have). Everything else populates from the endpoints we already call.
 */
export function mapGradesToSubjectDetails(
  raw: RawGradesResponse,
  recent?: RawRecentlyScored[],
  categoriesBySection?: Record<string, RawCategory[]>,
): Record<string, SubjectDetail> {
  const recentBySid = recent ? groupRecentBySection(recent) : {};
  const catsBySid = categoriesBySection ?? {};
  const out: Record<string, SubjectDetail> = {};
  for (const enrollment of raw) {
    for (const course of enrollment.courses) {
      if (course.dropped) continue;
      const sid = String(course.sectionID);
      const recentForCourse = recentBySid[sid] ?? [];
      const cats = catsBySid[sid];
      out[sid] = {
        categories: cats ? mapCategories(cats) : [],
        history: buildHistoryForSection(recentForCourse),
        assignments: recentForCourse.map(recentlyScoredToAssignment),
      };
    }
  }
  return out;
}

export function mapRecentlyScoredToAttention(raw: RawRecentlyScored[]): AttentionGroup[] {
  const flagged: AttentionItem[] = [];
  const lowScore: AttentionItem[] = [];

  for (const item of raw) {
    const isFlagged = item.late || item.missing || item.cheated || item.dropped || item.incomplete;
    const pct = parseFloat(item.scorePercentage ?? '');
    const score = item.scorePoints != null && item.totalPoints != null
      ? `${item.scorePoints} / ${item.totalPoints}`
      : '—';
    const due = item.dueDate ? item.dueDate.slice(0, 10) : '';
    const entry: AttentionItem = {
      class: item.courseName,
      title: item.assignmentName,
      due,
      score,
      pct: item.scorePercentage ? `${item.scorePercentage}%` : undefined,
    };
    if (isFlagged) flagged.push(entry);
    else if (!Number.isNaN(pct) && pct < 75) lowScore.push(entry);
  }

  const groups: AttentionGroup[] = [];
  if (flagged.length) groups.push({ name: 'Missing or flagged', sev: 'bad', items: flagged });
  if (lowScore.length) groups.push({ name: 'Low scores (<75%)', sev: 'warn', items: lowScore });
  return groups;
}
