import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { deliveryPartnerRepository } from '@/repositories/deliveryPartner.repository';
import { LoadingScreen, EmptyState, ScreenHeader, Button } from '@/shared/components/ui';
import { FormInput } from '@/shared/components/FormInput';
import { useThemeStore } from '@/stores';
import type { DeliveryPartner } from '@/shared/types';

export default function PartnersScreen() {
  const dark = useThemeStore((s) => s.dark);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DeliveryPartner | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const qc = useQueryClient();

  const { data: partners, isLoading, refetch } = useQuery({
    queryKey: ['delivery-partners'],
    queryFn: () => deliveryPartnerRepository.getAll(),
  });

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  const toggleActive = async (p: DeliveryPartner) => {
    await deliveryPartnerRepository.update(p.id, { active: !p.active });
    refetch();
  };

  const removePartner = (p: DeliveryPartner) => {
    Alert.alert('Delete Partner', `Remove ${p.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deliveryPartnerRepository.delete(p.id);
          refetch();
        },
      },
    ]);
  };

  const confirmReset = async () => {
    if (!resetUserId || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    try {
      const fn = httpsCallable(functions, 'resetDeliveryPartnerPassword');
      await fn({ userId: resetUserId, newPassword });
      setResetUserId(null);
      setNewPassword('');
      Alert.alert('Success', 'Password reset successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader
        title="Delivery Partners"
        subtitle={`${partners?.length ?? 0} partners`}
        onBack={() => router.back()}
        rightLabel={showForm ? 'Close' : '+ Add'}
        rightAction={() => { setShowForm(!showForm); setEditing(null); }}
        gradient
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {showForm && !editing && <PartnerForm onSuccess={() => { setShowForm(false); refetch(); }} dark={dark} border={border} text={text} muted={muted} cardBg={cardBg} />}
        {editing && (
          <EditPartnerForm
            partner={editing}
            onSuccess={() => { setEditing(null); refetch(); }}
            onCancel={() => setEditing(null)}
            dark={dark} border={border} text={text} muted={muted} cardBg={cardBg}
          />
        )}

        {resetUserId && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: '#FF9800', marginBottom: 16 }]}>
            <Text style={{ fontWeight: '700', color: text, marginBottom: 8 }}>Reset Password</Text>
            <TextInput
              placeholder="New password (min 6 chars)"
              placeholderTextColor={muted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              style={[styles.input, { borderColor: border, color: text, backgroundColor: dark ? '#1A2614' : '#F5F9F2' }]}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={[styles.btn, { flex: 1, backgroundColor: border }]} onPress={() => { setResetUserId(null); setNewPassword(''); }}>
                <Text style={{ textAlign: 'center', color: text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { flex: 1, backgroundColor: '#FF9800' }]} onPress={confirmReset}>
                <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '700' }}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!partners?.length ? (
          <EmptyState title="No delivery partners" message="Add your first delivery partner." />
        ) : (
          partners.map((p) => (
            <View key={p.id} style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: text, fontSize: 16 }}>{p.name}</Text>
                  <Text style={{ color: muted, fontSize: 13 }}>{p.mobile}</Text>
                  <Text style={{ color: '#1E5C0A', marginTop: 4, fontWeight: '600' }}>{p.assignedAreaName}</Text>
                  <Text style={{ color: muted, fontSize: 12, marginTop: 2 }}>Pincodes: {p.assignedPincodes.join(', ')}</Text>
                  <Text style={{ color: muted, fontSize: 12, marginTop: 2 }}>
                    Deliveries: {p.successfulDeliveries}/{p.totalDeliveries}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={{ fontSize: 12, color: p.active ? '#16A34A' : muted, fontWeight: '600' }}>
                    {p.active ? 'Active' : 'Inactive'}
                  </Text>
                  <Switch value={p.active} onValueChange={() => toggleActive(p)} trackColor={{ true: '#2D7A1A' }} />
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => { setEditing(p); setShowForm(false); }}>
                  <Text style={{ color: '#1A7BBE', fontWeight: '600', fontSize: 13 }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setResetUserId(p.userId); setNewPassword(''); }}>
                  <Text style={{ color: '#FF9800', fontWeight: '600', fontSize: 13 }}>Reset Password</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removePartner(p)}>
                  <Text style={{ color: '#DC2626', fontWeight: '600', fontSize: 13 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PartnerForm({ onSuccess, dark, border, text, muted, cardBg }: {
  onSuccess: () => void; dark: boolean; border: string; text: string; muted: string; cardBg: string;
}) {
  const { control, handleSubmit } = useForm({
    defaultValues: { name: '', mobile: '', password: 'partner123', areaName: '', pincodes: '' },
  });

  const onSubmit = async (data: Record<string, string>) => {
    try {
      const createPartner = httpsCallable(functions, 'createDeliveryPartner');
      await createPartner({
        name: data.name,
        mobile: data.mobile,
        password: data.password,
        areaName: data.areaName,
        pincodes: data.pincodes.split(',').map((p) => p.trim()).filter(Boolean),
      });
      onSuccess();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create partner');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: border, marginBottom: 16 }]}>
      <Text style={{ fontWeight: '800', color: text, marginBottom: 12 }}>➕ New Partner</Text>
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
      <Button title="Create Partner" onPress={handleSubmit(onSubmit)} gradient />
    </View>
  );
}

function EditPartnerForm({ partner, onSuccess, onCancel, dark, border, text, muted, cardBg }: {
  partner: DeliveryPartner; onSuccess: () => void; onCancel: () => void;
  dark: boolean; border: string; text: string; muted: string; cardBg: string;
}) {
  const [areaName, setAreaName] = useState(partner.assignedAreaName);
  const [pincodes, setPincodes] = useState(partner.assignedPincodes.join(', '));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await deliveryPartnerRepository.update(partner.id, {
        assignedAreaName: areaName,
        assignedPincodes: pincodes.split(',').map((p) => p.trim()).filter(Boolean),
      });
      onSuccess();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: '#1A7BBE', marginBottom: 16, borderWidth: 1.5 }]}>
      <Text style={{ fontWeight: '800', color: text, marginBottom: 12 }}>✏️ Edit {partner.name}</Text>
      <FormInput label="Area Name" value={areaName} onChangeText={setAreaName} />
      <FormInput label="Pincodes" value={pincodes} onChangeText={setPincodes} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
        <Button title="Cancel" variant="outline" onPress={onCancel} className="flex-1" />
        <Button title={saving ? 'Saving...' : 'Save'} onPress={save} disabled={saving} gradient className="flex-1" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E8F0E2' },
  input: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 14 },
  btn: { borderRadius: 10, paddingVertical: 12 },
});
