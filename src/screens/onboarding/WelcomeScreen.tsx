import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle, Fonts } from '../../tokens';
import { LuminaMark } from '../../components/LuminaMark';
import { LIcon } from '../../components/LIcon';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

const FEATURES: Array<{ icon: keyof typeof LIcon; label: string }> = [
  { icon: 'Sync',     label: 'Live sync with Infinite Campus' },
  { icon: 'Calc',     label: 'What-if calculator with real weights' },
  { icon: 'Sparkle',  label: 'Per-class AI plan, on demand' },
];

export function WelcomeScreen({ navigation }: Props) {
  const { T, dark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <LinearGradient
        colors={[dark ? `${T.accent}14` : `${T.accent}10`, 'transparent']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[monoStyle(T), styles.version]}>Lumina · v1.0</Text>

          <View style={styles.hero}>
            <LuminaMark T={T} size={88} />
            <Text style={[styles.headline, { color: T.text }]}>
              Your grades,{'\n'}
              <Text style={{ color: T.accent }}>finally</Text>
              {' '}in focus.
            </Text>
            <Text style={[styles.sub, { color: T.text2 }]}>
              Lumina pulls live grades from Infinite Campus, runs the math your teachers actually
              use, and helps you plan the rest of your semester.
            </Text>
          </View>

          <View style={styles.features}>
            {FEATURES.map((f, i) => {
              const Ic = LIcon[f.icon];
              return (
                <View key={i} style={[styles.featureRow, { backgroundColor: T.surface, borderColor: T.hairline }]}>
                  <View style={[styles.featureIcon, { backgroundColor: T.accentSoft }]}>
                    <Ic size={16} color={T.accent} stroke={1.8} />
                  </View>
                  <Text style={[styles.featureLabel, { color: T.text }]}>{f.label}</Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('District')}
            style={[styles.cta, { backgroundColor: T.accent, shadowColor: T.accent }]}
          >
            <Text style={[styles.ctaText, { color: dark ? '#04181B' : '#fff' }]}>Get started</Text>
            <LIcon.Arrow size={18} color={dark ? '#04181B' : '#fff'} stroke={2.2} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('District')}>
            <Text style={[styles.signIn, { color: T.text3 }]}>
              Already have an account?{' '}
              <Text style={{ color: T.ink, fontWeight: '500' }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 32,
  },
  version: {
    marginTop: 12,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 28,
  },
  headline: {
    fontSize: 42,
    lineHeight: 45,
    fontWeight: '700',
    letterSpacing: -1.26,
    marginTop: 28,
    marginBottom: 16,
  },
  sub: {
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 320,
  },
  features: {
    gap: 10,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  cta: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '600',
  },
  signIn: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 12.5,
  },
});
