import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

const CheckoutScreen = ({ navigation }) => {
  const { cartItems, totalAmount, clearCart } = useCart();
  const { user, API_URL, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    const userData = await refreshUser();
    const addrs = userData?.addresses || user?.addresses || [];
    setAddresses(addrs);
    const defaultAddr = addrs.find(addr => addr.isDefault);
    setSelectedAddress(defaultAddr || addrs[0] || null);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please add a delivery address');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert(t('emptyCart'));
      return;
    }

    setPlacingOrder(true);
    try {
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          variant: item.variant,
          quantity: item.quantity,
          price: item.price
        })),
        deliveryAddress: selectedAddress,
        specialInstructions
      };

      const response = await axios.post(`${API_URL}/orders`, orderData);

      if (response.data.success) {
        clearCart();
        Alert.alert(
          'Order Placed Successfully!',
          'Your order has been received. You will be notified when it is being prepared.',
          [{ text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'CustomerHome' }] }) }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('deliveryAddress')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddressManagement')}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
          
          {selectedAddress ? (
            <View style={styles.addressCard}>
              <Text style={styles.addressName}>{user?.fullName}</Text>
              <Text style={styles.addressText}>{selectedAddress.addressLine}</Text>
              <Text style={styles.addressText}>
                {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </Text>
              {selectedAddress.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.addAddressButton} onPress={() => navigation.navigate('AddressManagement')}>
              <Text style={styles.addAddressButtonText}>+ Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('orderSummary')}</Text>
          {cartItems.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemVariant}>{item.variant} × {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder="Add any special instructions..."
            multiline
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentText}>Payment collected on delivery. No online payment required.</Text>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>Cash on Delivery</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerAmount}>₹{totalAmount}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, placingOrder && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderButtonText}>{t('placeOrder')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.md },
  section: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, ...shadows.card },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  changeText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  addressCard: { backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.sm },
  addressName: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  addressText: { fontSize: 14, color: colors.textSecondary },
  defaultBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  defaultBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  addAddressButton: { borderStyle: 'dashed', borderWidth: 2, borderColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.sm, alignItems: 'center' },
  addAddressButtonText: { color: colors.primary, fontWeight: '600' },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemVariant: { fontSize: 13, color: colors.textSecondary },
  itemPrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
  instructionsInput: { backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.sm, minHeight: 80, fontSize: 15 },
  paymentInfo: { backgroundColor: '#E8F5E9', padding: spacing.md, borderRadius: borderRadius.sm },
  paymentText: { fontSize: 14, color: colors.primaryDark, marginBottom: 8 },
  paymentBadge: { alignSelf: 'flex-start', backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 4 },
  paymentBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontSize: 16, color: colors.textSecondary },
  totalValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  footer: { backgroundColor: colors.surface, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  footerSummary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  footerLabel: { fontSize: 15, color: colors.textSecondary },
  footerAmount: { fontSize: 22, fontWeight: '700', color: colors.primary },
  placeOrderButton: { backgroundColor: colors.primary, padding: 16, borderRadius: borderRadius.md, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  placeOrderButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default CheckoutScreen;
