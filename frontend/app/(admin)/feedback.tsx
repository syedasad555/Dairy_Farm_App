import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { feedbackService } from '@/services';
import { Card, LoadingScreen, EmptyState } from '@/shared/components/ui';
import { formatDateTime } from '@/shared/utils/format';

export default function FeedbackScreen() {
  const { data: feedback, isLoading } = useQuery({
    queryKey: ['feedback'],
    queryFn: () => feedbackService.getAll(),
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="p-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Text className="text-primary font-semibold">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-primary mb-4">Customer Feedback</Text>

        {!feedback?.length ? (
          <EmptyState title="No feedback yet" />
        ) : (
          feedback.map((fb) => (
            <Card key={fb.id} className="mb-3">
              <View className="flex-row justify-between">
                <Text className="font-bold">{fb.customerName}</Text>
                <Text>{'⭐'.repeat(fb.rating)}</Text>
              </View>
              <Text className="text-gray-700 mt-2">{fb.feedback}</Text>
              <Text className="text-muted text-sm mt-1">{formatDateTime(fb.createdAt)}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
