import { ClassItem, AttentionGroup, SubjectDetail } from '../types';

export const MockUser = {
  name: 'Aditya',
  firstName: 'Aditya',
  lastName: 'Krishnan',
  username: 'aditya',
  personID: 1,
  school: 'Westview High',
  gradeLevel: '10',
  initials: 'AK',
  fullName: 'Aditya Krishnan',
};

export const MockGPA = { uw: 3.33, w: 3.83, trend: 0.1 };

export const MockClasses: ClassItem[] = [
  {
    id: 'eng', code: 'ENG10', name: 'English 10', term: 'S2',
    letter: 'B', pct: 85.0, trend: 0.4, color: 'good',
    teacher: 'Ms. Reyes', next: 'Macbeth Essay · Thu', flags: 0,
  },
  {
    id: 'span', code: 'SPN3', name: 'Spanish 3', term: 'S2',
    letter: 'A-', pct: 91.2, trend: 1.1, color: 'good',
    teacher: 'Sr. Alvarez', next: 'Vocab Quiz · Tue', flags: 0,
  },
  {
    id: 'pre', code: 'PCT-H', name: 'Pre Calc / Trig Hon', term: 'S2',
    letter: 'B-', pct: 81.61, trend: -0.91, color: 'warn',
    teacher: 'Mr. Ivan', next: 'Ch 9 Test · Mon', flags: 5,
  },
  {
    id: 'chem', code: 'CHM', name: 'Chemistry — Earth Sys', term: 'S2',
    letter: 'A-', pct: 90.4, trend: -0.2, color: 'good',
    teacher: 'Dr. Patel', next: "Le Chatelier's Lab", flags: 1,
  },
  {
    id: 'hist', code: 'WHIST', name: 'World History', term: 'S2',
    letter: 'A', pct: 94.5, trend: 0.6, color: 'good',
    teacher: 'Ms. Brooks', next: 'Reading · Wed', flags: 0,
  },
  {
    id: 'pe', code: 'PE', name: 'Phys. Education', term: 'S2',
    letter: 'A', pct: 98.0, trend: 0.0, color: 'good',
    teacher: 'Coach Lee', next: 'Mile run · Fri', flags: 0,
  },
];

export const MockAttention: AttentionGroup[] = [
  {
    name: 'Missing', sev: 'bad', items: [
      { class: 'Chemistry — Earth Sys', title: "Le Chatelier's Principle Practice", due: 'Due Apr 22', score: '0 / 1' },
    ],
  },
  {
    name: 'Low scores', sev: 'warn', items: [
      { class: 'Pre Calc / Trig Hon', title: 'Chapter 5 Test',      due: 'Posted Apr 11', score: '40.5 / 58', pct: '69.8%' },
      { class: 'Pre Calc / Trig Hon', title: '5.5 HW',              due: 'Posted Apr 14', score: '1 / 10',    pct: '10%' },
      { class: 'Pre Calc / Trig Hon', title: '6.5 HW',              due: 'Posted Apr 17', score: '6.5 / 10',  pct: '65%' },
      { class: 'Pre Calc / Trig Hon', title: '8.1 HW',              due: 'Posted Apr 22', score: '7 / 10',    pct: '70%' },
      { class: 'Pre Calc / Trig Hon', title: 'CH8_DQ Extra Credit', due: 'Posted Apr 24', score: '2 / 5',     pct: '40%' },
    ],
  },
];

export const MockPreCalc: SubjectDetail = {
  categories: [
    { name: 'Tests',    weight: 60, pct: 78.4, count: 4 },
    { name: 'Homework', weight: 30, pct: 84.2, count: 18 },
    { name: 'Quizzes',  weight: 10, pct: 92.0, count: 6 },
  ],
  history: [
    { d: 'Apr 16', v: 82.52 }, { d: 'Apr 18', v: 82.50 },
    { d: 'Apr 21', v: 82.47 }, { d: 'Apr 23', v: 82.10 },
    { d: 'Apr 25', v: 81.74 }, { d: 'Today',  v: 81.61 },
  ],
  assignments: [
    { name: '8.4 HW',    score: '10 / 10',    pct: '100%',  cat: 'HW',   pos: 'good' },
    { name: '5.2 HW',    score: '10 / 10',    pct: '100%',  cat: 'HW',   pos: 'good' },
    { name: '5.3 HW',    score: '5 / 10',     pct: '50%',   cat: 'HW',   pos: 'warn' },
    { name: 'Ch 5 Test', score: '40.5 / 58',  pct: '69.8%', cat: 'Test', pos: 'warn' },
    { name: 'Quiz 7.2',  score: '18 / 20',    pct: '90%',   cat: 'Quiz', pos: 'good' },
    { name: '6.5 HW',    score: '6.5 / 10',   pct: '65%',   cat: 'HW',   pos: 'warn' },
  ],
};

// Infinite Campus WebView URL — student portal
export const IC_PORTAL_URL = 'https://campus.westviewusd.org/campus/portal/students/westview.jsp';
