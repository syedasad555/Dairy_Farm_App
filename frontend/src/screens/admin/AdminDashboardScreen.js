import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';

const AdminDashboardScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, API_URL, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Use dummy data for now
      setDashboardData({
        totalCustomers: 150,
        pendingApprovals: 12,
        totalProducts: 45,
        totalOrders: 320,
        activeDeliveries: 8,
        deliveredOrders: 290,
        outstandingAmounts: 45000,
        monthlyRevenue: 125000
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: t('totalCustomers', 'Total Customers'),
      value: dashboardData?.totalCustomers || 0,
      icon: '👥',
      color: colors.primary,
      onPress: () => {}
    },
    {
      title: t('pendingApprovals', 'Pending Approvals'),
      value: dashboardData?.pendingApprovals || 0,
      icon: '⏳',
      color: colors.warning,
      onPress: () => navigation.navigate('AdminApprovals')
    },
    {
      title: t('totalProducts', 'Total Products'),
      value: dashboardData?.totalProducts || 0,
      icon: '📦',
      color: colors.info,
      onPress: () => navigation.navigate('AdminProducts')
    },
    {
      title: t('totalOrders', 'Total Orders'),
      value: dashboardData?.totalOrders || 0,
      icon: '🛒',
      color: colors.secondary,
      onPress: () => navigation.navigate('AdminOrders')
    },
    {
      title: t('activeDeliveries', 'Active Deliveries'),
      value: dashboardData?.activeDeliveries || 0,
      icon: '🚚',
      color: colors.info,
      onPress: () => {}
    },
    {
      title: t('deliveredOrders', 'Delivered Orders'),
      value: dashboardData?.deliveredOrders || 0,
      icon: '✅',
      color: colors.success,
      onPress: () => {}
    },
    {
      title: t('outstandingAmount', 'Outstanding Amount'),
      value: `₹${(dashboardData?.outstandingAmounts || 0).toLocaleString()}`,
      icon: '💰',
      color: colors.error,
      onPress: () => navigation.navigate('AdminBilling')
    },
    {
      title: t('monthlyRevenue', 'Monthly Revenue'),
      value: `₹${(dashboardData?.monthlyRevenue || 0).toLocaleString()}`,
      icon: '📈',
      color: colors.primary,
      onPress: () => navigation.navigate('AdminAnalytics')
    }
  ];

  const quickActions = [
    { title: t('approveCustomers', 'Approve Customers'), icon: '✅', screen: 'AdminApprovals' },
    { title: t('manageProducts', 'Manage Products'), icon: '📦', screen: 'AdminProducts' },
    { title: t('viewOrders', 'View Orders'), icon: '🛒', screen: 'AdminOrders' },
    { title: t('managePartners', 'Manage Partners'), icon: '👥', screen: 'AdminDeliveryPartners' },
    { title: t('billing', 'Billing'), icon: '💰', screen: 'AdminBilling' },
    { title: t('analytics', 'Analytics'), icon: '📊', screen: 'AdminAnalytics' }
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loadingDashboard', 'Loading dashboard...')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}> 
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.textLight }]}>{t('adminDashboard')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>{t('farmFreshDairyManagement', 'Farm Fresh Dairy Management')}</Text>
        </View>
        <TouchableOpacity style={[styles.logoutButton, { borderColor: colors.primaryLight, backgroundColor: colors.primaryLight }]} onPress={logout}>
          <Text style={[styles.logoutButtonText, { color: colors.textLight }]}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.statCard, { backgroundColor: colors.surface, borderLeftColor: stat.color, shadowColor: colors.shadow }]}
              onPress={stat.onPress}
            >
              <Text style={[styles.statIcon, { color: stat.color }]}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('quickActions', 'Quick Actions')}</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
                onPress={() => navigation.navigate(action.screen)}
              >
                <Text style={[styles.actionIcon, { color: colors.primary }]}>{action.icon}</Text>
                <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recentActivity', 'Recent Activity')}</Text>
          <View style={[styles.activityCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}> 
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.activityText, { color: colors.text }]}>{t('newCustomerRegistration', 'New customer registration pending approval')}</Text>
              <Text style={[styles.activityTime, { color: colors.textSecondary }]}>2 min ago</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: colors.info }]} />
              <Text style={[styles.activityText, { color: colors.text }]}>{t('orderPlaced', 'Order ORD000320 placed')}</Text>
              <Text style={[styles.activityTime, { color: colors.textSecondary }]}>15 min ago</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.activityText, { color: colors.text }]}>{t('deliveryCompleted', 'Delivery completed for ORD000315')}</Text>
              <Text style={[styles.activityTime, { color: colors.textSecondary }]}>30 min ago</Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: colors.warning }]} />
              <Text style={[styles.activityText, { color: colors.text }]}>{t('monthlyStatementGenerated', 'Monthly statement generated for customer #45')}</Text>
              <Text style={[styles.activityTime, { color: colors.textSecondary }]}>1 hour ago</Text>
            </View>
          </View>
        </View>

        {/* Alerts */}
        {dashboardData?.pendingApprovals > 0 && (
          <View style={[styles.alertCard, { backgroundColor: colors.primaryLight, shadowColor: colors.shadow }]}> 
            <Text style={styles.alertIcon}>⚠️</Text>
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, { color: colors.text }]}>
                {dashboardData.pendingApprovals} {t('pendingApprovals', 'pending approvals')}
              </Text>
              <Text style={[styles.alertText, { color: colors.textSecondary }]}> 
                {t('reviewPendingApprovals', 'Review and approve customer registrations')}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.alertButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('AdminApprovals')}
            >
              <Text style={styles.alertButtonText}>{t('review')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 5,
  },
  logoutButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    borderRadius: 10,
    padding: 18,
    marginBottom: 10,
    marginRight: '2%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionCard: {
    width: '31%',
    borderRadius: 10,
    padding: 18,
    marginBottom: 10,
    marginRight: '2%',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  activityCard: {
    borderRadius: 10,
    padding: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 15,
  },
  activityDotBlue: {
  },
  activityDotGreen: {
  },
  activityDotOrange: {
  },
  activityText: {
    flex: 1,
    fontSize: 14,
  },
  activityTime: {
    fontSize: 12,
  },
  alertCard: {
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  alertIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  alertText: {
    fontSize: 14,
  },
  alertButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AdminDashboardScreen;
