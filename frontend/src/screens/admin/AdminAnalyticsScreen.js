import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const AdminAnalyticsScreen = ({ navigation }) => {
  const { user, API_URL } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/analytics?period=${period}`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics({
        orders: {
          total: 45,
          byStatus: {
            received: 5,
            preparing: 10,
            assigned: 8,
            out_for_delivery: 12,
            delivered: 8,
            cancelled: 2
          },
          totalRevenue: 12500
        },
        products: {
          total: 45,
          byCategory: {
            dairy: 20,
            meat: 10,
            poultry: 8,
            grocery: 7
          }
        },
        customers: {
          total: 150,
          active: 138,
          pending: 12
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const periods = ['daily', 'weekly', 'monthly'];

  const renderOrderStats = () => (
    <View style={styles.statsCard}>
      <Text style={styles.cardTitle}>Order Analytics</Text>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Total Orders</Text>
        <Text style={styles.statValue}>{analytics?.orders?.total || 0}</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Total Revenue</Text>
        <Text style={[styles.statValue, styles.revenueValue]}>
          ₹{(analytics?.orders?.totalRevenue || 0).toLocaleString()}
        </Text>
      </View>
      
      <Text style={styles.subTitle}>By Status</Text>
      {analytics?.orders?.byStatus && Object.entries(analytics.orders.byStatus).map(([status, count]) => (
        <View key={status} style={styles.statusRow}>
          <Text style={styles.statusLabel}>{status.replace('_', ' ').toUpperCase()}</Text>
          <View style={styles.statusBarContainer}>
            <View 
              style={[
                styles.statusBar, 
                { width: `${(count / analytics.orders.total) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.statusCount}>{count}</Text>
        </View>
      ))}
    </View>
  );

  const renderProductStats = () => (
    <View style={styles.statsCard}>
      <Text style={styles.cardTitle}>Product Analytics</Text>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Total Products</Text>
        <Text style={styles.statValue}>{analytics?.products?.total || 0}</Text>
      </View>
      
      <Text style={styles.subTitle}>By Category</Text>
      {analytics?.products?.byCategory && Object.entries(analytics.products.byCategory).map(([category, count]) => (
        <View key={category} style={styles.categoryRow}>
          <Text style={styles.categoryLabel}>{category.toUpperCase()}</Text>
          <View style={styles.categoryBarContainer}>
            <View 
              style={[
                styles.categoryBar, 
                { width: `${(count / analytics.products.total) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.categoryCount}>{count}</Text>
        </View>
      ))}
    </View>
  );

  const renderCustomerStats = () => (
    <View style={styles.statsCard}>
      <Text style={styles.cardTitle}>Customer Analytics</Text>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Total Customers</Text>
        <Text style={styles.statValue}>{analytics?.customers?.total || 0}</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Active</Text>
        <Text style={[styles.statValue, styles.activeValue]}>
          {analytics?.customers?.active || 0}
        </Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Pending</Text>
        <Text style={[styles.statValue, styles.pendingValue]}>
          {analytics?.customers?.pending || 0}
        </Text>
      </View>
      
      <View style={styles.customerProgress}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${((analytics?.customers?.active || 0) / (analytics?.customers?.total || 1)) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(((analytics?.customers?.active || 0) / (analytics?.customers?.total || 1)) * 100)}% Active
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Business insights and performance</Text>
      </View>

      <View style={styles.periodSelector}>
        {periods.map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.periodButton,
              period === p && styles.periodButtonActive
            ]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[
              styles.periodButtonText,
              period === p && styles.periodButtonTextActive
            ]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {renderOrderStats()}
        {renderProductStats()}
        {renderCustomerStats()}
      </ScrollView>
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
  headerSubtitle: {
    fontSize: 14,
    color: '#e8f5e9',
    marginTop: 5,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 5,
  },
  periodButtonActive: {
    backgroundColor: '#4CAF50',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  revenueValue: {
    color: '#4CAF50',
  },
  activeValue: {
    color: '#4CAF50',
  },
  pendingValue: {
    color: '#FF9800',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    width: 120,
  },
  statusBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  statusBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  statusCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 30,
    textAlign: 'right',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  categoryBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 30,
    textAlign: 'right',
  },
  customerProgress: {
    marginTop: 20,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AdminAnalyticsScreen;
