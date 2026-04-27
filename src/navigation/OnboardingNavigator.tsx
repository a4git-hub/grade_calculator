import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../types';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { DistrictScreen } from '../screens/onboarding/DistrictScreen';
import { SignInWebViewScreen } from '../screens/onboarding/SignInWebViewScreen';
import { FirstSyncScreen } from '../screens/onboarding/FirstSyncScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

interface Props {
  /**
   * Where the onboarding stack starts. Computed by RootNavigator from
   * persisted-district + forceChangeDistrict state. Note: `initialRouteName`
   * only takes effect at mount time — RootNavigator uses a `key` prop to
   * remount this navigator when the desired initial route changes
   * (e.g. after sign-out or "Change district").
   */
  initialRouteName?: keyof OnboardingStackParamList;
}

export function OnboardingNavigator({ initialRouteName = 'Welcome' }: Props) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Welcome"        component={WelcomeScreen} />
      <Stack.Screen name="District"       component={DistrictScreen} />
      <Stack.Screen name="SignInWebView"  component={SignInWebViewScreen} />
      <Stack.Screen name="FirstSync"      component={FirstSyncScreen} />
    </Stack.Navigator>
  );
}
