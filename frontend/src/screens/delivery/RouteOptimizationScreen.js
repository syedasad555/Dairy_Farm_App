import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const RouteOptimizationScreen = ({ route, navigation }) => {
  const { deliveryId } = route.params;
  const { user, API_URL } = useAuth();
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    optimizeRoute();
  }, [deliveryId]);

  const optimizeRoute = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/deliveries/optimize-route`,
        { orderIds: ['ord1', 'ord2'] }, // In real app, get from delivery
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );

      if (response.data.success) {
        setOptimizedRoute(response.data.data);
      }
    } catch (error) {
      console.error('Error optimizing route:', error);
      // Use dummy data for now
      setOptimizedRoute({
        route: [
          {
            stopNumber: 1,
            address: '123 Main Street, Hyderabad',
            estimatedArrival: new Date(Date.now() + 30 * 60000),
            status: 'pending'
          },
          {
            stopNumber: 2,
            address: '456 Oak Avenue, Hyderabad',
            estimatedArrival: new Date(Date.now() + 60 * 60000),
            status: 'pending'
          },
          {
            stopNumber: 3,
            address: '789 Pine Road, Hyderabad',
            estimatedArrival: new Date(Date.now() + 90 * 60000),
            status: 'pending'
          }
        ],
        totalStops: 3,
        estimatedDuration: 90
      });
    } finally {
      setLoading(false);
    }
  };

  const startNavigation = (stop) => {
    Alert.alert(
      'Start Navigation',
      `Start navigation to ${stop.address}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            // In a real app, open Google Maps or similar
            Alert.alert('Navigation Started', 'Opening navigation...');
          }
        }
      ]
    );
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStop = (stop) => (
    <View key={stop.stopNumber} style={styles.stopCard}>
      <View style={styles.stopHeader}>
        <View style={styles.stopNumber}>
          <Text style={styles.stopNumberText}>{stop.stopNumber}</Text>
        </View>
        <View style={styles.stopInfo}>
          <Text style={styles.stopAddress}>{stop.address}</Text>
          <Text style={styles.stopTime}>
            ETA: {formatTime(stop.estimatedArrival)}
          </Text>
        </View>
        {stop.status === 'completed' && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>✓</Text>
          </View>
        )}
      </View>

      {stop.status !== 'completed' && (
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={() => startNavigation(stop)}
        >
          <Text style={styles.navigateButtonText}>🗺️ Navigate</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Optimizing route...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Optimized Route</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Route Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Route Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{optimizedRoute?.totalStops || 0}</Text>
              <Text style={styles.summaryLabel}>Total Stops</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{optimizedRoute?.estimatedDuration || 0}</Text>
              <Text style={styles.summaryLabel}>Est. Minutes</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{user?.assignedArea?.city || 'N/A'}</Text>
              <Text style={styles.summaryLabel}>Area</Text>
            </View>
          </View>
        </View>

        {/* Route Stops */}
        <View style={styles.stopsContainer}>
          <Text style={styles.stopsTitle}>Delivery Stops</Text>
          
          {optimizedRoute?.route?.map((stop, index) => (
            <View key={stop.stopNumber}>
              {renderStop(stop)}
              {index < optimizedRoute.route.length - 1 && (
                <View style={styles.routeConnector}>
                  <View style={styles.connectorLine} />
                  <Text style={styles.connectorText}>
                    {Math.round((optimizedRoute.estimatedDuration / optimizedRoute.totalStops))} min
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Route Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Delivery Tips</Text>
          <Text style={styles.tipText}>• Follow the optimized route for efficiency</Text>
          <Text style={styles.tipText}>• Call customer before reaching</Text>
          <Text style={styles.tipText}>• Take delivery photo as proof</Text>
          <Text style={styles.tipText}>• Update status after each delivery</Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.startRouteButton}
        onPress={() => {
          if (optimizedRoute?.route?.[0]) {
            startNavigation(optimizedRoute.route[0]);
          }
        }}
      >
        <Text style={styles.startRouteButtonText}>🚀 Start First Delivery</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  stopsContainer: {
    marginBottom: 20,
  },
  stopsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  stopCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stopNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stopNumberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stopInfo: {
    flex: 1,
  },
  stopAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  stopTime: {
    fontSize: 14,
    color: '#666',
  },
  completedBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navigateButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  routeConnector: {
    alignItems: 'center',
    marginVertical: 5,
  },
  connectorLine: {
    width: 2,
    height: 30,
    backgroundColor: '#4CAF50',
  },
  connectorText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  tipsCard: {
    backgroundColor: '#fff9c4',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  startRouteButton: {
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  startRouteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RouteOptimizationScreen;
