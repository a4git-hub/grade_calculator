import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle } from '../../tokens';
import {
  SPIKE_PORTAL_URL, SPIKE_ORIGIN,
  isLoginUrl, extractIcCookies, fetchStudents,
  type CookieCaptureResult, type FetchStudentsResult,
} from '../../services/icSpike';

type Props = NativeStackScreenProps<RootStackParamList, 'IcSpike'>;
type Phase = 'awaiting-login' | 'logged-in' | 'running' | 'done';

export function IcSpikeScreen({ navigation }: Props) {
  const { T } = useTheme();
  const webRef = useRef<WebView>(null);

  const [phase, setPhase] = useState<Phase>('awaiting-login');
  const [navLog, setNavLog] = useState<string[]>([]);
  const [cookies, setCookies] = useState<CookieCaptureResult | null>(null);
  const [fetched, setFetched] = useState<FetchStudentsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onNav = (e: WebViewNavigation) => {
    // Keep last 10 navigation URLs visible so we can tighten the predicate.
    setNavLog((prev) => [...prev.slice(-9), e.url]);
    // eslint-disable-next-line no-console
    console.log('[IcSpike] nav →', e.url);
    if (phase === 'awaiting-login' && isLoginUrl(e.url)) {
      setPhase('logged-in');
    }
  };

  const runSpike = async () => {
    setPhase('running');
    setError(null);
    try {
      const c = await extractIcCookies(SPIKE_ORIGIN);
      setCookies(c);
      const f = await fetchStudents(c.cookieHeader, SPIKE_ORIGIN);
      setFetched(f);
      setPhase('done');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setPhase('done');
    }
  };

  const passJSession = !!cookies?.hasJSESSIONID;
  const passStatus = !!fetched && fetched.status === 200;
  const passPersonID = !!fetched && fetched.personID != null && fetched.personID !== '';

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={[styles.backText, { color: T.ink }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[monoStyle(T)]} numberOfLines={1}>IC Cookie Spike</Text>
          <View style={{ width: 64 }} />
        </View>

        {/* Phase strip */}
        <View style={[styles.status, { backgroundColor: T.surface, borderColor: T.hairline }]}>
          {phase === 'running'
            ? <ActivityIndicator size="small" color={T.accent} />
            : <View style={[styles.dot, {
                backgroundColor:
                  phase === 'done' ? (passJSession && passStatus && passPersonID ? T.good : T.bad)
                  : phase === 'logged-in' ? T.accent
                  : T.text3,
              }]} />}
          <Text style={[styles.statusText, { color: T.text }]}>
            {phase === 'awaiting-login' && 'Awaiting ClassLink login…'}
            {phase === 'logged-in' && 'Login detected — ready to capture.'}
            {phase === 'running' && 'Capturing cookies & calling IC…'}
            {phase === 'done' && 'Spike complete — see results below.'}
          </Text>
        </View>

        {/* WebView (SSO surface only — no injected JS) */}
        <View style={[styles.webWrap, { borderColor: T.hairline }]}>
          <WebView
            ref={webRef}
            source={{ uri: SPIKE_PORTAL_URL }}
            originWhitelist={['https://*']}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            javaScriptEnabled
            domStorageEnabled
            onNavigationStateChange={onNav}
            startInLoadingState
            renderLoading={() => (
              <View style={[styles.loading, { backgroundColor: T.bg }]}>
                <ActivityIndicator color={T.accent} />
              </View>
            )}
          />
        </View>

        {/* Capture button */}
        <TouchableOpacity
          onPress={runSpike}
          disabled={phase === 'running'}
          activeOpacity={0.85}
          style={[
            styles.button,
            { backgroundColor: phase === 'running' ? T.surface3 : T.accent },
          ]}
        >
          <Text style={[styles.buttonText, { color: phase === 'running' ? T.text3 : '#fff' }]}>
            {phase === 'running'
              ? 'Running…'
              : phase === 'logged-in'
                ? 'Capture cookies & test fetch'
                : 'Force capture (login auto-detect failed)'}
          </Text>
        </TouchableOpacity>

        {/* Result panel */}
        <ScrollView
          style={styles.results}
          contentContainerStyle={{ padding: 14 }}
          showsVerticalScrollIndicator
        >
          {/* Nav log is always visible — diagnostic for predicate mismatches. */}
          <Text style={[styles.sectionLabel, { color: T.text2 }]}>Recent navigation URLs</Text>
          <View style={[styles.codeBlock, { backgroundColor: T.surface, borderColor: T.hairline }]}>
            <Text style={[styles.code, { color: T.text3 }]} selectable>
              {navLog.length ? navLog.join('\n') : '(none yet — sign in via the WebView above)'}
            </Text>
          </View>

          {phase === 'done' && (
            <>
              <ResultRow
                T={T}
                label="1. JSESSIONID captured (HttpOnly readable)"
                pass={passJSession}
                detail={cookies?.cookieNames.length
                  ? `Cookies: ${cookies.cookieNames.join(', ')}`
                  : 'No cookies returned'}
              />
              <ResultRow
                T={T}
                label="2. HTTP 200 from /campus/resources/portal/students"
                pass={passStatus}
                detail={fetched ? `status=${fetched.status}` : '(fetch did not run)'}
              />
              <ResultRow
                T={T}
                label="3. personID parseable from response body"
                pass={passPersonID}
                detail={fetched
                  ? `personID=${String(fetched.personID ?? 'null')}`
                  : '(no body)'}
              />

              {error && (
                <Text style={[styles.errorText, { color: T.bad }]}>
                  Error: {error}
                </Text>
              )}

              <Text style={[styles.sectionLabel, { color: T.text2 }]}>Response body</Text>
              <View style={[styles.codeBlock, { backgroundColor: T.surface, borderColor: T.hairline }]}>
                <Text style={[styles.code, { color: T.text }]} selectable>
                  {fetched
                    ? (fetched.body
                        ? JSON.stringify(fetched.body, null, 2).slice(0, 4000)
                        : (fetched.rawText ?? '(empty)').slice(0, 4000))
                    : '(no fetch result yet)'}
                </Text>
              </View>

            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ResultRow({
  T, label, pass, detail,
}: { T: any; label: string; pass: boolean; detail: string }) {
  return (
    <View style={styles.resultRow}>
      <Text style={[styles.resultMark, { color: pass ? T.good : T.bad }]}>
        {pass ? '✓' : '✗'}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.resultLabel, { color: T.text }]}>{label}</Text>
        <Text style={[styles.resultDetail, { color: T.text3 }]} selectable>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10,
  },
  back:     { width: 64 },
  backText: { fontSize: 15, fontWeight: '500' },
  status: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 18, marginBottom: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1,
  },
  statusText: { flex: 1, fontSize: 13, fontWeight: '500' },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  webWrap: {
    height: 380, marginHorizontal: 18, marginBottom: 10,
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  loading: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  button: {
    marginHorizontal: 18, marginBottom: 10,
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  buttonText: { fontSize: 14, fontWeight: '600' },
  results:    { flex: 1, marginHorizontal: 18 },
  resultRow:  { flexDirection: 'row', gap: 10, marginBottom: 10 },
  resultMark: { fontSize: 18, fontWeight: '700', width: 18 },
  resultLabel:  { fontSize: 13, fontWeight: '600' },
  resultDetail: { fontSize: 11, marginTop: 2, fontVariant: ['tabular-nums'] },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 14, marginBottom: 6 },
  codeBlock:    { borderRadius: 10, borderWidth: 1, padding: 10 },
  code:         { fontSize: 11, fontFamily: 'Menlo', lineHeight: 14 },
  errorText:    { fontSize: 12, marginTop: 4, marginBottom: 4 },
});
