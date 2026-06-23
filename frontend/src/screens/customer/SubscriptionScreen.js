import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';

const SCHEDULES = [
  { value: 'daily', label: 'Daily' },
  { value: 'alternate_day', label: 'Alternate Days' },
  { value: 'weekly', label: 'Weekly' },
];

const SubscriptionScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, API_URL, refreshUser } = useAuth();
  const { colors } = useTheme();
  const [subscriptions, setSubscriptions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    productId: '', variant: '', quantity: '1', deliverySchedule: 'daily'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subRes, prodRes] = await Promise.all([
        axios.get(`${API_URL}/subscriptions`),
        axios.get(`${API_URL}/products?category=dairy`)
      ]);
      if (subRes.data.success) setSubscriptions(subRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.productId) {
      Alert.alert(t('error', 'Error'), t('pleaseSelectProduct', 'Please select a product'));
      return;
    }
    if (!form.variant) {
      Alert.alert(t('error', 'Error'), t('pleaseSelectVariant', 'Please select a variant'));
      return;
    }
    const quantityInt = parseInt(form.quantity) || 0;
    if (quantityInt <= 0) {
      Alert.alert(t('error', 'Error'), t('quantityAtLeastOne', 'Quantity must be at least 1'));
      return;
    }
    const userData = await refreshUser();
    const defaultAddr = userData?.addresses?.find(a => a.isDefault) || userData?.addresses?.[0];
    if (!defaultAddr) {
      Alert.alert(t('addressRequired', 'Address Required'), t('addressRequired', 'Please add a delivery address first'));
      return;
    }
    try {
      await axios.post(`${API_URL}/subscriptions`, {
        productId: form.productId,
        variant: form.variant,
        quantity: quantityInt,
        deliverySchedule: form.deliverySchedule,
        deliveryAddress: defaultAddr,
        startDate: new Date().toISOString(),
      });
      setShowModal(false);
      loadData();
      Alert.alert('Success', 'Milk subscription created!');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to create subscription');
    }
  };

  const handleCancel = (id) => {
    Alert.alert('Cancel Subscription', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes', style: 'destructive',
        onPress: async () => {
          await axios.put(`${API_URL}/subscriptions/${id}/status`, { status: 'cancelled' });
          loadData();
        }
      }
    ]);
  };

  const selectedProduct = products.find(p => p._id === form.productId);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: colors.primary }]}> 
          <Text style={styles.heroEmoji}>🥛</Text>
          <Text style={[styles.heroTitle, { color: colors.textLight }]}>{t('milkSubscriptions', 'Milk Subscriptions')}</Text>
          <Text style={[styles.heroSub, { color: colors.textLight }]}>{t('milkSubscriptionSub', 'Daily fresh milk delivered to your doorstep')}</Text>
        </View>

        {subscriptions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active subscriptions</Text>
          </View>
        ) : (
          subscriptions.map(sub => (
            <View key={sub._id} style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{sub.product?.name}</Text>
              <Text style={{ color: colors.textSecondary }}>{sub.variant} × {sub.quantity} — {sub.deliverySchedule}</Text>
              <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 4 }}>₹{sub.pricePerDelivery}/delivery</Text>
              <View style={[styles.statusBadge, { backgroundColor: sub.status === 'active' ? colors.success + '30' : colors.error + '30' }]}>
                <Text style={{ color: sub.status === 'active' ? colors.success : colors.error, fontWeight: '600' }}>{t(sub.status, sub.status)}</Text>
              </View>
              {sub.status === 'active' && (
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.error }]} onPress={() => handleCancel(sub._id)}>
                  <Text style={{ color: colors.error }}>{t('cancel')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowModal(true)}>
        <Text style={styles.addBtnText}>+ {t('newSubscription')}</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('subscribeToMilkDelivery', 'Subscribe to Milk Delivery')}</Text>
            <ScrollView>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Select Product</Text>
              {products.map(p => (
                <TouchableOpacity
                  key={p._id}
                  style={[styles.productOption, form.productId === p._id && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
                  onPress={() => setForm({ ...form, productId: p._id, variant: p.variants[0]?.size || '' })}
                >
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{p.name}</Text>
                </TouchableOpacity>
              ))}
              {selectedProduct && (
                <>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('variant', 'Variant')}</Text>
                  <View style={styles.variantRow}>
                    {selectedProduct.variants.map(v => (
                      <TouchableOpacity
                        key={v.size}
                        style={[styles.variantChip, form.variant === v.size && { backgroundColor: colors.primary }]}
                        onPress={() => setForm({ ...form, variant: v.size })}
                      >
                        <Text style={{ color: form.variant === v.size ? colors.textLight : colors.text }}>{v.size}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('schedule', 'Schedule')}</Text>
              {SCHEDULES.map(s => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.scheduleOption, form.deliverySchedule === s.value && { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                  onPress={() => setForm({ ...form, deliverySchedule: s.value })}
                >
                  <Text style={{ color: colors.text }}>{s.label}</Text>
                </TouchableOpacity>
              ))}
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('quantity', 'Quantity')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                keyboardType="numeric"
                value={form.quantity}
                onChangeText={t => setForm({ ...form, quantity: t })}
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowModal(false)}>
                <Text style={{ color: colors.textSecondary }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleCreate}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{t('subscribe')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: 100 },
  hero: { padding: 24, alignItems: 'center', marginBottom: 16 },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 22, fontWeight: '700', marginTop: 8 },
  heroSub: { fontSize: 14, marginTop: 4 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16 },
  card: { margin: 16, marginTop: 0, padding: 16, borderRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 17, fontWeight: '600' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginTop: 8 },
  cancelBtn: { marginTop: 10, padding: 8, borderWidth: 1, borderRadius: 8, alignItems: 'center' },
  addBtn: { position: 'absolute', bottom: 20, left: 20, right: 20, padding: 16, borderRadius: 12, alignItems: 'center' },
  addBtnText: { fontSize: 17, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  productOption: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 6 },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  scheduleOption: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelModalBtn: { flex: 1, padding: 14, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
});

export default SubscriptionScreen;
