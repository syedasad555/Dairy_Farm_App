import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
import { OrderMap } from '@/shared/components/OrderMap';
import { useAuthStore } from '@/stores';
import { orderService } from '@/services';
import { deliveryPartnerRepository } from '@/repositories/deliveryPartner.repository';
import { Card, Badge, Button, LoadingScreen, EmptyState } from '@/shared/components/ui';
import { formatCurrency, formatMobile } from '@/shared/utils/format';
import { calculateDistanceKm, formatDistance, getGoogleMapsNavigationUrl } from '@/shared/utils/geo';
import { ORDER_STATUS_LABELS } from '@/shared/constants';
import type { Order } from '@/shared/types';

export default function DeliveryOrdersScreen() {
  const profile = useAuthStore((s) => s.profile)!;
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
  const todayOrders = orders?.filter((o) => o.scheduledDate === today && o.status !== 'delivered' && o.status !== 'cancelled');

  if (isLoading) return <LoadingScreen />;

  if (selectedOrder) {
    return (
      <OrderDetailScreen order={selectedOrder} onBack={() => setSelectedOrder(null)} partnerId={partner!.id} />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="p-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#2D5016']} />}
      >
        <Text className="text-2xl font-bold text-primary mb-4">Today's Orders</Text>

        {!todayOrders?.length ? (
          <EmptyState title="No orders today" message="Orders assigned to your pincodes will appear here." />
        ) : (
          todayOrders.map((order) => (
            <TouchableOpacity key={order.id} onPress={() => setSelectedOrder(order)}>
              <Card className="mb-3">
                <View className="flex-row justify-between">
                  <Text className="font-bold">{order.orderNumber}</Text>
                  <Badge label={ORDER_STATUS_LABELS[order.status]} />
                </View>
                <Text className="text-gray-700 mt-1">{order.customerName}</Text>
                <Text className="text-muted text-sm">{order.address.village}, {order.address.pincode}</Text>
                <Text className="text-primary font-bold mt-2">{formatCurrency(order.totalAmount)}</Text>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OrderDetailScreen({
  order,
  onBack,
  partnerId,
}: {
  order: Order;
  onBack: () => void;
  partnerId: string;
}) {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const distance = location
    ? calculateDistanceKm(location.lat, location.lon, order.address.latitude, order.address.longitude)
    : null;

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Location access is required for delivery.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
  };

  const callCustomer = () => Linking.openURL(`tel:${order.customerMobile}`);
  const navigate = () => Linking.openURL(getGoogleMapsNavigationUrl(order.address.latitude, order.address.longitude));

  const markOutForDelivery = async () => {
    await orderService.markOutForDelivery(order.id);
    Alert.alert('Updated', 'Order marked as out for delivery.');
  };

  const completeDelivery = async () => {
    await getLocation();
    if (!location) {
      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera required', 'Please allow camera access for delivery proof.');
        return;
      }

      const photo = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (photo.canceled || !photo.assets[0]) return;

      setSubmitting(true);
      try {
        await orderService.submitDeliveryProof(
          { orderId: order.id, photoUri: photo.assets[0].uri, latitude: lat, longitude: lon },
          lat,
          lon
        );
        Alert.alert('Delivered!', 'Delivery completed successfully.');
        onBack();
      } catch (err) {
        Alert.alert('Cannot Complete', err instanceof Error ? err.message : 'Delivery failed');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="p-4">
        <TouchableOpacity onPress={onBack} className="mb-4">
          <Text className="text-primary font-semibold">← Back</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-primary mb-4">{order.orderNumber}</Text>

        <Card className="mb-3">
          <Text className="font-bold text-lg">{order.customerName}</Text>
          <Text className="text-muted">{formatMobile(order.customerMobile)}</Text>
          <Text className="text-gray-700 mt-2">
            {order.address.houseNumber}, {order.address.street}
          </Text>
          <Text className="text-gray-700">
            {order.address.village}, {order.address.city} - {order.address.pincode}
          </Text>
          <Text className="text-muted mt-2">Slot: {order.slotLabel}</Text>
          {distance !== null && (
            <Text className="text-primary font-semibold mt-1">Distance: {formatDistance(distance)}</Text>
          )}
        </Card>

        <Card className="mb-3">
          <Text className="font-bold mb-2">Products</Text>
          {order.items.map((item, i) => (
            <Text key={i} className="text-gray-700">
              {item.productName} ({item.variantName}) x{item.quantity} — {formatCurrency(item.totalPrice)}
            </Text>
          ))}
          <Text className="font-bold text-primary mt-2">Total Qty: {order.totalQuantity}</Text>
        </Card>

        <View className="mb-4">
          <OrderMap
            latitude={order.address.latitude}
            longitude={order.address.longitude}
            title={order.customerName}
          />
        </View>

        <View className="flex-row gap-2 mb-4">
          <Button title="Call Customer" variant="secondary" className="flex-1" onPress={callCustomer} />
          <Button title="Navigate" variant="outline" className="flex-1" onPress={navigate} />
        </View>

        {order.status === 'assigned' && (
          <Button title="Out for Delivery" onPress={markOutForDelivery} className="mb-3" />
        )}

        {order.status === 'out_for_delivery' && (
          <Button title="Complete Delivery (Photo + GPS)" onPress={completeDelivery} loading={submitting} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
