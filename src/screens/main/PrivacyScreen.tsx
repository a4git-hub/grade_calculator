// Privacy & data policy. Presented as a Root-level modal from Settings.
// Content is intentionally written in plain language — students and parents
// should be able to read it without legal training.

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle } from '../../tokens';
import { LIcon } from '../../components/LIcon';

interface SectionDef {
  title: string;
  body: string;
}

// Edit these strings to update policy. The structure is fixed: a hero summary
// followed by sections rendered as cards.
const HERO = `Lumina is built so your school data never leaves your phone. We don't run analytics, we don't have a backend, and we don't sync to the cloud. The only thing we remember between launches is which school district you picked.`;

const SECTIONS: SectionDef[] = [
  {
    title: 'What stays on your device',
    body:
      'Just one thing: the name and login URL of the school district you selected during onboarding. We keep this so you don\'t have to search for your district every time you open the app. It\'s stored in iOS\'s standard local app storage, never sent anywhere.',
  },
  {
    title: 'What we never write to disk',
    body:
      'Your name, username, grades, assignments, attention items, GPA, classes, teachers, school name — anything we fetch from Infinite Campus stays in memory only. The moment you close or kill the app, all of it disappears. Next launch starts fresh and re-authenticates.',
  },
  {
    title: 'How sign-in works',
    body:
      'When you tap "Sign in", we open your district\'s real Infinite Campus / ClassLink portal inside an embedded browser. Your password is typed into the official login form — Lumina never sees it. After login, we read the session cookies natively (no DOM scraping, no JavaScript injection), and use those cookies to fetch your data via standard HTTPS calls. Cookies live in iOS\'s system cookie store while the app is running, scoped to your district\'s domain.',
  },
  {
    title: 'What we don\'t do',
    body:
      '• No analytics, telemetry, or tracking.\n' +
      '• No third-party SDKs that phone home.\n' +
      '• No cloud backup of your data.\n' +
      '• No data sharing with anyone, ever.\n' +
      '• No advertising, no ad networks.\n' +
      '• No AI training on your data — Lumina\'s AI features (when enabled) operate per-prompt with the data only in your current session.',
  },
  {
    title: 'Network requests',
    body:
      'All HTTP traffic goes directly from your phone to your school district\'s Infinite Campus server. There is no Lumina-operated backend in the middle. The one exception is the one-time district search at onboarding, which queries Infinite Campus\'s public district directory at infinitecampus.com.',
  },
  {
    title: 'Open source components',
    body:
      'Lumina is built on React Native, Expo SDK 55, and a handful of well-known open-source libraries. The exact list is in the project\'s package.json file. Each of those packages has its own license terms but none of them collect data outside what they need to function.',
  },
];

export function PrivacyScreen() {
  const { T } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Privacy'>>();

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Top bar with close affordance */}
        <View style={styles.topBar}>
          <View style={{ width: 60 }} />
          <Text style={[monoStyle(T)]}>Privacy & data</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.closeText, { color: T.ink }]}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
        >
          {/* Hero callout */}
          <View style={[styles.hero, { backgroundColor: T.surface, borderColor: T.hairline }]}>
            <View style={styles.heroIconRow}>
              <View style={[styles.heroIconWrap, { backgroundColor: T.goodSoft }]}>
                <LIcon.Lock size={18} color={T.good} stroke={2.2} />
              </View>
              <Text style={[styles.heroTitle, { color: T.text }]}>
                Your data stays on your phone.
              </Text>
            </View>
            <Text style={[styles.heroBody, { color: T.text2 }]}>{HERO}</Text>
          </View>

          {SECTIONS.map((s, i) => (
            <View
              key={i}
              style={[styles.card, { backgroundColor: T.surface, borderColor: T.hairline }]}
            >
              <Text style={[styles.cardTitle, { color: T.text }]}>{s.title}</Text>
              <Text style={[styles.cardBody, { color: T.text2 }]}>{s.body}</Text>
            </View>
          ))}

          <Text style={[monoStyle(T), styles.footer]}>
            Last updated 2026-04-26 · Lumina v1.0
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
  },
  closeBtn: { width: 60, alignItems: 'flex-end' },
  closeText: { fontSize: 15, fontWeight: '500' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingBottom: 40 },
  hero: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 16,
  },
  heroIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  heroIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    textAlign: 'center',
    marginTop: 20,
  },
});
