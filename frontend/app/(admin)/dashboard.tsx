import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { adminService, authService } from '@/services';
import { LoadingScreen } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format';
import { useAuthStore, useThemeStore } from '@/stores';

const MENU = [
  { title: 'Approvals',     route: '/(admin)/approvals',     icon: '👤', badge: 'pendingApprovals' as const, color: ['#D97706','#F59E0B'] as const },
  { title: 'Products',      route: '/(admin)/products',      icon: '🥛', color: ['#1A7BBE','#4BA3D8'] as const },
  { title: 'Partners',      route: '/(admin)/partners',      icon: '🚚', color: ['#7C3912','#A0522D'] as const },
  { title: 'Orders',        route: '/(admin)/orders',        icon: '📦', color: ['#1E5C0A','#2D7A1A'] as const },
  { title: 'Billing',       route: '/(admin)/billing',       icon: '💰', color: ['#5B21B6','#7C3AED'] as const },
  { title: 'Subscriptions', route: '/(admin)/subscriptions', icon: '🔄', color: ['#0E7490','#0891B2'] as const },
  { title: 'Complaints',    route: '/(admin)/complaints',    icon: '📞', color: ['#DC2626','#EF4444'] as const },
  { title: 'Feedback',      route: '/(admin)/feedback',      icon: '⭐', color: ['#D97706','#F59E0B'] as const },
  { title: 'Analytics',     route: '/(admin)/analytics',     icon: '📊', color: ['#1E5C0A','#16A34A'] as const },
];

export default function AdminDashboardScreen() {
  const setProfile = useAuthStore((s) => s.setProfile);
  const profile = useAuthStore((s) => s.profile);
  const dark = useThemeStore((s) => s.dark);

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminService.getDashboardStats(),
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

  if (isLoading) return <LoadingScreen message="Loading dashboard..." />;

  const kpis = [
    { label: 'Customers',        value: stats?.totalCustomers ?? 0,                icon: '👥', color: '#1A7BBE' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals ?? 0,              icon: '⏳', color: '#D97706' },
    { label: 'Orders Today',     value: stats?.ordersToday ?? 0,                   icon: '📦', color: '#1E5C0A' },
    { label: 'Delivered Today',  value: stats?.deliveredToday ?? 0,                icon: '✅', color: '#16A34A' },
    { label: 'Pending Now',      value: stats?.pendingDeliveries ?? 0,             icon: '🚚', color: '#D97706' },
    { label: 'Month Revenue',    value: formatCurrency(stats?.revenueThisMonth ?? 0), icon: '💰', color: '#7C3912' },
    { label: 'Active Subs',      value: stats?.activeSubscriptions ?? 0,           icon: '🔄', color: '#0E7490' },
    { label: 'Partners',         value: stats?.deliveryPartners ?? 0,              icon: '🚴', color: '#5B21B6' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#1E5C0A']} tintColor="#1E5C0A" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ────────────────────────────────────────────────── */}
        <LinearGradient colors={['#1E5C0A', '#2D7A1A']} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>Welcome back,</Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 }}>
              {profile?.name ?? 'Admin'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 }}>
              MVR Farms Control Panel
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </LinearGradient>

        {/* ─── KPI Cards ────────────────────────────────────────────── */}
        <View style={{ padding: 16 }}>
          <Text style={{ fontWeight: '700', color: text, fontSize: 16, marginBottom: 12 }}>📊 Live Overview</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {kpis.map((k) => (
              <View key={k.label} style={[styles.kpiCard, { backgroundColor: dark ? cardBg : '#FFFFFF', borderColor: border, width: '47%' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 20, marginRight: 6 }}>{k.icon}</Text>
                  <Text style={{ fontSize: 11, color: muted, fontWeight: '600', flex: 1 }}>{k.label.toUpperCase()}</Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '900', color: dark ? '#E8F5E0' : k.color }}>{k.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Recent Complaints ────────────────────────────────────── */}
        {(stats?.recentComplaints?.length ?? 0) > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
            <View style={[styles.alertCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontWeight: '700', color: '#DC2626', fontSize: 14 }}>⚠️ Open Complaints</Text>
                <TouchableOpacity onPress={() => router.push('/(admin)/complaints' as never)}>
                  <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '600' }}>View All →</Text>
                </TouchableOpacity>
              </View>
              {stats!.recentComplaints.slice(0, 3).map((c) => (
                <Text key={c.id} style={{ fontSize: 13, color: '#7F1D1D', marginBottom: 4, lineHeight: 18 }}>
                  • {c.customerName}: {c.subject}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* ─── Management Grid ──────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Text style={{ fontWeight: '700', color: text, fontSize: 16, marginBottom: 12 }}>🛠️ Management</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {MENU.map((item) => {
              const badge = item.badge ? (stats as Record<string, number> | undefined)?.[item.badge] : 0;
              return (
                <TouchableOpacity
                  key={item.route}
                  onPress={() => router.push(item.route as never)}
                  style={{ width: '47%' }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={item.color}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.menuCard}
                  >
                    <Text style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</Text>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, textAlign: 'center' }}>
                      {item.title}
                    </Text>
                    {badge != null && badge > 0 && (
                      <View style={styles.menuBadge}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{badge}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, flexDirection: 'row', alignItems: 'flex-start' },
  logoutBtn: { padding: 8, marginTop: 4 },
  kpiCard: {
    borderRadius: 14, padding: 14, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  alertCard: { borderRadius: 14, padding: 14, borderWidth: 1.5, marginBottom: 16 },
  menuCard: {
    borderRadius: 16, padding: 20,
    alignItems: 'center', justifyContent: 'center', minHeight: 110,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    position: 'relative',
  },
  menuBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#DC2626', borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
});
