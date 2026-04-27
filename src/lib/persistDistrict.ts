// Persisted district selection. Only the district's display name + portal
// URL are stored — never cookies, never student data, never anything PII.
// The district choice is no different from a user preference (which school
// the student attends), so persisting it is consistent with the in-memory-
// only stance for student data.
//
// Cleared by AsyncStorage's standard removal mechanisms or by clearDistrict()
// below (e.g. when a future "Reset app" feature lands).

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PersistedDistrict {
  name: string;
  portalUrl: string;
}

const KEY = 'lumina:district';

/**
 * Read the persisted district. Returns null when nothing is stored or when
 * the stored value is malformed (defensive — bad data shouldn't crash the
 * app, just trigger first-time onboarding).
 */
export async function loadDistrict(): Promise<PersistedDistrict | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed != null &&
      typeof (parsed as PersistedDistrict).name === 'string' &&
      typeof (parsed as PersistedDistrict).portalUrl === 'string'
    ) {
      return {
        name: (parsed as PersistedDistrict).name,
        portalUrl: (parsed as PersistedDistrict).portalUrl,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveDistrict(d: PersistedDistrict): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(d));
}

export async function clearDistrict(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
