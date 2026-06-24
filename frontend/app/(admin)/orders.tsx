import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderRepository } from '@/repositories/order.repository';
import { deliveryPartnerRepository } from '@/repositories/deliveryPartner.repository';
import { adminService } from '@/services';
import { useThemeStore } from '@/stores';
import { LoadingScreen, EmptyState, ScreenHeader, Badge, Pill } from '@/shared/components/ui';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import type { Order, OrderStatus } from '@/shared/types';

const STATUS_OPTIONS = ['all', 'pending', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'] as const;
type StatusFilter = typeof STATUS_OPTIONS[number];

const STATUS_BADGE: Record<string, { label: string; color: 'primary' | 'blue' | 'success' | 'error' | 'gray' | 'warning' }> = {
  pending:          { label: 'Pending',         color: 'gray' },
  assigned:         { label: 'Assigned',        color: 'blue' },
  out_for_delivery: { label: 'Out for Delivery', color: 'primary' },
  delivered:        { label: 'Delivered',       color: 'success' },
  cancelled:        { label: 'Cancelled',       color: 'error' },
};

export default function AdminOrdersScreen() {
  const dark = useThemeStore((s) => s.dark);
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => orderRepository.getRecent(500),
  });

  const { data: partners } = useQuery({
    queryKey: ['delivery-partners'],
    queryFn: () => deliveryPartnerRepository.getAll(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => orderRepository.updateStatus(id, 'cancelled'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ orderId, partnerId }: { orderId: string; partnerId: string }) =>
      adminService.assignOrderPartner(orderId, partnerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  const handleAssignPartner = (order: Order) => {
    const activePartners = (partners ?? []).filter((p) => p.active);
    if (!activePartners.length) {
      Alert.alert('No Partners', 'Add a delivery partner first.');
      return;
    }
    Alert.alert(
      'Assign Partner',
      `Select partner for ${order.orderNumber}`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...activePartners.map((p) => ({
          text: `${p.name} (${p.assignedAreaName})`,
          onPress: () => assignMutation.mutate({ orderId: order.id, partnerId: p.id }),
        })),
      ]
    );
  };

  const filtered = (orders ?? [])
    .filter((o) => statusFilter === 'all' || o.status === statusFilter)
    .filter((o) =>
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.address.pincode.includes(search) ||
      (o.deliveryPartnerName ?? '').toLowerCase().includes(search.toLowerCase())
    );

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';
  const inputBg = dark ? '#1A2614' : '#FFFFFF';

  if (isLoading) return <LoadingScreen />;

  // Summary counts
  const counts = {
    pending: (orders ?? []).filter((o) => o.status === 'pending').length,
    assigned: (orders ?? []).filter((o) => o.status === 'assigned').length,
    out_for_delivery: (orders ?? []).filter((o) => o.status === 'out_for_delivery').length,
    delivered: (orders ?? []).filter((o) => o.status === 'delivered').length,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader
        title="Order Monitoring"
        subtitle={`${filtered.length} orders`}
        onBack={() => router.back()}
        gradient
      />

      {/* ─── Stats Row ───────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
        {[
          { label: 'Pending', count: counts.pending, color: '#D97706' },
          { label: 'Assigned', count: counts.assigned, color: '#1A7BBE' },
          { label: 'Delivering', count: counts.out_for_delivery, color: '#1E5C0A' },
          { label: 'Done', count: counts.delivered, color: '#16A34A' },
        ].map((s) => (
          <View key={s.label} style={[styles.statChip, { backgroundColor: cardBg, borderColor: border, flex: 1 }]}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: s.color }}>{s.count}</Text>
            <Text style={{ fontSize: 10, color: muted, fontWeight: '600' }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ─── Search ──────────────────────────────────────────────── */}
      <View style={[styles.searchBox, { backgroundColor: inputBg, borderColor: border }]}>
        <Ionicons name="search" size={16} color={muted} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search order, customer, pincode..."
          placeholderTextColor={muted}
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, color: text, fontSize: 14 }}
        />
      </View>

      {/* ─── Status Filter Pills ─────────────────────────────────── */}
      <FlatList
        horizontal
        data={STATUS_OPTIONS as unknown as string[]}
        keyExtractor={(s) => s}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
        style={{ maxHeight: 50 }}
        renderItem={({ item }) => (
          <Pill
            label={item === 'all' ? 'All' : STATUS_BADGE[item]?.label ?? item}
            selected={statusFilter === item}
            onPress={() => setStatusFilter(item as StatusFilter)}
          />
        )}
      />

      {/* ─── Orders List ─────────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 10 }}
        refreshing={false}
        onRefresh={refetch}
        ListEmptyComponent={<EmptyState title="No Orders" message="No orders match your filters." icon="📦" />}
        renderItem={({ item }: { item: Order }) => {
          const cfg = STATUS_BADGE[item.status];
          return (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: text, fontSize: 14 }}>{item.orderNumber}</Text>
                  <Text style={{ color: muted, fontSize: 13 }}>{item.customerName}</Text>
                </View>
                <Badge label={cfg?.label ?? item.status} color={cfg?.color ?? 'gray'} />
              </View>
              <View style={[styles.detailRow, { borderColor: border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="location-outline" size={12} color={muted} />
                  <Text style={{ color: muted, fontSize: 12 }}>{item.address.pincode}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="person-outline" size={12} color={muted} />
                  <Text style={{ color: muted, fontSize: 12 }}>{item.deliveryPartnerName ?? 'Unassigned'}</Text>
                </View>
                <Text style={{ fontWeight: '700', color: '#1E5C0A', fontSize: 14 }}>{formatCurrency(item.totalAmount)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <Text style={{ color: muted, fontSize: 11 }}>{item.slotLabel} · {formatDate(item.scheduledDate)}</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {['pending', 'assigned'].includes(item.status) && (
                    <TouchableOpacity onPress={() => handleAssignPartner(item)}>
                      <Text style={{ color: '#1A7BBE', fontSize: 12, fontWeight: '600' }}>Assign</Text>
                    </TouchableOpacity>
                  )}
                  {['pending', 'assigned'].includes(item.status) && (
                    <TouchableOpacity
                      onPress={() => Alert.alert('Cancel Order', `Cancel ${item.orderNumber}?`, [
                        { text: 'No', style: 'cancel' },
                        { text: 'Cancel Order', style: 'destructive', onPress: () => cancelMutation.mutate(item.id) },
                      ])}
                    >
                      <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statChip: { borderRadius: 12, padding: 10, borderWidth: 1, alignItems: 'center', gap: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 10, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5,
  },
  card: { borderRadius: 14, padding: 14, borderWidth: 1 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, paddingTop: 8, borderTopWidth: 1,
  },
});
