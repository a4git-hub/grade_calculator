import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, PanResponder } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LIcon } from './LIcon';
import { ThemeTokens } from '../tokens';
import { useAttention } from '../context/DataContext';

interface TabConfig {
  route: string;
  label: string;
  icon: keyof typeof LIcon;
  badge?: number;
}

const TABS: TabConfig[] = [
  { route: 'ClassesStack', label: 'Classes',   icon: 'Home' },
  { route: 'Attention',    label: 'Attention', icon: 'Bell' },
  { route: 'AiTutor',      label: 'AI Tutor',  icon: 'Sparkle' },
  { route: 'Settings',     label: 'Settings',  icon: 'Gear' },
];

interface Props extends BottomTabBarProps {
  T: ThemeTokens;
  dark: boolean;
}

export function CustomTabBar({ state, navigation, T, dark }: Props) {
  const insets = useSafeAreaInsets();
  const IconComp = LIcon;
  const attentionGroups = useAttention();
  const totalAttention = attentionGroups.reduce((acc, g) => acc + g.items.length, 0);

  const [tabWidth, setTabWidth] = useState(0);
  const anim = useRef(new Animated.Value(state.index)).current;

  // Track the current actual index so we can compute the drag offset properly
  const currentIndex = useRef(state.index);
  useEffect(() => {
    currentIndex.current = state.index;
    Animated.spring(anim, {
      toValue: state.index,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start();
  }, [state.index]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 10,
      onPanResponderGrant: () => {
        // Stop current spring and set the raw pixel value
        anim.stopAnimation();
        anim.setOffset(currentIndex.current);
        anim.setValue(0);
      },
      onPanResponderMove: (_, gesture) => {
        if (tabWidth > 0) {
          anim.setValue(gesture.dx / tabWidth);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        anim.flattenOffset();
        let newIndex = Math.round((anim as any)._value as number);
        newIndex = Math.max(0, Math.min(newIndex, TABS.length - 1));
        
        Animated.spring(anim, {
          toValue: newIndex,
          useNativeDriver: false,
          friction: 8,
          tension: 60,
        }).start();

        if (newIndex !== currentIndex.current) {
          navigation.navigate(TABS[newIndex].route);
        }
      },
    })
  ).current;

  const translateX = anim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, tabWidth, tabWidth * 2, tabWidth * 3],
  });

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.shadow}>
        <BlurView
          intensity={Platform.OS === 'android' ? 0 : 80}
          tint={dark ? 'dark' : 'light'}
          style={[styles.blur, { 
            backgroundColor: Platform.OS === 'android' ? T.tabBg : (dark ? 'rgba(30,30,30,0.65)' : 'rgba(255,255,255,0.7)'),
            borderColor: T.hairline2,
          }]}
        >
          <View style={styles.row} onLayout={(e) => setTabWidth(e.nativeEvent.layout.width / TABS.length)} {...panResponder.panHandlers}>
            {tabWidth > 0 && (
              <Animated.View style={[StyleSheet.absoluteFill, { width: tabWidth, transform: [{ translateX }] }]}>
                 <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={[styles.activePill, { backgroundColor: T.accent + '25' }]} />
                 </View>
              </Animated.View>
            )}
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
                    <Ic size={24} color={focused ? T.accent : T.text3} stroke={focused ? 2.5 : 2} />
                    {tab.route === 'Attention' && totalAttention > 0 && (
                      <View style={[styles.badge, { backgroundColor: T.bad }]}>
                        <Text style={styles.badgeText}>{totalAttention}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    width: '100%',
    maxWidth: 400, // keep it sane on iPad
  },
  blur: {
    borderWidth: 0.5,
    borderRadius: 40,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    width: 56,
    height: 38,
    borderRadius: 20,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
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
});
