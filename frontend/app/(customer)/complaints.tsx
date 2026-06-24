import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, StyleSheet, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useThemeStore } from '@/stores';
import { complaintService } from '@/services';
import { ScreenHeader } from '@/shared/components/ui';

const SUBJECTS = [
  'Missing delivery',
  'Wrong product delivered',
  'Quality issue',
  'Delivery partner complaint',
  'Billing issue',
  'App issue',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High'] as const;
type Priority = typeof PRIORITIES[number];

export default function ComplaintsScreen() {
  const dark = useThemeStore((s) => s.dark);
  const profile = useAuthStore((s) => s.profile)!;
  const qc = useQueryClient();

  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [requestCallback, setRequestCallback] = useState(false);
  const [preferredTime, setPreferredTime] = useState('');

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';
  const inputBg = dark ? '#1A2614' : '#F5F9F2';

  const submitMutation = useMutation({
    mutationFn: () =>
      complaintService.create({
        customerId: profile.id,
        customerName: profile.name,
        customerMobile: profile.mobile,
        subject: subject === 'Other' ? customSubject : subject,
        description,
        preferredTime: requestCallback ? preferredTime : '',
        requestCallback,
        status: 'open',
      }),
    onSuccess: () => {
      Alert.alert(
        '✅ Complaint Submitted',
        requestCallback
          ? 'We received your complaint. Our team will call you back at your preferred time.'
          : 'We received your complaint and will resolve it shortly.',
        [{ text: 'OK', onPress: () => { setSubject(''); setDescription(''); setRequestCallback(false); } }]
      );
      qc.invalidateQueries({ queryKey: ['complaints'] });
    },
    onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit'),
  });

  const handleSubmit = () => {
    const finalSubject = subject === 'Other' ? customSubject.trim() : subject;
    if (!finalSubject) return Alert.alert('Required', 'Please select a subject');
    if (!description.trim()) return Alert.alert('Required', 'Please describe your issue');
    submitMutation.mutate();
  };

  const priorityColors: Record<Priority, string> = {
    Low: '#16A34A',
    Medium: '#D97706',
    High: '#DC2626',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScreenHeader title="Support" subtitle="Complaints & Callback" gradient />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>

        {/* ─── Subject ─────────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.label, { color: muted }]}>SUBJECT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
            {SUBJECTS.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSubject(s)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: subject === s ? '#1E5C0A' : 'transparent',
                    borderColor: subject === s ? '#1E5C0A' : border,
                  },
                ]}
              >
                <Text style={{ color: subject === s ? '#fff' : muted, fontSize: 13, fontWeight: '600' }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {subject === 'Other' && (
            <TextInput
              placeholder="Describe your subject..."
              placeholderTextColor={muted}
              value={customSubject}
              onChangeText={setCustomSubject}
              style={[styles.input, { backgroundColor: inputBg, borderColor: border, color: text }]}
            />
          )}
        </View>

        {/* ─── Priority ────────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.label, { color: muted }]}>PRIORITY</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPriority(p)}
                style={[
                  styles.priorityBtn,
                  {
                    backgroundColor: priority === p ? `${priorityColors[p]}20` : 'transparent',
                    borderColor: priority === p ? priorityColors[p] : border,
                  },
                ]}
              >
                <View style={[styles.dot, { backgroundColor: priorityColors[p] }]} />
                <Text style={{ color: priority === p ? priorityColors[p] : muted, fontWeight: '600', fontSize: 13 }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── Description ─────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.label, { color: muted }]}>DESCRIPTION</Text>
          <TextInput
            placeholder="Please describe your issue in detail..."
            placeholderTextColor={muted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            style={[styles.textarea, { backgroundColor: inputBg, borderColor: border, color: text }]}
            textAlignVertical="top"
          />
        </View>

        {/* ─── Callback Request ────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontWeight: '700', color: text, fontSize: 15 }}>📞 Request Callback</Text>
              <Text style={{ color: muted, fontSize: 12, marginTop: 2 }}>We will call you to resolve this</Text>
            </View>
            <Switch
              value={requestCallback}
              onValueChange={setRequestCallback}
              trackColor={{ false: '#D1E5C8', true: '#2D7A1A' }}
              thumbColor={requestCallback ? '#1E5C0A' : '#f4f3f4'}
            />
          </View>
          {requestCallback && (
            <TextInput
              placeholder="Preferred callback time (e.g., 10 AM - 12 PM)"
              placeholderTextColor={muted}
              value={preferredTime}
              onChangeText={setPreferredTime}
              style={[styles.input, { backgroundColor: inputBg, borderColor: border, color: text, marginTop: 12 }]}
            />
          )}
        </View>

        {/* ─── Submit ──────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitMutation.isPending}
          style={[styles.submitBtn, { opacity: submitMutation.isPending ? 0.6 : 1 }]}
        >
          <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
            {submitMutation.isPending ? 'Submitting...' : 'Submit Complaint'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: { borderRadius: 16, padding: 16, borderWidth: 1 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, marginRight: 8,
  },
  input: {
    borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, marginTop: 8,
  },
  textarea: {
    borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, marginTop: 8, minHeight: 100,
  },
  priorityBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, borderWidth: 1.5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  submitBtn: {
    backgroundColor: '#1E5C0A', borderRadius: 14,
    paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
});
