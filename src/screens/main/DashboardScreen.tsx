import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClassesStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle, Fonts } from '../../tokens';
import { ClassCard } from '../../components/ClassCard';
import { LIcon } from '../../components/LIcon';
import { useClasses, useUser, useGpa, useData } from '../../context/DataContext';
import { timeAgo } from '../../lib/time';

type Props = NativeStackScreenProps<ClassesStackParamList, 'Dashboard'>;

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatToday(now: Date = new Date()): string {
  return `${DOW[now.getDay()]} · ${MON[now.getMonth()]} ${now.getDate()}`;
}

function buildSummary(classes: ReturnType<typeof useClasses>): string {
  if (classes.length === 0) return 'Sync to see your grade summary.';
  const stable = classes.filter(c => c.color === 'good').length;
  const dipped = classes.filter(c => c.color === 'bad' || c.color === 'warn');
  if (dipped.length === 0) {
    return `All ${classes.length} classes are stable. Solid week.`;
  }
  // Name the lowest course as the focus.
  const lowest = dipped.slice().sort((a, b) => a.pct - b.pct)[0]!;
  return `${stable} of ${classes.length} classes are stable. ${lowest.name} dipped — we'll dig in.`;
}

export function DashboardScreen({ navigation }: Props) {
  const { T } = useTheme();
  const user = useUser();
  const classes = useClasses();
  const gpa = useGpa();
  const { syncedAt } = useData();
  const today = formatToday();
  const summary = buildSummary(classes);
  const trendUp = gpa.trend >= 0;

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[monoStyle(T)]}>{today}</Text>
            <View style={[styles.syncBadge, { backgroundColor: T.goodSoft }]}>
              <View style={[styles.syncDot, { backgroundColor: T.good }]} />
              <Text style={[styles.syncText, { color: T.good }]}>Synced · {timeAgo(syncedAt)}</Text>
            </View>
          </View>

          <Text style={[styles.headline, { color: T.text }]}>
            Hey {user?.firstName ?? 'there'}.
          </Text>
          <Text style={[styles.headlineSub, { color: T.text2 }]}>
            {summary}
          </Text>

          {/* GPA strip */}
          <View style={[styles.gpaCard, { backgroundColor: T.surface, borderColor: T.hairline }]}>
            <View style={styles.gpaCell}>
              <Text style={[monoStyle(T)]}>GPA · Unweighted</Text>
              <Text style={[styles.gpaVal, { color: T.text }]}>{gpa.uw.toFixed(2)}</Text>
            </View>
            <View style={[styles.gpaDivider, { borderColor: T.hairline }]} />
            <View style={styles.gpaCell}>
              <Text style={[monoStyle(T)]}>GPA · Weighted</Text>
              <Text style={[styles.gpaVal, { color: T.accent }]}>{gpa.w.toFixed(2)}</Text>
            </View>
            <View style={[styles.gpaDivider, { borderColor: T.hairline }]} />
            <View style={styles.gpaCell}>
              <Text style={[monoStyle(T)]}>Term trend</Text>
              <View style={styles.trendRow}>
                <LIcon.Trend size={14} color={trendUp ? T.good : T.bad} stroke={2.4} />
                <Text style={[styles.gpaVal, { color: trendUp ? T.good : T.bad }]}>
                  {gpa.trend === 0 ? '—' : `${trendUp ? '+' : ''}${gpa.trend.toFixed(2)}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Classes section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: T.text2 }]}>Your classes</Text>
            <View style={styles.filterRow}>
              <LIcon.Filter size={12} color={T.text3} stroke={2} />
              <Text style={[styles.filterText, { color: T.text3 }]}>Term S2</Text>
            </View>
          </View>

          <View style={styles.cardList}>
            {classes.map((c) => (
              <ClassCard
                key={c.id}
                item={c}
                T={T}
                onPress={() => navigation.navigate('SubjectDetail', { classId: c.id })}
              />
            ))}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  safe:  { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '600',
  },
  headline: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.75,
    lineHeight: 34,
    marginTop: 14,
    marginBottom: 6,
  },
  headlineSub: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  gpaCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  gpaCell: {
    flex: 1,
  },
  gpaDivider: {
    width: 1,
    borderLeftWidth: 1,
    marginHorizontal: 14,
  },
  gpaVal: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.48,
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.65,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 12,
  },
  cardList: {
    gap: 10,
  },
});
