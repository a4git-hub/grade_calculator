import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList, RootStackParamList } from '../types';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainNavigator } from './MainNavigator';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Compute where the onboarding stack should start based on persisted-district
 * presence + the explicit "change district" trigger. Three cases:
 *
 *   - User tapped "Change district" in Settings → District screen
 *   - User has a previously-selected district (returning user) → SignInWebView
 *   - First-time user with no persisted district → Welcome
 */
function pickOnboardingInitial(
  hasDistrict: boolean,
  forceChangeDistrict: boolean,
): keyof OnboardingStackParamList {
  if (forceChangeDistrict) return 'District';
  if (hasDistrict) return 'SignInWebView';
  return 'Welcome';
}

export function RootNavigator() {
  const { T } = useTheme();
  const { hydrated, district, forceChangeDistrict, inApp } = useData();

  // Wait for AsyncStorage hydration so we don't flash the wrong onboarding
  // initial route on cold launch. This is a single key read — fast.
  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg }}>
        <ActivityIndicator color={T.accent} />
      </View>
    );
  }

  const onboardingInitial = pickOnboardingInitial(district != null, forceChangeDistrict);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {inApp ? (
          // User has completed at least one full sync — show the main app.
          // Sign-out / requestChangeDistrict resets inApp → flips back below.
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          // Onboarding flow. The `key` prop forces a remount when the desired
          // initial route changes (sign-out, change-district), since
          // initialRouteName is only honored on first mount of the navigator.
          <Stack.Screen
            name="Onboarding"
            // eslint-disable-next-line react/no-children-prop
          >
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
