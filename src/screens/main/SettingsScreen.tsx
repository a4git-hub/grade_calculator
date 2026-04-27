import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useUser, useData, useDistrict } from '../../context/DataContext';
import { monoStyle, Fonts } from '../../tokens';
import { LIcon } from '../../components/LIcon';
import { timeAgo } from '../../lib/time';

type IconKey = keyof typeof LIcon;

function Toggle({ on, onPress, T }: { on: boolean; onPress: () => void; T: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.toggle, { backgroundColor: on ? T.accent : T.surface3, justifyContent: on ? 'flex-end' : 'flex-start' }]}
    >
      <View style={styles.toggleThumb} />
    </TouchableOpacity>
  );
}

function SettingsRow({
  T, icon, title, sub, right, last, onPress,
}: {
  T: any; icon: IconKey; title: string; sub?: string; right?: React.ReactNode;
  last?: boolean; onPress?: () => void;
}) {
  const Ic = LIcon[icon];
  const Container: any = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { onPress, activeOpacity: 0.6 } : {};
  return (
    <Container
      {...containerProps}
      style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: T.hairline }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: T.surface3 }]}>
        {Ic && <Ic size={16} color={T.text2} />}
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: T.text }]}>{title}</Text>
        {sub ? <Text style={[styles.rowSub, { color: T.text3 }]}>{sub}</Text> : null}
      </View>
      {right}
    </Container>
  );
}

function SettingsGroup({ title, T, children }: { title: string; T: any; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: T.text2 }]}>{title}</Text>
      <View style={[styles.groupCard, { backgroundColor: T.surface, borderColor: T.hairline }]}>
        {children}
      </View>
    </View>
  );
}

export function SettingsScreen() {
  const { T, dark, toggleTheme } = useTheme();
  const user = useUser();
  const district = useDistrict();
  const { syncedAt, signOut, requestChangeDistrict } = useData();

  const densityToggle = (
    <View style={[styles.segControl, { backgroundColor: T.surface3 }]}>
      {(['Cozy', 'Compact'] as const).map((d) => (
        <TouchableOpacity
          key={d}
          style={[styles.seg, d === 'Cozy' && { backgroundColor: T.surface }]}
        >
          <Text style={[styles.segText, { color: d === 'Cozy' ? T.text : T.text3 }]}>{d}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.pageTitle, { color: T.text }]}>Settings</Text>

          {/* Profile card */}
          <View style={[styles.profileCard, { backgroundColor: T.surface, borderColor: T.hairline }]}>
            <LinearGradient
              colors={[T.accent, T.ink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{user?.initials ?? '?'}</Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: T.text }]}>{user?.fullName ?? '—'}</Text>
              <Text style={[styles.profileSub, { color: T.text3 }]}>
                {user?.school ?? '—'} · {user?.gradeLevel ?? '—'}th grade
              </Text>
              <View style={styles.profileMeta}>
                <View style={[styles.syncedBadge, { backgroundColor: T.goodSoft }]}>
                  <Text style={[styles.syncedText, { color: T.good }]}>Synced</Text>
                </View>
                <Text style={[styles.syncedTime, { color: T.text3 }]}>{timeAgo(syncedAt)}</Text>
              </View>
            </View>
            <LIcon.Chevron size={16} color={T.text3} />
          </View>

          {/* Appearance */}
          <SettingsGroup title="Appearance" T={T}>
            <SettingsRow
              T={T} icon="Sparkle" title="Dark mode" sub="Automatic at sunset"
              right={<Toggle on={dark} onPress={toggleTheme} T={T} />}
            />
            <SettingsRow
              T={T} icon="Doc" title="Data density" sub="Cards on dashboard"
              right={densityToggle} last
            />
          </SettingsGroup>

          {/* Account & Sync */}
          <SettingsGroup title="Account & Sync" T={T}>
            <SettingsRow
              T={T} icon="Lock" title="District"
              sub={district?.name ?? 'Not selected'}
              right={<LIcon.Chevron size={14} color={T.text3} />}
              // Tap signs out + flags forceChangeDistrict so RootNavigator
              // sends user back to the District search screen.
              onPress={requestChangeDistrict}
            />
            <SettingsRow T={T} icon="Doc" title="Class syllabi" sub="3 of 6 uploaded"
                         right={<LIcon.Chevron size={14} color={T.text3} />} last />
          </SettingsGroup>

          {/* About */}
          <SettingsGroup title="About" T={T}>
            <SettingsRow T={T} icon="Bell" title="Notifications"
                         right={<Toggle on={true} onPress={() => {}} T={T} />} />
            <SettingsRow T={T} icon="Doc" title="Privacy & data"
                         right={<LIcon.Chevron size={14} color={T.text3} />} />
            <SettingsRow
              T={T} icon="X" title="Sign out"
              right={<Text style={[styles.signOut, { color: T.bad }]}>Sign out</Text>} last
              // signOut clears in-memory session state but PRESERVES the
              // persisted district. Next launch / next render lands on
              // SignInWebView (returning-user path) — no re-pick required.
              onPress={signOut}
            />
          </SettingsGroup>

          <Text style={[monoStyle(T), styles.version]}>Lumina · v1.0 · build 240426</Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1 },
  safe:      { flex: 1 },
  scroll:    { flex: 1 },
  content:   { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 110 },
  pageTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -0.75, marginBottom: 16, marginTop: 6 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 4,
  },
  avatar:     { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  profileInfo:{ flex: 1 },
  profileName: { fontSize: 15, fontWeight: '600' },
  profileSub:  { fontSize: 12, marginTop: 2 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  syncedBadge: { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 5 },
  syncedText:  { fontSize: 10.5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  syncedTime:  { fontSize: 10.5 },
  group:       { marginTop: 20 },
  groupTitle:  {
    fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 8, paddingLeft: 4,
  },
  groupCard:   { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, paddingHorizontal: 16,
  },
  rowIcon:  { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowText:  { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '500' },
  rowSub:   { fontSize: 12, marginTop: 1 },
  toggle:   { width: 44, height: 26, borderRadius: 13, padding: 2, flexDirection: 'row', alignItems: 'center' },
  toggleThumb: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2,
    elevation: 2,
  },
  segControl: { flexDirection: 'row', borderRadius: 8, padding: 2 },
  seg:        { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
  segText:    { fontSize: 12, fontWeight: '600' },
  signOut:    { fontSize: 13, fontWeight: '600' },
  version:    { textAlign: 'center', marginTop: 20 },
});
