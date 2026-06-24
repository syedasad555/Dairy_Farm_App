import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Linking, Alert, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { OrderMap } from '@/shared/components/OrderMap';
import { useAuthStore, useThemeStore } from '@/stores';
import { orderService } from '@/services';
import { deliveryPartnerRepository } from '@/repositories/deliveryPartner.repository';
import { LoadingScreen, EmptyState, ScreenHeader, Badge } from '@/shared/components/ui';
import { formatCurrency, formatMobile } from '@/shared/utils/format';
import {
  calculateDistanceKm,
  formatDistance,
  getGoogleMapsNavigationUrl,
  isWithinDeliveryRange,
} from '@/shared/utils/geo';
import { ORDER_STATUS_LABELS, DELIVERY_RADIUS_KM } from '@/shared/constants';
import type { Order } from '@/shared/types';

const STATUS_BADGE_COLOR: Record<string, 'primary' | 'blue' | 'success' | 'error' | 'gray' | 'warning'> = {
  pending: 'gray',
  assigned: 'blue',
  out_for_delivery: 'primary',
  delivered: 'success',
  cancelled: 'error',
};

export default function DeliveryOrdersScreen() {
  const profile = useAuthStore((s) => s.profile)!;
  const dark = useThemeStore((s) => s.dark);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: partner } = useQuery({
    queryKey: ['delivery-partner', profile.id],
    queryFn: () => deliveryPartnerRepository.getByUserId(profile.id),
  });

  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['partner-orders', partner?.id],
    queryFn: () => (partner ? orderService.getPartnerOrders(partner.id) : []),
    enabled: !!partner,
  });

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders?.filter(
    (o) => o.scheduledDate === today && o.status !== 'delivered' && o.status !== 'cancelled'
  ) ?? [];

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  if (isLoading) return <LoadingScreen />;

  if (selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        onBack={() => { setSelectedOrder(null); refetch(); }}
        dark={dark}
        bg={bg} cardBg={cardBg} border={border} text={text} muted={muted}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader
        title="Today's Deliveries"
        subtitle={`${todayOrders.length} orders pending`}
        gradient
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#1E5C0A']} tintColor="#1E5C0A" />
        }
        scrollEventThrottle={16}
      >
        {!todayOrders.length ? (
          <EmptyState
            title="No orders for today"
            message="Orders assigned to your pincodes will appear here."
            icon="🚚"
          />
        ) : (
          todayOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              onPress={() => setSelectedOrder(order)}
              style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}
              activeOpacity={0.88}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', fontSize: 15, color: text }}>{order.orderNumber}</Text>
                  <Text style={{ color: muted, fontSize: 13, marginTop: 2 }}>{order.customerName}</Text>
                </View>
                <Badge label={ORDER_STATUS_LABELS[order.status]} color={STATUS_BADGE_COLOR[order.status]} />
              </View>
              <View style={[styles.addrRow, { borderColor: border }]}>
                <Text style={{ color: muted, fontSize: 12, flex: 1 }}>
                  📍 {order.address.village}, {order.address.city} — {order.address.pincode}
                </Text>
                <Text style={{ fontWeight: '700', color: '#1E5C0A', fontSize: 14 }}>
                  {formatCurrency(order.totalAmount)}
                </Text>
              </View>
              <Text style={{ color: muted, fontSize: 11, marginTop: 6 }}>⏰ {order.slotLabel}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Order Detail View ────────────────────────────────────────────────────
function OrderDetailView({
  order,
  onBack,
  dark, bg, cardBg, border, text, muted,
}: {
  order: Order;
  onBack: () => void;
  dark: boolean;
  bg: string; cardBg: string; border: string; text: string; muted: string;
}) {
  const [partnerLocation, setPartnerLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const distance = partnerLocation
    ? calculateDistanceKm(
        partnerLocation.lat,
        partnerLocation.lon,
        order.address.latitude,
        order.address.longitude
      )
    : null;

  const withinRange = distance !== null && distance <= DELIVERY_RADIUS_KM;

  const refreshLocation = async (): Promise<{ lat: number; lon: number } | null> => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is needed for delivery validation.');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const pos = { lat: loc.coords.latitude, lon: loc.coords.longitude };
      setPartnerLocation(pos);
      return pos;
    } finally {
      setLocationLoading(false);
    }
  };

  const callCustomer = () => Linking.openURL(`tel:${order.customerMobile}`);
  const navigate = () =>
    Linking.openURL(getGoogleMapsNavigationUrl(order.address.latitude, order.address.longitude));

  const markOutForDelivery = async () => {
    await orderService.markOutForDelivery(order.id);
    Alert.alert('✅ Updated', 'Marked as out for delivery.');
    onBack();
  };

  const completeDelivery = async () => {
    // ─── STEP 1: Get GPS FIRST (before photo) ─────────────────────
    const loc = await refreshLocation();
    if (!loc) return;

    const dist = calculateDistanceKm(loc.lat, loc.lon, order.address.latitude, order.address.longitude);
    if (dist > DELIVERY_RADIUS_KM) {
      Alert.alert(
        '📍 Too Far Away',
        `You must be within ${DELIVERY_RADIUS_KM} km of the delivery address.\nCurrent distance: ${formatDistance(dist)}`
      );
      return;
    }

    // ─── STEP 2: Capture photo ─────────────────────────────────────
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Required', 'Camera permission is needed for delivery proof.');
      return;
    }

    const photo = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
    if (photo.canceled || !photo.assets[0]) return;

    // ─── STEP 3: Submit proof ──────────────────────────────────────
    setSubmitting(true);
    try {
      await orderService.submitDeliveryProof(
        { orderId: order.id, photoUri: photo.assets[0].uri, latitude: loc.lat, longitude: loc.lon },
        loc.lat,
        loc.lon
      );
      Alert.alert(
        '✅ Delivery Complete!',
        'The customer and admin have been notified.',
        [{ text: 'OK', onPress: onBack }]
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Delivery failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader
        title={order.orderNumber}
        subtitle={ORDER_STATUS_LABELS[order.status]}
        onBack={onBack}
        gradient
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>

        {/* ─── Customer Card ─────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: text }}>{order.customerName}</Text>
          <Text style={{ color: muted, marginTop: 4 }}>📱 {formatMobile(order.customerMobile)}</Text>
          <Text style={{ color: text, marginTop: 8, lineHeight: 20 }}>
            📍 {order.address.houseNumber}, {order.address.street}{'\n'}
            {order.address.village}, {order.address.city} — {order.address.pincode}
          </Text>
          <Text style={{ color: muted, marginTop: 4 }}>⏰ Slot: {order.slotLabel}</Text>
          {distance !== null && (
            <View style={[styles.distBadge, { backgroundColor: withinRange ? '#F0FBE8' : '#FEF2F2' }]}>
              <Text style={{ fontWeight: '700', color: withinRange ? '#1E5C0A' : '#DC2626', fontSize: 14 }}>
                {withinRange ? '✅' : '⚠️'} Distance: {formatDistance(distance)}
                {!withinRange && ` — must be within ${DELIVERY_RADIUS_KM} km`}
              </Text>
            </View>
          )}
        </View>

        {/* ─── Items ─────────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={{ fontWeight: '700', color: text, marginBottom: 8 }}>📦 Items</Text>
          {order.items.map((item, i) => (
            <Text key={i} style={{ color: muted, fontSize: 13, paddingVertical: 2 }}>
              • {item.productName} ({item.variantName}) ×{item.quantity} — {formatCurrency(item.totalPrice)}
            </Text>
          ))}
          <Text style={{ fontWeight: '700', color: '#1E5C0A', marginTop: 8 }}>
            Total: {formatCurrency(order.totalAmount)} · {order.totalQuantity} items
          </Text>
        </View>

        {/* ─── Map ───────────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: border, padding: 4 }]}>
          <OrderMap
            latitude={order.address.latitude}
            longitude={order.address.longitude}
            title={order.customerName}
          />
        </View>

        {/* ─── Action Buttons ────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={callCustomer} style={[styles.actionBtn, { backgroundColor: '#1A7BBE', flex: 1 }]}>
            <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>📞 Call Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={navigate} style={[styles.actionBtn, { backgroundColor: '#7C3912', flex: 1 }]}>
            <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>🗺️ Navigate</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={refreshLocation}
          disabled={locationLoading}
          style={[styles.actionBtn, { backgroundColor: dark ? '#243018' : '#F5F9F2', borderWidth: 1.5, borderColor: '#1E5C0A' }]}
        >
          {locationLoading ? (
            <ActivityIndicator color="#1E5C0A" />
          ) : (
            <Text style={{ color: '#1E5C0A', fontWeight: '700', textAlign: 'center' }}>
              📍 Check My Location {distance !== null ? `(${formatDistance(distance)})` : ''}
            </Text>
          )}
        </TouchableOpacity>

        {order.status === 'assigned' && (
          <TouchableOpacity onPress={markOutForDelivery} style={[styles.actionBtn, { backgroundColor: '#1A7BBE' }]}>
            <Text style={{ color: '#fff', fontWeight: '800', textAlign: 'center', fontSize: 16 }}>
              🚚 Start Delivery
            </Text>
          </TouchableOpacity>
        )}

        {order.status === 'out_for_delivery' && (
          <TouchableOpacity
            onPress={completeDelivery}
            disabled={submitting}
            style={[styles.actionBtn, { backgroundColor: !submitting ? '#1E5C0A' : '#A0B090', marginBottom: 20 }]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '800', textAlign: 'center', fontSize: 16 }}>
                ✅ Complete Delivery (Photo + GPS)
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 14, borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  addrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  section: { borderRadius: 16, padding: 16, borderWidth: 1 },
  distBadge: { marginTop: 10, padding: 10, borderRadius: 10 },
  actionBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
