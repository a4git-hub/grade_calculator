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
  earned?: number;
  possible?: number;
  date?: string;
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

export type { UserProfile } from '../services/icTypes';

// Navigation param lists
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  /**
   * District search presented as a modal over Main. Used when the user taps
   * the "District" row in Settings to change schools. Reuses the
   * DistrictScreen component but changes its on-pick + cancel behavior
   * because route.name === 'ChangeDistrict' here (vs 'District' in Onboarding).
   */
  ChangeDistrict: undefined;
  /**
   * Privacy policy presented as a modal over Main. Reachable from the
   * "Privacy & data" row in Settings.
   */
  Privacy: undefined;
  /**
   * Web Sync scanner presented as a modal over Main. Reachable from the
   * "Lumina Web Sync" row in Settings.
   */
  WebSync: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  District: undefined;
  /**
   * No route params — SignInWebView reads the selected district directly from
   * DataContext (`useDistrict()`). This makes the screen reachable as the
   * onboarding entry point for returning users (RootNavigator picks it as
   * the initial route when a persisted district exists), not just as a step
   * after DistrictScreen.
   */
  SignInWebView: undefined;
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
  AiTutor: undefined;
  Settings: undefined;
};
