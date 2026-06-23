import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import { deliveryService, orderService } from '@/services';
import { deliveryPartnerRepository } from '@/repositories/deliveryPartner.repository';
import { Card, StatCard, LoadingScreen } from '@/shared/components/ui';

export default function DeliveryDashboardScreen() {
  const profile = useAuthStore((s) => s.profile)!;

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['delivery-stats', profile.id],
    queryFn: () => deliveryService.getPartnerStats(profile.id),
  });

  const { data: partner } = useQuery({
    queryKey: ['delivery-partner', profile.id],
    queryFn: () => deliveryPartnerRepository.getByUserId(profile.id),
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="p-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#2D5016']} />}
      >
        <Text className="text-2xl font-bold text-primary mb-1">Delivery Dashboard</Text>
        <Text className="text-muted mb-4">Welcome, {profile.name}</Text>

        <View className="flex-row flex-wrap gap-3 mb-6">
          <StatCard label="Today's Orders" value={stats?.todayOrders ?? 0} icon="📦" />
          <StatCard label="Pending" value={stats?.pendingOrders ?? 0} icon="⏳" />
          <StatCard label="Completed" value={stats?.completedOrders ?? 0} icon="✅" />
          <StatCard label="Success Rate" value={`${stats?.successRate ?? 0}%`} icon="📊" />
        </View>

        <Card>
          <Text className="font-bold text-lg mb-2">Assigned Area</Text>
          <Text className="text-primary font-semibold">{partner?.assignedAreaName ?? 'Not assigned'}</Text>
          <Text className="text-muted mt-2">Pincodes:</Text>
          <Text className="text-gray-700">{stats?.assignedPincodes?.join(', ') || 'None'}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
