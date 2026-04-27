import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert
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
import { useClasses, useSubjectDetail, useData } from '../../context/DataContext';
import { timeAgo } from '../../lib/time';

type Props = NativeStackScreenProps<ClassesStackParamList, 'SubjectDetail'>;

export function SubjectDetailScreen({ navigation, route }: Props) {
  const { T, dark } = useTheme();
  const [aiVisible, setAiVisible] = useState(false);
  
  // What-if state
  const [droppedAssignments, setDroppedAssignments] = useState<Record<string, boolean>>({});
  const [customAssignments, setCustomAssignments] = useState<Record<string, {name: string, score: string, total: string}[]>>({});
  const [editedAssignments, setEditedAssignments] = useState<Record<string, {score: string, total: string}>>({});
  
  // Final calc state
  const [finalCat, setFinalCat] = useState<string>('');
  const [finalTarget, setFinalTarget] = useState<string>('90');
  const [finalTotal, setFinalTotal] = useState<string>('100');
  
  // Chart tooltip state
  const [chartTooltip, setChartTooltip] = useState<{ x: number, v: number, d: string } | null>(null);

  const classes = useClasses();
  const subject = classes.find(c => c.id === route.params.classId) ?? null;
  const detail  = useSubjectDetail(route.params.classId) ?? { categories: [], history: [], assignments: [] };
  const { syncedAt } = useData();
  const col     = gradeColor(T, subject?.color ?? 'good');

  let isEdited = false;
  if (Object.keys(droppedAssignments).length > 0 || Object.keys(editedAssignments).length > 0 || Object.values(customAssignments).some(arr => arr.length > 0)) {
    isEdited = true;
  }

  let totalEarnedWeight = 0;
  let totalPossibleWeight = 0;

  const recalculatedCategories = detail.categories.map(cat => {
    let catEarned = 0;
    let catPossible = 0;
    const catAssignments = detail.assignments.filter(a => a.cat === cat.name);
    let hasScores = false;

    // Add original assignments
    catAssignments.forEach((a, j) => {
       const id = `${cat.name}-${a.name}-${j}`;
       if (droppedAssignments[id]) return;
       
       hasScores = true;
       if (editedAssignments[id]) {
          catEarned += parseFloat(editedAssignments[id].score) || 0;
          catPossible += parseFloat(editedAssignments[id].total) || 0;
       } else if (a.earned !== undefined && a.possible !== undefined) {
          catEarned += a.earned;
          catPossible += a.possible;
       } else if (a.pct !== '—') {
          catEarned += parseFloat(a.pct) || 0;
          catPossible += 100;
       }
    });

    // Add custom assignments
    const customForCat = customAssignments[cat.name] || [];
    customForCat.forEach(ca => {
       hasScores = true;
       catEarned += parseFloat(ca.score) || 0;
       catPossible += parseFloat(ca.total) || 0;
    });

    const newPct = hasScores ? (catPossible > 0 ? (catEarned / catPossible) * 100 : 0) : cat.pct;

    if (hasScores || cat.pct > 0) {
      totalEarnedWeight += (newPct / 100) * cat.weight;
      totalPossibleWeight += cat.weight;
    }

    return { ...cat, newPct };
  });

  const overallRecalculatedPct = totalPossibleWeight > 0 ? (totalEarnedWeight / totalPossibleWeight) * 100 : (subject?.pct ?? 0);
  
  // Calculate recalculated letter grade
  const letterForPct = (pct: number): string => {
    if (pct >= 93) return 'A';
    if (pct >= 90) return 'A-';
    if (pct >= 87) return 'B+';
    if (pct >= 83) return 'B';
    if (pct >= 80) return 'B-';
    if (pct >= 77) return 'C+';
    if (pct >= 73) return 'C';
    if (pct >= 70) return 'C-';
    if (pct >= 67) return 'D+';
    if (pct >= 60) return 'D';
    return 'F';
  };
  
  const overallLetter = isEdited ? letterForPct(overallRecalculatedPct) : (subject?.letter ?? '');

  if (!subject) {
    return (
      <View style={[styles.root, { backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: T.text2, fontSize: 15 }}>Loading…</Text>
      </View>
    );
  }

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
              <Text style={[styles.gradeLetter, { color: isEdited ? T.accent : col }]}>{overallLetter}</Text>
              <Text style={[styles.gradePct, { color: isEdited ? T.accent : T.text }]}>
                {isEdited ? overallRecalculatedPct.toFixed(2) : subject.pct.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.heroMeta}>
              {isEdited ? (
                 <TouchableOpacity 
                   style={[styles.trendBadge, { backgroundColor: T.accent + '22' }]}
                   onPress={() => {
                     setDroppedAssignments({});
                     setEditedAssignments({});
                     setCustomAssignments({});
                   }}
                 >
                   <LIcon.Refresh size={11} color={T.accent} stroke={2.4} />
                   <Text style={[styles.trendText, { color: T.accent }]}>Reset Grade</Text>
                 </TouchableOpacity>
               ) : (
                 <View style={[styles.trendBadge, { backgroundColor: T.badSoft }]}>
                   <LIcon.TrendDown size={11} color={T.bad} stroke={2.4} />
                   <Text style={[styles.trendText, { color: T.bad }]}>{subject.trend}% · 7d</Text>
                 </View>
               )}
              <Text style={[styles.syncNote, { color: T.text3 }]}>{isEdited ? 'What-If Mode' : `Last sync · ${timeAgo(syncedAt)}`}</Text>
            </View>
          </View>

          {/* Trajectory */}
          <Text style={[styles.sectionLabel, { color: T.text2 }]}>Trajectory · Semester</Text>
          <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.hairline, marginBottom: 18 }]}>
            {detail.history.length > 0 ? (
              <View 
                style={{ position: 'relative', width: 310, height: 84, backgroundColor: 'transparent' }}
                onStartShouldSetResponder={() => true}
                onResponderMove={(e) => {
                  const x = e.nativeEvent.locationX;
                  const w = 310;
                  const idx = Math.min(
                    detail.history.length - 1,
                    Math.max(0, Math.round((x / w) * (detail.history.length - 1)))
                  );
                  const item = detail.history[idx];
                  if (item) {
                    setChartTooltip({ x, v: item.v, d: item.d });
                  }
                }}
                onResponderRelease={() => setChartTooltip(null)}
                onResponderTerminate={() => setChartTooltip(null)}
              >
                <Sparkline data={detail.history.map(h => h.v)} color={col} width={310} height={84} />
                
                {chartTooltip && (
                  <View style={[styles.tooltip, { left: Math.max(20, Math.min(290, chartTooltip.x)) - 35 }]}>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{chartTooltip.v.toFixed(1)}%</Text>
                    <Text style={{ color: '#aaa', fontSize: 10 }}>{chartTooltip.d}</Text>
                  </View>
                )}
                {chartTooltip && (
                  <View style={[styles.tooltipLine, { left: chartTooltip.x }]} />
                )}
                
                <View style={styles.chartDates}>
                  <Text style={{ fontSize: 11, color: T.text3 }}>{detail.history[0]?.d}</Text>
                  <Text style={{ fontSize: 11, color: T.text3 }}>{detail.history[detail.history.length - 1]?.d}</Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.emptyNote, { color: T.text3 }]}>Not enough data yet</Text>
            )}
          </View>

          {/* Categories & Assignments */}
          <Text style={[styles.sectionLabel, { color: T.text2 }]}>Gradebook</Text>
          {recalculatedCategories.map((cat, i) => {
            const catPctVal = isEdited ? cat.newPct : cat.pct;
            const hasScore = catPctVal > 0;
            const catCol = !hasScore ? T.text3 : catPctVal >= 85 ? T.good : catPctVal >= 75 ? T.warn : T.bad;
            const catAssignments = detail.assignments.filter(a => a.cat === cat.name);
            const customForCat = customAssignments[cat.name] || [];
            
            return (
              <View key={i} style={[styles.card, { backgroundColor: T.surface, borderColor: T.hairline, marginBottom: 16 }]}>
                {/* Category Header */}
                <View style={[styles.catRow, { paddingBottom: 14 }]}>
                  <View style={styles.catInfo}>
                    <View style={styles.catLabelRow}>
                      <Text style={[styles.catName, { color: T.text }]}>{cat.name}</Text>
                      <Text style={[monoStyle(T), styles.catWeight]}>{cat.weight}% weight</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: T.surface3 }]}>
                      <View style={[styles.progressFill, { width: `${hasScore ? catPctVal : 0}%`, backgroundColor: catCol }]} />
                    </View>
                  </View>
                  <View style={styles.catScore}>
                    <Text style={[styles.catPct, { color: hasScore ? (isEdited ? T.accent : T.text) : T.text3 }]}>
                      {hasScore ? `${catPctVal.toFixed(2)}%` : '—'}
                    </Text>
                    {cat.count > 0 && (
                      <Text style={[styles.catCount, { color: T.text3 }]}>{cat.count} items</Text>
                    )}
                  </View>
                </View>

                {/* Assignments under Category */}
                <View style={{ borderTopWidth: 1, borderTopColor: T.hairline, paddingTop: 4 }}>
                  {catAssignments.map((a, j) => {
                      const id = `${cat.name}-${a.name}-${j}`;
                      const isDropped = droppedAssignments[id];
                      const edited = editedAssignments[id];
                      const currentEarned = edited ? edited.score : (a.earned?.toString() ?? '');
                      const currentTotal = edited ? edited.total : (a.possible?.toString() ?? '');
                      const displayPct = edited ? (((parseFloat(currentEarned)/parseFloat(currentTotal))*100) || 0).toFixed(1) + '%' : a.pct;
                      const ac = a.pos === 'good' ? T.good : a.pos === 'warn' ? T.warn : T.bad;

                      return (
                        <View key={`existing-${j}`} style={[styles.assignRow, { borderBottomWidth: 1, borderBottomColor: T.hairline }]}>
                          <TouchableOpacity 
                            onPress={() => setDroppedAssignments(prev => ({...prev, [id]: !isDropped}))}
                            style={{ marginRight: 8, padding: 4 }}
                          >
                            {isDropped ? (
                               <LIcon.Plus size={16} color={T.accent} stroke={2.4} />
                            ) : (
                               <LIcon.X size={16} color={T.text3} stroke={2.4} />
                            )}
                          </TouchableOpacity>
                          <View style={styles.assignInfo}>
                            <Text style={[styles.assignName, { color: isDropped ? T.text3 : T.text, textDecorationLine: isDropped ? 'line-through' : 'none' }]} numberOfLines={2}>{a.name}</Text>
                          </View>
                          
                          <View style={{ alignItems: 'flex-end' }}>
                            {a.possible !== undefined ? (
                              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 2}}>
                                <TextInput 
                                  style={[styles.assignScore, { color: isDropped ? T.text3 : (edited ? T.accent : T.text2), padding: 0 }]}
                                  value={currentEarned}
                                  editable={!isDropped}
                                  keyboardType="numeric"
                                  onChangeText={(t) => {
                                     setEditedAssignments(prev => ({...prev, [id]: { score: t, total: currentTotal }}));
                                  }}
                                />
                                <Text style={[styles.assignScore, { color: T.text3 }]}> / </Text>
                                <TextInput 
                                  style={[styles.assignScore, { color: isDropped ? T.text3 : (edited ? T.accent : T.text2), padding: 0 }]}
                                  value={currentTotal}
                                  editable={!isDropped}
                                  keyboardType="numeric"
                                  onChangeText={(t) => {
                                     setEditedAssignments(prev => ({...prev, [id]: { score: currentEarned, total: t }}));
                                  }}
                                />
                              </View>
                            ) : (
                              <Text style={[styles.assignScore, { color: T.text3, marginBottom: 2 }]}>{a.score}</Text>
                            )}
                            <Text style={[styles.assignPct, { color: isDropped ? T.text3 : (edited ? T.accent : ac) }]}>{isDropped ? 'Dropped' : displayPct}</Text>
                          </View>
                        </View>
                      );
                    })}
                    {customForCat.map((ca, j) => (
                      <View key={`custom-${j}`} style={[styles.assignRow, { borderBottomWidth: 1, borderBottomColor: T.hairline }]}>
                        <TouchableOpacity 
                          style={{ marginRight: 8, padding: 4 }}
                          onPress={() => {
                             const newArr = customForCat.filter((_, idx) => idx !== j);
                             setCustomAssignments(prev => ({...prev, [cat.name]: newArr}));
                          }}
                        >
                          <LIcon.X size={16} color={T.bad} stroke={2.4} />
                        </TouchableOpacity>
                        <View style={styles.assignInfo}>
                          <TextInput 
                            style={[styles.assignName, { color: T.text, padding: 0 }]} 
                            value={ca.name}
                            onChangeText={(t) => {
                               const newArr = [...customForCat];
                               newArr[j].name = t;
                               setCustomAssignments(prev => ({...prev, [cat.name]: newArr}));
                            }}
                          />
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 2}}>
                            <TextInput 
                               style={[styles.assignScore, { color: T.text, padding: 0 }]}
                               value={ca.score}
                               keyboardType="numeric"
                               onChangeText={(t) => {
                                 const newArr = [...customForCat];
                                 newArr[j].score = t;
                                 setCustomAssignments(prev => ({...prev, [cat.name]: newArr}));
                               }}
                            />
                            <Text style={[styles.assignScore, { color: T.text3 }]}> / </Text>
                            <TextInput 
                               style={[styles.assignScore, { color: T.text, padding: 0 }]}
                               value={ca.total}
                               keyboardType="numeric"
                               onChangeText={(t) => {
                                 const newArr = [...customForCat];
                                 newArr[j].total = t;
                                 setCustomAssignments(prev => ({...prev, [cat.name]: newArr}));
                               }}
                            />
                          </View>
                          <Text style={[styles.assignPct, { color: T.accent }]}>{(((parseFloat(ca.score)/parseFloat(ca.total))*100) || 0).toFixed(1)}%</Text>
                        </View>
                      </View>
                    ))}
                    <TouchableOpacity 
                      style={{ paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                      onPress={() => {
                        const newArr = [...customForCat, { name: 'New Assignment', score: '10', total: '10' }];
                        setCustomAssignments(prev => ({...prev, [cat.name]: newArr}));
                      }}
                    >
                      <LIcon.Plus size={14} color={T.ink} stroke={2} />
                      <Text style={{ color: T.ink, fontSize: 13, fontWeight: '500' }}>Add What-If</Text>
                    </TouchableOpacity>
                  </View>
              </View>
            );
          })}

          {/* Final Grade Calculator */}
          <Text style={[styles.sectionLabel, { color: T.text2, marginTop: 24 }]}>Final Grade Calculator</Text>
          <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.hairline, padding: 16 }]}>
            <Text style={{ color: T.text, fontSize: 14, marginBottom: 12 }}>Calculate what you need on the final to get your desired grade.</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: T.text3, marginBottom: 4 }}>Target Grade (%)</Text>
                <TextInput
                  style={{ backgroundColor: T.surface3, borderRadius: 8, padding: 10, color: T.text, fontSize: 16 }}
                  keyboardType="numeric"
                  value={finalTarget}
                  onChangeText={setFinalTarget}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: T.text3, marginBottom: 4 }}>Final Total Points</Text>
                <TextInput
                  style={{ backgroundColor: T.surface3, borderRadius: 8, padding: 10, color: T.text, fontSize: 16 }}
                  keyboardType="numeric"
                  value={finalTotal}
                  onChangeText={setFinalTotal}
                />
              </View>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: T.text3, marginBottom: 4 }}>Target Category</Text>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => {
                  if (detail.categories.length === 0) return;
                  const currentIdx = detail.categories.findIndex(c => c.name === (finalCat || detail.categories[0].name));
                  const nextIdx = (currentIdx + 1) % detail.categories.length;
                  setFinalCat(detail.categories[nextIdx].name);
                }}
                style={{ backgroundColor: T.surface3, borderRadius: 8, padding: 10 }}
              >
                <Text style={{ color: T.text, fontSize: 14 }}>{finalCat || (detail.categories[0]?.name ?? 'Select category')}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={{ backgroundColor: T.accent, padding: 12, borderRadius: 8, alignItems: 'center' }}
              onPress={() => {
                const targetGrade = parseFloat(finalTarget);
                const finalPts = parseFloat(finalTotal);
                if (isNaN(targetGrade) || isNaN(finalPts)) {
                  Alert.alert('Invalid Input', 'Please enter valid numbers for Target Grade and Total Points.');
                  return;
                }
                const currentPct = subject.pct;
                const catInfo = detail.categories.find(c => c.name === (finalCat || detail.categories[0]?.name));
                const catWeight = catInfo ? catInfo.weight / 100 : 0.2;
                // Simple estimation formula
                const neededPct = (targetGrade - currentPct * (1 - catWeight)) / catWeight;
                const neededPts = (neededPct / 100) * finalPts;
                
                Alert.alert('Final Score Needed', `To achieve a ${targetGrade}% overall, you need to score approximately ${neededPts.toFixed(1)} / ${finalPts} (${neededPct.toFixed(1)}%) on your final.`);
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Calculate Score Needed</Text>
            </TouchableOpacity>
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
  emptyNote: {
    fontSize: 13,
    paddingVertical: 14,
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    top: -20,
    backgroundColor: '#222',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'none',
  },
  tooltipLine: {
    position: 'absolute',
    top: 0,
    bottom: 24,
    width: 1,
    backgroundColor: '#fff',
    opacity: 0.3,
    zIndex: 9,
    pointerEvents: 'none',
  },
});
