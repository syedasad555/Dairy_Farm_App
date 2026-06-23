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
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const AdminApprovalsScreen = ({ navigation }) => {
  const { user, API_URL } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/pending-approvals`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      
      if (response.data.success) {
        setPendingUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      // Use dummy data for now
      setPendingUsers([
        {
          _id: '1',
          fullName: 'John Doe',
          mobileNumber: '9876543210',
          email: 'john@example.com',
          addresses: [{ addressLine: '123 Main St', city: 'Hyderabad', pincode: '500001' }],
          preferredLanguage: 'english',
          createdAt: new Date()
        },
        {
          _id: '2',
          fullName: 'Priya Sharma',
          mobileNumber: '9876543211',
          email: 'priya@example.com',
          addresses: [{ addressLine: '456 Oak Ave', city: 'Hyderabad', pincode: '500002' }],
          preferredLanguage: 'telugu',
          createdAt: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    Alert.alert(
      t('approveCustomer', 'Approve Customer'),
      t('approveCustomerConfirm', 'Are you sure you want to approve this customer?'),
      [
        { text: t('cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('approve', 'Approve'),
          onPress: async () => {
            try {
              const response = await axios.put(
                `${API_URL}/admin/approve-customer/${userId}`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${user.token}`
                  }
                }
              );

              if (response.data.success) {
                setPendingUsers(pendingUsers.filter(user => user._id !== userId));
                Alert.alert(t('success', 'Success'), t('customerApproved', 'Customer approved successfully'));
              }
            } catch (error) {
              console.error('Error approving customer:', error);
              Alert.alert(t('error', 'Error'), t('customerApproveFailed', 'Failed to approve customer'));
            }
          }
        }
      ]
    );
  };

  const handleReject = async (userId) => {
    Alert.alert(
      t('rejectCustomer', 'Reject Customer'),
      t('rejectCustomerConfirm', 'Are you sure you want to reject this customer?'),
      [
        { text: t('cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('reject', 'Reject'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.put(
                `${API_URL}/admin/reject-customer/${userId}`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${user.token}`
                  }
                }
              );

              if (response.data.success) {
                setPendingUsers(pendingUsers.filter(user => user._id !== userId));
                Alert.alert(t('success', 'Success'), t('customerRejected', 'Customer rejected successfully'));
              }
            } catch (error) {
              console.error('Error rejecting customer:', error);
              Alert.alert(t('error', 'Error'), t('customerRejectFailed', 'Failed to reject customer'));
            }
          }
        }
      ]
    );
  };

  const renderUserCard = (user) => (
    <View key={user._id} style={[styles.userCard, { backgroundColor: colors.surface, shadowColor: colors.shadow, borderColor: colors.border }]}> 
      <View style={styles.userHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }] }>
          <Text style={styles.avatarText}>{user.fullName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>{user.fullName}</Text>
          <Text style={[styles.userPhone, { color: colors.textSecondary }]}>{user.mobileNumber}</Text>
          {user.email && <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user.email}</Text>}
        </View>
        <View style={[styles.languageBadge, { backgroundColor: colors.primaryLight }] }>
          <Text style={[styles.languageText, { color: colors.textLight }]}>{user.preferredLanguage.toUpperCase()}</Text>
        </View>
      </View>

      <View style={[styles.addressSection, { backgroundColor: colors.inputBg }]}> 
        <Text style={[styles.addressLabel, { color: colors.text }]}>{t('addressLabel', '📍 Address')}</Text>
        <Text style={[styles.addressText, { color: colors.textSecondary }]}> {user.addresses[0]?.addressLine}, {user.addresses[0]?.city}</Text>
        <Text style={[styles.addressText, { color: colors.textSecondary }]}>{t('pincodeLabel', 'Pincode')}: {user.addresses[0]?.pincode}</Text>
      </View>

      <View style={styles.userFooter}>
        <Text style={[styles.registeredDate, { color: colors.textSecondary }]}> {t('registered', 'Registered')}: {new Date(user.createdAt).toLocaleDateString()}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(user._id)}
          >
            <Text style={styles.rejectButtonText}>{t('reject', 'Reject')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(user._id)}
          >
            <Text style={styles.approveButtonText}>{t('approve', 'Approve')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('loadingPendingApprovals', 'Loading pending approvals...')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.primary }]}> 
        <Text style={[styles.headerTitle, { color: colors.textLight }]}>{t('accountApprovals', 'Account Approvals')}</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>{pendingUsers.length} {t('pendingApprovals', 'pending approvals')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {pendingUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('allCaughtUp', 'All caught up!')}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noPendingApprovals', 'No pending customer approvals')}</Text>
          </View>
        ) : (
          pendingUsers.map(renderUserCard)
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
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  userCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  languageBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  languageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  addressSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  userFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  registeredDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  rejectButtonText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: 'bold',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AdminApprovalsScreen;
