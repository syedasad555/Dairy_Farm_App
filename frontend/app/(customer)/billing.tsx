import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import { billingService } from '@/services';
import { Card, Badge, LoadingScreen, EmptyState } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format';

export default function BillingScreen() {
  const profile = useAuthStore((s) => s.profile)!;

  const { data: statements, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['billing', profile.id],
    queryFn: () => billingService.getByCustomer(profile.id),
  });

  const pendingTotal = statements?.reduce((sum, s) => sum + s.pendingAmount, 0) ?? 0;
  const paidTotal = statements?.reduce((sum, s) => sum + s.paidAmount, 0) ?? 0;

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="p-4"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={['#2D5016']} />}
      >
        <Text className="text-2xl font-bold text-primary mb-4">Billing</Text>

        <View className="flex-row gap-3 mb-6">
          <Card className="flex-1">
            <Text className="text-muted text-sm">Pending</Text>
            <Text className="text-xl font-bold text-error">{formatCurrency(pendingTotal)}</Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-muted text-sm">Paid</Text>
            <Text className="text-xl font-bold text-success">{formatCurrency(paidTotal)}</Text>
          </Card>
        </View>

        <Text className="text-lg font-bold mb-3">Statement History</Text>

        {!statements?.length ? (
          <EmptyState title="No statements" message="Monthly bills will appear here." />
        ) : (
          statements.map((stmt) => (
            <Card key={stmt.id} className="mb-3">
              <View className="flex-row justify-between">
                <Text className="font-bold">
                  {new Date(stmt.year, stmt.month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                </Text>
                <Badge
                  label={stmt.paymentStatus}
                  color={stmt.paymentStatus === 'paid' ? 'success' : stmt.paymentStatus === 'partial' ? 'warning' : 'error'}
                />
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-muted">Total: {formatCurrency(stmt.totalAmount)}</Text>
                <Text className="text-error">Due: {formatCurrency(stmt.pendingAmount)}</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
