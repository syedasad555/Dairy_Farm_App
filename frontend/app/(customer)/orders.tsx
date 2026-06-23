import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import { orderService } from '@/services';
import { Card, Badge, LoadingScreen, EmptyState } from '@/shared/components/ui';
import { formatCurrency, formatDateTime } from '@/shared/utils/format';
import { ORDER_STATUS_LABELS } from '@/shared/constants';

const statusColors: Record<string, string> = {
  pending: 'warning',
  assigned: 'primary',
  out_for_delivery: 'primary',
  delivered: 'success',
  cancelled: 'error',
};

export default function OrdersScreen() {
  const profile = useAuthStore((s) => s.profile)!;

  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders', profile.id],
    queryFn: () => orderService.getCustomerOrders(profile.id),
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="p-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#2D5016']} />}
      >
        <Text className="text-2xl font-bold text-primary mb-4">My Orders</Text>

        {!orders?.length ? (
          <EmptyState title="No orders yet" message="Your order history will appear here." />
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="mb-3">
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="font-bold text-gray-900">{order.orderNumber}</Text>
                  <Text className="text-muted text-sm">{formatDateTime(order.createdAt)}</Text>
                </View>
                <Badge label={ORDER_STATUS_LABELS[order.status]} color={statusColors[order.status]} />
              </View>
              <Text className="text-sm text-gray-600 mt-2">
                {order.items.map((i) => `${i.productName} (${i.variantName}) x${i.quantity}`).join(', ')}
              </Text>
              <View className="flex-row justify-between mt-3">
                <Text className="text-muted text-sm">Slot: {order.slotLabel}</Text>
                <Text className="font-bold text-primary">{formatCurrency(order.totalAmount)}</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
