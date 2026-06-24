import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useThemeStore } from '@/stores';
import { deliveryPartnerRepository } from '@/repositories/deliveryPartner.repository';
import { orderRepository } from '@/repositories/order.repository';
import { LoadingScreen, EmptyState, ScreenHeader, Badge } from '@/shared/components/ui';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import type { Order } from '@/shared/types';

type Filter = 'all' | 'delivered' | 'cancelled';

export default function DeliveryHistoryScreen() {
  const profile = useAuthStore((s) => s.profile)!;
  const dark = useThemeStore((s) => s.dark);
  const [filter, setFilter] = useState<Filter>('all');

  const { data: partner } = useQuery({
    queryKey: ['delivery-partner', profile.id],
    queryFn: () => deliveryPartnerRepository.getByUserId(profile.id),
  });

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['partner-history', partner?.id],
    queryFn: () => (partner ? orderRepository.getByDeliveryPartner(partner.id) : []),
    enabled: !!partner,
    select: (data) => data.filter((o) => o.status === 'delivered' || o.status === 'cancelled'),
  });

  const filtered = (orders ?? []).filter((o) => filter === 'all' || o.status === filter);

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader
        title="Delivery History"
        subtitle={`${filtered.length} orders`}
        gradient
      />

      <View style={{ flexDirection: 'row', padding: 16, gap: 10 }}>
        {(['all', 'delivered', 'cancelled'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterPill,
              { backgroundColor: filter === f ? '#1E5C0A' : 'transparent', borderColor: filter === f ? '#1E5C0A' : (dark ? '#2D3D22' : '#D1E5C8') },
            ]}
          >
            <Text style={{ color: filter === f ? '#fff' : muted, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' }}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 10 }}
        refreshing={false}
        onRefresh={refetch}
        ListEmptyComponent={<EmptyState title="No History" message="Completed deliveries will appear here." icon="📋" />}
        renderItem={({ item }: { item: Order }) => (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', fontSize: 14, color: text }}>{item.orderNumber}</Text>
                <Text style={{ color: muted, fontSize: 13 }}>{item.customerName}</Text>
              </View>
              <Badge label={item.status === 'delivered' ? 'Delivered' : 'Cancelled'} color={item.status === 'delivered' ? 'success' : 'error'} />
            </View>
            <View style={[styles.row, { borderColor: border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: muted, fontSize: 12 }}>
                  📍 {item.address.village}, {item.address.pincode}
                </Text>
                <Text style={{ color: muted, fontSize: 12, marginTop: 2 }}>
                  📅 {formatDate(item.scheduledDate)} · {item.slotLabel}
                </Text>
              </View>
              <Text style={{ fontWeight: '700', color: item.status === 'delivered' ? '#1E5C0A' : '#DC2626', fontSize: 14 }}>
                {formatCurrency(item.totalAmount)}
              </Text>
            </View>
            {item.deliveryProof && (
              <View style={styles.proofBadge}>
                <Ionicons name="camera" size={12} color="#1E5C0A" />
                <Text style={{ color: '#1E5C0A', fontSize: 11, fontWeight: '600', marginLeft: 4 }}>
                  Proof submitted
                </Text>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  proofBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, padding: 6, backgroundColor: '#F0FBE8', borderRadius: 8 },
});
