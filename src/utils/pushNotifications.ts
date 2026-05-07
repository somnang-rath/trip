import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationsApi } from '../api/notifications.api';

/**
 * How a notification should appear when received while the app is in the
 * foreground. Without this, expo-notifications drops the alert silently.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let cachedToken: string | null = null;

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'TripSync',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6366f1',
  });
}

async function ensurePermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: asked } = await Notifications.requestPermissionsAsync();
  return asked === 'granted';
}

async function fetchExpoPushToken(): Promise<string | null> {
  // Simulators / web cannot receive Expo push notifications.
  if (!Device.isDevice) return null;

  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  try {
    const result = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return result.data;
  } catch (err) {
    console.warn('[push] failed to obtain Expo push token', err);
    return null;
  }
}

/**
 * Request permission, fetch this device's Expo push token, and register it
 * with the backend so other users' actions can fire pushes here. Safe to
 * call multiple times — duplicates are deduped server-side via $addToSet.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  await ensureAndroidChannel();
  const granted = await ensurePermission();
  if (!granted) return null;

  const token = await fetchExpoPushToken();
  if (!token) return null;

  try {
    await notificationsApi.registerPushToken(token);
    cachedToken = token;
    return token;
  } catch (err) {
    console.warn('[push] failed to register token with backend', err);
    return null;
  }
}

/**
 * Tell the backend to drop this device's token (called on logout) so the
 * just-signed-out user does not keep receiving pushes for the trip groups.
 */
export async function unregisterPushNotifications(): Promise<void> {
  if (!cachedToken) return;
  try {
    await notificationsApi.removePushToken(cachedToken);
  } catch {
    // Network errors during logout are non-fatal — the token will be
    // pruned the first time Expo reports it as unregistered.
  }
  cachedToken = null;
}
