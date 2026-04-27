import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle } from '../../tokens';
import { LIcon } from '../../components/LIcon';
import { useData } from '../../context/DataContext';
import { captureIcClient, isPostLoginUrl } from '../../hooks/useIcAuth';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SignInWebView'>;

type Phase = 'awaiting' | 'capturing' | 'error';

export function SignInWebViewScreen({ navigation, route }: Props) {
  const { T, dark } = useTheme();
  // Display name + URL come directly from DistrictScreen's search result.
  // No DISTRICTS lookup table needed — works for any IC tenant nationwide.
  const districtName = route.params.districtName;
  const portalUrl = route.params.portalUrl;
  const webRef = useRef<WebView>(null);
  const { setClient } = useData();
  const captureLockRef = useRef(false); // prevent double capture on multiple rapid nav events

  const [phase, setPhase] = useState<Phase>('awaiting');

  const onNav = async (e: WebViewNavigation) => {
    if (captureLockRef.current) return;
    if (!isPostLoginUrl(e.url)) return;
    captureLockRef.current = true;
    setPhase('capturing');
    try {
      // Origin = scheme + host of the district's portalUrl
      const origin = new URL(portalUrl).origin;
      const client = await captureIcClient(origin);
      setClient(client);
      // Closing the WebView = navigating away. The next screen (FirstSync)
      // will mount and call refresh() against the captured client.
      navigation.replace('FirstSync');
    } catch (err) {
      // Capture failed — most commonly because cookies aren't durable yet
      // (WebKit is still processing a Set-Cookie header from a 302 redirect).
      // Silently reset the lock so the NEXT nav event can retry. The status
      // strip stays on 'capturing' until a subsequent attempt succeeds or
      // the user manually backs out. No Alert — alerts during normal auto-
      // flow are noise; the screen's own status text communicates state.
      captureLockRef.current = false;
      // eslint-disable-next-line no-console
      console.log('[SignInWebView] capture attempt failed, will retry on next nav:', err);
    }
  };

  const progressText: Record<Phase, string> = {
    awaiting:  'Waiting for sign-in…',
    capturing: 'Capturing session…',
    error:     'Capture failed — pull to retry',
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
          <Text style={[monoStyle(T)]} numberOfLines={1}>{districtName}</Text>
          <View style={{ width: 64 }} />
        </View>

        {/* Status strip */}
        <View style={[styles.status, { backgroundColor: T.surface, borderColor: T.hairline }]}>
          {phase === 'error'
            ? <View style={[styles.dot, { backgroundColor: T.good }]} />
            : <ActivityIndicator size="small" color={T.accent} />}
          <Text style={[styles.statusText, { color: T.text }]} numberOfLines={1}>
            {progressText[phase]}
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
            source={{ uri: portalUrl }}
            originWhitelist={['https://*']}
            sharedCookiesEnabled                  // iOS — preserves SSO cookies
            thirdPartyCookiesEnabled              // Android
            javaScriptEnabled
            domStorageEnabled
            incognito={false}
            allowsInlineMediaPlayback
            onNavigationStateChange={onNav}
            startInLoadingState
            renderLoading={() => (
              <View style={[styles.loading, { backgroundColor: T.bg }]}>
                <ActivityIndicator color={T.accent} />
              </View>
            )}
            onError={(e) => {
              setPhase('error');
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
  loading:    { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  note:       { fontSize: 11, textAlign: 'center', paddingHorizontal: 24, paddingBottom: 16 },
});
