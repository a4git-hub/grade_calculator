export interface ClassItem {
  id: string;
  code: string;
  name: string;
  term: string;
  letter: string;
  pct: number;
  trend: number;
  color: 'good' | 'warn' | 'bad';
  teacher: string;
  next: string;
  flags: number;
}

export interface Category {
  name: string;
  weight: number;
  pct: number;
  count: number;
}

export interface HistoryPoint {
  d: string;
  v: number;
}

export interface Assignment {
  name: string;
  score: string;
  pct: string;
  cat: string;
  pos: 'good' | 'warn' | 'bad';
}

export interface SubjectDetail {
  categories: Category[];
  history: HistoryPoint[];
  assignments: Assignment[];
}

export interface AttentionGroup {
  name: string;
  sev: 'bad' | 'warn';
  items: AttentionItem[];
}

export interface AttentionItem {
  class: string;
  title: string;
  due: string;
  score: string;
  pct?: string;
}

// Navigation param lists
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  IcSpike: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  District: undefined;
  SignInWebView: { districtId: string };
  FirstSync: undefined;
};

export type ClassesStackParamList = {
  Dashboard: undefined;
  SubjectDetail: { classId: string };
  AIReport: { classId: string; promptTitle: string };
};

export type MainTabParamList = {
  ClassesStack: undefined;
  Attention: undefined;
  WhatIf: undefined;
  Settings: undefined;
};
