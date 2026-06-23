import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useCartStore, useAuthStore } from '@/stores';
import { orderService, addressService } from '@/services';
import { Card, Button, EmptyState } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format';
import { assignNearestDeliverySlot } from '@/shared/utils/deliverySlots';
import type { Address } from '@/shared/types';

export default function CartScreen() {
  const profile = useAuthStore((s) => s.profile)!;
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCartStore();
  const [placing, setPlacing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const { data: addresses } = useQuery({
    queryKey: ['addresses', profile.id],
    queryFn: () => addressService.getByUser(profile.id),
  });

  const slotPreview = assignNearestDeliverySlot();

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Select Address', 'Please select a delivery address.');
      return;
    }

    setPlacing(true);
    try {
      const order = await orderService.createOrder(profile.id, profile.name, profile.mobile, {
        items,
        addressId: selectedAddress,
      });
      clearCart();
      Alert.alert('Order Placed', slotPreview.message, [
        { text: 'View Orders', onPress: () => router.push('/(customer)/orders') },
      ]);
    } catch (err) {
      Alert.alert('Order Failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setPlacing(false);
    }
  };

  if (!items.length) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <EmptyState title="Cart is empty" message="Browse products and add items to your cart." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="p-4">
        <Text className="text-2xl font-bold text-primary mb-4">Your Cart</Text>

        {items.map((item) => (
          <Card key={`${item.productId}-${item.variantName}`} className="mb-3">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-bold text-gray-900">{item.productName}</Text>
                <Text className="text-muted text-sm">{item.variantName}</Text>
                <Text className="text-primary font-bold mt-1">{formatCurrency(item.price)}</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => updateQuantity(item.productId, item.variantName, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Text className="text-lg">−</Text>
                </TouchableOpacity>
                <Text className="font-bold text-lg">{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.productId, item.variantName, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-primary items-center justify-center"
                >
                  <Text className="text-lg text-white">+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => removeItem(item.productId, item.variantName)}
              className="mt-2"
            >
              <Text className="text-error text-sm">Remove</Text>
            </TouchableOpacity>
          </Card>
        ))}

        <Text className="text-lg font-bold text-gray-900 mt-4 mb-2">Delivery Address</Text>
        {!addresses?.length ? (
          <Card>
            <Text className="text-muted">No addresses saved.</Text>
            <Button title="Add Address" variant="outline" className="mt-3" onPress={() => router.push('/(customer)/profile')} />
          </Card>
        ) : (
          addresses.map((addr: Address) => (
            <TouchableOpacity key={addr.id} onPress={() => setSelectedAddress(addr.id)}>
              <Card className={`mb-2 ${selectedAddress === addr.id ? 'border-primary border-2' : ''}`}>
                <Text className="font-bold">{addr.title}</Text>
                <Text className="text-muted text-sm">
                  {addr.houseNumber}, {addr.street}, {addr.village}
                </Text>
                <Text className="text-muted text-sm">
                  {addr.city}, {addr.pincode}
                </Text>
              </Card>
            </TouchableOpacity>
          ))
        )}

        <Card className="mt-4 bg-accent/20">
          <Text className="text-sm text-gray-700">{slotPreview.message}</Text>
          <Text className="font-semibold text-primary mt-1">
            {slotPreview.slotLabel} — {slotPreview.scheduledDate}
          </Text>
        </Card>

        <View className="flex-row justify-between items-center mt-4 mb-2">
          <Text className="text-xl font-bold">Total</Text>
          <Text className="text-2xl font-bold text-primary">{formatCurrency(totalAmount())}</Text>
        </View>

        <Button title="Place Order" onPress={handlePlaceOrder} loading={placing} size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}
