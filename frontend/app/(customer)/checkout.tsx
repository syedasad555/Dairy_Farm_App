import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore, useAuthStore, useThemeStore } from '@/stores';
import { addressService, orderService } from '@/services';
import { Card, Button, LoadingScreen, EmptyState, ScreenHeader } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format';

export default function CheckoutScreen() {
  const dark = useThemeStore((s) => s.dark);
  const profile = useAuthStore((s) => s.profile)!;
  const { items, totalAmount, clearCart } = useCartStore();
  const qc = useQueryClient();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [slotInfo, setSlotInfo] = useState<string>('');

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses', profile.id],
    queryFn: () => addressService.getByUser(profile.id),
  });

  useEffect(() => {
    if (!addresses?.length || selectedAddressId) return;
    const def = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (def) setSelectedAddressId(def.id);
  }, [addresses, selectedAddressId]);

  // Calculate slot
  const computeSlotMessage = () => {
    const h = new Date().getHours();
    if (h >= 4 && h < 8) return '⏰ Your order will be delivered this morning (4–8 AM)';
    if (h >= 16 && h < 20) return '⏰ Your order will be delivered this evening (4–8 PM)';
    if (h < 16) return '🌅 Your order is scheduled for the next morning slot (4–8 AM)';
    return '🌙 Your order is scheduled for tomorrow morning (4–8 AM)';
  };

  const placeMutation = useMutation({
    mutationFn: () =>
      orderService.createOrder(profile.id, profile.name, profile.mobile, {
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          variantName: i.variantName,
          price: i.price,
          quantity: i.quantity,
        })),
        addressId: selectedAddressId!,
      }),
    onSuccess: () => {
      clearCart();
      qc.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert(
        '✅ Order Placed!',
        `${computeSlotMessage()}\n\nYou will receive a notification when your order is assigned.`,
        [{ text: 'View Orders', onPress: () => router.replace('/(customer)/orders' as never) }]
      );
    },
    onError: (err) => {
      Alert.alert('Failed to Place Order', err instanceof Error ? err.message : 'Please try again');
    },
  });

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      Alert.alert('No Address', 'Please select a delivery address.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Add products to cart before checkout.');
      return;
    }
    Alert.alert(
      'Confirm Order',
      `Place order for ${formatCurrency(totalAmount())}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Place Order', onPress: () => placeMutation.mutate() },
      ]
    );
  };

  if (isLoading) return <LoadingScreen />;

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader title="Checkout" onBack={() => router.back()} gradient />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>

        {/* ─── Order Items ─────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: text }]}>🛒 Order Summary</Text>
          {items.map((item, i) => (
            <View key={i} style={styles.orderItem}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', color: text, fontSize: 14 }}>{item.productName}</Text>
                <Text style={{ color: muted, fontSize: 12 }}>{item.variantName} × {item.quantity}</Text>
              </View>
              <Text style={{ fontWeight: '700', color: '#1E5C0A', fontSize: 14 }}>
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          ))}
          <View style={[styles.divider, { borderColor: border }]} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: text }}>Total</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E5C0A' }}>{formatCurrency(totalAmount())}</Text>
          </View>
        </View>

        {/* ─── Delivery Slot Info ──────────────────────────────────── */}
        <View style={[styles.slotBox, { borderColor: '#2D7A1A', backgroundColor: dark ? '#1A2614' : '#F0FBE8' }]}>
          <Ionicons name="time-outline" size={20} color="#1E5C0A" style={{ marginRight: 10 }} />
          <Text style={{ flex: 1, color: '#1E5C0A', fontSize: 13, fontWeight: '600', lineHeight: 20 }}>
            {computeSlotMessage()}
          </Text>
        </View>

        {/* ─── Delivery Address ────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: text }]}>📍 Delivery Address</Text>
            <TouchableOpacity onPress={() => router.push('/(customer)/profile' as never)}>
              <Text style={{ color: '#1E5C0A', fontWeight: '600', fontSize: 13 }}>+ Add New</Text>
            </TouchableOpacity>
          </View>
          {!addresses?.length ? (
            <Text style={{ color: muted, textAlign: 'center', paddingVertical: 12 }}>No addresses saved. Add one from Profile.</Text>
          ) : (
            addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                onPress={() => setSelectedAddressId(addr.id)}
                style={[
                  styles.addrCard,
                  {
                    borderColor: selectedAddressId === addr.id ? '#1E5C0A' : border,
                    backgroundColor: selectedAddressId === addr.id ? (dark ? '#1A2614' : '#F0FBE8') : 'transparent',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={[styles.radioOuter, { borderColor: selectedAddressId === addr.id ? '#1E5C0A' : '#D1E5C8' }]}>
                    {selectedAddressId === addr.id && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontWeight: '700', color: text, fontSize: 14 }}>{addr.title}</Text>
                      {addr.isDefault && (
                        <View style={{ backgroundColor: '#1E5C0A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>DEFAULT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: muted, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
                      {addr.houseNumber}, {addr.street}{'\n'}
                      {addr.village}, {addr.city} — {addr.pincode}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ─── Payment Info ────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: text }]}>💳 Payment</Text>
          <View style={[styles.paymentRow, { backgroundColor: dark ? '#1A2614' : '#F5F9F2', borderColor: border }]}>
            <Ionicons name="cash-outline" size={22} color="#1E5C0A" />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontWeight: '700', color: text, fontSize: 14 }}>Cash on Delivery</Text>
              <Text style={{ color: muted, fontSize: 12 }}>Pay when your order arrives</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color="#1E5C0A" style={{ marginLeft: 'auto' }} />
          </View>
        </View>
      </ScrollView>

      {/* ─── Place Order Button ──────────────────────────────────────── */}
      <View style={[styles.footer, { backgroundColor: dark ? '#1A2614' : '#FFFFFF', borderTopColor: border }]}>
        <View>
          <Text style={{ color: muted, fontSize: 12 }}>Total Amount</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#1E5C0A' }}>{formatCurrency(totalAmount())}</Text>
        </View>
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={placeMutation.isPending}
          style={[styles.placeBtn, { opacity: placeMutation.isPending ? 0.6 : 1 }]}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
            {placeMutation.isPending ? 'Placing...' : '🛍️ Place Order'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: { borderRadius: 16, padding: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  divider: { borderTopWidth: 1, marginVertical: 10 },
  slotBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 12, borderWidth: 1.5 },
  addrCard: { borderWidth: 1.5, borderRadius: 12, padding: 12, marginBottom: 10 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1E5C0A' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderTopWidth: 1 },
  placeBtn: { backgroundColor: '#1E5C0A', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 },
});
