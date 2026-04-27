import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LIcon } from './LIcon';
import { ThemeTokens } from '../tokens';

interface TabConfig {
  route: string;
  label: string;
  icon: keyof typeof LIcon;
  badge?: number;
}

const TABS: TabConfig[] = [
  { route: 'ClassesStack', label: 'Classes',   icon: 'Home' },
  { route: 'Attention',    label: 'Attention', icon: 'Bell', badge: 6 },
  { route: 'WhatIf',       label: 'What-If',   icon: 'Calc' },
  { route: 'Settings',     label: 'Settings',  icon: 'Gear' },
];

interface Props extends BottomTabBarProps {
  T: ThemeTokens;
  dark: boolean;
}

export function CustomTabBar({ state, navigation, T, dark }: Props) {
  const insets = useSafeAreaInsets();
  const IconComp = LIcon;

  return (
    <View style={[styles.wrapper, { bottom: 0 }]}>
      <BlurView
        intensity={Platform.OS === 'android' ? 0 : 85}
        tint={dark ? 'dark' : 'light'}
        style={[styles.blur, { borderTopColor: T.hairline2, backgroundColor: Platform.OS === 'android' ? T.tabBg : undefined }]}
      >
        <View style={[styles.row, { paddingBottom: insets.bottom + 4 }]}>
          {TABS.map((tab, idx) => {
            const focused = state.index === idx;
            const Ic = IconComp[tab.icon];
            if (!Ic) return null;
            return (
              <TouchableOpacity
                key={tab.route}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(tab.route)}
                style={styles.tab}
              >
                <View style={styles.iconWrap}>
                  <Ic size={22} color={focused ? T.accent : T.text3} stroke={focused ? 2 : 1.7} />
                  {tab.badge != null && (
                    <View style={[styles.badge, { backgroundColor: T.bad }]}>
                      <Text style={styles.badgeText}>{tab.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.label, { color: focused ? T.accent : T.text3, fontWeight: focused ? '600' : '500' }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  blur: {
    borderTopWidth: 0.5,
  },
  row: {
    flexDirection: 'row',
    // space-around centers the 4 capped-width tabs across the full row,
    // preventing the leftover-space-on-the-right artifact when tab content
    // is narrower than the screen (phone) while preserving the maxWidth:80
    // tap-target cap that keeps iPad layouts sane.
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  tab: {
    flex: 1,
    maxWidth: 80,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
  },
});
