import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useThemeStore } from '@/stores';
import { deliveryService } from '@/services';
import { orderRepository } from '@/repositories/order.repository';
import { deliveryPartnerRepository } from '@/repositories/deliveryPartner.repository';
import { authService } from '@/services';
import { LoadingScreen, Card } from '@/shared/components/ui';

export default function DeliveryDashboardScreen() {
  const profile = useAuthStore((s) => s.profile)!;
  const setProfile = useAuthStore((s) => s.setProfile);
  const dark = useThemeStore((s) => s.dark);

  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ['delivery-partner', profile.id],
    queryFn: () => deliveryPartnerRepository.getByUserId(profile.id),
  });

  const { data: stats, isLoading: statsLoading, refetch, isRefetching } = useQuery({
    queryKey: ['delivery-stats', profile.id],
    queryFn: () => deliveryService.getPartnerStats(profile.id),
    enabled: !!partner,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['partner-orders-recent', partner?.id],
    queryFn: () => (partner ? orderRepository.getByDeliveryPartner(partner.id) : []),
    enabled: !!partner,
    select: (data) => data.filter((o) => o.status === 'delivered').slice(0, 5),
  });

  const logout = async () => {
    await authService.logout();
    setProfile(null);
    router.replace('/(auth)/login');
  };

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  if (partnerLoading || statsLoading) return <LoadingScreen />;

  const successRate = stats?.successRate ?? 100;
  const rateColor = successRate >= 80 ? '#16A34A' : successRate >= 60 ? '#D97706' : '#DC2626';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#1E5C0A']} tintColor="#1E5C0A" />}
      >
        {/* ─── Header ────────────────────────────────────────────── */}
        <LinearGradient colors={['#1E5C0A', '#2D7A1A']} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Good {getGreeting()}</Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 }}>{profile.name}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
              📍 {partner?.assignedAreaName ?? 'No area assigned'}
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </LinearGradient>

        {/* ─── Today Stats ─────────────────────────────────────────── */}
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: text }}>📅 Today's Stats</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[
              { label: "Today's Orders", value: stats?.todayOrders ?? 0, icon: '📦', color: '#1A7BBE', bg: '#EBF6FD' },
              { label: 'Pending', value: stats?.pendingOrders ?? 0, icon: '⏳', color: '#D97706', bg: '#FFFBEB' },
              { label: 'Completed', value: stats?.completedOrders ?? 0, icon: '✅', color: '#16A34A', bg: '#F0FDF4' },
            ].map((s) => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: dark ? cardBg : s.bg, borderColor: border, flex: 1 }]}>
                <Text style={{ fontSize: 22 }}>{s.icon}</Text>
                <Text style={{ fontSize: 24, fontWeight: '800', color: dark ? '#E8F5E0' : s.color }}>{s.value}</Text>
                <Text style={{ fontSize: 11, color: muted, fontWeight: '600', textAlign: 'center' }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ─── Performance Card ──────────────────────────────────── */}
          <View style={[styles.perfCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: text, marginBottom: 6 }}>📈 Overall Performance</Text>
              <Text style={{ color: muted, fontSize: 13 }}>Total Deliveries: {partner?.totalDeliveries ?? 0}</Text>
              <Text style={{ color: muted, fontSize: 13, marginTop: 2 }}>Successful: {partner?.successfulDeliveries ?? 0}</Text>
            </View>
            <View style={[styles.rateCircle, { borderColor: rateColor }]}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: rateColor }}>{successRate}%</Text>
              <Text style={{ fontSize: 10, color: muted }}>Rate</Text>
            </View>
          </View>

          {/* ─── Assigned Areas ───────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={{ fontWeight: '700', color: text, marginBottom: 10 }}>📍 Assigned Pincodes</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(stats?.assignedPincodes ?? []).map((pin) => (
                <View key={pin} style={[styles.pincodeBadge, { borderColor: '#1E5C0A' }]}>
                  <Text style={{ color: '#1E5C0A', fontWeight: '700', fontSize: 13 }}>{pin}</Text>
                </View>
              ))}
              {!stats?.assignedPincodes?.length && (
                <Text style={{ color: muted }}>No pincodes assigned yet</Text>
              )}
            </View>
          </View>

          {/* ─── Go to Orders ─────────────────────────────────────── */}
          <TouchableOpacity
            onPress={() => router.push('/(delivery)/orders' as never)}
            style={styles.ordersBtn}
          >
            <LinearGradient colors={['#1E5C0A', '#2D7A1A']} style={styles.ordersBtnGrad}>
              <Ionicons name="list" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>View Today's Orders</Text>
              <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" style={{ marginLeft: 'auto' }} />
            </LinearGradient>
          </TouchableOpacity>

          {/* ─── Recent Deliveries ────────────────────────────────── */}
          {(recentOrders?.length ?? 0) > 0 && (
            <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={{ fontWeight: '700', color: text, marginBottom: 10 }}>🕐 Recent Deliveries</Text>
              {(recentOrders ?? []).map((o) => (
                <View key={o.id} style={styles.recentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: text, fontSize: 13 }}>{o.orderNumber}</Text>
                    <Text style={{ color: muted, fontSize: 12 }}>{o.customerName}</Text>
                  </View>
                  <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '600' }}>✅ Delivered</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning ☀️';
  if (h < 17) return 'afternoon 🌤️';
  return 'evening 🌙';
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, flexDirection: 'row', alignItems: 'flex-start' },
  logoutBtn: { padding: 8 },
  statCard: { borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'center', gap: 4 },
  perfCard: { borderRadius: 16, padding: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
  rateCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  section: { borderRadius: 16, padding: 16, borderWidth: 1 },
  pincodeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  ordersBtn: { borderRadius: 14, overflow: 'hidden' },
  ordersBtnGrad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14 },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E8F0E2' },
});
