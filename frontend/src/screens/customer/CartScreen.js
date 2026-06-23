import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../contexts/CartContext';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

const CartScreen = ({ navigation }) => {
  const { cartItems, totalAmount, updateQuantity, removeFromCart } = useCart();
  const { t } = useTranslation();

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert(t('emptyCart'));
      return;
    }
    navigation.navigate('Checkout');
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>{t('emptyCart')}</Text>
        <Text style={styles.emptyText}>Add some fresh products to get started</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('CustomerHome')}>
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('myCart')}</Text>
        <Text style={styles.itemCount}>{cartItems.length} items</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {cartItems.map(item => (
          <View key={item.id} style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemVariant}>{item.variant}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{item.quantity}</Text>
                <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(item.id)}>
              <Text style={styles.removeButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{totalAmount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>₹0</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutButtonText}>{t('checkout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyIcon: { fontSize: 72, marginBottom: spacing.md },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  shopButton: { backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: borderRadius.md },
  shopButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  itemCount: { fontSize: 14, color: '#C8E6C9', marginTop: 4 },
  content: { flex: 1, padding: spacing.md },
  cartItem: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.md, flexDirection: 'row', ...shadows.card,
  },
  itemImage: { width: 80, height: 80, borderRadius: borderRadius.sm },
  itemDetails: { flex: 1, marginLeft: spacing.md },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.text },
  itemVariant: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: 17, fontWeight: '700', color: colors.primary, marginTop: 4 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  quantityButton: {
    width: 32, height: 32, backgroundColor: colors.background, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  quantityButtonText: { fontSize: 18, fontWeight: '700', color: colors.text },
  quantityValue: { fontSize: 16, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  removeButton: { justifyContent: 'center', padding: 8 },
  removeButtonText: { fontSize: 20 },
  footer: { backgroundColor: colors.surface, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  summary: { marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 15, color: colors.textSecondary },
  summaryValue: { fontSize: 15, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 17, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  checkoutButton: { backgroundColor: colors.primary, padding: 16, borderRadius: borderRadius.md, alignItems: 'center' },
  checkoutButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default CartScreen;
