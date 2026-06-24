import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { orderRepository } from '@/repositories/order.repository';
import { analyticsRepository } from '@/repositories/analytics.repository';
import { useThemeStore } from '@/stores';
import { LoadingScreen, ScreenHeader, Card } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format';

const { width } = Dimensions.get('window');
type Period = 'daily' | 'weekly' | 'monthly';

export default function AdminAnalyticsScreen() {
  const dark = useThemeStore((s) => s.dark);
  const [period, setPeriod] = useState<Period>('monthly');

  const { data: analytics, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['analytics-latest'],
    queryFn: () => analyticsRepository.getLatest(),
  });

  const { data: orders } = useQuery({
    queryKey: ['admin-orders-analytics'],
    queryFn: () => orderRepository.getRecent(500),
  });

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  // Compute real-time stats
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const allOrders = orders ?? [];
  const periodOrders = allOrders.filter((o) => {
    if (period === 'daily') return o.scheduledDate === today;
    if (period === 'weekly') return o.scheduledDate >= weekAgo;
    return o.scheduledDate >= monthStart;
  });

  const delivered = periodOrders.filter((o) => o.status === 'delivered');
  const revenue = delivered.reduce((s, o) => s + o.totalAmount, 0);
  const successRate = periodOrders.length > 0
    ? Math.round((delivered.length / periodOrders.length) * 100)
    : 0;
  const totalLitres = analytics?.milkLitresSold ?? 0;

  // Top products
  const productMap: Record<string, { name: string; qty: number }> = {};
  for (const o of periodOrders) {
    for (const item of o.items) {
      const k = item.productId;
      if (!productMap[k]) productMap[k] = { name: item.productName, qty: 0 };
      productMap[k].qty += item.quantity;
    }
  }
  const topProducts = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const maxQty = topProducts[0]?.qty ?? 1;

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader title="Analytics" subtitle="Business Intelligence" onBack={() => router.back()} gradient />

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#1E5C0A']} tintColor="#1E5C0A" />}
      >
        {/* ─── Period Toggle ───────────────────────────────────────── */}
        <View style={[styles.periodToggle, { backgroundColor: dark ? '#1A2614' : '#E8F0E2' }]}>
          {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodBtn, { backgroundColor: period === p ? '#1E5C0A' : 'transparent' }]}
            >
              <Text style={{ color: period === p ? '#fff' : muted, fontWeight: '600', textTransform: 'capitalize', fontSize: 13 }}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Key Metrics ─────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[
            { label: 'Revenue', value: formatCurrency(revenue), icon: '💰', color: '#1E5C0A', bg: '#F0FBE8' },
            { label: 'Orders', value: periodOrders.length, icon: '📦', color: '#1A7BBE', bg: '#EBF6FD' },
            { label: 'Delivered', value: delivered.length, icon: '✅', color: '#16A34A', bg: '#F0FDF4' },
            { label: 'Success Rate', value: `${successRate}%`, icon: '📈', color: '#D97706', bg: '#FFFBEB' },
          ].map((m) => (
            <View key={m.label} style={[styles.metricCard, { backgroundColor: dark ? cardBg : m.bg, borderColor: border, width: (width - 44) / 2 }]}>
              <Text style={{ fontSize: 28, marginBottom: 4 }}>{m.icon}</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: dark ? '#E8F5E0' : m.color }}>{m.value}</Text>
              <Text style={{ fontSize: 12, color: muted, fontWeight: '600', marginTop: 2 }}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* ─── Delivery Performance ────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: text, marginBottom: 16 }}>📊 Delivery Performance</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {/* Gauge */}
            <View style={styles.gaugeOuter}>
              <View style={[styles.gaugeInner, { backgroundColor: successRate >= 80 ? '#1E5C0A' : successRate >= 60 ? '#D97706' : '#DC2626' }]}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{successRate}%</Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Success</Text>
              </View>
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              {[
                { label: 'Total Orders', value: periodOrders.length, color: '#1A7BBE' },
                { label: 'Delivered', value: delivered.length, color: '#16A34A' },
                { label: 'Pending', value: periodOrders.filter((o) => ['pending', 'assigned', 'out_for_delivery'].includes(o.status)).length, color: '#D97706' },
              ].map((s) => (
                <View key={s.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: muted, fontSize: 13 }}>{s.label}</Text>
                  <Text style={{ fontWeight: '700', color: s.color, fontSize: 13 }}>{s.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ─── Top Products ────────────────────────────────────────── */}
        {topProducts.length > 0 && (
          <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: text, marginBottom: 16 }}>🏆 Top Products</Text>
            {topProducts.map((p, i) => (
              <View key={p.name} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: text, fontSize: 13, fontWeight: '600' }}>
                    {i + 1}. {p.name}
                  </Text>
                  <Text style={{ color: '#1E5C0A', fontWeight: '700', fontSize: 13 }}>{p.qty} units</Text>
                </View>
                <View style={{ height: 8, backgroundColor: dark ? '#2D3D22' : '#E8F0E2', borderRadius: 4 }}>
                  <LinearGradient
                    colors={['#2D7A1A', '#1E5C0A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${(p.qty / maxQty) * 100}%`, height: 8, borderRadius: 4 }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── Milk & Products Sold ────────────────────────────────── */}
        {analytics && (
          <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: text, marginBottom: 12 }}>🥛 Product Summary</Text>
            {[
              { label: 'Milk Litres Sold', value: `${analytics.milkLitresSold} L`, icon: '🥛' },
              { label: 'Ghee Sold', value: `${analytics.gheeSold} units`, icon: '🫙' },
              { label: 'Egg Packs Sold', value: `${analytics.eggPacksSold} packs`, icon: '🥚' },
            ].map((item) => (
              <View key={item.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                <Text style={{ color: muted, fontSize: 14 }}>{item.icon} {item.label}</Text>
                <Text style={{ fontWeight: '700', color: text, fontSize: 14 }}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  periodToggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  metricCard: { borderRadius: 16, padding: 16, borderWidth: 1, alignItems: 'flex-start' },
  section: { borderRadius: 16, padding: 16, borderWidth: 1 },
  gaugeOuter: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: '#1E5C0A',
    alignItems: 'center', justifyContent: 'center',
  },
  gaugeInner: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
  },
});
