import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle } from '../../tokens';
import { LIcon } from '../../components/LIcon';
import {
  DISTRICTS, IC_SCRAPER_JS, ICMessage, parseICPayload,
} from '../../services/infiniteCampus';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SignInWebView'>;

type Phase = 'auth' | 'fetching' | 'parsed' | 'error';

export function SignInWebViewScreen({ navigation, route }: Props) {
  const { T, dark } = useTheme();
  const district = DISTRICTS.find(d => d.id === route.params.districtId) ?? DISTRICTS[0];
  const webRef = useRef<WebView>(null);

  const [phase,    setPhase]   = useState<Phase>('auth');
  const [progress, setProgress] = useState<string>('Waiting for sign-in…');

  const onMessage = (event: WebViewMessageEvent) => {
    let msg: ICMessage;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    switch (msg.type) {
      case 'await-auth':
        setPhase('auth');
        setProgress('Waiting for sign-in…');
        return;
      case 'progress':
        setPhase('fetching');
        setProgress({
          roster:      'Loading course roster…',
          grades:      'Pulling grades & weights…',
          assignments: 'Pulling assignments…',
          history:     'Computing grade history…',
        }[msg.payload.step]);
        return;
      case 'error':
        setPhase('error');
        Alert.alert('Sync error', msg.payload.message);
        return;
      case 'done': {
        setPhase('parsed');
        const parsed = parseICPayload(msg.payload);
        // TODO: persist via AsyncStorage / SecureStore — then advance.
        // For now the parsed payload is dropped and onboarding proceeds with mock data.
        // (Wire this into a DataContext in a follow-up.)
        // eslint-disable-next-line no-console
        console.log('[Lumina] Parsed IC payload:', parsed.classes.length, 'classes');
        navigation.replace('FirstSync');
        return;
      }
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <LIcon.ChevronLeft size={18} color={T.ink} stroke={2.4} />
            <Text style={[styles.backText, { color: T.ink }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[monoStyle(T)]} numberOfLines={1}>{district.name}</Text>
          <View style={{ width: 64 }} />
        </View>

        {/* Status strip */}
        <View style={[styles.status, { backgroundColor: T.surface, borderColor: T.hairline }]}>
          {phase === 'parsed'
            ? <View style={[styles.dot, { backgroundColor: T.good }]} />
            : <ActivityIndicator size="small" color={T.accent} />}
          <Text style={[styles.statusText, { color: T.text }]} numberOfLines={1}>
            {progress}
          </Text>
          <View style={[styles.lockChip, { backgroundColor: T.surface3 }]}>
            <LIcon.Lock size={11} color={T.text2} />
            <Text style={[styles.lockText, { color: T.text2 }]}>secure</Text>
          </View>
        </View>

        {/* WKWebView (iOS) / android.webkit.WebView (Android) */}
        <View style={[styles.webWrap, { borderColor: T.hairline }]}>
          <WebView
            ref={webRef}
            source={{ uri: district.portalUrl }}
            originWhitelist={['https://*']}
            sharedCookiesEnabled                  // iOS — preserves SSO cookies
            thirdPartyCookiesEnabled              // Android
            javaScriptEnabled
            domStorageEnabled
            incognito={false}
            allowsInlineMediaPlayback
            onMessage={onMessage}
            injectedJavaScript={IC_SCRAPER_JS}
            startInLoadingState
            renderLoading={() => (
              <View style={[styles.loading, { backgroundColor: T.bg }]}>
                <ActivityIndicator color={T.accent} />
              </View>
            )}
            onError={(e) => {
              setPhase('error');
              setProgress(`Failed to load: ${e.nativeEvent.description}`);
            }}
          />
        </View>

        <Text style={[styles.note, { color: T.text3 }]}>
          Lumina never sees your password. Credentials stay inside your district&rsquo;s portal.
        </Text>
      </SafeAreaView>
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
  back:     { flexDirection: 'row', alignItems: 'center', gap: 2, width: 64 },
  backText: { fontSize: 15, fontWeight: '500', marginLeft: -2 },
  status: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 18, marginBottom: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1,
  },
  statusText: { flex: 1, fontSize: 13, fontWeight: '500' },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  lockChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 3, paddingHorizontal: 7, borderRadius: 6,
  },
  lockText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  webWrap: {
    flex: 1, marginHorizontal: 18, marginBottom: 10,
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  loading:    { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  note:       { fontSize: 11, textAlign: 'center', paddingHorizontal: 24, paddingBottom: 16 },
});
