import '../global.css';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Stack, router } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { queryClient } from '@/lib/queryClient';
import { useAuthListener } from '@/shared/hooks/useAuth';
import { useOfflineSync } from '@/shared/hooks/useOfflineSync';
import { useAuthStore, useThemeStore, useNotificationStore } from '@/stores';
import { registerForPushNotifications, savePushToken, getNotificationRoute } from '@/services/pushNotifications';
import '@/lib/i18n';

// ─── Inner Providers (hooks run inside QueryClientProvider) ───────────────
function RootProviders() {
  useAuthListener();
  useOfflineSync();

  const profile = useAuthStore((s) => s.profile);
  const increment = useNotificationStore((s) => s.increment);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // ─── FCM token registration on login ───────────────────────────────
  useEffect(() => {
    if (!profile?.id) return;

    registerForPushNotifications().then((token) => {
      if (token) savePushToken(profile.id, token);
    });
  }, [profile?.id]);

  // ─── Foreground notification handler ───────────────────────────────
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      increment();
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      const type = data?.type ?? '';
      const route = getNotificationRoute(type, data);
      if (route !== '/') {
        router.push(route as never);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [increment]);

  // ─── App state refresh (refetch on foreground) ─────────────────────
  useEffect(() => {
    const handler = (status: AppStateStatus) => {
      if (status === 'active') {
        queryClient.invalidateQueries();
      }
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(delivery)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootProviders />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
