import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useThemeStore, useNotificationStore } from '@/stores';
import { notificationRepository } from '@/repositories/misc.repository';
import { LoadingScreen, EmptyState, ScreenHeader } from '@/shared/components/ui';
import { formatDateTime } from '@/shared/utils/format';
import type { AppNotification } from '@/shared/types';

const TYPE_ICONS: Record<string, string> = {
  order_created:        '📦',
  out_for_delivery:     '🚚',
  delivered:            '✅',
  account_approved:     '✅',
  monthly_bill:         '💰',
  complaint_raised:     '📞',
  registration_pending: '👤',
  monthly_report:       '📊',
  subscription_created: '🔄',
  default:              '🔔',
};

const TYPE_COLORS: Record<string, string> = {
  order_created:    '#1E5C0A',
  out_for_delivery: '#1A7BBE',
  delivered:        '#16A34A',
  account_approved: '#16A34A',
  monthly_bill:     '#D97706',
  complaint_raised: '#DC2626',
  default:          '#5A6B52',
};

export default function NotificationsScreen() {
  const dark = useThemeStore((s) => s.dark);
  const profile = useAuthStore((s) => s.profile)!;
  const reset = useNotificationStore((s) => s.reset);
  const qc = useQueryClient();

  // Reset badge when screen opens
  useEffect(() => { reset(); }, [reset]);

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications', profile.id],
    queryFn: () => notificationRepository.getByUser(profile.id),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationRepository.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  const unread = notifications?.filter((n) => !n.read) ?? [];

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader
        title="Notifications"
        subtitle={unread.length > 0 ? `${unread.length} unread` : 'All caught up!'}
        gradient
      />
      <FlatList
        data={notifications ?? []}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshing={false}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No Notifications"
            message="You'll see order updates, approvals, and bills here"
            icon="🔔"
          />
        }
        renderItem={({ item }: { item: AppNotification }) => {
          const icon = TYPE_ICONS[item.type] ?? TYPE_ICONS.default;
          const color = TYPE_COLORS[item.type] ?? TYPE_COLORS.default;
          return (
            <TouchableOpacity
              onPress={() => !item.read && markReadMutation.mutate(item.id)}
              style={[
                styles.card,
                {
                  backgroundColor: item.read ? cardBg : (dark ? '#1A2614' : '#F0FBE8'),
                  borderColor: item.read ? border : '#2D7A1A',
                  borderWidth: item.read ? 1 : 1.5,
                },
              ]}
              activeOpacity={0.85}
            >
              <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
                <Text style={{ fontSize: 22 }}>{icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '700', color: text, fontSize: 14, flex: 1 }}>{item.title}</Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={{ color: muted, fontSize: 13, marginTop: 3, lineHeight: 18 }}>{item.body}</Text>
                <Text style={{ color: muted, fontSize: 11, marginTop: 6 }}>
                  {formatDateTime(item.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 14, padding: 14, borderRadius: 14, alignItems: 'flex-start' },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#1E5C0A' },
});
