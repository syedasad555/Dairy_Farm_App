import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  ScrollView
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';

const LiveTrackingScreen = ({ route }) => {
  const { orderId } = route.params;
  const { API_URL } = useAuth();
  const { colors } = useTheme();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchTracking = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}/tracking`);
      if (response.data.success) {
        setTracking(response.data.data);
      }
    } catch (error) {
      console.error('Tracking error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openInGoogleMaps = () => {
    const destCoords = tracking?.deliveryAddress?.location?.coordinates;
    const partnerLoc = tracking?.deliveryPartner?.location;
    const lat = partnerLoc?.latitude || destCoords?.[1] || 17.385;
    const lng = partnerLoc?.longitude || destCoords?.[0] || 78.4867;
    Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading live tracking...</Text>
      </View>
    );
  }

  const partnerLoc = tracking?.deliveryPartner?.location;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.mapPlaceholder, { backgroundColor: colors.primary + '15' }]}>
        <Text style={styles.mapEmoji}>🗺️</Text>
        <Text style={[styles.mapNote, { color: colors.textSecondary }]}>
          Live map is available on the mobile app. On web, use the button below to open Google Maps.
        </Text>
        <TouchableOpacity style={[styles.mapsBtn, { backgroundColor: colors.primary }]} onPress={openInGoogleMaps}>
          <Text style={styles.mapsBtnText}>Open in Google Maps</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoPanel, { backgroundColor: colors.surface }]}>
        <Text style={[styles.orderNumber, { color: colors.text }]}>{tracking?.orderNumber}</Text>
        <View style={[styles.statusPill, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.statusText, { color: colors.primary }]}>
            {tracking?.orderStatus?.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>

        {tracking?.deliveryPartner ? (
          <View style={styles.partnerInfo}>
            <Text style={[styles.partnerName, { color: colors.text }]}>🛵 {tracking.deliveryPartner.name}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${tracking.deliveryPartner.mobile}`)}>
              <Text style={[styles.partnerPhone, { color: colors.primary }]}>📞 {tracking.deliveryPartner.mobile}</Text>
            </TouchableOpacity>
            {partnerLoc && (
              <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                Partner location: {partnerLoc.latitude.toFixed(4)}, {partnerLoc.longitude.toFixed(4)}
              </Text>
            )}
          </View>
        ) : (
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Waiting for delivery partner assignment...</Text>
        )}

        <Text style={[styles.eta, { color: colors.textSecondary }]}>
          {partnerLoc ? 'Location updates every 10 seconds' : 'Partner location not available yet'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 },
  mapPlaceholder: { margin: 16, padding: 32, borderRadius: 16, alignItems: 'center' },
  mapEmoji: { fontSize: 48, marginBottom: 12 },
  mapNote: { textAlign: 'center', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  mapsBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  mapsBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  infoPanel: { margin: 16, marginTop: 0, padding: 20, borderRadius: 16, elevation: 2 },
  orderNumber: { fontSize: 18, fontWeight: '700' },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  partnerInfo: { marginTop: 12 },
  partnerName: { fontSize: 16, fontWeight: '600' },
  partnerPhone: { fontSize: 15, marginTop: 4 },
  eta: { fontSize: 13, marginTop: 12 },
});

export default LiveTrackingScreen;
