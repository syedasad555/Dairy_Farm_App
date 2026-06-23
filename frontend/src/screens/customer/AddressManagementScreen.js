import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const AddressManagementScreen = ({ navigation }) => {
  const { user, refreshUser, API_URL } = useAuth();
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    addressLine: '',
    city: '',
    village: '',
    town: '',
    state: '',
    pincode: '',
    landmark: '',
    isDefault: false
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    const userData = await refreshUser();
    if (userData?.addresses) setAddresses(userData.addresses);
  };

  const handleAddAddress = async () => {
    if (!newAddress.addressLine || !newAddress.city || !newAddress.pincode) {
      Alert.alert('Required Fields', 'Please fill in address line, city, and pincode');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/users/addresses`, newAddress);
      if (response.data.success) {
        setAddresses(response.data.data);
        await refreshUser();
        setNewAddress({ addressLine: '', city: '', village: '', town: '', state: '', pincode: '', landmark: '', isDefault: false });
        setShowAddModal(false);
        Alert.alert('Success', 'Address added successfully');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add address');
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const response = await axios.put(`${API_URL}/users/addresses/${addressId}`, { isDefault: true });
      if (response.data.success) {
        setAddresses(response.data.data);
        await refreshUser();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update default address');
    }
  };

  const handleDeleteAddress = (addressId) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const response = await axios.delete(`${API_URL}/users/addresses/${addressId}`);
            if (response.data.success) {
              setAddresses(response.data.data);
              await refreshUser();
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete address');
          }
        }
      }
    ]);
  };

  const renderAddressCard = (address) => (
    <View key={address._id} style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <Text style={styles.addressType}>
          {address.isDefault ? 'Default Address' : 'Address'}
        </Text>
        {address.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Default</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.addressText}>{address.addressLine}</Text>
      <Text style={styles.addressText}>
        {address.village && `${address.village}, `}
        {address.town && `${address.town}, `}
        {address.city}, {address.state} - {address.pincode}
      </Text>
      {address.landmark && (
        <Text style={styles.landmarkText}>Landmark: {address.landmark}</Text>
      )}
      
      <View style={styles.addressActions}>
        {!address.isDefault && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(address._id)}
          >
            <Text style={styles.actionButtonText}>Set Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteAddress(address._id)}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Addresses</Text>
      </View>

      <ScrollView style={styles.content}>
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>No addresses saved</Text>
            <Text style={styles.emptyText}>Add your delivery address to get started</Text>
          </View>
        ) : (
          addresses.map(renderAddressCard)
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+ Add New Address</Text>
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Address Line *</Text>
              <TextInput
                style={styles.input}
                placeholder="House/Flat No, Street, Area"
                value={newAddress.addressLine}
                onChangeText={(text) => setNewAddress({ ...newAddress, addressLine: text })}
              />

              <Text style={styles.label}>Village (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Village"
                value={newAddress.village}
                onChangeText={(text) => setNewAddress({ ...newAddress, village: text })}
              />

              <Text style={styles.label}>Town (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Town"
                value={newAddress.town}
                onChangeText={(text) => setNewAddress({ ...newAddress, town: text })}
              />

              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={newAddress.city}
                onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
              />

              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                value={newAddress.state}
                onChangeText={(text) => setNewAddress({ ...newAddress, state: text })}
              />

              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={styles.input}
                placeholder="Pincode"
                keyboardType="numeric"
                maxLength={6}
                value={newAddress.pincode}
                onChangeText={(text) => setNewAddress({ ...newAddress, pincode: text })}
              />

              <Text style={styles.label}>Landmark (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Nearby landmark"
                value={newAddress.landmark}
                onChangeText={(text) => setNewAddress({ ...newAddress, landmark: text })}
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setNewAddress({ ...newAddress, isDefault: !newAddress.isDefault })}
              >
                <View style={[styles.checkbox, newAddress.isDefault && styles.checkboxChecked]}>
                  {newAddress.isDefault && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Set as default address</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddAddress}>
              <Text style={styles.saveButtonText}>Save Address</Text>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  addressCard: {
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
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  landmarkText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  addressActions: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
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
    maxHeight: '90%',
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddressManagementScreen;
