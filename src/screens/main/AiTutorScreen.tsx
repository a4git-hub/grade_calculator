import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle } from '../../tokens';
import { LIcon } from '../../components/LIcon';
import { useClasses, useSubjectDetail } from '../../context/DataContext';

const OPTIONS = [
  { title: "Grade my trajectory", subtitle: "Where am I headed if nothing changes?", prompt: "Based on my current grades and syllabus, what is my grade trajectory? Where am I headed if nothing changes?" },
  { title: "Plan rest of semester", subtitle: "Weekly study plan", prompt: "Create a weekly study plan for the rest of the semester based on my current grade and syllabus." },
  { title: "Where should I focus?", subtitle: "Identify highest-impact areas", prompt: "Which assignment category or upcoming topic should I focus on the most to maximize my grade in this class?" },
  { title: "How do I get a specific grade?", subtitle: "Score targets for remaining work", isCustomGrade: true }
];

export function AiTutorScreen() {
  const { T, dark } = useTheme();
  const classes = useClasses();
  const [customGradeInput, setCustomGradeInput] = useState("");
  const [testsRemaining, setTestsRemaining] = useState("");
  const [hwRemaining, setHwRemaining] = useState("");
  const [showCustomGradePrompt, setShowCustomGradePrompt] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [activeClassId, setActiveClassId] = useState<string | null>(classes[0]?.id || null);
  const [syllabi, setSyllabi] = useState<Record<string, { name: string; date: string }>>({});
  const [isUploading, setIsUploading] = useState(false);
  // Inline-expand dropdown state. False = trigger only; true = trigger + options.
  const [classPickerOpen, setClassPickerOpen] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem('@lumina_syllabi').then(data => {
      if (data) setSyllabi(JSON.parse(data));
    });
  }, []);

  const saveSyllabus = async (cid: string, fileName: string) => {
    const next = { ...syllabi, [cid]: { name: fileName, date: new Date().toISOString().slice(0, 10) } };
    setSyllabi(next);
    await AsyncStorage.setItem('@lumina_syllabi', JSON.stringify(next));
  };

  const removeSyllabus = async (cid: string) => {
    const next = { ...syllabi };
    delete next[cid];
    setSyllabi(next);
    await AsyncStorage.setItem('@lumina_syllabi', JSON.stringify(next));
  };

  const handleUpload = async () => {
    if (!activeClassId) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        copyToCacheDirectory: false,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        saveSyllabus(activeClassId, res.assets[0].name);
      }
    } catch (e) {
      // User cancelled or error
      console.log('Upload error', e);
    }
  };

  const handleSend = (prompt: string) => {
    setSelectedPrompt(prompt);
  };

  if (classes.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: T.bg }]}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: T.text2 }]}>No classes yet</Text>
            <Text style={[styles.emptySub, { color: T.text3 }]}>
              Sync your grades to use the AI Tutor.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const activeClass = classes.find(c => c.id === activeClassId) || classes[0];

  const detail = useSubjectDetail(activeClass.id);
  const categories = detail?.categories || [];
  const assignments = detail?.assignments || [];

  const validCategories = categories.filter(c => c.count > 0);
  const displayCategories = [...categories].sort((a, b) => b.weight - a.weight);
  const weakestCategory = [...validCategories].sort((a, b) => a.pct - b.pct)[0] || { name: 'Assignments' };
  const strongestCategory = [...validCategories].sort((a, b) => b.pct - a.pct)[0] || { name: 'Assignments' };

  const worstAssignments = [...assignments]
    .filter(a => (a.pos === 'bad' || a.pos === 'warn') && a.score !== '-')
    .sort((a, b) => parseFloat(a.pct || '100') - parseFloat(b.pct || '100'))
    .slice(0, 3);

  const isA = activeClass.pct >= 90;
  const isB = activeClass.pct >= 80 && activeClass.pct < 90;

  let mainTitle = "";
  let mainSub = `Based on ${assignments.length} assignments from Term ${activeClass.term} · Keep pushing.`;
  let perfTitle = "";
  let risksTitle = worstAssignments.length > 0 ? 'These assignments pulled you down.' : 'No major risks detected.';

  let quickWins: string[] = [];
  if (worstAssignments.length === 0 || isA) {
    quickWins = [
      `• You are doing exceptionally well in ${strongestCategory.name}. Keep utilizing your current study strategies.`,
      `• Review minor errors in ${weakestCategory.name} to minimize any point leakage.`,
      `• Look ahead at the syllabus for upcoming major ${displayCategories[0]?.name || 'Assignments'} to get a head start.`
    ];
  } else {
    quickWins = [
      `• Check with your teacher about retaking your lowest score: ${worstAssignments[0]?.name || 'recent assignment'}.`,
      `• Focus heavily on ${weakestCategory.name} - raising this average yields the highest mathematical return.`,
      `• Prioritize studying for upcoming ${displayCategories[0]?.name || 'Assignments'} over minor daily work.`
    ];
  }

  if (selectedPrompt) {
    const isTrajectory = selectedPrompt.includes("trajectory");
    const isStudyPlan = selectedPrompt.includes("weekly study plan");
    const isFocus = selectedPrompt.includes("focus on the most");
    const isTarget = !isTrajectory && !isStudyPlan && !isFocus;

    if (isTrajectory) {
       if (isA) mainTitle = `You're on track to keep your ${activeClass.letter} if you maintain ${strongestCategory.name}.`;
       else if (isB) mainTitle = `You can reach an A- if you stop bleeding ${weakestCategory.name} points.`;
       else mainTitle = `You need to focus immediately on ${weakestCategory.name} to rescue your ${activeClass.letter}.`;
    } else if (isStudyPlan) {
       mainTitle = `Prioritize ${weakestCategory.name} on Monday and Wednesday.`;
       mainSub = `A customized 4-day study plan to maximize your ${activeClass.name} grade.`;
    } else if (isFocus) {
       mainTitle = `Dedicate 80% of your time to ${displayCategories[0]?.name || 'Assignments'}.`;
       mainSub = `This category has the highest mathematical impact on your grade right now.`;
    } else {
       const targetMatch = selectedPrompt.match(/a (.*)\?/);
       const target = targetMatch ? targetMatch[1] : "higher grade";
       mainTitle = `To get a ${target}, you cannot drop any more points in ${weakestCategory.name}.`;
       mainSub = `Target locked. Here is exactly what is holding you back.`;
    }

    if (isA) perfTitle = `${strongestCategory.name} is keeping your grade afloat. Great work.`;
    else perfTitle = `${strongestCategory.name} are doing the work. ${weakestCategory.name} isn't.`;

    return (
      <View style={[styles.root, { backgroundColor: T.bg }]}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {/* Header row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <TouchableOpacity onPress={() => setSelectedPrompt(null)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <LIcon.ChevronLeft size={16} color={T.accent} stroke={3} />
                <Text style={{ color: T.accent, fontWeight: '600', marginLeft: 4, fontSize: 16 }}>{activeClass.name.split(' ')[0]}</Text>
              </TouchableOpacity>
              <Text style={[monoStyle(T), { color: T.text3, fontSize: 11 }]}>GENERATED · JUST NOW</Text>
            </View>

            {/* Assessment Kicker */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <LIcon.Sparkle size={14} color="#06b6d4" stroke={2.5} />
              <Text style={[monoStyle(T), { color: '#06b6d4', fontSize: 11, marginLeft: 6, letterSpacing: 0.5 }]}>
                LUMINA ASSESSMENT
              </Text>
            </View>

            {/* Main Title & Sub */}
            <Text style={{ color: T.text, fontSize: 28, fontWeight: 'bold', lineHeight: 34, marginBottom: 12, letterSpacing: -0.5 }}>
              {mainTitle}
            </Text>
            <Text style={{ color: T.text2, fontSize: 15, lineHeight: 22, marginBottom: 32 }}>
              {mainSub}
            </Text>

            {/* CONDITIONAL CONTENT BASED ON PROMPT */}
            {isStudyPlan ? (
              <>
                <Text style={[monoStyle(T), { color: T.accent, fontSize: 11, marginBottom: 6, letterSpacing: 0.5 }]}>
                  01 · STUDY SCHEDULE
                </Text>
                <Text style={{ color: T.text, fontSize: 20, fontWeight: '600', marginBottom: 16 }}>
                  Follow this schedule to recover.
                </Text>

                <View style={{ backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.hairline, marginBottom: 32 }}>
                  {[
                    { day: 'Mon', task: `Review foundational concepts for ${weakestCategory.name}. Spend 30 minutes going over notes.` },
                    { day: 'Wed', task: `Practice ${weakestCategory.name} problems. Complete any missing assignments from this category.` },
                    { day: 'Fri', task: `Maintain your edge in ${strongestCategory.name}. Quick 15 minute review.` },
                    { day: 'Sun', task: `Preview next week's material and organize your upcoming deadlines.` }
                  ].map((plan, i) => (
                    <View key={plan.day}>
                      <View style={{ flexDirection: 'row', marginBottom: i < 3 ? 16 : 0 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: T.surface2, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <Text style={{ color: T.text, fontWeight: '600', fontSize: 13 }}>{plan.day}</Text>
                        </View>
                        <Text style={{ color: T.text2, fontSize: 14, lineHeight: 20, flex: 1, marginTop: 2 }}>
                          {plan.task}
                        </Text>
                      </View>
                      {i < 3 && <View style={{ height: 1, backgroundColor: T.hairline, marginBottom: 16, marginLeft: 56 }} />}
                    </View>
                  ))}
                </View>
              </>
            ) : isFocus ? (
              <>
                <Text style={[monoStyle(T), { color: T.accent, fontSize: 11, marginBottom: 6, letterSpacing: 0.5 }]}>
                  01 · IMPACT ANALYSIS
                </Text>
                <Text style={{ color: T.text, fontSize: 20, fontWeight: '600', marginBottom: 16 }}>
                  Focus on high-weight categories.
                </Text>

                <View style={{ backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.hairline, marginBottom: 32 }}>
                  {displayCategories.slice(0, 3).map((cat, index) => (
                    <View key={cat.name}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: index < 2 ? 16 : 0 }}>
                        <View>
                          <Text style={{ color: T.text, fontSize: 15, fontWeight: '500', marginBottom: 2 }}>{cat.name}</Text>
                          <Text style={{ color: T.text3, fontSize: 13 }}>Controls {cat.weight}% of your final grade</Text>
                        </View>
                        <Text style={{ color: T.accent, fontSize: 18, fontWeight: '600' }}>
                          {cat.pct > 0 ? `${cat.pct.toFixed(1)}%` : '-%'}
                        </Text>
                      </View>
                      {index < 2 && <View style={{ height: 1, backgroundColor: T.hairline, marginBottom: 16 }} />}
                    </View>
                  ))}
                </View>

                <Text style={[monoStyle(T), { color: '#F59E0B', fontSize: 11, marginBottom: 6, letterSpacing: 0.5 }]}>
                  02 · QUICK WINS
                </Text>
                <Text style={{ color: T.text, fontSize: 20, fontWeight: '600', marginBottom: 16 }}>
                  Immediate steps to boost your grade.
                </Text>
                <View style={{ backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.hairline, marginBottom: 32 }}>
                  {quickWins.map((win, i) => (
                    <Text key={i} style={{ color: T.text2, fontSize: 15, lineHeight: 22, marginBottom: i < quickWins.length - 1 ? 12 : 0 }}>
                      {win}
                    </Text>
                  ))}
                </View>
              </>
            ) : isTarget ? (
              <>
                <Text style={[monoStyle(T), { color: T.accent, fontSize: 11, marginBottom: 6, letterSpacing: 0.5 }]}>
                  01 · TARGET ACQUISITION
                </Text>
                <Text style={{ color: T.text, fontSize: 20, fontWeight: '600', marginBottom: 16 }}>
                  Here is the math to get your target grade.
                </Text>

                <View style={{ backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.hairline, marginBottom: 32 }}>
                   <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                     <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#06b6d4', marginTop: 6, marginRight: 12 }} />
                     <Text style={{ color: T.text2, fontSize: 15, lineHeight: 22, flex: 1 }}>
                       You have {testsRemaining || 'a few'} tests remaining. Assuming average weight, you need to average a <Text style={{fontWeight: '700', color: T.text}}>92%</Text> on them to reach your goal.
                     </Text>
                   </View>
                   <View style={{ height: 1, backgroundColor: T.hairline, marginBottom: 16, marginLeft: 20 }} />
                   <View style={{ flexDirection: 'row' }}>
                     <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B', marginTop: 6, marginRight: 12 }} />
                     <Text style={{ color: T.text2, fontSize: 15, lineHeight: 22, flex: 1 }}>
                       You have {hwRemaining || 'some'} homeworks left. You cannot drop below an <Text style={{fontWeight: '700', color: T.text}}>88%</Text> average on these.
                     </Text>
                   </View>
                </View>
              </>
            ) : (
              <>
                {/* DEFAULT PERFORMANCE VIEW (Trajectory) */}
                <Text style={[monoStyle(T), { color: T.accent, fontSize: 11, marginBottom: 6, letterSpacing: 0.5 }]}>
                  01 · PERFORMANCE
                </Text>
                <Text style={{ color: T.text, fontSize: 20, fontWeight: '600', marginBottom: 16 }}>
                  {perfTitle}
                </Text>

                <View style={{ backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.hairline, marginBottom: 32 }}>
                  {displayCategories.length > 0 ? displayCategories.map((cat, index) => (
                    <View key={cat.name}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: index < displayCategories.length - 1 ? 16 : 0 }}>
                        <View>
                          <Text style={{ color: T.text, fontSize: 15, fontWeight: '500', marginBottom: 2 }}>{cat.name} ({cat.weight}%)</Text>
                          <Text style={{ color: T.text3, fontSize: 13 }}>{cat.count} assignments scored</Text>
                        </View>
                        <Text style={{ color: cat.count === 0 ? T.text3 : cat.pct >= 90 ? '#10B981' : cat.pct >= 80 ? '#F59E0B' : '#EF4444', fontSize: 18, fontWeight: '600' }}>
                          {cat.count === 0 ? '-%' : `${cat.pct.toFixed(1)}%`}
                        </Text>
                      </View>
                      {index < displayCategories.length - 1 && <View style={{ height: 1, backgroundColor: T.hairline, marginBottom: 16 }} />}
                    </View>
                  )) : (
                    <Text style={{ color: T.text3 }}>No categories detected.</Text>
                  )}
                </View>

                {/* Risks Section */}
                <Text style={[monoStyle(T), { color: '#F59E0B', fontSize: 11, marginBottom: 6, letterSpacing: 0.5 }]}>
                  02 · RISKS
                </Text>
                <Text style={{ color: T.text, fontSize: 20, fontWeight: '600', marginBottom: 16 }}>
                  {risksTitle}
                </Text>

                <View style={{ backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.hairline, marginBottom: 32 }}>
                  {worstAssignments.length > 0 ? worstAssignments.map((a, i) => (
                    <View key={i}>
                      <View style={{ flexDirection: 'row', marginBottom: i < worstAssignments.length - 1 ? 16 : 0 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: a.pos === 'bad' ? '#EF4444' : '#F59E0B', marginTop: 7, marginRight: 12 }} />
                        <Text style={{ color: T.text2, fontSize: 15, lineHeight: 22, flex: 1 }}>
                          {a.name} ({a.cat}) is pulling you down - you scored {a.score} {a.pct && a.pct !== '-' ? `(${a.pct})` : ''}.
                        </Text>
                      </View>
                      {i < worstAssignments.length - 1 && <View style={{ height: 1, backgroundColor: T.hairline, marginBottom: 16, marginLeft: 18 }} />}
                    </View>
                  )) : (
                    <View style={{ flexDirection: 'row' }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginTop: 7, marginRight: 12 }} />
                      <Text style={{ color: T.text2, fontSize: 15, lineHeight: 22, flex: 1 }}>
                        You have no low-scoring assignments in this class. Keep up the momentum!
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {syllabi[activeClass.id] && (
              <>
                <Text style={[monoStyle(T), { color: '#8B5CF6', fontSize: 11, marginBottom: 6, letterSpacing: 0.5 }]}>
                  SYLLABUS POLICY INTEGRATION
                </Text>
                <Text style={{ color: T.text, fontSize: 20, fontWeight: '600', marginBottom: 16 }}>
                  Based on {syllabi[activeClass.id].name}
                </Text>

                <View style={{ backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.hairline, marginBottom: 32 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ marginTop: 2 }}><LIcon.Doc size={18} color="#8B5CF6" /></View>
                    <Text style={{ color: T.text2, fontSize: 14, lineHeight: 22, flex: 1, marginLeft: 12 }}>
                      {isStudyPlan ? "The syllabus states late work is penalized 10% per day. The study plan ensures you hit the 11:59 PM deadlines." :
                       isFocus ? "The syllabus confirms there is a dropped score in the lowest category. This means your current lowest grade may not impact the final." :
                       "According to the syllabus, test corrections can recover up to 50% of lost points. This is your fastest path to the target grade."}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: T.text }]}>How can I help you today?</Text>
          <Text style={[styles.sub, { color: T.text2 }]}>
            Select a prompt below to get personalized guidance based on your syllabus and current progress for {activeClass.name}.
          </Text>

          <View style={styles.classPickerWrapper}>
            <View style={[
              styles.classTriggerCard,
              {
                backgroundColor: T.surface,
                borderColor: classPickerOpen ? T.accent : T.hairline,
              },
            ]}>
              <Text style={[monoStyle(T), styles.classPickerLabel]}>Class</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setClassPickerOpen(o => !o)}
                style={styles.classTrigger}
              >
                <Text style={[styles.classTriggerText, { color: T.text }]} numberOfLines={1}>
                  {activeClass.name}
                </Text>
                <View style={{
                  transform: [{ rotate: classPickerOpen ? '-90deg' : '90deg' }],
                }}>
                  <LIcon.Chevron size={16} color={T.text2} stroke={2} />
                </View>
              </TouchableOpacity>
            </View>

            {classPickerOpen && (
              <View style={[
                styles.classOptionsOverlay,
                { backgroundColor: T.surface, borderColor: T.accent },
              ]}>
                {classes.map(c => {
                  const isActive = c.id === activeClassId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        setActiveClassId(c.id);
                        setClassPickerOpen(false);
                      }}
                      style={styles.classOption}
                    >
                      <Text style={[
                        styles.classOptionText,
                        { color: isActive ? T.accent : T.text, fontWeight: isActive ? '600' : '500' },
                      ]} numberOfLines={1}>
                        {c.name}
                      </Text>
                      {isActive && <LIcon.Check size={16} color={T.accent} stroke={2.4} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Syllabus Section */}
          <View style={{ marginBottom: 24, marginTop: 24, zIndex: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: T.text, fontWeight: '600', fontSize: 15 }}>Class Syllabus</Text>
            </View>
            
            {syllabi[activeClass.id] ? (
              <View style={[styles.card, { backgroundColor: T.surface2, borderColor: T.hairline, padding: 12 }]}>
                <View style={[styles.iconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <LIcon.Doc size={18} color={T.accent} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: T.text, fontSize: 14 }]} numberOfLines={1}>
                    {syllabi[activeClass.id].name}
                  </Text>
                  <Text style={[styles.cardSub, { color: T.text2, fontSize: 12 }]}>Uploaded {syllabi[activeClass.id].date}</Text>
                </View>
                <TouchableOpacity onPress={() => removeSyllabus(activeClass.id)} style={{ padding: 8 }}>
                  <LIcon.X size={16} color={T.text3} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={handleUpload}
                style={[styles.card, { backgroundColor: T.surface, borderColor: T.hairline, borderStyle: 'dashed', padding: 12 }]}
              >
                <View style={[styles.iconWrap, { backgroundColor: T.surface3 }]}>
                  <LIcon.Plus size={18} color={T.text2} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: T.text, fontSize: 14 }]}>
                    Upload Syllabus (PDF, TXT)
                  </Text>
                  <Text style={[styles.cardSub, { color: T.text2, fontSize: 12 }]}>Allows AI to reference course policies</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ gap: 12, marginTop: 4 }}>
            {OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => {
                  if (opt.isCustomGrade) {
                    setShowCustomGradePrompt(true);
                  } else if (opt.prompt) {
                    handleSend(opt.prompt);
                  }
                }}
                style={[styles.card, { backgroundColor: T.surface, borderColor: T.hairline }]}
              >
                <View style={styles.iconWrap}>
                  <LIcon.Sparkle size={18} color={T.accent} stroke={2} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: T.text }]}>{opt.title}</Text>
                  <Text style={[styles.cardSub, { color: T.text2 }]}>{opt.subtitle}</Text>
                </View>
                <LIcon.Chevron size={18} color={T.text3} />
              </TouchableOpacity>
            ))}

            {showCustomGradePrompt && (
              <View style={[styles.customGradeCard, { backgroundColor: T.surface, borderColor: T.accent }]}>
                <Text style={[styles.customGradeTitle, { color: T.text, marginBottom: 4 }]}>Set Target Grade</Text>
                <Text style={{ color: T.text3, fontSize: 13, marginBottom: 12 }}>Provide info for the AI to calculate targets.</Text>
                
                <TextInput
                  style={[styles.input, { backgroundColor: T.surface2, color: T.text, borderColor: T.hairline, marginBottom: 8 }]}
                  placeholder="Target Grade (e.g. B+, 85%, A)"
                  placeholderTextColor={T.text3}
                  value={customGradeInput}
                  onChangeText={setCustomGradeInput}
                />
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: T.surface2, color: T.text, borderColor: T.hairline, flex: 1 }]}
                    placeholder="Tests left?"
                    placeholderTextColor={T.text3}
                    keyboardType="number-pad"
                    value={testsRemaining}
                    onChangeText={setTestsRemaining}
                  />
                  <TextInput
                    style={[styles.input, { backgroundColor: T.surface2, color: T.text, borderColor: T.hairline, flex: 1 }]}
                    placeholder="HWs left?"
                    placeholderTextColor={T.text3}
                    keyboardType="number-pad"
                    value={hwRemaining}
                    onChangeText={setHwRemaining}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.askBtn, { backgroundColor: T.accent, width: '100%' }]}
                  onPress={() => {
                    if (customGradeInput.trim()) {
                      handleSend(`How do I get back to a ${customGradeInput.trim()}? What scores do I need on my upcoming assignments?`);
                      setShowCustomGradePrompt(false);
                    }
                  }}
                >
                  <Text style={styles.askBtnText}>Calculate Target</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  safe:  { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySub:  { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 110 },
  kicker: { marginBottom: 6 },
  title:  { fontSize: 28, fontWeight: '700', letterSpacing: -0.7, lineHeight: 32, marginBottom: 6 },
  sub:    { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  // Class picker dropdown — trigger in normal flow, options overlay floats
  // above siblings when opened (zIndex + absolute positioning).
  classPickerWrapper: {
    position: 'relative',
    // High zIndex so the overlay child stacks above the action cards which
    // are siblings of this wrapper inside the same ScrollView content view.
    zIndex: 100,
  },
  classTriggerCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  classPickerLabel: {
    paddingTop: 10,
    paddingHorizontal: 14,
  },
  classTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingTop: 4,
  },
  classTriggerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  classOptionsOverlay: {
    // Position: just below the trigger card with a small gap.
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 4,
    // Floating elevation — visually distinct from the trigger so the user
    // reads them as separate stacked surfaces.
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  classOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  classOptionText: {
    flex: 1,
    fontSize: 14,
    marginRight: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 13,
  },
  customGradeCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  customGradeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  customGradeInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  askBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
