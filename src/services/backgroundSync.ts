import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureIcClient } from '../hooks/useIcAuth';
import { loadDistrict } from '../lib/persistDistrict';
import { mapGradesToClasses, computeGpa } from './icMapper';

const BACKGROUND_FETCH_TASK = 'BACKGROUND_GRADE_SYNC';

// 1. Define the task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const district = await loadDistrict();
    if (!district) return BackgroundFetch.BackgroundFetchResult.NoData;

    const origin = new URL(district.portalUrl).origin;
    
    // Will throw if cookies are missing/expired
    const client = await captureIcClient(origin);
    
    // Fetch latest grades silently
    const gradesRaw = await client.getGrades();
    const classes = mapGradesToClasses(gradesRaw);
    const newGpa = computeGpa(classes);

    // Load previously seen GPA from storage
    const cachedGpaStr = await AsyncStorage.getItem('@lumina_bg_gpa');
    
    // Save new GPA for next time
    await AsyncStorage.setItem('@lumina_bg_gpa', JSON.stringify(newGpa));

    if (cachedGpaStr) {
      const cachedGpa = JSON.parse(cachedGpaStr);
      
      // If Unweighted GPA changed!
      if (cachedGpa.uw !== newGpa.uw) {
        const direction = newGpa.uw > cachedGpa.uw ? 'went up! 🎉' : 'dropped. ⚠️';
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Infinite Campus Update',
            body: `Your GPA just ${direction} It is now ${newGpa.uw.toFixed(2)}.`,
            sound: true,
          },
          trigger: null, // Fire immediately
        });
        
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('Background fetch failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// 2. Register the task
export async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 60, // 1 hour
    stopOnTerminate: false, // android only
    startOnBoot: true,      // android only
  });
}

export async function unregisterBackgroundFetchAsync() {
  return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}
