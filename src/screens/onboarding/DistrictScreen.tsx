import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle } from '../../tokens';
import { LIcon } from '../../components/LIcon';
import { DISTRICTS as IC_DISTRICTS } from '../../services/infiniteCampus';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'District'>;

const DISTRICTS = IC_DISTRICTS.map((d, i) => ({ ...d, match: i === 0 }));

function StepDots({ T, step }: { T: any; step: number }) {
  return (
    <View style={styles.dotsRow}>
      {[1, 2, 3].map(i => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: i === step ? 22 : 6,
              backgroundColor: i <= step ? T.accent : T.surface3,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function DistrictScreen({ navigation }: Props) {
  const { T, dark } = useTheme();
  const [query, setQuery] = useState('Westview');

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Step header */}
          <View style={styles.stepHeader}>
            <StepDots T={T} step={2} />
            <Text style={[monoStyle(T)]}>Step 2 / 3</Text>
          </View>

          <Text style={[styles.title, { color: T.text }]}>Find your district</Text>
          <Text style={[styles.sub, { color: T.text2 }]}>
            We'll route you to your school's sign-in. Lumina never sees your password.
          </Text>

          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: T.surface, borderColor: T.hairline }]}>
            <LIcon.Search size={18} color={T.text3} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              style={[styles.searchInput, { color: T.text }]}
              placeholderTextColor={T.text3}
              placeholder="Search district…"
            />
          </View>

          <Text style={[monoStyle(T), styles.matchCount]}>{DISTRICTS.length} matches</Text>

          {/* District list */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {DISTRICTS.map((d, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('SignInWebView', { districtId: d.id })}
                style={[
                  styles.districtRow,
                  {
                    backgroundColor: d.match ? T.accentSoft : T.surface,
                    borderColor: d.match ? T.accent + '55' : T.hairline,
                  },
                ]}
              >
                <View style={[
                  styles.initials,
                  { backgroundColor: d.match ? T.accent + '22' : T.surface3 },
                ]}>
                  <Text style={[styles.initialsText, { color: d.match ? T.accent : T.text2 }]}>
                    {d.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </Text>
                </View>
                <View style={styles.districtInfo}>
                  <Text style={[styles.districtName, { color: T.text }]}>{d.name}</Text>
                  <Text style={[styles.districtSub, { color: T.text3 }]}>{d.sub}</Text>
                </View>
                {d.match ? (
                  <View style={[styles.checkCircle, { backgroundColor: T.accent }]}>
                    <LIcon.Check size={14} color={dark ? '#04181B' : '#fff'} stroke={2.6} />
                  </View>
                ) : (
                  <LIcon.Chevron size={16} color={T.text3} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Security note */}
          <View style={[styles.secNote, { backgroundColor: T.surface, borderColor: T.hairline }]}>
            <LIcon.Lock size={18} color={T.text2} />
            <Text style={[styles.secText, { color: T.text2 }]}>
              Sign-in opens in your district's secure portal. Credentials stay on your device.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              const matched = DISTRICTS.find(d => d.match) ?? DISTRICTS[0];
              navigation.navigate('SignInWebView', { districtId: matched.id });
            }}
            style={[styles.cta, { backgroundColor: T.accent }]}
          >
            <Text style={[styles.ctaText, { color: dark ? '#04181B' : '#fff' }]}>
              Continue with ClassLink
            </Text>
            <LIcon.Arrow size={18} color={dark ? '#04181B' : '#fff'} stroke={2.2} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
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
    marginBottom: 28,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 33,
    marginBottom: 10,
  },
  sub: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 22,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  matchCount: {
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  initials: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontWeight: '600',
    fontSize: 14,
  },
  districtInfo: {
    flex: 1,
  },
  districtName: {
    fontSize: 15,
    fontWeight: '600',
  },
  districtSub: {
    fontSize: 12,
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 18,
    marginBottom: 14,
  },
  secText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
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
