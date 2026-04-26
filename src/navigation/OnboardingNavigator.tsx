import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../types';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { DistrictScreen } from '../screens/onboarding/DistrictScreen';
import { SignInWebViewScreen } from '../screens/onboarding/SignInWebViewScreen';
import { FirstSyncScreen } from '../screens/onboarding/FirstSyncScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Welcome"        component={WelcomeScreen} />
      <Stack.Screen name="District"       component={DistrictScreen} />
      <Stack.Screen name="SignInWebView"  component={SignInWebViewScreen} />
      <Stack.Screen name="FirstSync"      component={FirstSyncScreen} />
    </Stack.Navigator>
  );
}
