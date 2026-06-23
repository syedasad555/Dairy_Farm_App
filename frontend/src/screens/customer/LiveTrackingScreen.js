import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';

const LiveTrackingScreen = ({ route }) => {
  const { orderId } = route.params;
  const { API_URL } = useAuth();
  const { colors } = useTheme();
  const mapRef = useRef(null);
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
        fitMap(response.data.data);
      }
    } catch (error) {
      console.error('Tracking error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fitMap = (data) => {
    const coords = [];
    const destCoords = data.deliveryAddress?.location?.coordinates;
    if (destCoords?.[0] && destCoords?.[1]) {
      coords.push({ latitude: destCoords[1], longitude: destCoords[0] });
    }
    if (data.deliveryPartner?.location) {
      coords.push(data.deliveryPartner.location);
    }
    if (coords.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading live tracking...</Text>
      </View>
    );
  }

  const destCoords = tracking?.deliveryAddress?.location?.coordinates;
  const destLat = destCoords?.[1] || 17.385;
  const destLng = destCoords?.[0] || 78.4867;
  const partnerLoc = tracking?.deliveryPartner?.location;
  const initialRegion = {
    latitude: partnerLoc?.latitude || destLat,
    longitude: partnerLoc?.longitude || destLng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const routeCoords = partnerLoc
    ? [{ latitude: partnerLoc.latitude, longitude: partnerLoc.longitude }, { latitude: destLat, longitude: destLng }]
    : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion} showsUserLocation>
        <Marker coordinate={{ latitude: destLat, longitude: destLng }} title="Delivery Address" pinColor={colors.primary} />
        {partnerLoc && (
          <Marker coordinate={partnerLoc} title={tracking.deliveryPartner.name} description="Delivery Partner">
            <View style={[styles.partnerMarker, { backgroundColor: colors.secondary }]}>
              <Text style={styles.partnerEmoji}>🛵</Text>
            </View>
          </Marker>
        )}
        {routeCoords.length === 2 && (
          <Polyline coordinates={routeCoords} strokeColor={colors.primary} strokeWidth={3} lineDashPattern={[5, 5]} />
        )}
      </MapView>

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
          </View>
        ) : (
          <Text style={{ color: colors.textSecondary }}>Waiting for delivery partner assignment...</Text>
        )}

        <Text style={[styles.eta, { color: colors.textSecondary }]}>
          {partnerLoc ? 'Live location updating every 10 seconds' : 'Partner location not available yet'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { flex: 1 },
  partnerMarker: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  partnerEmoji: { fontSize: 22 },
  infoPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
  },
  orderNumber: { fontSize: 18, fontWeight: '700' },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  partnerInfo: { marginTop: 12 },
  partnerName: { fontSize: 16, fontWeight: '600' },
  partnerPhone: { fontSize: 15, marginTop: 4 },
  eta: { fontSize: 13, marginTop: 8 },
});

export default LiveTrackingScreen;
