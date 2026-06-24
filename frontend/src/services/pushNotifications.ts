/**
 * Push Notification Service — MVR Farms
 * Uses Firebase SDK only. No axios / REST API.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authRepository } from '@/repositories/auth.repository';

// ─── Foreground handler ────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Register & get push token ─────────────────────────────────────────────
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[FCM] Skipping on simulator/emulator');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[FCM] Notification permissions denied');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('mvr-default', {
      name: 'MVR Farms',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2D7A1A',
    });
    await Notifications.setNotificationChannelAsync('mvr-orders', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
    });
    await Notifications.setNotificationChannelAsync('mvr-delivery', {
      name: 'Delivery Alerts',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return tokenData.data;
  } catch (err) {
    console.log('[FCM] Could not get push token:', err);
    return null;
  }
}

// ─── Save token to Firestore via repository ────────────────────────────────
export async function savePushToken(uid: string, token: string | null): Promise<void> {
  if (!token || !uid) return;
  try {
    await authRepository.updateFcmToken(uid, token);
    console.log('[FCM] Token saved to Firestore');
  } catch (err) {
    console.error('[FCM] Failed to save token:', err);
  }
}

// ─── Helper: map notification type to route ────────────────────────────────
export function getNotificationRoute(type: string, data?: Record<string, string>): string {
  switch (type) {
    case 'order_created':
    case 'delivered':
    case 'out_for_delivery':
      return '/(customer)/orders';
    case 'account_approved':
      return '/(customer)/home';
    case 'monthly_bill':
      return '/(customer)/billing';
    case 'complaint_raised':
      return '/(admin)/complaints';
    case 'registration_pending':
      return '/(admin)/approvals';
    case 'monthly_report':
      return '/(admin)/dashboard';
    default:
      return '/';
  }
}
