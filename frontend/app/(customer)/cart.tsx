import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCartStore, useThemeStore } from '@/stores';
import { EmptyState } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format';

export default function CartScreen() {
  const dark = useThemeStore((s) => s.dark);
  const { items, updateQuantity, removeItem, clearCart, totalAmount, totalItems } = useCartStore();

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  if (!items.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <EmptyState
          title="Your cart is empty"
          message="Browse fresh dairy products and add to your cart."
          icon="🛒"
          action={() => router.push('/(customer)/home' as never)}
          actionLabel="Start Shopping"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* ─── Header ─────────────────────────────────────────────── */}
      <LinearGradient colors={['#1E5C0A', '#2D7A1A']} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>🛒 Cart</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{totalItems()} items</Text>
        </View>
        <TouchableOpacity onPress={() => { clearCart(); }} style={{ padding: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' }}>Clear All</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {items.map((item) => (
          <View key={`${item.productId}-${item.variantName}`} style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Image placeholder */}
              <View style={[styles.imgBox, { backgroundColor: dark ? '#1A2614' : '#F0FBE8' }]}>
                <Text style={{ fontSize: 28 }}>🥛</Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700', color: text, fontSize: 15 }}>{item.productName}</Text>
                <Text style={{ color: muted, fontSize: 13 }}>{item.variantName}</Text>
                <Text style={{ color: '#1E5C0A', fontWeight: '800', fontSize: 15, marginTop: 4 }}>
                  {formatCurrency(item.price)} each
                </Text>
              </View>

              {/* Quantity Controls */}
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.productId, item.variantName, item.quantity - 1)}
                  style={[styles.qtyBtn, { backgroundColor: dark ? '#1A2614' : '#F0FBE8' }]}
                >
                  <Text style={{ fontSize: 18, color: '#1E5C0A', fontWeight: '700' }}>−</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: '800', color: text, minWidth: 28, textAlign: 'center' }}>
                  {item.quantity}
                </Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.productId, item.variantName, item.quantity + 1)}
                  style={[styles.qtyBtn, { backgroundColor: '#1E5C0A' }]}
                >
                  <Text style={{ fontSize: 18, color: '#fff', fontWeight: '700' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Item Total + Remove */}
            <View style={[styles.itemFooter, { borderTopColor: border }]}>
              <TouchableOpacity onPress={() => removeItem(item.productId, item.variantName)}>
                <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '600' }}>🗑️ Remove</Text>
              </TouchableOpacity>
              <Text style={{ fontWeight: '800', color: '#1E5C0A', fontSize: 15 }}>
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          </View>
        ))}

        {/* ─── Price Summary ─────────────────────────────────────── */}
        <View style={[styles.summary, { backgroundColor: cardBg, borderColor: '#2D7A1A' }]}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: text, marginBottom: 10 }}>💰 Order Summary</Text>
          {[
            { label: `Subtotal (${totalItems()} items)`, value: formatCurrency(totalAmount()) },
            { label: 'Delivery', value: 'Free 🎉' },
          ].map((row) => (
            <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: muted, fontSize: 14 }}>{row.label}</Text>
              <Text style={{ color: row.value.includes('Free') ? '#16A34A' : text, fontWeight: '600' }}>{row.value}</Text>
            </View>
          ))}
          <View style={[styles.divider, { borderColor: border }]} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '800', color: text, fontSize: 16 }}>Total</Text>
            <Text style={{ fontWeight: '900', color: '#1E5C0A', fontSize: 20 }}>{formatCurrency(totalAmount())}</Text>
          </View>
        </View>
      </ScrollView>

      {/* ─── Checkout Button ──────────────────────────────────────── */}
      <View style={[styles.footer, { backgroundColor: dark ? '#1A2614' : '#FFFFFF', borderTopColor: border }]}>
        <TouchableOpacity
          onPress={() => router.push('/(customer)/checkout' as never)}
          style={styles.checkoutBtn}
          activeOpacity={0.88}
        >
          <LinearGradient colors={['#2D7A1A', '#1E5C0A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.checkoutGrad}>
            <Ionicons name="cart" size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>
              Proceed to Checkout — {formatCurrency(totalAmount())}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, flexDirection: 'row', alignItems: 'center' },
  card: { borderRadius: 16, padding: 14, borderWidth: 1 },
  imgBox: { width: 64, height: 64, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  summary: { borderRadius: 16, padding: 16, borderWidth: 1.5 },
  divider: { borderTopWidth: 1, marginVertical: 10 },
  footer: { padding: 16, borderTopWidth: 1 },
  checkoutBtn: { borderRadius: 14, overflow: 'hidden' },
  checkoutGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14 },
});
