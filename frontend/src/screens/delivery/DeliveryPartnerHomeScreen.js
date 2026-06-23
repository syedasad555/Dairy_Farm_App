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
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const DeliveryPartnerHomeScreen = ({ navigation }) => {
  const { user, API_URL, logout } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [todayDeliveries, setTodayDeliveries] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');

  useEffect(() => {
    fetchDeliveries();
  }, [activeTab]);

  useEffect(() => {
    let interval;
    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const updateLocation = async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          await axios.put(`${API_URL}/users/location`, {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        } catch (e) {}
      };

      await updateLocation();
      interval = setInterval(updateLocation, 30000);
    };

    startLocationTracking();
    return () => { if (interval) clearInterval(interval); };
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      
      switch (activeTab) {
        case 'today':
          endpoint = `${API_URL}/deliveries/today`;
          break;
        case 'pending':
          endpoint = `${API_URL}/deliveries/pending`;
          break;
        case 'completed':
          endpoint = `${API_URL}/deliveries/completed`;
          break;
      }

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      
      if (response.data.success) {
        const deliveries = response.data.data;
        
        if (activeTab === 'today') {
          setTodayDeliveries(deliveries);
        } else if (activeTab === 'pending') {
          setPendingDeliveries(deliveries);
        } else {
          setCompletedDeliveries(deliveries);
        }
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      if (activeTab === 'today') setTodayDeliveries([]);
      else if (activeTab === 'pending') setPendingDeliveries([]);
      else setCompletedDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryStatusColor = (status) => {
    switch (status) {
      case 'assigned':
        return colors.info;
      case 'picked_up':
        return colors.warning;
      case 'in_transit':
        return colors.secondary;
      case 'delivered':
        return colors.success;
      case 'failed':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getDeliveryStatusText = (status) => {
    switch (status) {
      case 'assigned':
        return t('assigned', 'Assigned');
      case 'picked_up':
        return t('pickedUp', 'Picked Up');
      case 'in_transit':
        return t('inTransit', 'In Transit');
      case 'delivered':
        return t('delivered', 'Delivered');
      case 'failed':
        return t('failed', 'Failed');
      default:
        return status;
    }
  };

  const renderDelivery = (delivery) => (
    <TouchableOpacity
      key={delivery._id}
      style={[styles.deliveryCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
      onPress={() => navigation.navigate('DeliveryDetails', { deliveryId: delivery._id })}
    >
      <View style={styles.deliveryHeader}>
        <View>
          <Text style={[styles.orderNumber, { color: colors.text }]}>{delivery.order.orderNumber}</Text>
          <Text style={[styles.customerName, { color: colors.textSecondary }]}>{delivery.order.customer.fullName}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getDeliveryStatusColor(delivery.deliveryStatus) }
        ]}>
          <Text style={styles.statusText}>{getDeliveryStatusText(delivery.deliveryStatus)}</Text>
        </View>
      </View>

      <View style={styles.deliveryInfo}>
        <Text style={[styles.infoLabel, { color: colors.text }]}>{t('addressLabel', '📍 Address')}</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}> 
          {delivery.order.deliveryAddress.addressLine}, {delivery.order.deliveryAddress.city}
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>{t('pincodeLabel', 'Pincode')}: {delivery.order.deliveryAddress.pincode}</Text>
      </View>

      <View style={styles.deliveryInfo}>
        <Text style={[styles.infoLabel, { color: colors.text }]}>{t('contactLabel', '📞 Contact')}</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>{delivery.order.customer.mobileNumber}</Text>
      </View>

      <View style={styles.deliveryFooter}>
        <Text style={[styles.amount, { color: colors.success }]}>₹{delivery.order.finalAmount}</Text>
        <TouchableOpacity
          style={[styles.navigateButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('RouteOptimization', { deliveryId: delivery._id })}
        >
          <Text style={[styles.navigateButtonText, { color: colors.textLight }]}>{t('navigate', 'Navigate')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const getActiveDeliveries = () => {
    switch (activeTab) {
      case 'today':
        return todayDeliveries;
      case 'pending':
        return pendingDeliveries;
      case 'completed':
        return completedDeliveries;
      default:
        return todayDeliveries;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logoutConfirmTitle', 'Logout'),
      t('logoutConfirmText', 'Are you sure you want to logout?'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('logout'), style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.primary }]}> 
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textLight }]}>{t('deliveries')}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textLight }]}> 
              {t('greeting', { name: user?.fullName?.split(' ')[0] || '' })} · {user?.assignedArea?.city || t('yourArea', 'Your Area')}
            </Text>
          </View>
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight }]} onPress={handleLogout}>
            <Text style={[styles.logoutText, { color: colors.textLight }]}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}> 
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{todayDeliveries.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('today')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{pendingDeliveries.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('pending')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{completedDeliveries.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('completed')}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}> 
        {['today', 'pending', 'completed'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && [styles.activeTab, { backgroundColor: colors.primary }],
              { borderColor: colors.border }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab ? [styles.activeTabText, { color: colors.textLight }] : { color: colors.textSecondary }
            ]}>
              {t(tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loadingDeliveries', 'Loading deliveries...')}</Text>
          </View>
        ) : getActiveDeliveries().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noDeliveries', 'No deliveries')}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}> 
              {activeTab === 'completed' ? t('noCompletedDeliveries', 'No completed deliveries yet') : t('noPendingDeliveries', 'No pending deliveries')}
            </Text>
          </View>
        ) : (
          getActiveDeliveries().map(renderDelivery)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    margin: 15,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    padding: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  deliveryCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  customerName: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deliveryInfo: {
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 3,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 15,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  navigateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  navigateButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DeliveryPartnerHomeScreen;
