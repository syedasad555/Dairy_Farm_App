import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { orderRepository } from '@/repositories/order.repository';
import { useThemeStore } from '@/stores';
import { LoadingScreen, ScreenHeader, Badge, Divider, InfoRow } from '@/shared/components/ui';
import { formatCurrency, formatDate, formatDateTime } from '@/shared/utils/format';
import { getGoogleMapsNavigationUrl } from '@/shared/utils/geo';
import { ORDER_STATUS_LABELS } from '@/shared/constants';
import type { Order } from '@/shared/types';

const STATUS_STEPS = ['pending', 'assigned', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = ['Order Placed', 'Assigned', 'Out for Delivery', 'Delivered'];

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const dark = useThemeStore((s) => s.dark);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderRepository.getById(orderId!),
    enabled: !!orderId,
  });

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  if (isLoading) return <LoadingScreen />;
  if (!order) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader title="Order Details" onBack={() => router.back()} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: muted }}>Order not found</Text>
      </View>
    </SafeAreaView>
  );

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader
        title={order.orderNumber}
        subtitle={ORDER_STATUS_LABELS[order.status]}
        onBack={() => router.back()}
        gradient
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>

        {/* ─── Status Stepper ─────────────────────────────────────── */}
        {!isCancelled && (
          <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: text }]}>📍 Order Status</Text>
            <View style={styles.stepper}>
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStep;
                const active = i === currentStep;
                return (
                  <View key={step} style={{ alignItems: 'center', flex: 1 }}>
                    <View style={[
                      styles.stepDot,
                      { backgroundColor: done ? '#1E5C0A' : (dark ? '#2D3D22' : '#E8F0E2'), borderColor: active ? '#1E5C0A' : 'transparent' },
                    ]}>
                      {done && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    {i < STATUS_STEPS.length - 1 && (
                      <View style={[styles.stepLine, { backgroundColor: i < currentStep ? '#1E5C0A' : (dark ? '#2D3D22' : '#E8F0E2') }]} />
                    )}
                    <Text style={{ fontSize: 10, color: done ? '#1E5C0A' : muted, fontWeight: done ? '700' : '400', textAlign: 'center', marginTop: 4 }}>
                      {STATUS_LABELS[i]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── Items ──────────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: text }]}>📦 Items</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', color: text }}>{item.productName}</Text>
                <Text style={{ color: muted, fontSize: 12 }}>{item.variantName} × {item.quantity}</Text>
              </View>
              <Text style={{ fontWeight: '700', color: '#1E5C0A' }}>{formatCurrency(item.totalPrice)}</Text>
            </View>
          ))}
          <Divider />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '700', color: text }}>Total</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E5C0A' }}>{formatCurrency(order.totalAmount)}</Text>
          </View>
        </View>

        {/* ─── Delivery Info ───────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: text }]}>🚚 Delivery</Text>
          <InfoRow label="Slot" value={order.slotLabel} icon="⏰" />
          <InfoRow label="Scheduled Date" value={formatDate(order.scheduledDate)} icon="📅" />
          {order.deliveryPartnerName && (
            <InfoRow label="Delivery Partner" value={order.deliveryPartnerName} icon="👤" />
          )}
        </View>

        {/* ─── Address ─────────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={[styles.sectionTitle, { color: text, marginBottom: 0 }]}>📍 Delivery Address</Text>
            {order.address.latitude !== 0 && (
              <TouchableOpacity
                onPress={() => Linking.openURL(getGoogleMapsNavigationUrl(order.address.latitude, order.address.longitude))}
                style={styles.mapsBtn}
              >
                <Ionicons name="map" size={14} color="#1A7BBE" />
                <Text style={{ color: '#1A7BBE', fontWeight: '600', fontSize: 12, marginLeft: 4 }}>Open Maps</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={{ color: text, lineHeight: 22 }}>
            {order.address.houseNumber}, {order.address.street}{'\n'}
            {order.address.village}, {order.address.city}{'\n'}
            {order.address.state} — {order.address.pincode}
          </Text>
        </View>

        {/* ─── Delivery Proof ──────────────────────────────────────── */}
        {order.deliveryProof && (
          <View style={[styles.section, { backgroundColor: cardBg, borderColor: '#16A34A', borderWidth: 1.5 }]}>
            <Text style={[styles.sectionTitle, { color: text }]}>✅ Delivery Confirmed</Text>
            <InfoRow label="Delivered At" value={formatDateTime(order.deliveryProof.deliveredAt)} icon="🕐" />
            {order.deliveryProof.photoUrl && (
              <TouchableOpacity onPress={() => Linking.openURL(order.deliveryProof!.photoUrl)} style={styles.photoBtn}>
                <Ionicons name="image" size={16} color="#1E5C0A" />
                <Text style={{ color: '#1E5C0A', fontWeight: '600', marginLeft: 6 }}>View Delivery Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: { borderRadius: 16, padding: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  stepper: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 8 },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  stepLine: { height: 2, flex: 1, position: 'absolute', top: 11, left: '50%', right: '-50%' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  mapsBtn: { flexDirection: 'row', alignItems: 'center', padding: 6, backgroundColor: '#EBF6FD', borderRadius: 8 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#F0FBE8', borderRadius: 10, marginTop: 8 },
});
