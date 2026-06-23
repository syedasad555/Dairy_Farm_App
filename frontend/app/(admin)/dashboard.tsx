import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services';
import { Card, StatCard, LoadingScreen } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format';
import { authService } from '@/services';
import { useAuthStore } from '@/stores';

const menuItems = [
  { title: 'Pending Approvals', route: '/(admin)/approvals', icon: '👤' },
  { title: 'Products', route: '/(admin)/products', icon: '🥛' },
  { title: 'Delivery Partners', route: '/(admin)/partners', icon: '🚚' },
  { title: 'Orders', route: '/(admin)/orders', icon: '📦' },
  { title: 'Billing', route: '/(admin)/billing', icon: '💰' },
  { title: 'Subscriptions', route: '/(admin)/subscriptions', icon: '🔄' },
  { title: 'Feedback', route: '/(admin)/feedback', icon: '⭐' },
  { title: 'Complaints', route: '/(admin)/complaints', icon: '📞' },
];

export default function AdminDashboardScreen() {
  const setProfile = useAuthStore((s) => s.setProfile);

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminService.getDashboardStats(),
  });

  const logout = async () => {
    await authService.logout();
    setProfile(null);
    router.replace('/(auth)/login');
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="p-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#2D5016']} />}
      >
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-2xl font-bold text-primary">Admin Dashboard</Text>
            <Text className="text-muted">MVR Farms</Text>
          </View>
          <TouchableOpacity onPress={logout}>
            <Text className="text-error font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap gap-3 mb-6">
          <StatCard label="Customers" value={stats?.totalCustomers ?? 0} />
          <StatCard label="Pending Approvals" value={stats?.pendingApprovals ?? 0} />
          <StatCard label="Orders Today" value={stats?.ordersToday ?? 0} />
          <StatCard label="Delivered Today" value={stats?.deliveredToday ?? 0} />
          <StatCard label="Pending Deliveries" value={stats?.pendingDeliveries ?? 0} />
          <StatCard label="Revenue (Month)" value={formatCurrency(stats?.revenueThisMonth ?? 0)} />
          <StatCard label="Products Sold" value={stats?.productsSold ?? 0} />
          <StatCard label="Active Subscriptions" value={stats?.activeSubscriptions ?? 0} />
        </View>

        {stats?.recentComplaints?.length ? (
          <Card className="mb-4">
            <Text className="font-bold mb-2">Recent Complaints</Text>
            {stats.recentComplaints.slice(0, 3).map((c) => (
              <Text key={c.id} className="text-sm text-gray-700 mb-1">• {c.subject}</Text>
            ))}
          </Card>
        ) : null}

        <Text className="text-lg font-bold mb-3">Management</Text>
        <View className="flex-row flex-wrap gap-3">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route as never)}
              className="w-[47%]"
            >
              <Card className="items-center py-4">
                <Text className="text-2xl mb-2">{item.icon}</Text>
                <Text className="font-semibold text-center text-gray-800">{item.title}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
