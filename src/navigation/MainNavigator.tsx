import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { ClassesStackNavigator } from './ClassesStackNavigator';
import { AttentionScreen } from '../screens/main/AttentionScreen';
import { AiTutorScreen } from '../screens/main/AiTutorScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { CustomTabBar } from '../components/TabBar';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  const { T, dark } = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} T={T} dark={dark} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="ClassesStack" component={ClassesStackNavigator} />
      <Tab.Screen name="Attention"    component={AttentionScreen} />
      <Tab.Screen name="AiTutor"      component={AiTutorScreen} />
      <Tab.Screen name="Settings"     component={SettingsScreen} />
    </Tab.Navigator>
  );
}
