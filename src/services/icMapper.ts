import type {
  ClassItem, SubjectDetail, AttentionGroup, AttentionItem,
} from '../types';
import type {
  RawUserAccount, RawGradesResponse, RawRecentlyScored,
  RawGradingTask, UserProfile,
} from './icTypes';

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

export function mapGradesToClasses(raw: RawGradesResponse): ClassItem[] {
  const classes: ClassItem[] = [];
  for (const enrollment of raw) {
    for (const course of enrollment.courses) {
      if (course.dropped) continue;
      const task = pickActiveTermGrade(course.gradingTasks);
      const pct = task?.progressPercent ?? 0;
      const letter = task?.progressScore?.trim() || letterForPct(pct);
      classes.push({
        id: String(course.sectionID),
        code: course.courseNumber,
        name: course.courseName,
        term: task ? semesterFromTermName(task.termName) : 'S2',
        teacher: course.teacherDisplay,
        letter,
        pct,
        trend: 0, // history endpoint deferred to Phase 2
        color: colorForPct(pct),
        next: '',
        flags: 0,
      });
    }
  }
  return classes;
}

/**
 * Build subject detail map keyed by sectionID.
 * categories/history/assignments are EMPTY in v1 — those require per-section
 * /categories and /grades/detail/{sid} endpoints not in this phase. Phase 2
 * fills them in. Empty arrays render as "no data yet" UI states cleanly.
 */
export function mapGradesToSubjectDetails(raw: RawGradesResponse): Record<string, SubjectDetail> {
  const out: Record<string, SubjectDetail> = {};
  for (const enrollment of raw) {
    for (const course of enrollment.courses) {
      if (course.dropped) continue;
      out[String(course.sectionID)] = {
        categories: [],
        history: [],
        assignments: [],
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
