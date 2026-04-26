import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClassesStackParamList } from '../types';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { SubjectDetailScreen } from '../screens/main/SubjectDetailScreen';
import { AIReportScreen } from '../screens/main/AIReportScreen';

const Stack = createNativeStackNavigator<ClassesStackParamList>();

export function ClassesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Dashboard"     component={DashboardScreen} />
      <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
      <Stack.Screen name="AIReport"      component={AIReportScreen} />
    </Stack.Navigator>
  );
}
