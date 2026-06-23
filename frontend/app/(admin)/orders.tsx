import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { orderRepository } from '@/repositories/order.repository';
import { Card, Badge, LoadingScreen, EmptyState } from '@/shared/components/ui';
import { formatCurrency, formatDateTime } from '@/shared/utils/format';
import { ORDER_STATUS_LABELS } from '@/shared/constants';

export default function AdminOrdersScreen() {
  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => orderRepository.getRecent(100),
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="p-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#2D5016']} />}
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-semibold">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-primary mb-4">All Orders</Text>

        {!orders?.length ? (
          <EmptyState title="No orders" />
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="mb-3">
              <View className="flex-row justify-between">
                <Text className="font-bold">{order.orderNumber}</Text>
                <Badge label={ORDER_STATUS_LABELS[order.status]} />
              </View>
              <Text className="text-gray-700">{order.customerName} — {order.customerMobile}</Text>
              <Text className="text-muted text-sm">{formatDateTime(order.createdAt)}</Text>
              <Text className="text-muted text-sm">Partner: {order.deliveryPartnerName ?? 'Unassigned'}</Text>
              <Text className="text-primary font-bold mt-1">{formatCurrency(order.totalAmount)}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
