import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';

const DeliveryDetailsScreen = ({ route, navigation }) => {
  const { deliveryId } = route.params;
  const { user, API_URL } = useAuth();
  const { colors } = useTheme();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);
  const [gpsCoordinates, setGpsCoordinates] = useState({ latitude: null, longitude: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDeliveryDetails();
  }, [deliveryId]);

  const fetchDeliveryDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/deliveries/${deliveryId}`);
      if (response.data.success) {
        setDelivery(response.data.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load delivery details');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (newStatus) => {
    try {
      const response = await axios.put(`${API_URL}/deliveries/${deliveryId}/status`, { deliveryStatus: newStatus });
      if (response.data.success) {
        setDelivery(prev => ({ ...prev, deliveryStatus: newStatus }));
        Alert.alert('Success', `Status updated to ${newStatus.replace(/_/g, ' ')}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      base64: true,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setDeliveryPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Location permission is needed');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setGpsCoordinates({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

    await axios.put(`${API_URL}/users/location`, {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
    if (deliveryId) {
      await axios.put(`${API_URL}/deliveries/${deliveryId}/location`, {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    }
    Alert.alert('Location Updated', 'GPS coordinates captured');
  };

  const submitDeliveryProof = async () => {
    if (!deliveryPhoto) {
      Alert.alert('Photo Required', 'Please take a delivery photo');
      return;
    }
    if (!gpsCoordinates.latitude) {
      Alert.alert('GPS Required', 'Please capture your current location');
      return;
    }

    setSubmitting(true);
    try {
      const orderId = delivery.order?._id || delivery.order;
      const response = await axios.put(`${API_URL}/orders/${orderId}/delivery-proof`, {
        image: deliveryPhoto,
        gpsCoordinates: {
          latitude: gpsCoordinates.latitude,
          longitude: gpsCoordinates.longitude,
        },
      });
      if (response.data.success) {
        setShowPhotoModal(false);
        Alert.alert('Success', 'Delivery completed successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit proof');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const map = { assigned: colors.info, picked_up: colors.warning, in_transit: '#9C27B0', delivered: colors.success, failed: colors.error };
    return map[status] || colors.textSecondary;
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!delivery?.order) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Delivery not found</Text>
      </View>
    );
  }

  const order = delivery.order;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Delivery Details</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.deliveryStatus) }]}>
          <Text style={styles.statusText}>{delivery.deliveryStatus.replace(/_/g, ' ').toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order #{order.orderNumber}</Text>
          <Text style={[styles.amount, { color: colors.primary }]}>₹{order.finalAmount}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer</Text>
          <Text style={[styles.customerName, { color: colors.text }]}>{order.customer?.fullName}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.customer?.mobileNumber}`)}>
            <Text style={[styles.phone, { color: colors.primary }]}>📞 {order.customer?.mobileNumber}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📍 Delivery Address</Text>
          <Text style={{ color: colors.textSecondary }}>{order.deliveryAddress?.addressLine}</Text>
          <Text style={{ color: colors.textSecondary }}>{order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Items</Text>
          {order.items?.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={{ color: colors.text, flex: 1 }}>{item.product?.name || 'Product'}</Text>
              <Text style={{ color: colors.textSecondary }}>×{item.quantity}</Text>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>₹{item.totalPrice || item.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        {delivery.deliveryStatus === 'assigned' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => updateDeliveryStatus('in_transit')}>
            <Text style={styles.actionBtnText}>🚀 Start Delivery</Text>
          </TouchableOpacity>
        )}

        {delivery.deliveryStatus === 'in_transit' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={() => setShowPhotoModal(true)}>
            <Text style={styles.actionBtnText}>✅ Complete Delivery</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={showPhotoModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delivery Proof</Text>

            <TouchableOpacity style={[styles.photoBtn, { borderColor: colors.primary }]} onPress={takePhoto}>
              {deliveryPhoto ? (
                <Image source={{ uri: deliveryPhoto }} style={styles.photoPreview} />
              ) : (
                <Text style={{ color: colors.primary, fontWeight: '600' }}>📷 Take Delivery Photo</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.locationBtn, { backgroundColor: colors.info }]} onPress={getCurrentLocation}>
              <Text style={styles.locationBtnText}>
                {gpsCoordinates.latitude ? `📍 ${gpsCoordinates.latitude.toFixed(4)}, ${gpsCoordinates.longitude.toFixed(4)}` : '📍 Get Current Location'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }, submitting && { opacity: 0.6 }]}
              onPress={submitDeliveryProof}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit & Complete</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPhotoModal(false)}>
              <Text style={{ color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  content: { flex: 1, padding: 16 },
  section: { padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  amount: { fontSize: 24, fontWeight: '700' },
  customerName: { fontSize: 17, fontWeight: '600' },
  phone: { fontSize: 15, marginTop: 4 },
  itemRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  actionBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  actionBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  photoBtn: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, padding: 30, alignItems: 'center', marginBottom: 12 },
  photoPreview: { width: 200, height: 150, borderRadius: 8 },
  locationBtn: { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  locationBtnText: { color: '#fff', fontWeight: '600' },
  submitBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cancelBtn: { padding: 14, alignItems: 'center', marginTop: 8 },
});

export default DeliveryDetailsScreen;
