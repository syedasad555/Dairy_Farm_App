import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { subscriptionService } from '@/services';
import { Card, Button, LoadingScreen, EmptyState, Badge } from '@/shared/components/ui';
import { FormInput, FormSelect } from '@/shared/components/FormInput';

export default function SubscriptionsScreen() {
  const [showForm, setShowForm] = useState(false);

  const { data: subscriptions, isLoading, refetch } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionService.getAll(),
  });

  const cancel = (id: string) => {
    Alert.alert('Cancel Subscription', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: async () => { await subscriptionService.cancel(id); refetch(); } },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="p-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-semibold">← Back</Text>
        </TouchableOpacity>

        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-primary">Subscriptions</Text>
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Text className="text-primary font-semibold">{showForm ? 'Cancel' : '+ Create'}</Text>
          </TouchableOpacity>
        </View>

        {showForm && <SubscriptionForm onSuccess={() => { setShowForm(false); refetch(); }} />}

        {!subscriptions?.length ? (
          <EmptyState title="No subscriptions" />
        ) : (
          subscriptions.map((sub) => (
            <Card key={sub.id} className="mb-3">
              <View className="flex-row justify-between">
                <Text className="font-bold">{sub.customerName}</Text>
                <Badge label={sub.active ? 'Active' : 'Cancelled'} color={sub.active ? 'success' : 'error'} />
              </View>
              <Text className="text-gray-700">{sub.productName} — {sub.variantName} x{sub.quantity}</Text>
              <Text className="text-muted text-sm">{sub.startDate} to {sub.endDate}</Text>
              <Text className="text-muted text-sm capitalize">Slot: {sub.slot}</Text>
              {sub.active && (
                <Button title="Cancel" variant="danger" size="sm" className="mt-2" onPress={() => cancel(sub.id)} />
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SubscriptionForm({ onSuccess }: { onSuccess: () => void }) {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      customerId: '',
      customerName: '',
      productId: '',
      productName: '',
      variantName: '1L',
      quantity: '1',
      price: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      slot: 'morning',
    },
  });

  const onSubmit = async (data: Record<string, string>) => {
    await subscriptionService.create({
      customerId: data.customerId,
      customerName: data.customerName,
      productId: data.productId,
      productName: data.productName,
      variantName: data.variantName,
      quantity: parseInt(data.quantity, 10),
      price: parseFloat(data.price),
      startDate: data.startDate,
      endDate: data.endDate,
      slot: data.slot as 'morning' | 'evening',
      active: true,
    });
    onSuccess();
  };

  return (
    <Card className="mb-4">
      {(['customerId', 'customerName', 'productId', 'productName', 'variantName', 'quantity', 'price', 'startDate', 'endDate'] as const).map((field) => (
        <Controller key={field} control={control} name={field} render={({ field: { onChange, value } }) => (
          <FormInput label={field} value={value} onChangeText={onChange} keyboardType={field === 'quantity' || field === 'price' ? 'numeric' : 'default'} />
        )} />
      ))}
      <Controller control={control} name="slot" render={({ field: { onChange, value } }) => (
        <FormSelect label="Slot" value={value} onChange={onChange} options={[{ label: 'Morning', value: 'morning' }, { label: 'Evening', value: 'evening' }]} />
      )} />
      <Button title="Create Subscription" onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}
