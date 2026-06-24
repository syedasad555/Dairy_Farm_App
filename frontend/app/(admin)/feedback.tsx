import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { feedbackRepository } from '@/repositories/misc.repository';
import { useThemeStore } from '@/stores';
import { LoadingScreen, EmptyState, ScreenHeader } from '@/shared/components/ui';
import { formatDate } from '@/shared/utils/format';
import type { Feedback } from '@/shared/types';

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={{ fontSize: 14, color: s <= rating ? '#D97706' : '#E8F0E2' }}>★</Text>
      ))}
    </View>
  );
}

export default function AdminFeedbackScreen() {
  const dark = useThemeStore((s) => s.dark);

  const { data: feedback, isLoading, refetch } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: () => feedbackRepository.getAll(),
  });

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  const avgRating = feedback?.length
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
    : '—';

  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    star: r,
    count: (feedback ?? []).filter((f) => f.rating === r).length,
    pct: feedback?.length
      ? Math.round(((feedback ?? []).filter((f) => f.rating === r).length / feedback.length) * 100)
      : 0,
  }));

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader
        title="Customer Feedback"
        subtitle={`${feedback?.length ?? 0} total reviews`}
        onBack={() => router.back()}
        gradient
      />

      {/* ─── Rating Summary ──────────────────────────────────────── */}
      {(feedback?.length ?? 0) > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border, margin: 16 }]}>
          <View style={{ alignItems: 'center', marginRight: 20 }}>
            <Text style={{ fontSize: 52, fontWeight: '900', color: '#D97706', lineHeight: 56 }}>{avgRating}</Text>
            <StarRating rating={Math.round(parseFloat(avgRating || '0'))} />
            <Text style={{ color: muted, fontSize: 12, marginTop: 4 }}>Average Rating</Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            {ratingDist.map((r) => (
              <View key={r.star} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: muted, fontSize: 12, width: 14 }}>{r.star}</Text>
                <Text style={{ fontSize: 12, color: '#D97706' }}>★</Text>
                <View style={{ flex: 1, height: 6, backgroundColor: dark ? '#2D3D22' : '#E8F0E2', borderRadius: 3 }}>
                  <View style={{ width: `${r.pct}%`, height: 6, backgroundColor: '#D97706', borderRadius: 3 }} />
                </View>
                <Text style={{ color: muted, fontSize: 11, width: 24, textAlign: 'right' }}>{r.count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={feedback ?? []}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 10 }}
        refreshing={false}
        onRefresh={refetch}
        ListEmptyComponent={<EmptyState title="No Feedback Yet" icon="⭐" message="Customer ratings will appear here." />}
        renderItem={({ item }: { item: Feedback }) => (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '700', color: text }}>{item.customerName}</Text>
              <StarRating rating={item.rating} />
            </View>
            {item.feedback && (
              <Text style={{ color: muted, fontSize: 13, marginTop: 8, lineHeight: 18, fontStyle: 'italic' }}>
                "{item.feedback}"
              </Text>
            )}
            <Text style={{ color: muted, fontSize: 11, marginTop: 8 }}>{formatDate(item.createdAt)}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  summaryCard: { borderRadius: 16, padding: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  card: { borderRadius: 14, padding: 14, borderWidth: 1 },
});
