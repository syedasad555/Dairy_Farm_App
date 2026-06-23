import { View, Text, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { complaintService } from '@/services';
import { Card, Badge, Button, LoadingScreen, EmptyState } from '@/shared/components/ui';
import { formatDateTime } from '@/shared/utils/format';

export default function ComplaintsScreen() {
  const { data: complaints, isLoading, refetch } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => complaintService.getOpen(),
  });

  const resolve = (id: string) => {
    Alert.alert('Mark Resolved', 'Has this complaint been resolved?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resolve', onPress: async () => { await complaintService.resolve(id); refetch(); } },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="p-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-semibold">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-primary mb-4">Complaints</Text>

        {!complaints?.length ? (
          <EmptyState title="No open complaints" />
        ) : (
          complaints.map((c) => (
            <Card key={c.id} className="mb-3">
              <View className="flex-row justify-between">
                <Text className="font-bold">{c.subject}</Text>
                <Badge label={c.status} color={c.status === 'open' ? 'warning' : 'success'} />
              </View>
              <Text className="text-gray-700">{c.customerName} — {c.customerMobile}</Text>
              <Text className="text-muted mt-2">{c.description}</Text>
              <Text className="text-sm text-muted mt-1">Preferred: {c.preferredTime}</Text>
              <Text className="text-muted text-sm">{formatDateTime(c.createdAt)}</Text>
              <View className="flex-row gap-2 mt-3">
                <Button title="Call" variant="secondary" size="sm" className="flex-1" onPress={() => Linking.openURL(`tel:${c.customerMobile}`)} />
                <Button title="Resolve" size="sm" className="flex-1" onPress={() => resolve(c.id)} />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
