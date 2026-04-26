import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ClassesStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle, gradeColor, Fonts } from '../../tokens';
import { Sparkline } from '../../components/Sparkline';
import { AISheet } from '../../components/AISheet';
import { LIcon } from '../../components/LIcon';
import { MockClasses, MockPreCalc } from '../../data/mock';

type Props = NativeStackScreenProps<ClassesStackParamList, 'SubjectDetail'>;

export function SubjectDetailScreen({ navigation, route }: Props) {
  const { T, dark } = useTheme();
  const [aiVisible, setAiVisible] = useState(false);

  const subject = MockClasses.find(c => c.id === route.params.classId) ?? MockClasses[2];
  const detail  = MockPreCalc; // real app: load by subject.id
  const col     = gradeColor(T, subject.color);

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Top nav */}
        <View style={[styles.navBar]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <LIcon.ChevronLeft size={18} color={T.ink} stroke={2.4} />
            <Text style={[styles.backText, { color: T.ink }]}>Classes</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <LIcon.Refresh size={18} color={T.text2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={styles.titleBlock}>
            <Text style={[monoStyle(T)]}>{subject.code} · {subject.teacher}</Text>
            <Text style={[styles.title, { color: T.text }]}>{subject.name}</Text>
          </View>

          {/* Hero grade card */}
          <View style={[styles.heroCard, { backgroundColor: dark ? T.surface2 : T.surface, borderColor: T.hairline }]}>
            <View style={[styles.heroBg, { backgroundColor: col + '22' }]} />
            <Text style={[monoStyle(T)]}>Current grade · Term S2</Text>
            <View style={styles.gradeRow}>
              <Text style={[styles.gradeLetter, { color: col }]}>{subject.letter}</Text>
              <Text style={[styles.gradePct, { color: T.text }]}>
                {subject.pct.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.heroMeta}>
              <View style={[styles.trendBadge, { backgroundColor: T.badSoft }]}>
                <LIcon.TrendDown size={11} color={T.bad} stroke={2.4} />
                <Text style={[styles.trendText, { color: T.bad }]}>{subject.trend}% · 7d</Text>
              </View>
              <Text style={[styles.syncNote, { color: T.text3 }]}>Last sync · 2m ago</Text>
            </View>
          </View>

          {/* Categories */}
          <Text style={[styles.sectionLabel, { color: T.text2 }]}>Categories</Text>
          <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.hairline }]}>
            {detail.categories.map((cat, i) => {
              const catCol = cat.pct >= 85 ? T.good : cat.pct >= 75 ? T.warn : T.bad;
              return (
                <View
                  key={i}
                  style={[
                    styles.catRow,
                    i < detail.categories.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.hairline },
                  ]}
                >
                  <View style={styles.catInfo}>
                    <View style={styles.catLabelRow}>
                      <Text style={[styles.catName, { color: T.text }]}>{cat.name}</Text>
                      <Text style={[monoStyle(T), styles.catWeight]}>{cat.weight}% weight</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: T.surface3 }]}>
                      <View style={[styles.progressFill, { width: `${cat.pct}%`, backgroundColor: catCol }]} />
                    </View>
                  </View>
                  <View style={styles.catScore}>
                    <Text style={[styles.catPct, { color: T.text }]}>{cat.pct}%</Text>
                    <Text style={[styles.catCount, { color: T.text3 }]}>{cat.count} items</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Trajectory */}
          <Text style={[styles.sectionLabel, { color: T.text2 }]}>Trajectory · 10 days</Text>
          <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.hairline }]}>
            <Sparkline data={detail.history.map(h => h.v)} color={col} width={310} height={84} />
            <View style={styles.chartDates}>
              <Text style={[monoStyle(T)]}>{detail.history[0].d}</Text>
              <Text style={[monoStyle(T)]}>{detail.history[detail.history.length - 1].d}</Text>
            </View>
          </View>

          {/* Assignments */}
          <View style={styles.assignHeader}>
            <Text style={[styles.sectionLabel, { color: T.text2, marginBottom: 0 }]}>Assignments</Text>
            <Text style={[styles.seeAll, { color: T.ink }]}>See all</Text>
          </View>
          <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.hairline }]}>
            {detail.assignments.map((a, i) => {
              const ac = a.pos === 'good' ? T.good : a.pos === 'warn' ? T.warn : T.bad;
              return (
                <View
                  key={i}
                  style={[
                    styles.assignRow,
                    i < detail.assignments.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.hairline },
                  ]}
                >
                  <View style={[styles.catChip, { backgroundColor: ac + '22' }]}>
                    <Text style={[styles.catChipText, { color: ac }]}>{a.cat}</Text>
                  </View>
                  <View style={styles.assignInfo}>
                    <Text style={[styles.assignName, { color: T.text }]} numberOfLines={1}>{a.name}</Text>
                    <Text style={[styles.assignScore, { color: T.text3 }]}>{a.score}</Text>
                  </View>
                  <Text style={[styles.assignPct, { color: ac }]}>{a.pct}</Text>
                </View>
              );
            })}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Fixed AI button */}
        <View style={styles.aiFabWrap} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => setAiVisible(true)}
            activeOpacity={0.88}
            style={styles.aiFab}
          >
            <LinearGradient
              colors={[T.accent, T.ink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiFabGrad}
            >
              <LIcon.Sparkle size={18} color="#fff" stroke={2.2} />
              <Text style={styles.aiFabText}>Assess my plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <AISheet
        visible={aiVisible}
        onClose={() => setAiVisible(false)}
        onSelect={(prompt) => {
          setAiVisible(false);
          navigation.navigate('AIReport', { classId: subject.id, promptTitle: prompt });
        }}
        T={T}
        className={subject.name}
      />
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
    paddingBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: -2,
  },
  scroll:  { flex: 1 },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  titleBlock: {
    paddingTop: 14,
    paddingBottom: 0,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.56,
    lineHeight: 32,
    marginTop: 4,
  },
  heroCard: {
    padding: 22,
    paddingBottom: 18,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
    position: 'relative',
  },
  heroBg: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginTop: 8,
  },
  gradeLetter: {
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -2.56,
    lineHeight: 58,
  },
  gradePct: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -0.64,
    fontVariant: ['tabular-nums'],
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  syncNote: {
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.65,
    marginBottom: 10,
    marginTop: 18,
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  catInfo: {
    flex: 1,
  },
  catLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  catName: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  catWeight: {
    fontSize: 10,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  catScore: {
    alignItems: 'flex-end',
    minWidth: 56,
  },
  catPct: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  catCount: {
    fontSize: 10.5,
    marginTop: 1,
  },
  chartDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  assignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '500',
  },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  catChip: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  assignInfo: {
    flex: 1,
    minWidth: 0,
  },
  assignName: {
    fontSize: 14,
    fontWeight: '500',
  },
  assignScore: {
    fontSize: 11.5,
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
  assignPct: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  aiFabWrap: {
    position: 'absolute',
    right: 18,
    bottom: 32,
  },
  aiFab: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#5BC8C2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  aiFabGrad: {
    height: 56,
    paddingHorizontal: 22,
    paddingLeft: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiFabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
