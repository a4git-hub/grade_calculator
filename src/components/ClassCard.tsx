import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeTokens, gradeColor, monoStyle, Fonts } from '../tokens';
import { ClassItem } from '../types';
import { Sparkline } from './Sparkline';
import { LIcon } from './LIcon';

interface Props {
  item: ClassItem;
  T: ThemeTokens;
  history?: { d: string; v: number }[];
  onPress: () => void;
}

export function ClassCard({ item, T, history, onPress }: Props) {
  const col = gradeColor(T, item.color);
  const trendUp = item.trend > 0;
  const trendFlat = item.trend === 0;
  
  let sparkData = [
    item.pct - 1.4, item.pct - 1.0, item.pct - 0.7,
    item.pct - 0.3, item.pct - 0.1, item.pct,
  ];
  if (history && history.length > 0) {
    sparkData = history.slice(-10).map(h => h.v);
  }
  const pctStr = item.pct % 1 === 0 ? `${item.pct}%` : `${item.pct.toFixed(2)}%`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, { backgroundColor: T.surface, borderColor: T.hairline }]}
    >
      <View style={styles.topRow}>
        <View style={styles.nameCol}>
          <Text style={[monoStyle(T), styles.code]}>{item.code} · Term {item.term}</Text>
          <Text style={[styles.name, { color: T.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.teacher, { color: T.text3 }]}>{item.teacher}</Text>
        </View>
        <View style={styles.gradeCol}>
          <Text style={[styles.gradeLetter, { color: col }]}>{item.letter}</Text>
          <Text style={[styles.gradePct, { color: T.text2 }]}>{pctStr}</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Sparkline data={sparkData} color={col} width={80} height={26} />
        <View style={[styles.trendBadge]}>
          {trendUp ? (
            <LIcon.Trend size={12} color={T.good} stroke={2.2} />
          ) : trendFlat ? (
            <View style={[styles.flatLine, { backgroundColor: T.text3 }]} />
          ) : (
            <LIcon.TrendDown size={12} color={T.bad} stroke={2.2} />
          )}
          <Text style={[
            styles.trendText,
            { color: trendUp ? T.good : trendFlat ? T.text3 : T.bad, fontFamily: Fonts.mono },
          ]}>
            {trendFlat ? '0.0%' : `${trendUp ? '+' : ''}${item.trend.toFixed(1)}%`}
          </Text>
        </View>
        <View style={styles.spacer} />
        {item.flags > 0 && (
          <View style={[styles.flagBadge, { backgroundColor: T.warnSoft }]}>
            <LIcon.Bell size={11} color={T.warn} stroke={2.2} />
            <Text style={[styles.flagText, { color: T.warn }]}>{item.flags}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
  },
  code: {
    marginBottom: 4,
  },
  name: {
    fontSize: 16.5,
    fontWeight: '600',
    lineHeight: 20,
  },
  teacher: {
    fontSize: 12,
    marginTop: 2,
  },
  gradeCol: {
    alignItems: 'flex-end',
  },
  gradeLetter: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.52,
    lineHeight: 26,
  },
  gradePct: {
    fontSize: 12.5,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 11.5,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  flatLine: {
    width: 10,
    height: 1,
  },
  spacer: {
    flex: 1,
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  flagText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
