import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClassesStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle } from '../../tokens';
import { LIcon } from '../../components/LIcon';
import { useClasses, useData } from '../../context/DataContext';

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
  const { subjectDetails } = useData();
  const subject = classes.find(c => c.id === route.params.classId);
  const detail = subject ? subjectDetails[subject.id] : null;
  const backLabel = subject?.name ?? 'Class';

  if (!subject || !detail) {
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
            <Text style={[styles.headlineSub, { color: T.text2 }]}>Class data not found.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isUpward = subject.trend > 0;
  
  // Find categories
  const activeCategories = detail.categories.filter(c => c.count > 0);
  const worstCategory = activeCategories.length > 0 ? [...activeCategories].sort((a,b) => a.pct - b.pct)[0] : null;
  const bestCategory = activeCategories.length > 0 ? [...activeCategories].sort((a,b) => b.pct - a.pct)[0] : null;

  // Find lowest assignments
  const gradedAssignments = detail.assignments.filter(a => a.earned !== undefined && a.possible !== undefined && a.possible > 0);
  const worstAssignments = [...gradedAssignments].sort((a,b) => {
    const aPct = (a.earned! / a.possible!);
    const bPct = (b.earned! / b.possible!);
    return aPct - bPct;
  }).slice(0, 3);

  const promptTitle = route.params.promptTitle || '';

  // Generate Headline
  let headline = `Your grade is stable.`;
  if (promptTitle.includes('trajectory')) {
     headline = isUpward ? "You are on a strong upward trajectory." : "Your recent trajectory is slipping down.";
  } else if (promptTitle.includes('bomb')) {
     headline = worstCategory ? `A bad score in ${worstCategory.name} will heavily drop your grade.` : `A bad score will negatively impact your grade.`;
  } else if (promptTitle.includes('How do I get')) {
     headline = `Focus on your weakest categories to reach the next level.`;
  } else if (worstCategory) {
     headline = `Your ${worstCategory.name} category is dragging down your grade.`;
     if (isUpward) {
        headline = `You're trending up! Focus on ${worstCategory.name} to boost it further.`;
     }
  }

  const totalAssn = detail.assignments.length;
  const headlineSub = `Based on ${totalAssn} total assignments · Real-time algorithmic analysis.`;

  // Performance Section Title
  const perfTitle = bestCategory && worstCategory 
    ? `${bestCategory.name} is doing the work. ${worstCategory.name} isn't.` 
    : 'Category Breakdown';

  // Plan logic
  const nextGrade = subject.pct >= 90 ? 'A' : subject.pct >= 80 ? 'A-' : subject.pct >= 70 ? 'B' : 'C';
  const planTarget = Math.ceil(subject.pct) + 1;

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <LIcon.ChevronLeft size={18} color={T.ink} stroke={2.4} />
            <Text style={[styles.backText, { color: T.ink }]} numberOfLines={1}>{backLabel}</Text>
          </TouchableOpacity>
          <Text style={[monoStyle(T)]}>Generated · Just now</Text>
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
              {headline}
            </Text>
            <Text style={[styles.headlineSub, { color: T.text2 }]}>
              {headlineSub}
            </Text>
          </View>

          {/* 01 Performance */}
          <ReportSection T={T} kicker="01 · Performance"
                         title={perfTitle} color={T.ink}>
            {activeCategories.map((cat, i) => (
              <ReportRow 
                key={i} 
                T={T} 
                label={`${cat.name} (${cat.weight > 0 ? cat.weight + '%' : 'pts'})`}    
                value={`${cat.pct}%`} 
                sub={`${cat.count} items`} 
                pos={cat.pct >= subject.pct ? 'good' : 'warn'} 
              />
            ))}
            {activeCategories.length === 0 && <Text style={{ color: T.text2, paddingVertical: 12 }}>No categories available.</Text>}
          </ReportSection>

          {/* 02 Risks */}
          <ReportSection T={T} kicker="02 · Risks"
                         title="Three things pulling this down." color={T.warn}>
            {worstAssignments.map((a, i) => {
               const pct = Math.round((a.earned! / a.possible!) * 100);
               return (
                 <ReportBullet 
                   key={i} 
                   T={T} 
                   sev={pct < 60 ? 'bad' : 'warn'}  
                   text={`${a.name} (${a.cat}) was scored ${a.earned}/${a.possible} (${pct}%).`} 
                 />
               );
            })}
            {worstAssignments.length === 0 && <ReportBullet T={T} sev="good" text="No major risks detected! Keep it up." />}
          </ReportSection>

          {/* 03 Plan */}
          <ReportSection T={T} kicker="03 · Plan"
                         title={`A target that gets you to ${nextGrade}.`} color={T.accent}>
            <PlanWeek T={T} week="This Week"
                      items={worstCategory ? [`Review mistakes in ${worstCategory.name}`, `Ask teacher for help on ${worstCategory.name}`, `Maintain strong scores in ${bestCategory?.name ?? 'other categories'}`] : ['Keep up the good work!']}
                      target={planTarget.toFixed(1)} last />
          </ReportSection>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btnOutline, { borderColor: T.hairline2 }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.btnOutlineText, { color: T.text }]}>Save plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnFill, { backgroundColor: T.accent }]}
              onPress={() => navigation.goBack()}
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
