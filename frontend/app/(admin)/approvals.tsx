import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Linking, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authRepository } from '@/repositories/auth.repository';
import { adminService } from '@/services';
import { useThemeStore } from '@/stores';
import { LoadingScreen, EmptyState, ScreenHeader, Badge } from '@/shared/components/ui';
import { formatDate, formatMobile } from '@/shared/utils/format';
import type { UserProfile } from '@/shared/types';

export default function ApprovalsScreen() {
  const dark = useThemeStore((s) => s.dark);
  const qc = useQueryClient();
  const [tab, setTab] = useState<'pending' | 'all'>('pending');

  const { data: pending, isLoading, refetch } = useQuery({
    queryKey: ['pending-customers'],
    queryFn: () => authRepository.getPendingCustomers(),
  });

  const approveMutation = useMutation({
    mutationFn: (uid: string) => adminService.approveCustomer(uid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending-customers'] }); qc.invalidateQueries({ queryKey: ['admin-dashboard'] }); },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: (uid: string) => adminService.rejectCustomer(uid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending-customers'] }); qc.invalidateQueries({ queryKey: ['admin-dashboard'] }); },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  const handleApprove = (uid: string, name: string) => {
    Alert.alert('Approve Customer', `Approve ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => approveMutation.mutate(uid) },
    ]);
  };

  const handleReject = (uid: string, name: string) => {
    Alert.alert('Reject Customer', `Reject ${name}? They will not be able to login.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => rejectMutation.mutate(uid) },
    ]);
  };

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader
        title="Customer Approvals"
        subtitle={`${pending?.length ?? 0} pending`}
        onBack={() => router.back()}
        gradient
      />

      <FlatList
        data={pending ?? []}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshing={false}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            title="No Pending Approvals"
            message="All customer registrations have been processed."
            icon="✅"
          />
        }
        renderItem={({ item }: { item: UserProfile }) => (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={styles.avatar}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>
                  {item.name[0]?.toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '800', color: text, fontSize: 16 }}>{item.name}</Text>
                <Text style={{ color: muted, fontSize: 13 }}>📱 {formatMobile(item.mobile)}</Text>
                {item.email && <Text style={{ color: muted, fontSize: 12 }}>✉️ {item.email}</Text>}
              </View>
              <Badge label="Pending" color="warning" />
            </View>

            {/* Meta */}
            <View style={[styles.metaRow, { borderColor: border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="calendar-outline" size={13} color={muted} />
                <Text style={{ color: muted, fontSize: 12 }}>Registered {formatDate(item.createdAt)}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="language-outline" size={13} color={muted} />
                <Text style={{ color: muted, fontSize: 12, textTransform: 'capitalize' }}>{item.language}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${item.mobile}`)}
                style={[styles.actionBtn, { flex: 0, paddingHorizontal: 14, backgroundColor: dark ? '#1A2614' : '#F5F9F2', borderColor: border }]}
              >
                <Ionicons name="call" size={16} color="#1E5C0A" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReject(item.id, item.name)}
                style={[styles.actionBtn, { flex: 1, borderColor: '#DC2626', backgroundColor: '#FEF2F2' }]}
              >
                <Ionicons name="close" size={16} color="#DC2626" />
                <Text style={{ color: '#DC2626', fontWeight: '700', marginLeft: 6 }}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleApprove(item.id, item.name)}
                style={[styles.actionBtn, { flex: 1.5, backgroundColor: '#1E5C0A', borderColor: '#1E5C0A' }]}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#1E5C0A', alignItems: 'center', justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
  },
});
