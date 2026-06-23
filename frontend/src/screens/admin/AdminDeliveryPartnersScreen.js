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

const AdminDeliveryPartnersScreen = ({ navigation }) => {
  const { user, API_URL } = useAuth();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [resetPartnerId, setResetPartnerId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [newPartner, setNewPartner] = useState({
    fullName: '', mobileNumber: '', password: 'partner123',
    vehicleNumber: '', vehicleType: 'Bike',
    area: '', city: '', radius: '5'
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/delivery-partners`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      
      if (response.data.success) {
        setPartners(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching delivery partners:', error);
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPartner = async () => {
    if (!newPartner.fullName || !newPartner.mobileNumber || newPartner.mobileNumber.length !== 10) {
      Alert.alert('Error', 'Please fill name and valid 10-digit mobile number');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/admin/delivery-partners`, {
        fullName: newPartner.fullName,
        mobileNumber: newPartner.mobileNumber,
        password: newPartner.password,
        vehicleNumber: newPartner.vehicleNumber,
        vehicleType: newPartner.vehicleType,
        assignedArea: {
          area: newPartner.area,
          city: newPartner.city,
          radius: parseFloat(newPartner.radius) || 5,
        },
      }, { headers: { Authorization: `Bearer ${user.token}` } });

      if (response.data.success) {
        setShowAddModal(false);
        setNewPartner({ fullName: '', mobileNumber: '', password: 'partner123', vehicleNumber: '', vehicleType: 'Bike', area: '', city: '', radius: '5' });
        fetchPartners();
        Alert.alert('Success', 'Delivery partner created successfully');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create partner');
    }
  };

  const handleDeletePartner = (partnerId) => {
    Alert.alert(
      'Delete Delivery Partner',
      'Are you sure you want to delete this delivery partner?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${API_URL}/admin/delivery-partners/${partnerId}`,
                {
                  headers: {
                    Authorization: `Bearer ${user.token}`
                  }
                }
              );

              if (response.data.success) {
                setPartners(partners.filter(p => p._id !== partnerId));
                Alert.alert('Success', 'Delivery partner deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting partner:', error);
              Alert.alert('Error', 'Failed to delete delivery partner');
            }
          }
        }
      ]
    );
  };

  const handleResetPassword = (partnerId) => {
    setResetPartnerId(partnerId);
    setNewPassword('');
    setShowResetModal(true);
  };

  const confirmResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    try {
      const response = await axios.put(
        `${API_URL}/admin/delivery-partners/${resetPartnerId}/reset-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (response.data.success) {
        setShowResetModal(false);
        setResetPartnerId(null);
        setNewPassword('');
        Alert.alert('Success', 'Password reset successfully');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reset password');
    }
  };

  const openEditModal = (partner) => {
    setEditingPartner({
      _id: partner._id,
      fullName: partner.fullName,
      mobileNumber: partner.mobileNumber,
      vehicleNumber: partner.vehicleNumber || '',
      vehicleType: partner.vehicleType || 'Bike',
      area: partner.assignedArea?.area || '',
      city: partner.assignedArea?.city || '',
      village: partner.assignedArea?.village || '',
      town: partner.assignedArea?.town || '',
      radius: String(partner.assignedArea?.radius || 5),
      status: partner.status || 'active',
    });
    setShowEditModal(true);
  };

  const handleEditPartner = async () => {
    if (!editingPartner?.fullName) {
      Alert.alert('Error', 'Full name is required');
      return;
    }
    try {
      const response = await axios.put(
        `${API_URL}/admin/delivery-partners/${editingPartner._id}`,
        {
          fullName: editingPartner.fullName,
          vehicleNumber: editingPartner.vehicleNumber,
          vehicleType: editingPartner.vehicleType,
          status: editingPartner.status,
          assignedArea: {
            area: editingPartner.area,
            city: editingPartner.city,
            village: editingPartner.village,
            town: editingPartner.town,
            radius: parseFloat(editingPartner.radius) || 5,
          },
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (response.data.success) {
        setShowEditModal(false);
        setEditingPartner(null);
        fetchPartners();
        Alert.alert('Success', 'Delivery partner updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update partner');
    }
  };

  const renderPartnerCard = (partner) => (
    <View key={partner._id} style={styles.partnerCard}>
      <View style={styles.partnerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{partner.fullName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.partnerInfo}>
          <Text style={styles.partnerName}>{partner.fullName}</Text>
          <Text style={styles.partnerPhone}>{partner.mobileNumber}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{partner.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.partnerDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🏍️ Vehicle</Text>
          <Text style={styles.detailValue}>{partner.vehicleType} - {partner.vehicleNumber}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍 Area</Text>
          <Text style={styles.detailValue}>{partner.assignedArea?.area}, {partner.assignedArea?.city}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📏 Radius</Text>
          <Text style={styles.detailValue}>{partner.assignedArea?.radius} km</Text>
        </View>
      </View>

      <View style={styles.partnerActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(partner)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.resetButton]}
          onPress={() => handleResetPassword(partner._id)}
        >
          <Text style={styles.actionButtonText}>Reset Password</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeletePartner(partner._id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading delivery partners...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery Partners</Text>
        <Text style={styles.headerSubtitle}>{partners.length} partners</Text>
      </View>

      <ScrollView style={styles.content}>
        {partners.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No delivery partners</Text>
            <Text style={styles.emptyText}>Add delivery partners to manage deliveries</Text>
          </View>
        ) : (
          partners.map(renderPartnerCard)
        )}
      </ScrollView>

      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
        <Text style={styles.addButtonText}>+ Add Delivery Partner</Text>
      </TouchableOpacity>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Delivery Partner</Text>
            <ScrollView>
              <TextInput style={styles.modalInput} placeholder="Full Name" value={newPartner.fullName} onChangeText={t => setNewPartner({...newPartner, fullName: t})} />
              <TextInput style={styles.modalInput} placeholder="Mobile Number (10 digits)" keyboardType="phone-pad" maxLength={10} value={newPartner.mobileNumber} onChangeText={t => setNewPartner({...newPartner, mobileNumber: t})} />
              <TextInput style={styles.modalInput} placeholder="Password" value={newPartner.password} onChangeText={t => setNewPartner({...newPartner, password: t})} />
              <TextInput style={styles.modalInput} placeholder="Vehicle Number" value={newPartner.vehicleNumber} onChangeText={t => setNewPartner({...newPartner, vehicleNumber: t})} />
              <TextInput style={styles.modalInput} placeholder="Vehicle Type (Bike/Scooter)" value={newPartner.vehicleType} onChangeText={t => setNewPartner({...newPartner, vehicleType: t})} />
              <TextInput style={styles.modalInput} placeholder="Assigned Area" value={newPartner.area} onChangeText={t => setNewPartner({...newPartner, area: t})} />
              <TextInput style={styles.modalInput} placeholder="City" value={newPartner.city} onChangeText={t => setNewPartner({...newPartner, city: t})} />
              <TextInput style={styles.modalInput} placeholder="Radius (km)" keyboardType="numeric" value={newPartner.radius} onChangeText={t => setNewPartner({...newPartner, radius: t})} />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddPartner}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Delivery Partner</Text>
            {editingPartner && (
              <ScrollView>
                <TextInput style={styles.modalInput} placeholder="Full Name" value={editingPartner.fullName} onChangeText={t => setEditingPartner({ ...editingPartner, fullName: t })} />
                <TextInput style={styles.modalInput} placeholder="Mobile Number" value={editingPartner.mobileNumber} editable={false} />
                <TextInput style={styles.modalInput} placeholder="Vehicle Number" value={editingPartner.vehicleNumber} onChangeText={t => setEditingPartner({ ...editingPartner, vehicleNumber: t })} />
                <TextInput style={styles.modalInput} placeholder="Vehicle Type" value={editingPartner.vehicleType} onChangeText={t => setEditingPartner({ ...editingPartner, vehicleType: t })} />
                <TextInput style={styles.modalInput} placeholder="Assigned Area" value={editingPartner.area} onChangeText={t => setEditingPartner({ ...editingPartner, area: t })} />
                <TextInput style={styles.modalInput} placeholder="Village" value={editingPartner.village} onChangeText={t => setEditingPartner({ ...editingPartner, village: t })} />
                <TextInput style={styles.modalInput} placeholder="Town" value={editingPartner.town} onChangeText={t => setEditingPartner({ ...editingPartner, town: t })} />
                <TextInput style={styles.modalInput} placeholder="City" value={editingPartner.city} onChangeText={t => setEditingPartner({ ...editingPartner, city: t })} />
                <TextInput style={styles.modalInput} placeholder="Radius (km)" keyboardType="numeric" value={editingPartner.radius} onChangeText={t => setEditingPartner({ ...editingPartner, radius: t })} />
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.statusRow}>
                  {['active', 'suspended'].map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statusChip, editingPartner.status === s && styles.statusChipActive]}
                      onPress={() => setEditingPartner({ ...editingPartner, status: s })}
                    >
                      <Text style={[styles.statusChipText, editingPartner.status === s && styles.statusChipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowEditModal(false); setEditingPartner(null); }}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleEditPartner}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showResetModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalHint}>Enter a new password for this delivery partner (min 6 characters).</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowResetModal(false); setResetPartnerId(null); setNewPassword(''); }}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#FF9800' }]} onPress={confirmResetPassword}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Reset</Text>
              </TouchableOpacity>
            </View>
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
  partnerCard: {
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
  partnerHeader: {
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
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  partnerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  partnerDetails: {
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
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  partnerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 15 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#f5f5f5', alignItems: 'center' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#4CAF50', alignItems: 'center' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  modalHint: { fontSize: 14, color: '#666', marginBottom: 12 },
  statusRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statusChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
  statusChipActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  statusChipText: { fontSize: 14, color: '#666', textTransform: 'capitalize' },
  statusChipTextActive: { color: '#fff', fontWeight: '600' },
});

export default AdminDeliveryPartnersScreen;
