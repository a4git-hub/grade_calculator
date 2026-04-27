import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle } from '../../tokens';
import { LIcon } from '../../components/LIcon';
import { useClasses } from '../../context/DataContext';

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
  const [showCustomGradePrompt, setShowCustomGradePrompt] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [activeClassId, setActiveClassId] = useState<string | null>(classes[0]?.id || null);

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

  const generateMockResponse = (prompt: string) => {
    const className = activeClass.name;
    const grade = activeClass.pct.toFixed(1);
    
    if (prompt.includes("trajectory")) {
      return `Based on your current grade of ${grade}% in ${className}, you are on a steady path. If you maintain your average performance across upcoming assignments, you are projected to finish the semester with a ${activeClass.letter}. To improve this, focus on consistency in your heavily weighted categories.`;
    }
    if (prompt.includes("weekly study plan")) {
      return `Here is a suggested plan for ${className}:\n\n• Monday: Review last week's notes (30 mins)\n• Wednesday: Practice problems / homework (45 mins)\n• Friday: Prepare for any upcoming quizzes (30 mins)\n• Sunday: Preview next week's material (20 mins)`;
    }
    if (prompt.includes("focus on the most")) {
      return `To maximize your grade of ${grade}% in ${className}, you should heavily prioritize the highest-weighted category (e.g., Assessments/Exams). If you have missing assignments, clear those out first as zeros severely drag down your average. Once your missing work is cleared, dedicate 80% of your study time to upcoming major tests.`;
    }
    if (prompt.includes("How do I get back to a")) {
      const match = prompt.match(/a (.*)\?/);
      const target = match ? match[1] : "higher grade";
      return `To achieve a ${target} in ${className}, you need to score consistently above that threshold on all remaining assignments. Since your current grade is ${grade}%, focus primarily on high-weight categories like exams and major projects to pull your average up efficiently. Use the "Final Grade Calculator" in your class view to find the exact score you need on your final!`;
    }
    return `Analyzing your gradebook for ${className}... Your current standing is ${grade}%. Maintain focus on your highest-weighted categories to secure your grade.`;
  };

  if (selectedPrompt) {
    return (
      <View style={[styles.root, { backgroundColor: T.bg }]}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={{ padding: 22 }}>
            <TouchableOpacity onPress={() => setSelectedPrompt(null)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <LIcon.ChevronLeft size={18} color={T.ink} stroke={2.4} />
              <Text style={{ color: T.ink, fontWeight: '600', marginLeft: 4 }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: T.text }]}>AI Tutor</Text>
            <Text style={[styles.sub, { color: T.text2 }]}>Generating response for: "{selectedPrompt}"</Text>
            {/* AI response rendering goes here */}
            <View style={{ padding: 20, backgroundColor: T.surface, borderRadius: 12, marginTop: 20, borderWidth: 1, borderColor: T.hairline }}>
              <LIcon.Sparkle size={20} color={T.accent} stroke={2} />
              <Text style={{ color: T.text, marginTop: 12, lineHeight: 22, fontSize: 15 }}>
                {generateMockResponse(selectedPrompt)}
              </Text>
            </View>
          </View>
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
          {/* Class Selector */}
          <View style={{ marginBottom: 20 }}>
            <Text style={[monoStyle(T), styles.kicker]}>Select Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>
              {classes.map(c => {
                const isActive = c.id === activeClassId;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setActiveClassId(c.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 16,
                      backgroundColor: isActive ? T.accent : T.surface2,
                      borderWidth: 1,
                      borderColor: isActive ? T.accent : T.hairline,
                    }}
                  >
                    <Text style={{ color: isActive ? '#fff' : T.text, fontWeight: isActive ? '600' : '500', fontSize: 13 }}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <Text style={[styles.title, { color: T.text }]}>How can I help you today?</Text>
          <Text style={[styles.sub, { color: T.text2 }]}>
            Select a prompt below to get personalized guidance based on your syllabus and current progress for {activeClass.name}.
          </Text>

          <View style={{ gap: 12 }}>
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
                <Text style={[styles.customGradeTitle, { color: T.text }]}>What grade are you aiming for?</Text>
                <View style={styles.customGradeInputRow}>
                  <TextInput
                    style={[styles.input, { backgroundColor: T.surface2, color: T.text, borderColor: T.hairline }]}
                    placeholder="e.g. B+, 85%, A"
                    placeholderTextColor={T.text3}
                    value={customGradeInput}
                    onChangeText={setCustomGradeInput}
                  />
                  <TouchableOpacity
                    style={[styles.askBtn, { backgroundColor: T.accent }]}
                    onPress={() => {
                      if (customGradeInput.trim()) {
                        handleSend(`How do I get back to a ${customGradeInput.trim()}? What scores do I need on my upcoming assignments?`);
                        setShowCustomGradePrompt(false);
                      }
                    }}
                  >
                    <Text style={styles.askBtnText}>Ask</Text>
                  </TouchableOpacity>
                </View>
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
  sub:    { fontSize: 14, lineHeight: 20, marginBottom: 24 },
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
