import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useThemeStore } from '@/stores';
import { subscriptionService, productService } from '@/services';
import { LoadingScreen, EmptyState, ScreenHeader, Badge, Button } from '@/shared/components/ui';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import type { Subscription, Product } from '@/shared/types';

export default function SubscriptionsScreen() {
  const dark = useThemeStore((s) => s.dark);
  const profile = useAuthStore((s) => s.profile)!;
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: subs, isLoading, refetch } = useQuery({
    queryKey: ['subscriptions', profile.id],
    queryFn: () => subscriptionService.getByCustomer(profile.id),
  });

  const { data: products } = useQuery({
    queryKey: ['products-sub'],
    queryFn: () => productService.getAll(),
    enabled: showForm,
  });

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  const active = subs?.filter((s) => s.active) ?? [];
  const inactive = subs?.filter((s) => !s.active) ?? [];

  const today = new Date().toISOString().split('T')[0];
  const daysLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - new Date(today).getTime();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader
        title="Subscriptions"
        subtitle="Your recurring deliveries"
        rightLabel={showForm ? 'Close' : '+ New'}
        rightAction={() => setShowForm(!showForm)}
        gradient
      />

      {showForm && (
        <SubscribeForm
          profile={profile}
          products={products ?? []}
          onSuccess={() => { setShowForm(false); refetch(); qc.invalidateQueries({ queryKey: ['subscriptions'] }); }}
          dark={dark} cardBg={cardBg} border={border} text={text} muted={muted}
        />
      )}

      {/* ─── Summary ────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', padding: 16, gap: 12 }}>
        {[
          { label: 'Active', value: active.length, color: '#1E5C0A', icon: '🔄' },
          { label: 'Total', value: (subs ?? []).length, color: '#1A7BBE', icon: '📋' },
        ].map((item) => (
          <View key={item.label} style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border, flex: 1 }]}>
            <Text style={{ fontSize: 24 }}>{item.icon}</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', color: item.color }}>{item.value}</Text>
            <Text style={{ fontSize: 12, color: muted, fontWeight: '600' }}>{item.label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={[...active, ...inactive]}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 12 }}
        refreshing={false}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No Subscriptions"
            message="Tap + New to set up daily milk or grocery delivery."
            icon="🔄"
          />
        }
        renderItem={({ item }: { item: Subscription }) => {
          const days = daysLeft(item.endDate);
          const isExpiringSoon = days <= 7 && item.active;
          return (
            <View style={[styles.subCard, {
              backgroundColor: cardBg,
              borderColor: isExpiringSoon ? '#D97706' : (item.active ? '#2D7A1A' : border),
              borderWidth: isExpiringSoon || item.active ? 1.5 : 1,
            }]}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: text }}>{item.productName}</Text>
                  <Text style={{ color: muted, fontSize: 13 }}>{item.variantName}</Text>
                </View>
                <Badge label={item.active ? 'Active' : 'Expired'} color={item.active ? 'success' : 'gray'} />
              </View>

              {/* Details */}
              <View style={[styles.detailsRow, { borderColor: dark ? '#2D3D22' : '#E8F0E2' }]}>
                {[
                  { icon: '📦', label: 'Qty / Day', value: `${item.quantity}` },
                  { icon: '💰', label: 'Rate', value: formatCurrency(item.price) },
                  { icon: '⏰', label: 'Slot', value: item.slot === 'morning' ? 'Morning' : 'Evening' },
                ].map((d) => (
                  <View key={d.label} style={styles.detailItem}>
                    <Text style={{ fontSize: 18 }}>{d.icon}</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: text, marginTop: 2 }}>{d.value}</Text>
                    <Text style={{ fontSize: 11, color: muted }}>{d.label}</Text>
                  </View>
                ))}
              </View>

              {/* Dates */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <View>
                  <Text style={{ fontSize: 11, color: muted }}>START DATE</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: text }}>{formatDate(item.startDate)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, color: muted }}>END DATE</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: text }}>{formatDate(item.endDate)}</Text>
                </View>
              </View>

              {/* Expiry Warning */}
              {isExpiringSoon && (
                <View style={styles.expiryWarn}>
                  <Ionicons name="warning" size={14} color="#D97706" />
                  <Text style={{ color: '#D97706', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
                    Expires in {days} day{days !== 1 ? 's' : ''} — Contact us to renew
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  summaryCard: { borderRadius: 14, padding: 16, borderWidth: 1, alignItems: 'center', gap: 4 },
  subCard: { borderRadius: 16, padding: 16 },
  detailsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 14, paddingTop: 14, borderTopWidth: 1,
  },
  detailItem: { alignItems: 'center', gap: 2 },
  expiryWarn: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 10, padding: 8, backgroundColor: '#FFFBEB', borderRadius: 8,
  },
});

function SubscribeForm({ profile, products, onSuccess, dark, cardBg, border, text, muted }: {
  profile: { id: string; name: string };
  products: Product[];
  onSuccess: () => void;
  dark: boolean; cardBg: string; border: string; text: string; muted: string;
}) {
  const [productId, setProductId] = useState('');
  const [variantName, setVariantName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [slot, setSlot] = useState<'morning' | 'evening'>('morning');
  const [endDate, setEndDate] = useState('');

  const dairyProducts = products.filter((p) => p.category === 'Dairy' && p.variants?.length);
  const selected = dairyProducts.find((p) => p.id === productId);
  const startDate = new Date().toISOString().split('T')[0];

  const mutation = useMutation({
    mutationFn: async () => {
      const variant = selected?.variants.find((v) => v.name === variantName);
      if (!selected || !variant) throw new Error('Select product and variant');
      if (!endDate) throw new Error('Enter end date');

      await subscriptionService.create({
        customerId: profile.id,
        customerName: profile.name,
        productId: selected.id,
        productName: selected.name,
        variantName,
        quantity: parseInt(quantity, 10) || 1,
        price: variant.price,
        startDate,
        endDate,
        slot,
        active: true,
      });
    },
    onSuccess: () => { Alert.alert('✅ Subscribed!', 'Your recurring delivery has been set up.'); onSuccess(); },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  const inputStyle = { borderWidth: 1.5, borderColor: border, borderRadius: 10, padding: 12, color: text, backgroundColor: dark ? '#1A2614' : '#F5F9F2', marginBottom: 10, fontSize: 14 };

  return (
    <ScrollView style={{ maxHeight: 420, backgroundColor: cardBg, borderBottomWidth: 1, borderColor: border, padding: 16 }}>
      <Text style={{ fontWeight: '800', color: text, marginBottom: 12 }}>🥛 New Milk Subscription</Text>

      <Text style={{ color: muted, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>PRODUCT</Text>
      {dairyProducts.map((p) => (
        <TouchableOpacity key={p.id} onPress={() => { setProductId(p.id); setVariantName(''); }}
          style={{ padding: 10, borderRadius: 8, marginBottom: 4, backgroundColor: productId === p.id ? '#F0FBE8' : 'transparent' }}>
          <Text style={{ color: productId === p.id ? '#1E5C0A' : text, fontWeight: productId === p.id ? '700' : '400' }}>{p.name}</Text>
        </TouchableOpacity>
      ))}

      {selected && (
        <>
          <Text style={{ color: muted, fontSize: 11, fontWeight: '700', marginBottom: 4, marginTop: 8 }}>VARIANT</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {selected.variants.map((v) => (
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

      <Text style={{ color: muted, fontSize: 11, fontWeight: '700' }}>QTY PER DAY</Text>
      <TextInput value={quantity} onChangeText={setQuantity} keyboardType="numeric" style={inputStyle} />

      <Text style={{ color: muted, fontSize: 11, fontWeight: '700' }}>DELIVERY SLOT</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        {(['morning', 'evening'] as const).map((s) => (
          <TouchableOpacity key={s} onPress={() => setSlot(s)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
            borderColor: slot === s ? '#1E5C0A' : border, backgroundColor: slot === s ? '#F0FBE8' : 'transparent', alignItems: 'center' }}>
            <Text style={{ color: slot === s ? '#1E5C0A' : muted, fontWeight: '700' }}>
              {s === 'morning' ? '🌅 Morning' : '🌙 Evening'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ color: muted, fontSize: 11, fontWeight: '700' }}>END DATE (YYYY-MM-DD)</Text>
      <TextInput value={endDate} onChangeText={setEndDate} placeholder="2026-12-31" placeholderTextColor={muted} style={inputStyle} />

      <Button title={mutation.isPending ? 'Setting up...' : 'Start Subscription'} onPress={() => mutation.mutate()} loading={mutation.isPending} gradient />
    </ScrollView>
  );
}
