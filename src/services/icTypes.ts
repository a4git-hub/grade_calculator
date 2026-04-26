// Raw response types from Infinite Campus's portal API.
// Pinned to schemas captured from real SRVUSD DevTools traffic on 2026-04-26.
//
// These are intentionally narrow — only fields the app consumes are typed.
// Fields like `_model` / `_hashCode` exist on every IC response but are
// HATEOAS metadata for IC's own UI; we ignore them.

export interface RawUserAccount {
  _id: string;
  userID: number;
  personID: number;
  username: string;
  currentIdentityID: number;
  firstName: string;
  lastName: string;
  isSAMLAccount: boolean;
  homepage: string;
  active: boolean;
  hasEmail: boolean;
  disable?: boolean;
  acceptUsePolicy?: boolean;
  isLDAPAccount?: boolean;
  hasESignaturePIN?: boolean;
}

export interface RawGradingTask {
  _id: string;
  personID: number;
  trialID: number;
  calendarID: number;
  structureID: number;
  courseID: number;
  courseName: string;
  sectionID: number;
  taskID: number;
  termGPA?: number;
  termID: number;
  hasAssignments: boolean;
  hasCompositeTasks?: boolean;
  hideStandardsOnPortal?: boolean;
  taskName: string; // "Semester Grade" | "Quarter Grade" | "Progress Grade" | other
  gradedOnce?: boolean;
  treeTraversalSeq?: number;
  portal?: boolean;
  cumulativeTermSeq?: number;
  maxAssignments?: number;
  calcMethod?: string; // e.g. "nu"
  groupWeighted?: boolean;
  usePercent?: boolean;
  curveID?: number;
  scoreID?: number;
  /** IC's official letter grade — respects per-course curving + weighted categories. */
  progressScore?: string;
  /** IC's official percent. */
  progressPercent?: number;
  progressPointsEarned?: number;
  progressTotalPoints?: number;
  modifiedDate?: string;
  hasDetail?: boolean;
  termName: string; // "T1" | "T2" | "T3" | "T4"
  termSeq: number;
}

export interface RawCourse {
  _id: string;
  rosterID: number;
  personID: number;
  structureID: number;
  calendarID: number;
  schoolID: number;
  courseID: number;
  sectionID: number;
  courseName: string;
  courseNumber: string;
  isResponsive?: boolean;
  sectionNumber: string;
  endYear: number;
  schoolName: string;
  trialID: number;
  trialActive: boolean;
  roomName: string;
  teacherDisplay: string;
  hideStandardsOnPortal?: boolean;
  dropped?: boolean;
  crossSiteSection?: boolean;
  crossSiteStudent?: boolean;
  gradingTasks: RawGradingTask[];
  sectionPlacements: unknown[];
}

export interface RawGradesEnrollment {
  enrollmentID: number;
  terms: unknown;
  schoolID: number;
  calendarID: number;
  structureID: number;
  crossSiteEnrollment?: boolean;
  /** e.g. "25-26 [School Name]" — strip the YY-YY prefix to get the school name. */
  displayName: string;
  endDate: string | null;
  /** Grade level as a string, e.g. "10". */
  grade: string;
  gradesEnabled: boolean;
  assignmentsEnabled: boolean;
  gradingKeyEnabled?: boolean;
  courses: RawCourse[];
}

export type RawGradesResponse = RawGradesEnrollment[];

export interface RawRecentlyScored {
  objectSectionID: number;
  parentObjectSectionID: number | null;
  type: number;
  personID: number;
  taskID: number;
  groupActivityID: number;
  termIDs: number[];
  assignmentName: string;
  calendarID: number;
  structureID: number;
  sectionID: number;
  dueDate: string;
  assignedDate: string;
  scoreModifiedDate: string;
  releaseScoresTimeStamp?: string | null;
  courseName: string;
  active: boolean;
  scoringType: string;
  score: string | null;
  scorePoints: string | null;
  scorePercentage: string | null;
  totalPoints: number;
  comments?: string | null;
  feedback?: string | null;
  late: boolean;
  missing: boolean;
  cheated: boolean;
  dropped: boolean;
  incomplete: boolean;
  turnedIn: boolean;
  multiplier?: number;
  notGraded?: boolean;
}

export interface RawRosterTermInfo {
  _id: string;
  termID: number;
  termScheduleID: number;
  seq: number;
  startDate: string;
  endDate: string;
  termName: string;
  structureID: number;
  isPrimary?: boolean;
  termScheduleName?: string;
  calendarID: number;
  scheduleStructureName?: string;
}

export interface RawRosterSectionPlacement {
  _id: string;
  sectionID: number;
  termID: number;
  termName: string;
  termSeq: number;
  periodID: number;
  trialID: number;
  periodSequence?: number;
  term: RawRosterTermInfo;
  periodScheduleID?: number;
  periodName: string;
  periodScheduleName?: string;
  teacherDisplay: string;
  periodScheduleSequence?: number;
  structureID: number;
  courseID: number;
  courseNumber: string;
  sectionNumber: number;
  courseName: string;
  termScheduleID: number;
  crossSiteSection?: boolean;
  startDate: string;
  endDate: string;
  roomID?: number;
  roomName: string;
  unitAttendance?: boolean;
  attendance?: boolean;
  isResponsive?: boolean;
  instructionalDay?: boolean;
}

export interface RawRosterEntry {
  _id: string;
  rosterID: number;
  personID: number;
  structureID: number;
  calendarID: number;
  schoolID: number;
  courseID: number;
  sectionID: number;
  courseName: string;
  courseNumber: string;
  isResponsive?: boolean;
  sectionNumber: string;
  endYear: number;
  schoolName: string;
  trialID: number;
  trialActive: boolean;
  roomName: string;
  teacherDisplay: string;
  hideStandardsOnPortal?: boolean;
  crossSiteSection?: boolean;
  crossSiteStudent?: boolean;
  sectionPlacements: RawRosterSectionPlacement[];
}

// ---------------------------------------------------------------------------
// App-domain projection of the user (replaces MockUser shape from data/mock.ts).
// All other domain types (ClassItem, SubjectDetail, AttentionGroup) live in
// src/types/index.ts — we extend them via the mapper, not redefine them here.
// ---------------------------------------------------------------------------

export interface UserProfile {
  personID: number;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  username: string;
  /** Derived from grades.displayName by stripping the YY-YY year prefix. */
  school: string | null;
  /** From grades.grade — grade level as a string, e.g. "10". */
  gradeLevel: string | null;
}
