import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authService, addressService, feedbackService } from '@/services';
import { authRepository } from '@/repositories/auth.repository';
import { useAuthStore, useThemeStore } from '@/stores';
import { Card, Button, ScreenHeader, FormField, Divider } from '@/shared/components/ui';
import { formatMobile, formatDate } from '@/shared/utils/format';
import type { Address, Language } from '@/shared/types';
import i18n from '@/lib/i18n';

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'english', label: 'English' },
  { id: 'telugu', label: 'తెలుగు' },
  { id: 'hindi', label: 'हिंदी' },
];

export default function CustomerProfileScreen() {
  const profile = useAuthStore((s) => s.profile)!;
  const setProfile = useAuthStore((s) => s.setProfile);
  const dark = useThemeStore((s) => s.dark);
  const toggleDark = useThemeStore((s) => s.toggleDark);
  const qc = useQueryClient();
  const [showAddressForm, setShowAddressForm] = useState(false);

  const { data: addresses, refetch } = useQuery({
    queryKey: ['addresses', profile.id],
    queryFn: () => addressService.getByUser(profile.id),
  });

  const logout = async () => {
    await authService.logout();
    setProfile(null);
    router.replace('/(auth)/login');
  };

  const bg = dark ? '#0F1A0A' : '#F5F9F2';
  const cardBg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const text = dark ? '#E8F5E0' : '#1A2614';
  const muted = dark ? '#8FA882' : '#5A6B52';

  const changeLanguage = async (lang: Language) => {
    await authRepository.updateProfile(profile.id, { language: lang });
    setProfile({ ...profile, language: lang });
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* ─── Profile Header ──────────────────────────────────────── */}
        <LinearGradient colors={['#1E5C0A', '#2D7A1A']} style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800' }}>
              {profile.name[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12 }}>{profile.name}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 }}>
            📱 {formatMobile(profile.mobile)}
          </Text>
          {profile.email && (
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>✉️ {profile.email}</Text>
          )}
          <View style={styles.statusBadge}>
            <Text style={{ color: '#1E5C0A', fontSize: 12, fontWeight: '700' }}>✅ Approved Customer</Text>
          </View>
        </LinearGradient>

        <View style={{ padding: 16, gap: 14 }}>
          {/* ─── Settings ────────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: text }]}>⚙️ Settings</Text>

            {/* Dark Mode Toggle */}
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', color: text }}>Dark Mode</Text>
                <Text style={{ color: muted, fontSize: 12 }}>Switch to dark theme</Text>
              </View>
              <Switch
                value={dark}
                onValueChange={toggleDark}
                trackColor={{ false: '#D1E5C8', true: '#2D7A1A' }}
                thumbColor={dark ? '#1E5C0A' : '#f4f3f4'}
              />
            </View>

            <Divider />

            {/* Language */}
            <Text style={{ fontWeight: '600', color: text, marginBottom: 8 }}>Language</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  onPress={() => changeLanguage(lang.id)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: profile.language === lang.id ? '#1E5C0A' : border,
                    backgroundColor: profile.language === lang.id ? '#F0FBE8' : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontWeight: profile.language === lang.id ? '700' : '500',
                    color: profile.language === lang.id ? '#1E5C0A' : muted,
                    fontSize: 13,
                  }}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Divider />

            {/* Quick Links */}
            {[
              { icon: '🔄', label: 'My Subscriptions', route: '/(customer)/subscriptions' },
              { icon: '💰', label: 'Billing & Payments', route: '/(customer)/billing' },
              { icon: '📞', label: 'Complaints & Support', route: '/(customer)/complaints' },
              { icon: '🔔', label: 'Notifications', route: '/(customer)/notifications' },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => router.push(item.route as never)}
                style={styles.linkRow}
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>{item.icon}</Text>
                <Text style={{ flex: 1, fontWeight: '600', color: text, fontSize: 15 }}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={muted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* ─── Addresses ───────────────────────────────────────── */}
          <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { color: text, marginBottom: 0 }]}>📍 Delivery Addresses</Text>
              <TouchableOpacity onPress={() => setShowAddressForm(!showAddressForm)}>
                <Text style={{ color: '#1E5C0A', fontWeight: '700' }}>{showAddressForm ? 'Cancel' : '+ Add'}</Text>
              </TouchableOpacity>
            </View>

            {showAddressForm && (
              <AddressForm userId={profile.id} onSuccess={() => { setShowAddressForm(false); refetch(); }} dark={dark} border={border} bg={bg} text={text} muted={muted} />
            )}

            {!addresses?.length && !showAddressForm && (
              <Text style={{ color: muted, textAlign: 'center', padding: 16 }}>No addresses saved yet</Text>
            )}

            {addresses?.map((addr: Address) => (
              <View key={addr.id} style={[styles.addrCard, { borderColor: addr.isDefault ? '#1E5C0A' : border, borderWidth: addr.isDefault ? 1.5 : 1 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text style={{ fontWeight: '700', color: text }}>{addr.title}</Text>
                      {addr.isDefault && (
                        <View style={{ backgroundColor: '#1E5C0A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>DEFAULT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: muted, fontSize: 13, lineHeight: 18 }}>
                      {addr.houseNumber}, {addr.street}{'\n'}{addr.village}, {addr.city} — {addr.pincode}
                    </Text>
                  </View>
                  {!addr.isDefault && (
                    <TouchableOpacity
                      onPress={() => addressService.setDefault(addr.id, profile.id).then(() => { refetch(); qc.invalidateQueries({ queryKey: ['addresses'] }); })}
                    >
                      <Text style={{ color: '#1E5C0A', fontSize: 12, fontWeight: '600' }}>Set Default</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* ─── Quick Feedback ──────────────────────────────────── */}
          <QuickFeedback customerId={profile.id} customerName={profile.name} dark={dark} cardBg={cardBg} border={border} text={text} muted={muted} />

          {/* ─── Logout ──────────────────────────────────────────── */}
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 10 }} />
            <Text style={{ color: '#DC2626', fontWeight: '800', fontSize: 16 }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Address Form ──────────────────────────────────────────────────────────
function AddressForm({ userId, onSuccess, dark, border, bg, text, muted }: {
  userId: string; onSuccess: () => void;
  dark: boolean; border: string; bg: string; text: string; muted: string;
}) {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      title: 'Home', houseNumber: '', street: '', village: '',
      city: '', district: '', state: '', pincode: '',
      latitude: 0, longitude: 0, isDefault: false,
    },
  });

  const onSubmit = async (data: Parameters<typeof addressService.create>[1]) => {
    try {
      await addressService.create(userId, data);
      onSuccess();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save address');
    }
  };

  const fields: { name: string; label: string; keyboard?: 'default' | 'numeric' }[] = [
    { name: 'title', label: 'Address Title (Home, Work...)' },
    { name: 'houseNumber', label: 'House / Flat Number' },
    { name: 'street', label: 'Street' },
    { name: 'village', label: 'Village / Area' },
    { name: 'city', label: 'City' },
    { name: 'district', label: 'District' },
    { name: 'state', label: 'State' },
    { name: 'pincode', label: 'Pincode', keyboard: 'numeric' },
  ];

  return (
    <View style={{ marginBottom: 12 }}>
      {fields.map((f) => (
        <Controller
          key={f.name}
          control={control}
          name={f.name as never}
          render={({ field: { onChange, value } }) => (
            <FormField label={f.label} value={String(value ?? '')} onChangeText={onChange} keyboardType={f.keyboard ?? 'default'} />
          )}
        />
      ))}
      <Button title="Save Address" onPress={handleSubmit(onSubmit as never)} gradient />
    </View>
  );
}

// ─── Quick Feedback ────────────────────────────────────────────────────────
function QuickFeedback({ customerId, customerName, dark, cardBg, border, text, muted }: {
  customerId: string; customerName: string;
  dark: boolean; cardBg: string; border: string; text: string; muted: string;
}) {
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    await feedbackService.submit({ customerId, customerName, rating, feedback: feedbackText });
    setSubmitted(true);
    setFeedbackText('');
    Alert.alert('🙏 Thank you!', 'Your feedback helps us improve.');
  };

  if (submitted) return (
    <View style={[styles.section, { backgroundColor: cardBg, borderColor: '#16A34A', borderWidth: 1.5, alignItems: 'center', padding: 20 }]}>
      <Text style={{ fontSize: 32, marginBottom: 8 }}>🎉</Text>
      <Text style={{ fontWeight: '700', color: '#16A34A', fontSize: 15 }}>Feedback submitted!</Text>
    </View>
  );

  return (
    <View style={[styles.section, { backgroundColor: cardBg, borderColor: border }]}>
      <Text style={[styles.sectionTitle, { color: text }]}>⭐ Rate Your Experience</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map((r) => (
          <TouchableOpacity key={r} onPress={() => setRating(r)}>
            <Text style={{ fontSize: 32, opacity: r <= rating ? 1 : 0.25 }}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FormField
        label="Tell us more (optional)"
        value={feedbackText}
        onChangeText={setFeedbackText}
        multiline
        numberOfLines={3}
      />
      <Button title="Submit Feedback" onPress={submit} size="sm" />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 28, paddingHorizontal: 20 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  statusBadge: {
    marginTop: 12, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  section: { borderRadius: 16, padding: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  addrCard: { borderRadius: 12, padding: 12, marginBottom: 10 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#DC2626', borderRadius: 12, paddingVertical: 14,
  },
});
