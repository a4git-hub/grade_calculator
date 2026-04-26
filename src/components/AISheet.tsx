import React from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { LIcon } from './LIcon';
import { ThemeTokens } from '../tokens';

interface Prompt {
  icon: keyof typeof LIcon;
  title: string;
  sub: string;
}

const PROMPTS: Prompt[] = [
  { icon: 'Trend',    title: 'Grade my trajectory',          sub: 'Where am I headed if nothing changes?' },
  { icon: 'Calendar', title: 'Plan rest of semester',        sub: '4 weeks left · weekly study plan' },
  { icon: 'Target',   title: 'What if I miss the next test?', sub: 'Ch 9 Test · Mon — impact preview' },
  { icon: 'ArrowUp',  title: 'How do I get back to a B+?',   sub: 'Score targets for remaining work' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
  T: ThemeTokens;
  className: string;
}

export function AISheet({ visible, onClose, onSelect, T, className }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: T.surface, borderColor: T.hairline2 }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: T.hairline2 }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.kickerRow}>
                <LIcon.Sparkle size={11} color={T.accent} stroke={2.4} />
                <Text style={[styles.kicker, { color: T.accent }]}>Lumina AI · {className}</Text>
              </View>
              <Text style={[styles.sheetTitle, { color: T.text }]}>What should I look at?</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: T.surface3 }]}>
              <LIcon.X size={16} color={T.text2} />
            </TouchableOpacity>
          </View>

          {/* Prompts */}
          <ScrollView style={styles.promptList} showsVerticalScrollIndicator={false}>
            {PROMPTS.map((p, i) => {
              const Ic = LIcon[p.icon];
              if (!Ic) return null;
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  onPress={() => onSelect(p.title)}
                  style={[styles.promptRow, { backgroundColor: T.surface2, borderColor: T.hairline }]}
                >
                  <View style={[styles.promptIcon, { backgroundColor: T.accentSoft }]}>
                    <Ic size={18} color={T.accent} stroke={1.8} />
                  </View>
                  <View style={styles.promptText}>
                    <Text style={[styles.promptTitle, { color: T.text }]}>{p.title}</Text>
                    <Text style={[styles.promptSub, { color: T.text3 }]}>{p.sub}</Text>
                  </View>
                  <LIcon.Chevron size={14} color={T.text3} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Privacy note */}
          <View style={styles.privacyRow}>
            <LIcon.Lock size={12} color={T.text3} />
            <Text style={[styles.privacyText, { color: T.text3 }]}>
              Lumina only answers questions about <Text style={{ fontStyle: 'italic' }}>your</Text> grades and syllabus.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0, left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 6,
  },
  headerLeft: {
    flex: 1,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.66,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptList: {
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  promptIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: {
    flex: 1,
  },
  promptTitle: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  promptSub: {
    fontSize: 12,
    marginTop: 2,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  privacyText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});
