import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

const STATUS_STEPS = [
  { key: 'received', label: 'Order Received', icon: '📋' },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'assigned', label: 'Assigned To Partner', icon: '🚴' },
  { key: 'out_for_delivery', label: 'Out For Delivery', icon: '🚚' },
  { key: 'delivered', label: 'Delivered', icon: '✅' },
];

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { API_URL } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const idx = STATUS_STEPS.findIndex(s => s.key === order.orderStatus);
    return idx >= 0 ? idx : 0;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text>Order not found</Text>
      </View>
    );
  }

  const currentStep = getCurrentStepIndex();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.orderAmount}>₹{order.finalAmount}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        {STATUS_STEPS.map((step, index) => (
          <View key={step.key} style={styles.stepRow}>
            <View style={[styles.stepIcon, index <= currentStep && styles.stepIconActive]}>
              <Text>{step.icon}</Text>
            </View>
            <View style={styles.stepLine}>
              <Text style={[styles.stepLabel, index <= currentStep && styles.stepLabelActive]}>{step.label}</Text>
              {index < STATUS_STEPS.length - 1 && (
                <View style={[styles.connector, index < currentStep && styles.connectorActive]} />
              )}
            </View>
          </View>
        ))}
      </View>

      {order.deliveryPartner && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Partner</Text>
          <Text style={styles.partnerName}>{order.deliveryPartner.fullName}</Text>
          <Text style={styles.partnerPhone}>📞 {order.deliveryPartner.mobileNumber}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.product?.name || 'Product'}</Text>
            <Text style={styles.itemDetail}>{item.variant} × {item.quantity}</Text>
            <Text style={styles.itemPrice}>₹{item.totalPrice}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.addressText}>{order.deliveryAddress?.addressLine}</Text>
        <Text style={styles.addressText}>
          {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    backgroundColor: colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg,
    marginBottom: spacing.md, alignItems: 'center',
  },
  orderNumber: { fontSize: 20, fontWeight: '700', color: '#fff' },
  orderDate: { fontSize: 14, color: '#C8E6C9', marginTop: 4 },
  orderAmount: { fontSize: 28, fontWeight: '700', color: '#fff', marginTop: 8 },
  section: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md, ...shadows.card },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginBottom: spacing.md },
  stepRow: { flexDirection: 'row', marginBottom: 4 },
  stepIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  stepIconActive: { backgroundColor: '#C8E6C9' },
  stepLine: { flex: 1, marginLeft: spacing.sm, paddingBottom: spacing.md },
  stepLabel: { fontSize: 15, color: colors.textSecondary },
  stepLabelActive: { color: colors.primary, fontWeight: '600' },
  connector: { width: 2, height: 20, backgroundColor: colors.border, marginLeft: 18, marginTop: 4 },
  connectorActive: { backgroundColor: colors.primary },
  partnerName: { fontSize: 16, fontWeight: '600' },
  partnerPhone: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { flex: 1, fontSize: 15, fontWeight: '500' },
  itemDetail: { fontSize: 13, color: colors.textSecondary, marginRight: 12 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
  addressText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});

export default OrderDetailsScreen;
