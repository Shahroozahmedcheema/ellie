import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import type { NudgeLevel } from './types';

/**
 * Expo Go ships without the notifications module on Android and throws from
 * the import itself, logging as it goes. Detecting the client up front avoids
 * both the throw and the noise.
 */
const inExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const CHANNEL = 'ellie-nudges';

/**
 * `expo-notifications` throws the moment it is imported on Android in Expo Go,
 * which since SDK 53 ships without it. A top-level import therefore takes down
 * every module that transitively reaches this file — which is all of them, via
 * the store — and the router then fails to find a single route.
 *
 * Loading it on demand keeps that failure contained: where the module is
 * missing, reminders quietly do nothing and the rest of the app runs.
 */
type NotificationsModule = typeof import('expo-notifications');
let cached: NotificationsModule | null | undefined;

function notifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (inExpoGo && Platform.OS === 'android') {
    cached = null;
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}

/** True when reminders can actually be scheduled in this runtime. */
export function nudgesAvailable(): boolean {
  return notifications() !== null;
}

/**
 * How many times a day Ellie speaks up, and when.
 *
 * The times are deliberately unremarkable — mid-morning, mid-afternoon and
 * after dinner — so a nudge lands when someone can act on it rather than while
 * they are asleep.
 */
export const NUDGE_SCHEDULE: Record<
  NudgeLevel,
  { hour: number; minute: number; title: string; body: string }[]
> = {
  1: [
    {
      hour: 21,
      minute: 0,
      title: 'How did today go? 🌙',
      body: 'A minute to log what you spent, then forget about it.',
    },
  ],
  2: [
    {
      hour: 9,
      minute: 30,
      title: 'Morning 🌤',
      body: 'Here is what you have left for today.',
    },
    {
      hour: 21,
      minute: 0,
      title: 'How did today go? 🌙',
      body: 'A minute to log what you spent, then forget about it.',
    },
  ],
  3: [
    {
      hour: 9,
      minute: 30,
      title: 'Morning 🌤',
      body: 'Here is what you have left for today.',
    },
    {
      hour: 14,
      minute: 30,
      title: 'Halfway through 🍩',
      body: 'Anything to log from this morning?',
    },
    {
      hour: 21,
      minute: 0,
      title: 'How did today go? 🌙',
      body: 'A minute to log what you spent, then forget about it.',
    },
  ],
};

export const NUDGE_LEVELS: {
  level: NudgeLevel;
  name: string;
  note: string;
}[] = [
  { level: 1, name: 'Soft 🌱', note: 'Once a day, in the evening' },
  { level: 2, name: 'Medium 🌤', note: 'Twice a day, morning and evening' },
  { level: 3, name: 'Aggressive 🔔', note: 'Three times a day, keep me honest' },
];

/** Presentation rules for a notification that lands while the app is open. */
export function initNotifications(): void {
  const N = notifications();
  if (!N) return;
  try {
    N.setNotificationHandler({
      // SDK 57 replaced `shouldShowAlert` with the banner/list pair.
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Presentation is cosmetic; never let it break startup.
  }
}

/** Asks for permission, creating the Android channel first so the prompt appears. */
export async function requestNudgePermission(): Promise<boolean> {
  const N = notifications();
  if (!N) return false;
  try {
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync(CHANNEL, {
        name: 'Daily nudges',
        importance: N.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F0503C',
      });
    }
    const current = await N.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await N.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return asked.granted;
  } catch {
    return false;
  }
}

/**
 * Replaces every scheduled nudge with the ones this level calls for.
 *
 * Always cancels first: levels change, and leftovers from a previous level
 * would otherwise keep firing forever.
 */
export async function applyNudgeSchedule(
  level: NudgeLevel,
  enabled: boolean,
): Promise<void> {
  const N = notifications();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;

    const granted = await requestNudgePermission();
    if (!granted) return;

    for (const slot of NUDGE_SCHEDULE[level]) {
      await N.scheduleNotificationAsync({
        content: { title: slot.title, body: slot.body },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DAILY,
          hour: slot.hour,
          minute: slot.minute,
          ...(Platform.OS === 'android' ? { channelId: CHANNEL } : null),
        },
      });
    }
  } catch {
    // Notifications are a nicety; never let them break the app.
  }
}
