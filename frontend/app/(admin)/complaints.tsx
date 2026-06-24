import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { complaintRepository } from '@/repositories/misc.repository';
import { useThemeStore } from '@/stores';
import { LoadingScreen, EmptyState, ScreenHeader, Badge } from '@/shared/components/ui';
import { formatDateTime } from '@/shared/utils/format';
import type { Complaint } from '@/shared/types';

export default function AdminComplaintsScreen() {
  const dark = useThemeStore((s) => s.dark);
  const qc = useQueryClient();

  const { data: complaints, isLoading, refetch } = useQuery({
    queryKey: ['admin-complaints'],
    queryFn: () => complaintRepository.getAll(),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => complaintRepository.resolve(id, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-complaints'] }); Alert.alert('✅ Resolved'); },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  const handleResolve = (complaint: Complaint) => {
    Alert.prompt(
      'Resolve Complaint',
      `Add admin notes for: "${complaint.subject}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Resolve', onPress: (notes = '') => resolveMutation.mutate({ id: complaint.id, notes }) },
      ],
      'plain-text',
      '',
    );
  };

  const open = (complaints ?? []).filter((c) => c.status === 'open');
  const resolved = (complaints ?? []).filter((c) => c.status === 'resolved');

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader
        title="Complaints"
        subtitle={`${open.length} open · ${resolved.length} resolved`}
        onBack={() => router.back()}
        gradient
      />
      <FlatList
        data={complaints ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshing={false}
        onRefresh={refetch}
        ListEmptyComponent={<EmptyState title="No Complaints" icon="✅" message="All clear!" />}
        renderItem={({ item }: { item: Complaint }) => (
          <View style={[styles.card, {
            backgroundColor: cardBg,
            borderColor: item.status === 'open' ? '#DC2626' : border,
            borderWidth: item.status === 'open' ? 1.5 : 1,
          }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ fontWeight: '800', color: text, fontSize: 15 }}>{item.subject}</Text>
                <Text style={{ color: muted, fontSize: 13, marginTop: 2 }}>{item.customerName} · {item.customerMobile}</Text>
              </View>
              <Badge label={item.status === 'open' ? 'Open' : 'Resolved'} color={item.status === 'open' ? 'error' : 'success'} />
            </View>

            <Text style={{ color: muted, fontSize: 13, marginTop: 10, lineHeight: 18 }}>{item.description}</Text>

            {item.requestCallback && (
              <View style={styles.callbackBadge}>
                <Ionicons name="call" size={13} color='#1A7BBE' />
                <Text style={{ color: '#1A7BBE', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
                  Callback requested · {item.preferredTime || 'Anytime'}
                </Text>
              </View>
            )}

            {item.adminNotes && (
              <View style={[styles.notesBox, { borderColor: border, backgroundColor: dark ? '#1A2614' : '#F5F9F2' }]}>
                <Text style={{ fontSize: 11, color: muted, fontWeight: '700' }}>ADMIN NOTE</Text>
                <Text style={{ color: text, fontSize: 13, marginTop: 4 }}>{item.adminNotes}</Text>
              </View>
            )}

            <View style={[styles.footer, { borderColor: border }]}>
              <Text style={{ color: muted, fontSize: 11 }}>{formatDateTime(item.createdAt)}</Text>
              {item.status === 'open' && (
                <TouchableOpacity onPress={() => handleResolve(item)} style={styles.resolveBtn}>
                  <Ionicons name="checkmark-circle" size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 4 }}>Mark Resolved</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16 },
  callbackBadge: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#EBF6FD', borderRadius: 8, marginTop: 10 },
  notesBox: { marginTop: 10, padding: 10, borderRadius: 10, borderWidth: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E5C0A', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8 },
});
