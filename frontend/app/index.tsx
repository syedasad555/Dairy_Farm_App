import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores';
import { LoadingScreen } from '@/shared/components/ui';

export default function Index() {
  const { profile, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message="Loading MVR Farms..." />;
  }

  if (!profile) {
    return <Redirect href="/(auth)/login" />;
  }

  switch (profile.role) {
    case 'admin':
      return <Redirect href="/(admin)/dashboard" />;
    case 'delivery_partner':
      return <Redirect href="/(delivery)/dashboard" />;
    case 'customer':
      return <Redirect href="/(customer)/home" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}
