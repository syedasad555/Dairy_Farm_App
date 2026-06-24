import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useThemeStore } from '@/stores';
import { orderService } from '@/services';
import { LoadingScreen, EmptyState, ScreenHeader, Badge } from '@/shared/components/ui';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import type { Order } from '@/shared/types';

const STATUS_CONFIG: Record<string, { label: string; color: 'primary' | 'blue' | 'success' | 'error' | 'gray'; icon: string }> = {
  pending:          { label: 'Pending',        color: 'gray',    icon: '⏳' },
  assigned:         { label: 'Assigned',       color: 'blue',    icon: '✅' },
  out_for_delivery: { label: 'Out for Delivery', color: 'primary', icon: '🚚' },
  delivered:        { label: 'Delivered',      color: 'success', icon: '✅' },
  cancelled:        { label: 'Cancelled',      color: 'error',   icon: '❌' },
};

type Filter = 'all' | 'active' | 'delivered';

export default function OrdersScreen() {
  const dark = useThemeStore((s) => s.dark);
  const profile = useAuthStore((s) => s.profile)!;
  const [filter, setFilter] = useState<Filter>('all');

  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders', profile.id],
    queryFn: () => orderService.getCustomerOrders(profile.id),
  });

  const filtered = (orders ?? []).filter((o) => {
    if (filter === 'active') return ['pending', 'assigned', 'out_for_delivery'].includes(o.status);
    if (filter === 'delivered') return o.status === 'delivered';
    return true;
  });

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader title="My Orders" subtitle={`${orders?.length ?? 0} orders total`} gradient />

      {/* ─── Filter Pills ────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', padding: 16, gap: 10 }}>
        {([
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'delivered', label: 'Delivered' },
        ] as const).map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterPill,
              {
                backgroundColor: filter === f.key ? '#1E5C0A' : 'transparent',
                borderColor: filter === f.key ? '#1E5C0A' : (dark ? '#2D3D22' : '#D1E5C8'),
              },
            ]}
          >
            <Text style={{ color: filter === f.key ? '#fff' : muted, fontWeight: '600', fontSize: 13 }}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 12 }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title={filter === 'all' ? 'No Orders Yet' : `No ${filter} orders`}
            message="Your order history will appear here."
            icon="📦"
            action={() => router.push('/(customer)/home' as never)}
            actionLabel="Start Shopping"
          />
        }
        renderItem={({ item }: { item: Order }) => {
          const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
          return (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(customer)/order-detail', params: { orderId: item.id } } as never)}
              style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
              activeOpacity={0.88}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: text }}>{item.orderNumber}</Text>
                  <Text style={{ color: muted, fontSize: 12, marginTop: 2 }}>
                    {item.slotLabel} · {formatDate(item.scheduledDate)}
                  </Text>
                </View>
                <Badge label={cfg.label} color={cfg.color} />
              </View>

              {/* Items summary */}
              <Text style={{ color: muted, fontSize: 13, marginTop: 8 }}>
                {item.items.slice(0, 2).map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                {item.items.length > 2 && ` +${item.items.length - 2} more`}
              </Text>

              <View style={[styles.cardFooter, { borderTopColor: border }]}>
                <Text style={{ color: muted, fontSize: 12 }}>
                  {item.items.reduce((s, i) => s + i.quantity, 0)} items
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E5C0A' }}>
                  {formatCurrency(item.totalAmount)}
                </Text>
              </View>

              {item.status === 'out_for_delivery' && (
                <View style={styles.trackingBanner}>
                  <Ionicons name="navigate" size={13} color="#1A7BBE" />
                  <Text style={{ color: '#1A7BBE', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
                    Partner is on the way · Tap to track
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filterPill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  card: { borderRadius: 16, padding: 14, borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  trackingBanner: { flexDirection: 'row', alignItems: 'center', marginTop: 8, padding: 8, backgroundColor: '#EBF6FD', borderRadius: 8 },
});
