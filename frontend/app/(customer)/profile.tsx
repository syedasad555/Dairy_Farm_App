import { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '@/stores';
import { authService, addressService, feedbackService, complaintService } from '@/services';
import { Card, Button } from '@/shared/components/ui';
import { FormInput } from '@/shared/components/FormInput';
import type { Address } from '@/shared/types';

export default function ProfileScreen() {
  const profile = useAuthStore((s) => s.profile)!;
  const setProfile = useAuthStore((s) => s.setProfile);
  const queryClient = useQueryClient();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);

  const { data: addresses, refetch } = useQuery({
    queryKey: ['addresses', profile.id],
    queryFn: () => addressService.getByUser(profile.id),
  });

  const logout = async () => {
    await authService.logout();
    setProfile(null);
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="p-4">
        <Text className="text-2xl font-bold text-primary mb-4">Profile</Text>

        <Card className="mb-4">
          <Text className="text-xl font-bold">{profile.name}</Text>
          <Text className="text-muted">{profile.mobile}</Text>
          {profile.email && <Text className="text-muted">{profile.email}</Text>}
          <Text className="text-sm text-primary mt-2 capitalize">{profile.language}</Text>
        </Card>

        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold">Addresses</Text>
          <TouchableOpacity onPress={() => setShowAddressForm(!showAddressForm)}>
            <Text className="text-primary font-semibold">{showAddressForm ? 'Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {showAddressForm && (
          <AddressForm
            userId={profile.id}
            onSuccess={() => {
              setShowAddressForm(false);
              refetch();
            }}
          />
        )}

        {addresses?.map((addr: Address) => (
          <Card key={addr.id} className="mb-2">
            <View className="flex-row justify-between">
              <Text className="font-bold">{addr.title} {addr.isDefault && '★'}</Text>
              {!addr.isDefault && (
                <TouchableOpacity onPress={() => { addressService.setDefault(addr.id, profile.id).then(() => refetch()); }}>
                  <Text className="text-primary text-sm">Set Default</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text className="text-muted text-sm">
              {addr.houseNumber}, {addr.street}, {addr.village}, {addr.city} - {addr.pincode}
            </Text>
          </Card>
        ))}

        <View className="flex-row gap-2 mt-4">
          <Button title="Feedback" variant="outline" className="flex-1" onPress={() => setShowFeedback(!showFeedback)} />
          <Button title="Complaint" variant="outline" className="flex-1" onPress={() => setShowComplaint(!showComplaint)} />
        </View>

        {showFeedback && <FeedbackForm customerId={profile.id} customerName={profile.name} />}
        {showComplaint && (
          <ComplaintForm customerId={profile.id} customerName={profile.name} customerMobile={profile.mobile} />
        )}

        <Button title="Logout" variant="danger" onPress={logout} className="mt-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

function AddressForm({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      title: 'Home',
      houseNumber: '',
      street: '',
      village: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
      latitude: 0,
      longitude: 0,
      isDefault: false,
    },
  });

  const onSubmit = async (data: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addressService.create(userId, data);
      onSuccess();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save address');
    }
  };

  const fields = ['title', 'houseNumber', 'street', 'village', 'city', 'district', 'state', 'pincode'] as const;

  return (
    <Card className="mb-4">
      {fields.map((field) => (
        <Controller
          key={field}
          control={control}
          name={field}
          render={({ field: { onChange, value } }) => (
            <FormInput
              label={field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
              value={value}
              onChangeText={onChange}
              keyboardType={field === 'pincode' ? 'numeric' : 'default'}
            />
          )}
        />
      ))}
      <Button title="Save Address" onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}

function FeedbackForm({ customerId, customerName }: { customerId: string; customerName: string }) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  const submit = async () => {
    await feedbackService.submit({ customerId, customerName, rating, feedback });
    Alert.alert('Thank you!', 'Your feedback has been submitted.');
    setFeedback('');
  };

  return (
    <Card className="mt-4">
      <Text className="font-bold mb-2">Rate Us</Text>
      <View className="flex-row gap-2 mb-3">
        {[1, 2, 3, 4, 5].map((r) => (
          <TouchableOpacity key={r} onPress={() => setRating(r)}>
            <Text className={`text-2xl ${r <= rating ? '' : 'opacity-30'}`}>⭐</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FormInput label="Feedback" value={feedback} onChangeText={setFeedback} multiline />
      <Button title="Submit Feedback" onPress={submit} />
    </Card>
  );
}

function ComplaintForm({
  customerId,
  customerName,
  customerMobile,
}: {
  customerId: string;
  customerName: string;
  customerMobile: string;
}) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  const submit = async () => {
    await complaintService.create({
      customerId,
      customerName,
      customerMobile,
      subject,
      description,
      preferredTime,
      requestCallback: true,
      status: 'open',
    });
    Alert.alert('Complaint Submitted', 'Our team will contact you shortly.');
    setSubject('');
    setDescription('');
  };

  return (
    <Card className="mt-4">
      <FormInput label="Subject" value={subject} onChangeText={setSubject} />
      <FormInput label="Description" value={description} onChangeText={setDescription} multiline />
      <FormInput label="Preferred Callback Time" value={preferredTime} onChangeText={setPreferredTime} />
      <Button title="Raise Complaint" onPress={submit} />
    </Card>
  );
}
