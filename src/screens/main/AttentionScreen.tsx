import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { monoStyle } from '../../tokens';
import { useAttention } from '../../context/DataContext';

export function AttentionScreen() {
  const { T } = useTheme();
  const attention = useAttention();

  const totalItems = attention.reduce((sum, g) => sum + g.items.length, 0);
  const kickerText = attention.length === 0
    ? 'All clear'
    : `${totalItems} item${totalItems !== 1 ? 's' : ''} · across ${attention.length} class${attention.length !== 1 ? 'es' : ''}`;

  return (
    <View style={[styles.root, { backgroundColor: T.bg }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[monoStyle(T), styles.kicker]}>{kickerText}</Text>
          <Text style={[styles.title, { color: T.text }]}>Needs attention</Text>
          <Text style={[styles.sub, { color: T.text2 }]}>
            {attention.length === 0
              ? 'Nothing needs your attention right now.'
              : 'Sorted by impact on your grade — fix the top one first.'}
          </Text>

          {attention.map((group, gi) => {
            const c = group.sev === 'bad' ? T.bad : T.warn;
            return (
              <View key={gi} style={styles.group}>
                {/* Group header */}
                <View style={styles.groupHeader}>
                  <View style={[styles.groupDot, { backgroundColor: c }]} />
                  <Text style={[styles.groupName, { color: T.text2 }]}>{group.name}</Text>
                  <View style={[styles.groupLine, { backgroundColor: T.hairline }]} />
                  <Text style={[monoStyle(T)]}>{group.items.length}</Text>
                </View>

                {/* Items */}
                <View style={styles.itemList}>
                  {group.items.map((it, i) => (
                    <View
                      key={i}
                      style={[
                        styles.itemCard,
                        {
                          backgroundColor: T.surface,
                          borderColor: T.hairline,
                          borderLeftColor: c,
                        },
                      ]}
                    >
                      <View style={styles.itemMain}>
                        <Text style={[monoStyle(T), styles.itemClass]}>{it.class}</Text>
                        <Text style={[styles.itemTitle, { color: T.text }]} numberOfLines={1}>
                          {it.title}
                        </Text>
                        <View style={styles.itemMeta}>
                          <View style={[styles.flagPill, { backgroundColor: c + '22' }]}>
                            <Text style={[styles.flagPillText, { color: c }]}>{group.name}</Text>
                          </View>
                          <Text style={[styles.itemDue, { color: T.text3 }]}>{it.due}</Text>
                        </View>
                      </View>
                      <View style={styles.itemScore}>
                        <Text style={[styles.itemScoreVal, { color: T.text }]}>{it.score}</Text>
                        {it.pct && (
                          <Text style={[styles.itemPct, { color: c }]}>{it.pct}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1 },
  safe:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 110 },
  kicker:  { marginBottom: 6 },
  title:   { fontSize: 30, fontWeight: '700', letterSpacing: -0.75, lineHeight: 33, marginBottom: 6 },
  sub:     { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  group:   { marginBottom: 18 },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
  },
  groupDot:  { width: 6, height: 6, borderRadius: 3 },
  groupName: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  groupLine: { flex: 1, height: 1 },
  itemList:  { gap: 8 },
  itemCard:  {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  itemMain:  { flex: 1, minWidth: 0 },
  itemClass: { marginBottom: 3 },
  itemTitle: { fontSize: 14.5, fontWeight: '600' },
  itemMeta:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  flagPill:  { paddingVertical: 2, paddingHorizontal: 7, borderRadius: 5 },
  flagPillText: { fontSize: 10.5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemDue:   { fontSize: 11 },
  itemScore: { alignItems: 'flex-end' },
  itemScoreVal: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  itemPct:      { fontSize: 11, fontWeight: '600', marginTop: 2, fontVariant: ['tabular-nums'] },
});
