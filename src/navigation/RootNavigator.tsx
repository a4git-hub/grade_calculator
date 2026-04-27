import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList, RootStackParamList } from '../types';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainNavigator } from './MainNavigator';
import { DistrictScreen } from '../screens/onboarding/DistrictScreen';
import { PrivacyScreen } from '../screens/main/PrivacyScreen';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Decide where the onboarding flow should start based on whether we have a
 * previously-selected district persisted to disk:
 *
 *   - District present (returning user, or just signed out) → SignInWebView
 *   - No district (first-time user) → Welcome (which leads to District picker)
 *
 * Note: changing district from Settings does NOT route through here anymore
 * — that flow uses the Root-level `ChangeDistrict` modal so the user can
 * cancel without losing their session. See SettingsScreen.tsx + the modal
 * registration below.
 */
function pickOnboardingInitial(
  hasDistrict: boolean,
): keyof OnboardingStackParamList {
  return hasDistrict ? 'SignInWebView' : 'Welcome';
}

export function RootNavigator() {
  const { T } = useTheme();
  const { hydrated, district, inApp } = useData();

  // Wait for AsyncStorage hydration so we don't flash the wrong onboarding
  // initial route on cold launch. This is a single key read — fast.
  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg }}>
        <ActivityIndicator color={T.accent} />
      </View>
    );
  }

  const onboardingInitial = pickOnboardingInitial(district != null);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {inApp ? (
          // User has completed sync — show the main app + the modals that
          // only make sense from inside the app (Change district, Privacy).
          <Stack.Group>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen
              name="ChangeDistrict"
              component={DistrictScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="Privacy"
              component={PrivacyScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </Stack.Group>
        ) : (
          // Onboarding flow. The `key` prop forces a remount when the desired
          // initial route changes (sign-out flips inApp false → also possibly
          // changes district presence). initialRouteName is only honored on
          // first mount of the navigator.
          <Stack.Screen name="Onboarding">
            {() => (
              <OnboardingNavigator
                key={onboardingInitial}
                initialRouteName={onboardingInitial}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
