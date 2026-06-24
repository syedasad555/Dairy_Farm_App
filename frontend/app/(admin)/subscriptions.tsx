import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { subscriptionRepository } from '@/repositories/misc.repository';
import { productRepository } from '@/repositories/product.repository';
import { authRepository } from '@/repositories/auth.repository';
import { useThemeStore } from '@/stores';
import { LoadingScreen, EmptyState, ScreenHeader, Badge } from '@/shared/components/ui';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import type { Subscription } from '@/shared/types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminSubscriptionsScreen() {
  const dark = useThemeStore((s) => s.dark);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: subs, isLoading, refetch } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => subscriptionRepository.getAll(),
  });

  const { data: products } = useQuery({
    queryKey: ['products-admin'],
    queryFn: () => productRepository.getAll(),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => authRepository.getAllCustomers(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => subscriptionRepository.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subscriptions'] }); Alert.alert('✅ Cancelled'); },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  const active = (subs ?? []).filter((s) => s.active);
  const inactive = (subs ?? []).filter((s) => !s.active);

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader
        title="Subscriptions"
        subtitle={`${active.length} active · ${inactive.length} expired`}
        onBack={() => router.back()}
        rightLabel={showForm ? 'Close' : '+ New'}
        rightAction={() => setShowForm(!showForm)}
        gradient
      />

      {/* ─── Create Form ─────────────────────────────────────────── */}
      {showForm && (
        <SubscriptionForm
          customers={customers ?? []}
          products={products ?? []}
          onSuccess={() => { setShowForm(false); refetch(); }}
          dark={dark} bg={bg} cardBg={cardBg} border={border} text={text} muted={muted}
        />
      )}

      {/* ─── Summary ─────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', padding: 16, gap: 12 }}>
        {[
          { label: 'Active', value: active.length, color: '#1E5C0A', bg: '#F0FBE8' },
          { label: 'Expired', value: inactive.length, color: '#DC2626', bg: '#FEF2F2' },
          { label: 'Total', value: (subs ?? []).length, color: '#1A7BBE', bg: '#EBF6FD' },
        ].map((s) => (
          <View key={s.label} style={[styles.summaryCard, { backgroundColor: dark ? cardBg : s.bg, borderColor: border, flex: 1 }]}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: dark ? '#E8F5E0' : s.color }}>{s.value}</Text>
            <Text style={{ fontSize: 11, color: muted, fontWeight: '600' }}>{s.label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={subs ?? []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 10 }}
        refreshing={false}
        onRefresh={refetch}
        ListEmptyComponent={<EmptyState title="No Subscriptions" icon="🔄" />}
        renderItem={({ item }: { item: Subscription }) => (
          <View style={[styles.card, {
            backgroundColor: cardBg,
            borderColor: item.active ? '#2D7A1A' : border,
            borderWidth: item.active ? 1.5 : 1,
          }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ fontWeight: '800', color: text, fontSize: 14 }}>{item.customerName}</Text>
                <Text style={{ color: muted, fontSize: 13 }}>{item.productName} · {item.variantName}</Text>
              </View>
              <Badge label={item.active ? 'Active' : 'Expired'} color={item.active ? 'success' : 'gray'} />
            </View>

            <View style={[styles.detailRow, { borderColor: border }]}>
              {[
                { label: 'Qty/Day', value: `${item.quantity}` },
                { label: 'Price', value: formatCurrency(item.price) },
                { label: 'Slot', value: item.slot === 'morning' ? '🌅 AM' : '🌙 PM' },
              ].map((d) => (
                <View key={d.label} style={{ alignItems: 'center' }}>
                  <Text style={{ fontWeight: '700', color: text, fontSize: 14 }}>{d.value}</Text>
                  <Text style={{ fontSize: 11, color: muted }}>{d.label}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ color: muted, fontSize: 12 }}>
                {formatDate(item.startDate)} → {formatDate(item.endDate)}
              </Text>
              {item.active && (
                <TouchableOpacity
                  onPress={() => Alert.alert('Cancel Subscription', `Cancel ${item.customerName}'s subscription?`, [
                    { text: 'No', style: 'cancel' },
                    { text: 'Cancel Sub', style: 'destructive', onPress: () => cancelMutation.mutate(item.id) },
                  ])}
                >
                  <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// ─── Create Subscription Form ─────────────────────────────────────────────
function SubscriptionForm({ customers, products, onSuccess, dark, bg, cardBg, border, text, muted }: {
  customers: Array<{ id: string; name: string; mobile: string }>;
  products: Array<{ id: string; name: string; variants: Array<{ name: string; price: number }> }>;
  onSuccess: () => void;
  dark: boolean; bg: string; cardBg: string; border: string; text: string; muted: string;
}) {
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [variantName, setVariantName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [slot, setSlot] = useState<'morning' | 'evening'>('morning');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const customer = customers.find((c) => c.id === customerId);
      const product = products.find((p) => p.id === productId);
      const variant = product?.variants.find((v) => v.name === variantName);
      if (!customer || !product || !variant) throw new Error('Select customer, product, and variant');

      await subscriptionRepository.create({
        customerId,
        customerName: customer.name,
        productId,
        productName: product.name,
        variantName,
        quantity: parseInt(quantity, 10),
        price: variant.price,
        startDate,
        endDate,
        slot,
        active: true,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subscriptions'] }); onSuccess(); },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create'),
  });

  const inputStyle = { borderWidth: 1.5, borderColor: border, borderRadius: 10, padding: 12, color: text, backgroundColor: dark ? '#1A2614' : '#F5F9F2', marginBottom: 10, fontSize: 14 };
  const labelStyle = { color: muted, fontSize: 11, fontWeight: '700' as const, marginBottom: 4, letterSpacing: 0.5 };

  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <View style={[{ backgroundColor: cardBg, borderColor: border, borderBottomWidth: 1, padding: 16 }]}>
      <Text style={{ fontWeight: '800', color: text, fontSize: 15, marginBottom: 14 }}>➕ New Subscription</Text>

      <Text style={labelStyle}>CUSTOMER</Text>
      <View style={[inputStyle, { padding: 0 }]}>
        {customers.slice(0, 5).map((c) => (
          <TouchableOpacity key={c.id} onPress={() => setCustomerId(c.id)}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: customerId === c.id ? '#F0FBE8' : 'transparent' }}>
            {customerId === c.id && <Ionicons name="checkmark-circle" size={16} color="#1E5C0A" style={{ marginRight: 6 }} />}
            <Text style={{ color: customerId === c.id ? '#1E5C0A' : text, fontWeight: customerId === c.id ? '700' : '400' }}>
              {c.name} · {c.mobile}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={labelStyle}>PRODUCT</Text>
      <View style={[inputStyle, { padding: 0 }]}>
        {products.filter((p) => p.variants?.length).map((p) => (
          <TouchableOpacity key={p.id} onPress={() => { setProductId(p.id); setVariantName(''); }}
            style={{ flexDirection: 'row', padding: 10, backgroundColor: productId === p.id ? '#F0FBE8' : 'transparent' }}>
            {productId === p.id && <Ionicons name="checkmark-circle" size={16} color="#1E5C0A" style={{ marginRight: 6 }} />}
            <Text style={{ color: productId === p.id ? '#1E5C0A' : text, fontWeight: productId === p.id ? '700' : '400' }}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedProduct && (
        <>
          <Text style={labelStyle}>VARIANT</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {selectedProduct.variants.map((v) => (
              <TouchableOpacity key={v.name} onPress={() => setVariantName(v.name)}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5,
                  borderColor: variantName === v.name ? '#1E5C0A' : border,
                  backgroundColor: variantName === v.name ? '#F0FBE8' : 'transparent' }}>
                <Text style={{ color: variantName === v.name ? '#1E5C0A' : muted, fontWeight: '600' }}>
                  {v.name} · {formatCurrency(v.price)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={labelStyle}>QTY PER DAY</Text>
      <TextInput placeholder="1" placeholderTextColor={muted} value={quantity} onChangeText={setQuantity} keyboardType="numeric" style={inputStyle} />

      <Text style={labelStyle}>SLOT</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        {(['morning', 'evening'] as const).map((s) => (
          <TouchableOpacity key={s} onPress={() => setSlot(s)}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
              borderColor: slot === s ? '#1E5C0A' : border,
              backgroundColor: slot === s ? '#F0FBE8' : 'transparent', alignItems: 'center' }}>
            <Text style={{ color: slot === s ? '#1E5C0A' : muted, fontWeight: '700' }}>
              {s === 'morning' ? '🌅 Morning' : '🌙 Evening'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={labelStyle}>START DATE (YYYY-MM-DD)</Text>
      <TextInput value={startDate} onChangeText={setStartDate} placeholder="2024-01-01" placeholderTextColor={muted} style={inputStyle} />

      <Text style={labelStyle}>END DATE (YYYY-MM-DD)</Text>
      <TextInput value={endDate} onChangeText={setEndDate} placeholder="2024-12-31" placeholderTextColor={muted} style={inputStyle} />

      <TouchableOpacity
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending}
        style={[styles.submitBtn, { opacity: mutation.isPending ? 0.6 : 1 }]}
      >
        <Text style={{ color: '#fff', fontWeight: '800', textAlign: 'center', fontSize: 15 }}>
          {mutation.isPending ? 'Creating...' : '✅ Create Subscription'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: { borderRadius: 12, padding: 12, borderWidth: 1, alignItems: 'center', gap: 3 },
  card: { borderRadius: 14, padding: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  submitBtn: { backgroundColor: '#1E5C0A', borderRadius: 12, paddingVertical: 14, marginTop: 4 },
});
