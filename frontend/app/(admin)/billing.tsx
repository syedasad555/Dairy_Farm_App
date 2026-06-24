import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { billingRepository } from '@/repositories/misc.repository';
import { queryDocuments, orderBy } from '@/repositories/base.repository';
import { COLLECTIONS } from '@/shared/constants';
import { useThemeStore } from '@/stores';
import { LoadingScreen, EmptyState, ScreenHeader, Badge } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils/format';
import type { BillingStatement } from '@/shared/types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

async function getAllStatements(): Promise<BillingStatement[]> {
  return queryDocuments<BillingStatement>(
    COLLECTIONS.BILLING_STATEMENTS,
    orderBy('year', 'desc'),
    orderBy('month', 'desc')
  );
}

export default function AdminBillingScreen() {
  const dark = useThemeStore((s) => s.dark);
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');

  const { data: statements, isLoading, refetch } = useQuery({
    queryKey: ['all-billing'],
    queryFn: getAllStatements,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, paid, status }: { id: string; paid: number; status: BillingStatement['paymentStatus'] }) =>
      billingRepository.updatePayment(id, paid, status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-billing'] });
      setSelectedId(null);
      setPaidAmount('');
      setNotes('');
      Alert.alert('✅ Updated', 'Payment updated successfully');
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed'),
  });

  const handleUpdate = (stmt: BillingStatement) => {
    const paid = parseFloat(paidAmount);
    if (isNaN(paid) || paid < 0) return Alert.alert('Invalid', 'Enter a valid amount');
    const status: BillingStatement['paymentStatus'] =
      paid >= stmt.totalAmount ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
    updateMutation.mutate({ id: stmt.id, paid, status });
  };

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';
  const inputBg = dark ? '#1A2614' : '#F5F9F2';

  const totalPending = (statements ?? []).reduce((s, b) => s + b.pendingAmount, 0);
  const totalCollected = (statements ?? []).reduce((s, b) => s + b.paidAmount, 0);

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader title="Billing Management" onBack={() => router.back()} gradient />

      {/* ─── Summary ────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', padding: 16, gap: 12 }}>
        <View style={[styles.summaryCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', flex: 1 }]}>
          <Text style={{ fontSize: 20, marginBottom: 4 }}>💸</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#DC2626' }}>{formatCurrency(totalPending)}</Text>
          <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '600' }}>Total Pending</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#F0FBE8', borderColor: '#B8F48B', flex: 1 }]}>
          <Text style={{ fontSize: 20, marginBottom: 4 }}>✅</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E5C0A' }}>{formatCurrency(totalCollected)}</Text>
          <Text style={{ fontSize: 11, color: '#1E5C0A', fontWeight: '600' }}>Total Collected</Text>
        </View>
      </View>

      <FlatList
        data={statements ?? []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 12 }}
        refreshing={false}
        onRefresh={refetch}
        ListEmptyComponent={<EmptyState title="No Billing Statements" icon="💰" />}
        renderItem={({ item }: { item: BillingStatement }) => {
          const isSelected = selectedId === item.id;
          const statusConfig = {
            paid:    { color: 'success' as const, label: 'Paid' },
            partial: { color: 'warning' as const, label: 'Partial' },
            unpaid:  { color: 'error'   as const, label: 'Unpaid' },
          };
          const cfg = statusConfig[item.paymentStatus];
          return (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: isSelected ? '#1E5C0A' : border, borderWidth: isSelected ? 2 : 1 }]}>
              <TouchableOpacity onPress={() => setSelectedId(isSelected ? null : item.id)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View>
                    <Text style={{ fontWeight: '800', color: text, fontSize: 15 }}>{item.customerName}</Text>
                    <Text style={{ color: muted, fontSize: 13 }}>{MONTHS[item.month - 1]} {item.year}</Text>
                  </View>
                  <Badge label={cfg.label} color={cfg.color} />
                </View>
                <View style={[styles.billRow, { borderColor: border }]}>
                  {[
                    { label: 'Total',   value: formatCurrency(item.totalAmount),   color: text },
                    { label: 'Paid',    value: formatCurrency(item.paidAmount),    color: '#16A34A' },
                    { label: 'Pending', value: formatCurrency(item.pendingAmount), color: item.pendingAmount > 0 ? '#DC2626' : '#16A34A' },
                  ].map((col) => (
                    <View key={col.label} style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: col.color }}>{col.value}</Text>
                      <Text style={{ fontSize: 11, color: muted }}>{col.label}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
              {isSelected && (
                <View style={[styles.payForm, { borderColor: border }]}>
                  <Text style={{ fontWeight: '700', color: text, marginBottom: 10 }}>💰 Update Payment</Text>
                  <TextInput
                    placeholder={`Enter paid amount (total: ${formatCurrency(item.totalAmount)})`}
                    placeholderTextColor={muted}
                    value={paidAmount}
                    onChangeText={setPaidAmount}
                    keyboardType="numeric"
                    style={[styles.input, { backgroundColor: inputBg, borderColor: border, color: text }]}
                  />
                  <TextInput
                    placeholder="Admin notes (optional)"
                    placeholderTextColor={muted}
                    value={notes}
                    onChangeText={setNotes}
                    style={[styles.input, { backgroundColor: inputBg, borderColor: border, color: text, marginTop: 8 }]}
                  />
                  <TouchableOpacity
                    onPress={() => handleUpdate(item)}
                    disabled={updateMutation.isPending}
                    style={[styles.updateBtn, { opacity: updateMutation.isPending ? 0.6 : 1 }]}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800' }}>
                      {updateMutation.isPending ? 'Updating...' : 'Update Payment'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  summaryCard: { borderRadius: 14, padding: 16, borderWidth: 1, alignItems: 'center', gap: 2 },
  card: { borderRadius: 16, padding: 16 },
  billRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  payForm: { marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  input: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  updateBtn: { backgroundColor: '#1E5C0A', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
});
