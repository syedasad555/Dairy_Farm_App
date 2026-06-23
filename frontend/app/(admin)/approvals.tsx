import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authRepository } from '@/repositories/auth.repository';
import { adminService } from '@/services';
import { Card, Button, LoadingScreen, EmptyState } from '@/shared/components/ui';

export default function ApprovalsScreen() {
  const queryClient = useQueryClient();

  const { data: pending, isLoading, refetch } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => authRepository.getPendingCustomers(),
  });

  const approve = async (uid: string) => {
    await adminService.approveCustomer(uid);
    Alert.alert('Approved', 'Customer has been approved and notified.');
    refetch();
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const reject = async (uid: string) => {
    Alert.alert('Reject Customer', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          await adminService.rejectCustomer(uid);
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
        <Text className="text-2xl font-bold text-primary mb-4">Pending Approvals</Text>

        {!pending?.length ? (
          <EmptyState title="No pending approvals" />
        ) : (
          pending.map((customer) => (
            <Card key={customer.id} className="mb-3">
              <Text className="font-bold text-lg">{customer.name}</Text>
              <Text className="text-muted">{customer.mobile}</Text>
              {customer.email && <Text className="text-muted text-sm">{customer.email}</Text>}
              <View className="flex-row gap-2 mt-3">
                <Button title="Approve" className="flex-1" onPress={() => approve(customer.id)} />
                <Button title="Reject" variant="danger" className="flex-1" onPress={() => reject(customer.id)} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
