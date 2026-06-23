import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores';
import { authService } from '@/services';
import { Card, Button } from '@/shared/components/ui';

export default function DeliveryProfileScreen() {
  const profile = useAuthStore((s) => s.profile)!;
  const setProfile = useAuthStore((s) => s.setProfile);

  const logout = async () => {
    await authService.logout();
    setProfile(null);
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="p-4">
        <Text className="text-2xl font-bold text-primary mb-4">Profile</Text>
        <Card>
          <Text className="text-xl font-bold">{profile.name}</Text>
          <Text className="text-muted">{profile.mobile}</Text>
          <Text className="text-primary mt-2 capitalize">Delivery Partner</Text>
        </Card>
        <Button title="Logout" variant="danger" onPress={logout} className="mt-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
