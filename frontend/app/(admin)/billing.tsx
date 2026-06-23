import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { BillingStatement } from '@/shared/types';
import { queryDocuments, orderBy } from '@/repositories/base.repository';
import { COLLECTIONS } from '@/shared/constants';
import { Card, Badge, Button, LoadingScreen, EmptyState } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format';
import { billingRepository } from '@/repositories/misc.repository';
import type { PaymentStatus } from '@/shared/types';

export default function AdminBillingScreen() {
  const { data: statements, isLoading, refetch } = useQuery({
    queryKey: ['admin-billing'],
    queryFn: () => queryDocuments<BillingStatement>(COLLECTIONS.BILLING_STATEMENTS, orderBy('createdAt', 'desc')),
  });

  const updatePayment = (id: string, status: PaymentStatus, total: number) => {
    const paid = status === 'paid' ? total : status === 'partial' ? total / 2 : 0;
    Alert.alert('Update Payment', `Mark as ${status}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          await billingRepository.updatePayment(id, paid, status);
          refetch();
        },
      },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="p-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-semibold">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-primary mb-4">Billing Management</Text>

        {!statements?.length ? (
          <EmptyState title="No billing statements" message="Monthly bills are generated automatically." />
        ) : (
          statements.map((stmt) => (
            <Card key={stmt.id} className="mb-3">
              <View className="flex-row justify-between">
                <Text className="font-bold">{stmt.customerName}</Text>
                <Badge label={stmt.paymentStatus} color={stmt.paymentStatus === 'paid' ? 'success' : 'warning'} />
              </View>
              <Text className="text-muted">
                {new Date(stmt.year, stmt.month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
              <Text className="text-primary font-bold mt-1">{formatCurrency(stmt.totalAmount)}</Text>
              <Text className="text-error text-sm">Pending: {formatCurrency(stmt.pendingAmount)}</Text>
              <View className="flex-row gap-2 mt-3">
                <Button title="Paid" size="sm" className="flex-1" onPress={() => updatePayment(stmt.id, 'paid', stmt.totalAmount)} />
                <Button title="Partial" variant="outline" size="sm" className="flex-1" onPress={() => updatePayment(stmt.id, 'partial', stmt.totalAmount)} />
                <Button title="Unpaid" variant="danger" size="sm" className="flex-1" onPress={() => updatePayment(stmt.id, 'unpaid', stmt.totalAmount)} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
