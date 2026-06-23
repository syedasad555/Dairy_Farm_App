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

const AdminOrdersScreen = ({ navigation }) => {
  const { user, API_URL } = useAuth();
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchOrders();
    fetchPartners();
  }, [activeTab]);

  const fetchPartners = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/delivery-partners`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.data.success) setPartners(response.data.data);
    } catch (e) {}
  };

  const handleAssignPartner = (orderId) => {
    if (partners.length === 0) {
      Alert.alert('No Partners', 'Please add delivery partners first');
      return;
    }
    Alert.alert('Assign Delivery Partner', 'Select a partner', [
      ...partners.map(p => ({
        text: `${p.fullName} (${p.assignedArea?.area || 'N/A'})`,
        onPress: () => assignPartner(orderId, p._id),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const assignPartner = async (orderId, partnerId) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}/assign`, { deliveryPartnerId: partnerId }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchOrders();
      Alert.alert('Success', 'Delivery partner assigned');
    } catch (e) {
      Alert.alert('Error', 'Failed to assign partner');
    }
  };

  const handleUpdateStatus = (orderId, status) => {
    Alert.alert('Update Status', `Mark as ${status}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await axios.put(`${API_URL}/orders/${orderId}/status`, { orderStatus: status }, {
              headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchOrders();
          } catch (e) {
            Alert.alert('Error', 'Failed to update status');
          }
        }
      }
    ]);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/orders`;
      if (activeTab !== 'all') {
        url += `?status=${activeTab}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'received':
        return '#2196F3';
      case 'preparing':
        return '#FF9800';
      case 'assigned':
        return '#9C27B0';
      case 'out_for_delivery':
        return '#FF5722';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getOrderStatusText = (status) => {
    switch (status) {
      case 'received':
        return 'Received';
      case 'preparing':
        return 'Preparing';
      case 'assigned':
        return 'Assigned';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const tabs = ['all', 'received', 'preparing', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'];

  const renderOrder = (order) => (
    <View key={order._id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.customerName}>{order.customer.fullName}</Text>
          <Text style={styles.customerPhone}>{order.customer.mobileNumber}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getOrderStatusColor(order.orderStatus) }
        ]}>
          <Text style={styles.statusText}>{getOrderStatusText(order.orderStatus)}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.items.slice(0, 2).map((item, index) => (
          <Text key={index} style={styles.itemText}>
            {item.product.name} × {item.quantity}
          </Text>
        ))}
        {order.items.length > 2 && (
          <Text style={styles.moreItemsText}>+{order.items.length - 2} more items</Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.amount}>₹{order.finalAmount}</Text>
        <Text style={styles.date}>{new Date(order.createdAt).toLocaleDateString()}</Text>
      </View>
      {['received', 'preparing'].includes(order.orderStatus) && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus(order._id, 'preparing')}>
            <Text style={styles.actionBtnText}>Preparing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.assignBtn]} onPress={() => handleAssignPartner(order._id)}>
            <Text style={styles.actionBtnText}>Assign Partner</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order Management</Text>
        <Text style={styles.headerSubtitle}>{orders.length} orders</Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No orders</Text>
            <Text style={styles.emptyText}>No orders found for this status</Text>
          </View>
        ) : (
          orders.map(renderOrder)
        )}
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
  tabsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 15,
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
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
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
  orderItems: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  itemText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  moreItemsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, backgroundColor: '#FF9800', padding: 10, borderRadius: 8, alignItems: 'center' },
  assignBtn: { backgroundColor: '#2196F3' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

export default AdminOrdersScreen;
