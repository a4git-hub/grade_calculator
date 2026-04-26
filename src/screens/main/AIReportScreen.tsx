import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClassesStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle } from '../../tokens';
import { LIcon } from '../../components/LIcon';
import { useClasses } from '../../context/DataContext';

type Props = NativeStackScreenProps<ClassesStackParamList, 'AIReport'>;

function ReportSection({
  T, kicker, title, color, children,
}: { T: any; kicker: string; title: string; color: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[monoStyle(T), { color }]}>{kicker}</Text>
      <Text style={[styles.sectionTitle, { color: T.text }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: T.surface, borderColor: T.hairline, borderLeftColor: color }]}>
        {children}
      </View>
    </View>
  );
}

function ReportRow({ T, label, value, sub, pos }: { T: any; label: string; value: string; sub: string; pos: 'good' | 'warn' | 'bad' }) {
  const c = pos === 'good' ? T.good : pos === 'warn' ? T.warn : T.bad;
  return (
    <View style={[styles.reportRow, { borderBottomColor: T.hairline }]}>
      <View style={styles.reportRowLeft}>
        <Text style={[styles.reportLabel, { color: T.text }]}>{label}</Text>
        <Text style={[styles.reportSub, { color: T.text3 }]}>{sub}</Text>
      </View>
      <Text style={[styles.reportValue, { color: c }]}>{value}</Text>
    </View>
  );
}

function ReportBullet({ T, sev, text }: { T: any; sev: 'bad' | 'warn' | 'good'; text: string }) {
  const c = sev === 'bad' ? T.bad : sev === 'warn' ? T.warn : T.good;
  return (
    <View style={[styles.bulletRow, { borderBottomColor: T.hairline }]}>
      <View style={[styles.bulletDot, { backgroundColor: c }]} />
      <Text style={[styles.bulletText, { color: T.text }]}>{text}</Text>
    </View>
  );
}

function PlanWeek({ T, week, items, target, last }: {
  T: any; week: string; items: string[]; target: string; last?: boolean;
}) {
  return (
    <View style={[styles.planWeek, !last && { borderBottomWidth: 1, borderBottomColor: T.hairline }]}>
      <View style={styles.planWeekHeader}>
        <Text style={[monoStyle(T), { color: T.text2 }]}>{week}</Text>
        <Text style={[styles.planTarget, { color: T.accent }]}>→ {target}%</Text>
      </View>
      <View style={styles.planItems}>
        {items.map((it, i) => (
          <View key={i} style={styles.planItem}>
            <View style={[styles.planCheck, { borderColor: T.hairline2 }]} />
            <Text style={[styles.planItemText, { color: T.text }]}>{it}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function AIReportScreen({ navigation, route }: Props) {
  const { T, dark } = useTheme();
  const classes = useClasses();
  const subject = classes.find(c => c.id === route.params.classId);
  const backLabel = subject?.name ?? 'Class';

  if (!subject) {
    return (
      <View style={[styles.root, { backgroundColor: T.bg }]}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <LIcon.ChevronLeft size={18} color={T.ink} stroke={2.4} />
              <Text style={[styles.backText, { color: T.ink }]}>Back</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[styles.headlineSub, { color: T.text2 }]}>Class not found.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <LIcon.ChevronLeft size={18} color={T.ink} stroke={2.4} />
            <Text style={[styles.backText, { color: T.ink }]} numberOfLines={1}>{backLabel}</Text>
          </TouchableOpacity>
          <Text style={[monoStyle(T)]}>Generated · 2:41 PM</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Kicker + headline */}
          <View style={styles.reportHead}>
            <View style={styles.kickerRow}>
              <LIcon.Sparkle size={14} color={T.accent} stroke={2.4} />
              <Text style={[monoStyle(T), { color: T.accent }]}>Lumina assessment</Text>
            </View>
            <Text style={[styles.headline, { color: T.text }]}>
              You can hold a B- if you stop bleeding HW points.
            </Text>
            <Text style={[styles.headlineSub, { color: T.text2 }]}>
              Based on 18 HW, 4 tests, and 6 quizzes from Term S2 · 4 weeks remaining.
            </Text>
          </View>

          {/* 01 Performance */}
          <ReportSection T={T} kicker="01 · Performance"
                         title="Tests are doing the work. Homework isn't." color={T.ink}>
            <ReportRow T={T} label="Tests (60%)"    value="78.4%" sub="2 of 4 above class avg" pos="warn" />
            <ReportRow T={T} label="Homework (30%)" value="84.2%" sub="3 zeros + 4 low scores" pos="warn" />
            <ReportRow T={T} label="Quizzes (10%)"  value="92.0%" sub="strongest category"     pos="good" />
          </ReportSection>

          {/* 02 Risks */}
          <ReportSection T={T} kicker="02 · Risks"
                         title="Three things will pull this down." color={T.warn}>
            <ReportBullet T={T} sev="bad"  text="Le Chatelier practice (CHM) is missing — drops 0.6%." />
            <ReportBullet T={T} sev="warn" text="Ch 9 Test on Mon — last test was 69.8%. Below 65 puts you at C+." />
            <ReportBullet T={T} sev="warn" text="HW pattern: scores drop on every 5th, 6th, 8th HW. Look at sleep/timing." />
          </ReportSection>

          {/* 03 Plan */}
          <ReportSection T={T} kicker="03 · Plan · 4 weeks"
                         title="A weekly target that gets you to 84%." color={T.accent}>
            <PlanWeek T={T} week="Apr 28 – May 4"
                      items={['Submit 5.3 HW retake (Mon)', 'Ch 9 Test ≥ 80%', 'Office hrs · Wed']}
                      target="82.5" />
            <PlanWeek T={T} week="May 5 – May 11"
                      items={['HW 9.1–9.4 · all ≥ 90%', 'Catch-up: Le Chatelier (CHM)']}
                      target="83.4" />
            <PlanWeek T={T} week="May 12 – May 18"
                      items={['Quiz 9.5 ≥ 95%', 'Practice test on Sun']}
                      target="83.8" />
            <PlanWeek T={T} week="May 19 – Final"
                      items={['Final ≥ 80% locks B-', '≥ 88% upgrades to B']}
                      target="84.2" last />
          </ReportSection>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btnOutline, { borderColor: T.hairline2 }]}
            >
              <Text style={[styles.btnOutlineText, { color: T.text }]}>Save plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnFill, { backgroundColor: T.accent }]}
            >
              <Text style={[styles.btnFillText, { color: dark ? '#04181B' : '#fff' }]}>Open What-If</Text>
              <LIcon.Arrow size={14} color={dark ? '#04181B' : '#fff'} stroke={2.4} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.disclaimer, { color: T.text3 }]}>
            AI uses your synced grades + uploaded syllabus. Numbers are estimates.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  safe:  { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { fontSize: 15, fontWeight: '500', marginLeft: -2 },
  scroll:   { flex: 1 },
  content:  { paddingBottom: 40 },
  reportHead: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 4,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headline: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.52,
    lineHeight: 31,
    marginTop: 4,
    marginBottom: 8,
  },
  headlineSub: {
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.19,
    lineHeight: 24,
    marginTop: 6,
    marginBottom: 12,
  },
  sectionCard: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  reportRowLeft: { flex: 1 },
  reportLabel:   { fontSize: 14, fontWeight: '500' },
  reportSub:     { fontSize: 12, marginTop: 2 },
  reportValue:   { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  bulletDot:  { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 13.5, lineHeight: 20 },
  planWeek:   { paddingVertical: 12 },
  planWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  planTarget: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  planItems:  { marginTop: 6, gap: 4 },
  planItem:   { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  planCheck:  { width: 14, height: 14, borderRadius: 4, borderWidth: 1.5, marginTop: 2, flexShrink: 0 },
  planItemText: { flex: 1, fontSize: 13, lineHeight: 19 },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 6,
  },
  btnOutline: {
    flex: 1, height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  btnOutlineText: { fontSize: 14, fontWeight: '600' },
  btnFill: {
    flex: 1, height: 48, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  btnFillText: { fontSize: 14, fontWeight: '600' },
  disclaimer: {
    textAlign: 'center',
    fontSize: 11,
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
});
