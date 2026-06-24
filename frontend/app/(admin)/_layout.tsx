import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/stores';

export default function AdminLayout() {
  const profile = useAuthStore((s) => s.profile);

  if (!profile || profile.role !== 'admin') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="approvals" />
      <Stack.Screen name="products" />
      <Stack.Screen name="partners" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="subscriptions" />
      <Stack.Screen name="feedback" />
      <Stack.Screen name="complaints" />
      <Stack.Screen name="analytics" />
    </Stack>
  );
}
