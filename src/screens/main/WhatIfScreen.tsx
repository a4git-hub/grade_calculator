import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle } from '../../tokens';
import { LIcon } from '../../components/LIcon';

const EXISTING = [
  { name: 'Ch 5 Test', score: '40.5 / 58', pct: '69.8%', pos: 'warn' as const, on: true  },
  { name: '5.3 HW',   score: '5 / 10',    pct: '50%',   pos: 'warn' as const, on: false },
  { name: '6.5 HW',   score: '6.5 / 10',  pct: '65%',   pos: 'warn' as const, on: true  },
  { name: '8.1 HW',   score: '7 / 10',    pct: '70%',   pos: 'warn' as const, on: true  },
];

const TARGETS = [
  { letter: 'B+', pct: 87, need: 'avg 92% on remaining', sev: 'warn' as const,  current: false },
  { letter: 'B',  pct: 83, need: 'avg 84% on remaining', sev: 'good' as const,  current: true  },
  { letter: 'B-', pct: 80, need: 'avg 76% on remaining', sev: 'good' as const,  current: false },
];

export function WhatIfScreen() {
  const { T, dark } = useTheme();
  const [toggles, setToggles] = useState(EXISTING.map(a => a.on));
  const [sliderVal] = useState(80);

  const toggle = (i: number) => {
    const next = [...toggles];
    next[i] = !next[i];
    setToggles(next);
  };

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[monoStyle(T), styles.kicker]}>What-if · Pre Calc / Trig Hon</Text>
          <Text style={[styles.title, { color: T.text }]}>Simulate the next 4 weeks.</Text>
          <Text style={[styles.sub, { color: T.text2 }]}>
            Toggle assignments, drop low scores, or invent fake ones to see grade impact live.
          </Text>

          {/* Live result */}
          <View style={[styles.resultCard, {
            backgroundColor: dark ? T.surface2 : T.surface,
            borderColor: T.accent + '40',
          }]}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={[monoStyle(T)]}>Projected grade</Text>
                <View style={styles.gradeRow}>
                  <Text style={[styles.gradeLetter, { color: T.accent }]}>B</Text>
                  <Text style={[styles.gradePct, { color: T.text }]}>83.7%</Text>
                </View>
                <View style={styles.uptrendRow}>
                  <LIcon.Trend size={12} color={T.good} stroke={2.4} />
                  <Text style={[styles.uptrendText, { color: T.good }]}>+2.09% vs current</Text>
                </View>
              </View>
              <View style={[styles.changesBadge, { backgroundColor: T.accentSoft }]}>
                <Text style={[monoStyle(T), { color: T.accent }]}>3 changes</Text>
              </View>
            </View>
          </View>

          {/* Existing assignments */}
          <Text style={[styles.sectionLabel, { color: T.text2 }]}>Existing assignments</Text>
          <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.hairline }]}>
            {EXISTING.map((a, i) => {
              const on = toggles[i];
              const c = on ? T.warn : T.text3;
              return (
                <View
                  key={i}
                  style={[
                    styles.toggleRow,
                    i < EXISTING.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.hairline },
                  ]}
                >
                  <View style={styles.toggleInfo}>
                    <Text style={[
                      styles.toggleName,
                      { color: on ? T.text : T.text3, textDecorationLine: on ? 'none' : 'line-through' },
                    ]}>{a.name}</Text>
                    <Text style={[styles.toggleScore, { color: T.text3 }]}>{a.score} · {a.pct}</Text>
                  </View>
                  <View style={styles.toggleRight}>
                    <Text style={[styles.toggleStatus, { color: on ? c : T.text3 }]}>
                      {on ? 'Counts' : 'Dropped'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => toggle(i)}
                      activeOpacity={0.8}
                      style={[styles.toggleSwitch, { backgroundColor: on ? T.accent : T.surface3, justifyContent: on ? 'flex-end' : 'flex-start' }]}
                    >
                      <View style={styles.toggleThumb} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Hypothetical */}
          <View style={styles.hypotheticalHeader}>
            <Text style={[styles.sectionLabel, { color: T.text2, marginBottom: 0 }]}>Hypothetical</Text>
            <View style={styles.addBtn}>
              <LIcon.Plus size={12} color={T.ink} stroke={2.4} />
              <Text style={[styles.addText, { color: T.ink }]}>Add</Text>
            </View>
          </View>
          <View style={[styles.hypoCard, { backgroundColor: T.surface, borderColor: T.accent + '55' }]}>
            <View style={styles.hypoHeader}>
              <View style={[styles.newChip, { backgroundColor: T.inkSoft }]}>
                <Text style={[styles.newChipText, { color: T.ink }]}>NEW</Text>
              </View>
              <Text style={[styles.hypoName, { color: T.text }]}>Ch 9 Test (Mon)</Text>
              <View style={styles.spacer} />
              <Text style={[monoStyle(T)]}>Tests · 60%</Text>
            </View>

            {/* Score row */}
            <View style={styles.scoreRow}>
              <View style={[styles.scoreInput, { backgroundColor: T.surface3 }]}>
                <Text style={[styles.scoreVal, { color: T.text }]}>48</Text>
                <Text style={[styles.scoreOf, { color: T.text3 }]}>/ 60</Text>
              </View>
              <View style={[styles.scorePct, { backgroundColor: T.accentSoft, borderColor: T.accent + '40' }]}>
                <Text style={[styles.scorePctVal, { color: T.accent }]}>80%</Text>
                <Text style={[monoStyle(T), { color: T.accent, fontSize: 9 }]}>score</Text>
              </View>
            </View>

            {/* Slider (visual) */}
            <View style={styles.sliderWrap}>
              <View style={[styles.sliderTrack, { backgroundColor: T.surface3 }]}>
                <View style={[styles.sliderFill, { backgroundColor: T.accent, width: `${sliderVal}%` }]} />
                <View style={[styles.sliderThumb, { left: `${sliderVal}%`, borderColor: T.accent }]} />
              </View>
              <View style={styles.sliderLabels}>
                <Text style={[monoStyle(T), { fontSize: 9 }]}>0</Text>
                <Text style={[monoStyle(T), { fontSize: 9 }]}>30</Text>
                <Text style={[monoStyle(T), { fontSize: 9 }]}>60</Text>
              </View>
            </View>
          </View>

          {/* Targets */}
          <Text style={[styles.sectionLabel, { color: T.text2 }]}>What you need</Text>
          <View style={[styles.targetsCard, { backgroundColor: T.surface, borderColor: T.hairline }]}>
            {TARGETS.map((g, i) => {
              const c = g.sev === 'good' ? T.good : T.warn;
              return (
                <View
                  key={i}
                  style={[
                    styles.targetRow,
                    i < TARGETS.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.hairline },
                    g.current && { backgroundColor: T.accentSoft },
                  ]}
                >
                  <View style={[styles.targetLetter, { backgroundColor: c + '22' }]}>
                    <Text style={[styles.targetLetterText, { color: c }]}>{g.letter}</Text>
                  </View>
                  <View style={styles.targetInfo}>
                    <Text style={[styles.targetNeed, { color: T.text }]}>{g.need}</Text>
                    <Text style={[styles.targetPct, { color: T.text3 }]}>
                      ≥ {g.pct}% · {g.current ? 'on track' : 'reach'}
                    </Text>
                  </View>
                  {g.current && (
                    <Text style={[monoStyle(T), { color: T.accent }]}>You</Text>
                  )}
                </View>
              );
            })}
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
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 110 },
  kicker: { marginBottom: 6 },
  title:  { fontSize: 28, fontWeight: '700', letterSpacing: -0.7, lineHeight: 32, marginBottom: 6 },
  sub:    { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  resultCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gradeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 6 },
  gradeLetter: { fontSize: 48, fontWeight: '700', letterSpacing: -1.44, lineHeight: 44 },
  gradePct:    { fontSize: 26, fontWeight: '600', fontVariant: ['tabular-nums'] },
  uptrendRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  uptrendText: { fontSize: 12, fontWeight: '600' },
  changesBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  sectionLabel: {
    fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.65,
    marginTop: 20, marginBottom: 10,
  },
  card: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleInfo: { flex: 1 },
  toggleName:  { fontSize: 14, fontWeight: '500' },
  toggleScore: { fontSize: 11.5, marginTop: 1, fontVariant: ['tabular-nums'] },
  toggleRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleStatus: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  toggleSwitch: {
    width: 38, height: 22, borderRadius: 11, padding: 2,
    flexDirection: 'row', alignItems: 'center',
  },
  toggleThumb: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3, shadowRadius: 2, elevation: 2,
  },
  hypotheticalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 20, marginBottom: 10,
  },
  addBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText:   { fontSize: 12, fontWeight: '500' },
  hypoCard:  { padding: 14, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  hypoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  newChip:   { width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  newChipText: { fontSize: 10, fontWeight: '700' },
  hypoName:  { fontSize: 14, fontWeight: '600' },
  spacer:    { flex: 1 },
  scoreRow:  { flexDirection: 'row', gap: 8, marginBottom: 8 },
  scoreInput: {
    flex: 1, padding: 10, paddingHorizontal: 12, borderRadius: 10,
    flexDirection: 'row', alignItems: 'baseline', gap: 4,
  },
  scoreVal:  { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  scoreOf:   { fontSize: 14 },
  scorePct:  {
    width: 92, padding: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  scorePctVal: { fontSize: 18, fontWeight: '700' },
  sliderWrap: { marginTop: 14, marginHorizontal: 4, marginBottom: 8 },
  sliderTrack: {
    height: 6, borderRadius: 3, position: 'relative', overflow: 'visible', marginBottom: 8,
  },
  sliderFill:  { height: '100%', borderRadius: 3 },
  sliderThumb: {
    position: 'absolute', top: '50%', marginTop: -10, marginLeft: -10,
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
    elevation: 3,
  },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  targetsCard:  { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  targetRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, paddingHorizontal: 16 },
  targetLetter: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  targetLetterText: { fontSize: 18, fontWeight: '700' },
  targetInfo: { flex: 1 },
  targetNeed: { fontSize: 13, fontWeight: '500' },
  targetPct:  { fontSize: 11.5, marginTop: 2, fontVariant: ['tabular-nums'] },
});
