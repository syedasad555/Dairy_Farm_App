import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const AdminBillingScreen = ({ navigation }) => {
  const { user, API_URL } = useAuth();
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    fetchStatements();
  }, []);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/billing`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      
      if (response.data.success) {
        setStatements(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statements:', error);
      setStatements([
        {
          _id: '1',
          statementNumber: 'STMT000001',
          customer: { fullName: 'John Doe', mobileNumber: '9876543210' },
          month: 6,
          year: 2026,
          totalAmount: 2500,
          paidAmount: 1500,
          pendingAmount: 1000,
          paymentStatus: 'partial',
          dueDate: new Date('2026-07-15')
        },
        {
          _id: '2',
          statementNumber: 'STMT000002',
          customer: { fullName: 'Jane Smith', mobileNumber: '9876543211' },
          month: 5,
          year: 2026,
          totalAmount: 1800,
          paidAmount: 1800,
          pendingAmount: 0,
          paymentStatus: 'paid',
          dueDate: new Date('2026-06-15')
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#4CAF50';
      case 'partial':
        return '#FF9800';
      case 'unpaid':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const handleRecordPayment = (statement) => {
    setSelectedStatement(statement);
    setPaymentAmount('');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const submitPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/billing/${selectedStatement._id}/payment`,
        {
          amount: parseFloat(paymentAmount),
          paymentMethod: 'Cash',
          notes: paymentNotes
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );

      if (response.data.success) {
        setShowPaymentModal(false);
        fetchStatements();
        Alert.alert('Success', 'Payment recorded successfully');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', 'Failed to record payment');
    }
  };

  const renderStatement = (statement) => (
    <View key={statement._id} style={styles.statementCard}>
      <View style={styles.statementHeader}>
        <View>
          <Text style={styles.statementNumber}>{statement.statementNumber}</Text>
          <Text style={styles.customerName}>{statement.customer.fullName}</Text>
          <Text style={styles.customerPhone}>{statement.customer.mobileNumber}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getPaymentStatusColor(statement.paymentStatus) }
        ]}>
          <Text style={styles.statusText}>
            {statement.paymentStatus.charAt(0).toUpperCase() + statement.paymentStatus.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.statementDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Period</Text>
          <Text style={styles.detailValue}>
            {getMonthName(statement.month)} {statement.year}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={styles.detailValue}>₹{statement.totalAmount}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Paid</Text>
          <Text style={[styles.detailValue, styles.paidValue]}>₹{statement.paidAmount}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Pending</Text>
          <Text style={[styles.detailValue, styles.pendingValue]}>₹{statement.pendingAmount}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Due Date</Text>
          <Text style={styles.detailValue}>
            {new Date(statement.dueDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {statement.paymentStatus !== 'paid' && (
        <TouchableOpacity
          style={styles.paymentButton}
          onPress={() => handleRecordPayment(statement)}
        >
          <Text style={styles.paymentButtonText}>Record Payment</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading billing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Billing Management</Text>
        <Text style={styles.headerSubtitle}>
          Outstanding: ₹{statements.reduce((sum, s) => sum + s.pendingAmount, 0).toLocaleString()}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {statements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyTitle}>No billing statements</Text>
            <Text style={styles.emptyText}>Monthly statements will appear here</Text>
          </View>
        ) : (
          statements.map(renderStatement)
        )}
      </ScrollView>

      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Statement</Text>
              <Text style={styles.statementInfo}>
                {selectedStatement?.statementNumber} - {selectedStatement?.customer?.fullName}
              </Text>
              <Text style={styles.pendingInfo}>
                Pending: ₹{selectedStatement?.pendingAmount}
              </Text>

              <Text style={styles.label}>Payment Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
              />

              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Add payment notes"
                value={paymentNotes}
                onChangeText={setPaymentNotes}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={submitPayment}>
              <Text style={styles.submitButtonText}>Record Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statementCard: {
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
  statementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  statementNumber: {
    fontSize: 16,
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
  statementDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paidValue: {
    color: '#4CAF50',
  },
  pendingValue: {
    color: '#FF9800',
  },
  paymentButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  statementInfo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  pendingInfo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AdminBillingScreen;
