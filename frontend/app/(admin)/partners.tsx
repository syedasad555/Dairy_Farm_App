import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { deliveryPartnerRepository } from '@/repositories/deliveryPartner.repository';
import { Card, Button, LoadingScreen, EmptyState } from '@/shared/components/ui';
import { FormInput } from '@/shared/components/FormInput';

export default function PartnersScreen() {
  const [showForm, setShowForm] = useState(false);

  const { data: partners, isLoading, refetch } = useQuery({
    queryKey: ['delivery-partners'],
    queryFn: () => deliveryPartnerRepository.getAll(),
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="p-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-semibold">← Back</Text>
        </TouchableOpacity>

        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-primary">Delivery Partners</Text>
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Text className="text-primary font-semibold">{showForm ? 'Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {showForm && <PartnerForm onSuccess={() => { setShowForm(false); refetch(); }} />}

        {!partners?.length ? (
          <EmptyState title="No delivery partners" />
        ) : (
          partners.map((p) => (
            <Card key={p.id} className="mb-3">
              <Text className="font-bold text-lg">{p.name}</Text>
              <Text className="text-muted">{p.mobile}</Text>
              <Text className="text-primary mt-1">{p.assignedAreaName}</Text>
              <Text className="text-sm text-gray-600">Pincodes: {p.assignedPincodes.join(', ')}</Text>
              <Text className="text-sm text-muted mt-1">
                Deliveries: {p.successfulDeliveries}/{p.totalDeliveries} ({p.totalDeliveries > 0 ? Math.round((p.successfulDeliveries / p.totalDeliveries) * 100) : 100}%)
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PartnerForm({ onSuccess }: { onSuccess: () => void }) {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      name: '',
      mobile: '',
      password: 'partner123',
      areaName: '',
      pincodes: '',
    },
  });

  const onSubmit = async (data: Record<string, string>) => {
    try {
      const createPartner = httpsCallable(functions, 'createDeliveryPartner');
      await createPartner({
        name: data.name,
        mobile: data.mobile,
        password: data.password,
        areaName: data.areaName,
        pincodes: data.pincodes.split(',').map((p) => p.trim()),
      });
      onSuccess();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create partner');
    }
  };

  return (
    <Card className="mb-4">
      <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
        <FormInput label="Name" value={value} onChangeText={onChange} />
      )} />
      <Controller control={control} name="mobile" render={({ field: { onChange, value } }) => (
        <FormInput label="Mobile" value={value} onChangeText={onChange} keyboardType="phone-pad" maxLength={10} />
      )} />
      <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
        <FormInput label="Password" value={value} onChangeText={onChange} secureTextEntry />
      )} />
      <Controller control={control} name="areaName" render={({ field: { onChange, value } }) => (
        <FormInput label="Assigned Area Name" value={value} onChangeText={onChange} />
      )} />
      <Controller control={control} name="pincodes" render={({ field: { onChange, value } }) => (
        <FormInput label="Pincodes (comma separated)" value={value} onChangeText={onChange} placeholder="500001, 500002" />
      )} />
      <Button title="Create Partner" onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}
