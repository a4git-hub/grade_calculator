import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { OnboardingStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle, Fonts } from '../../tokens';
import { LIcon } from '../../components/LIcon';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'FirstSync'>;

const SYNC_ITEMS = [
  { label: 'Authenticated as Aditya Krishnan', done: true  },
  { label: 'Loaded course roster · 6 classes', done: true  },
  { label: 'Pulling assignments & weights',    done: true  },
  { label: 'Computing grade history',          done: false, active: true },
  { label: 'Indexing for AI assessments',      done: false },
];

const PROGRESS = 0.62;
const RADIUS   = 70;
const CIRC     = 2 * Math.PI * RADIUS;

function StepDots({ T }: { T: any }) {
  return (
    <View style={styles.dotsRow}>
      {[1, 2, 3].map(i => (
        <View key={i} style={[styles.dot, { width: i === 3 ? 22 : 6, backgroundColor: T.accent }]} />
      ))}
    </View>
  );
}

export function FirstSyncScreen({ navigation }: Props) {
  const { T, dark } = useTheme();
  const pulseScale   = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale,   { toValue: 1.5, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseScale,   { toValue: 1,   duration: 600, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 1,   duration: 600, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <LinearGradient
        colors={[dark ? `${T.accent}1f` : `${T.accent}10`, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.18 }}
        end={{ x: 0.5, y: 0.7 }}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Step header */}
          <View style={styles.stepHeader}>
            <StepDots T={T} />
            <Text style={[monoStyle(T)]}>Step 3 / 3</Text>
          </View>

          {/* Progress ring */}
          <View style={styles.ringWrap}>
            <Svg width={160} height={160} viewBox="0 0 160 160"
                 style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={80} cy={80} r={RADIUS} stroke={T.surface2} strokeWidth={6} fill="none" />
              <Circle
                cx={80} cy={80} r={RADIUS}
                stroke={T.accent} strokeWidth={6} fill="none"
                strokeLinecap="round"
                strokeDasharray={`${PROGRESS * CIRC} ${CIRC}`}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={[styles.ringPct, { color: T.text }]}>
                62<Text style={[styles.ringSign, { color: T.text2 }]}>%</Text>
              </Text>
              <Text style={[monoStyle(T), styles.syncLabel]}>Syncing</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: T.text }]}>Tidying up your data</Text>
          <Text style={[styles.sub, { color: T.text2 }]}>This usually takes about 8 seconds.</Text>

          {/* Sync items */}
          <View style={[styles.itemsCard, { backgroundColor: T.surface, borderColor: T.hairline }]}>
            {SYNC_ITEMS.map((it, i) => (
              <View
                key={i}
                style={[
                  styles.syncItem,
                  i < SYNC_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.hairline },
                ]}
              >
                <View style={[
                  styles.syncIcon,
                  {
                    borderWidth: it.done ? 0 : 1.5,
                    borderColor: it.active ? T.accent : T.hairline2,
                    backgroundColor: it.done ? T.good : 'transparent',
                  },
                ]}>
                  {it.done && <LIcon.Check size={12} color="#fff" stroke={3} />}
                  {it.active && (
                    <Animated.View style={[
                      styles.pulseDot,
                      { backgroundColor: T.accent, transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                    ]} />
                  )}
                </View>
                <Text style={[
                  styles.syncText,
                  {
                    color: it.done ? T.text2 : it.active ? T.text : T.text3,
                    fontWeight: it.active ? '500' : '400',
                  },
                ]}>
                  {it.label}
                </Text>
              </View>
            ))}
          </View>

          <Text style={[monoStyle(T), styles.encNote]}>End-to-end encrypted · stays on device</Text>

          {/* In real app, auto-navigates on sync complete */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              // Navigate to root Main screen — replaces full onboarding stack
              navigation.getParent<any>()?.reset({ index: 0, routes: [{ name: 'Main' }] });
            }}
            style={[styles.cta, { backgroundColor: T.accent }]}
          >
            <Text style={[styles.ctaText, { color: dark ? '#04181B' : '#fff' }]}>Continue to Lumina</Text>
            <LIcon.Arrow size={18} color={dark ? '#04181B' : '#fff'} stroke={2.2} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1 },
  safe:    { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 32,
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:     { height: 6, borderRadius: 3 },
  ringWrap: {
    alignSelf: 'center',
    width: 160,
    height: 160,
    marginTop: 4,
    marginBottom: 32,
  },
  ringCenter: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ringPct: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -0.76,
    lineHeight: 40,
    fontVariant: ['tabular-nums'],
  },
  ringSign: {
    fontSize: 18,
  },
  syncLabel: {
    marginTop: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.52,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 30,
  },
  sub: {
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  itemsCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  syncItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  syncIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncText: {
    fontSize: 14,
    flex: 1,
  },
  encNote: {
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  cta: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
