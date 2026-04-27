import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { monoStyle } from '../../tokens';
import { LIcon } from '../../components/LIcon';
import { searchDistricts, type IcDistrictResult } from '../../services/icDistrictSearch';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'District'>;

const MIN_QUERY_LEN = 3;
const DEBOUNCE_MS = 300;
const STATE_CODE = 'CA'; // v1: hardcoded; future feature = state picker

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

function initialsForDistrict(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function DistrictScreen({ navigation }: Props) {
  const { T, dark } = useTheme();
  const { setDistrict } = useData();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IcDistrictResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<IcDistrictResult | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track latest query so a slow response from an older query can't overwrite
  // results from a newer query (out-of-order race protection).
  const queryTokenRef = useRef(0);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LEN) {
      setResults([]);
      setError(null);
      setLoading(false);
      setSelected(null);
      return;
    }

    setLoading(true);
    setError(null);
    const myToken = ++queryTokenRef.current;
    timerRef.current = setTimeout(async () => {
      try {
        const r = await searchDistricts(trimmed, STATE_CODE);
        if (queryTokenRef.current !== myToken) return; // a newer query has fired
        setResults(r);
        // If the previously-selected district isn't in the new results, clear it
        setSelected(prev => (prev && r.some(d => d.id === prev.id) ? prev : null));
      } catch (e) {
        if (queryTokenRef.current !== myToken) return;
        setError(e instanceof Error ? e.message : String(e));
        setResults([]);
        setSelected(null);
      } finally {
        if (queryTokenRef.current === myToken) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const trimmed = query.trim();
  const showHint = trimmed.length > 0 && trimmed.length < MIN_QUERY_LEN;
  const showEmpty = !loading && !error && trimmed.length >= MIN_QUERY_LEN && results.length === 0;
  const canContinue = selected != null;

  const goToSignIn = (district: IcDistrictResult) => {
    // Persist + write to DataContext. SignInWebView reads from context, so we
    // don't pass route params. This also clears forceChangeDistrict so the
    // "Change district" flow lands cleanly on SignInWebView next time.
    void setDistrict({
      name: district.district_name,
      portalUrl: district.student_login_url,
    });
    navigation.navigate('SignInWebView');
  };

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
              placeholder="Search by city or district name (3+ characters)"
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
            {loading && <ActivityIndicator size="small" color={T.accent} />}
          </View>

          {/* Status line */}
          <View style={styles.statusRow}>
            {showHint && (
              <Text style={[monoStyle(T), { color: T.text3 }]}>
                Type at least {MIN_QUERY_LEN} characters
              </Text>
            )}
            {!showHint && !error && results.length > 0 && (
              <Text style={[monoStyle(T), styles.matchCount]}>
                {results.length} match{results.length === 1 ? '' : 'es'} in {STATE_CODE}
              </Text>
            )}
            {error && (
              <Text style={[monoStyle(T), { color: T.bad }]} numberOfLines={2}>
                {error}
              </Text>
            )}
          </View>

          {/* District list */}
          <ScrollView
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {showEmpty && (
              <View style={[styles.emptyState, { borderColor: T.hairline }]}>
                <Text style={[styles.emptyTitle, { color: T.text2 }]}>No districts found</Text>
                <Text style={[styles.emptySub, { color: T.text3 }]}>
                  Try a different spelling or part of your school's city name.
                </Text>
              </View>
            )}
            {results.map((d) => {
              const isSelected = selected?.id === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  activeOpacity={0.85}
                  onPress={() => setSelected(d)}
                  style={[
                    styles.districtRow,
                    {
                      backgroundColor: isSelected ? T.accentSoft : T.surface,
                      borderColor: isSelected ? T.accent + '55' : T.hairline,
                    },
                  ]}
                >
                  <View style={[
                    styles.initials,
                    { backgroundColor: isSelected ? T.accent + '22' : T.surface3 },
                  ]}>
                    <Text style={[styles.initialsText, { color: isSelected ? T.accent : T.text2 }]}>
                      {initialsForDistrict(d.district_name)}
                    </Text>
                  </View>
                  <View style={styles.districtInfo}>
                    <Text style={[styles.districtName, { color: T.text }]} numberOfLines={1}>
                      {d.district_name}
                    </Text>
                    <Text style={[styles.districtSub, { color: T.text3 }]} numberOfLines={1}>
                      Campus · {d.state_code}
                    </Text>
                  </View>
                  {isSelected ? (
                    <View style={[styles.checkCircle, { backgroundColor: T.accent }]}>
                      <LIcon.Check size={14} color={dark ? '#04181B' : '#fff'} stroke={2.6} />
                    </View>
                  ) : (
                    <LIcon.Chevron size={16} color={T.text3} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Security note */}
          <View style={[styles.secNote, { backgroundColor: T.surface, borderColor: T.hairline }]}>
            <LIcon.Lock size={18} color={T.text2} />
            <Text style={[styles.secText, { color: T.text2 }]}>
              Sign-in opens in your district's secure portal. Credentials stay on your device.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={canContinue ? 0.85 : 1}
            disabled={!canContinue}
            onPress={() => selected && goToSignIn(selected)}
            style={[
              styles.cta,
              { backgroundColor: canContinue ? T.accent : T.surface2 },
            ]}
          >
            <Text style={[
              styles.ctaText,
              { color: canContinue ? (dark ? '#04181B' : '#fff') : T.text3 },
            ]}>
              {canContinue ? 'Continue with ClassLink' : 'Pick a district to continue'}
            </Text>
            {canContinue && (
              <LIcon.Arrow size={18} color={dark ? '#04181B' : '#fff'} stroke={2.2} />
            )}
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
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  statusRow: {
    minHeight: 18,
    marginBottom: 8,
  },
  matchCount: {
    // monoStyle already provides color/font; just margin spacer below.
  },
  list: {
    flex: 1,
  },
  emptyState: {
    padding: 18,
    paddingVertical: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
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
