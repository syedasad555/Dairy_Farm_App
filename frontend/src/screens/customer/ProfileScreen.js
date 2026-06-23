import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, refreshUser, changeLanguage, API_URL } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const { t } = useTranslation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    preferredLanguage: user?.preferredLanguage || 'english'
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleUpdateProfile = async () => {
    try {
      const response = await axios.put(`${API_URL}/users/profile`, editForm);
      if (response.data.success) {
        await refreshUser();
        if (editForm.preferredLanguage) changeLanguage(editForm.preferredLanguage);
        setShowEditModal(false);
        Alert.alert(t('success', 'Success'), t('profileUpdated', 'Profile updated successfully'));
      }
    } catch (error) {
      Alert.alert(t('error', 'Error'), error.response?.data?.message || t('profileUpdateFailed', 'Failed to update profile'));
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert(t('error', 'Error'), t('passwordsDoNotMatch', 'Passwords do not match'));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      Alert.alert(t('error', 'Error'), t('passwordTooShort', 'Password must be at least 6 characters'));
      return;
    }
    try {
      await axios.put(`${API_URL}/users/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert(t('success', 'Success'), t('passwordChanged', 'Password changed successfully'));
    } catch (error) {
      Alert.alert(t('error', 'Error'), error.response?.data?.message || t('passwordChangeFailed', 'Failed to change password'));
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout', 'Logout'),
      t('logoutConfirmText', 'Are you sure you want to logout?'),
      [
        { text: t('cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('logout', 'Logout'),
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  const menuItems = [
    { icon: '📦', title: t('orders'), onPress: () => navigation.navigate('OrderTracking') },
    { icon: '🥛', title: t('milkSubscriptions'), onPress: () => navigation.navigate('Subscription') },
    { icon: '📍', title: t('deliveryAddress'), onPress: () => navigation.navigate('AddressManagement') },
    { icon: '📄', title: t('orderSummary'), onPress: () => navigation.navigate('Billing') },
    { icon: '🔔', title: t('notifications'), onPress: () => navigation.navigate('Notifications') },
    { icon: isDark ? '☀️' : '🌙', title: isDark ? t('lightMode', 'Light Mode') : t('darkMode', 'Dark Mode'), onPress: toggleTheme },
    { icon: '💬', title: t('customerSupport', 'Customer Support'), onPress: () => Alert.alert(t('support', 'Support'), 'Call us: 9876543210') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={[styles.header, { backgroundColor: colors.primary }] }>
        <Text style={[styles.headerTitle, { color: colors.textLight }]}>{t('profile')}</Text>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }] }>
          <View style={styles.avatar}>
            <Text style={[styles.avatarText, { color: colors.textLight }]}>{user?.fullName?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.fullName}</Text>
          <Text style={[styles.userPhone, { color: colors.textSecondary }]}>{user?.mobileNumber}</Text>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowEditModal(true)}
          >
            <Text style={styles.editButtonText}>{t('editProfile', 'Edit Profile')}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}> 
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{user?.loyaltyPoints || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('loyaltyPoints', 'Loyalty Points')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{user?.preferredLanguage?.toUpperCase()}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('language')}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuContainer, { backgroundColor: colors.surface }] }>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={item.onPress}
            >
              <Text style={[styles.menuIcon, { color: colors.text }]}>{item.icon}</Text>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Password Change */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowPasswordModal(true)}
        >
          <Text style={styles.menuIcon}>🔒</Text>
          <Text style={[styles.menuTitle, { color: colors.text }]}>{t('changePassword', 'Change Password')}</Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.surface }]} onPress={handleLogout}>
          <Text style={[styles.logoutButtonText, { color: colors.error }]}>{t('logout')}</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textSecondary }]}>{t('version', 'Version')} 1.0.0</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }] }>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }] }>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('editProfile')}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.text }]}>{t('fullName', 'Full Name')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={editForm.fullName}
                onChangeText={(text) => setEditForm({ ...editForm, fullName: text })}
              />

              <Text style={styles.label}>{t('email', 'Email')}</Text>
              <TextInput
                style={styles.input}
                placeholder="Email (optional)"
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                keyboardType="email-address"
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('preferredLanguage', 'Preferred Language')}</Text>
              <View style={styles.languageSelector}>
                {['english', 'telugu', 'hindi'].map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.languageOption,
                      editForm.preferredLanguage === lang && styles.languageOptionSelected,
                      editForm.preferredLanguage === lang && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => {
                      setEditForm({ ...editForm, preferredLanguage: lang });
                      changeLanguage(lang);
                    }}
                  >
                    <Text style={[
                      styles.languageText,
                      editForm.preferredLanguage === lang && styles.languageTextSelected,
                      editForm.preferredLanguage === lang && { color: colors.textLight }
                    ]}>
                      {t(`language${lang.charAt(0).toUpperCase() + lang.slice(1)}`, lang.charAt(0).toUpperCase() + lang.slice(1))}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleUpdateProfile}>
              <Text style={styles.saveButtonText}>{t('saveChanges', 'Save Changes')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }] }>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('changePassword', 'Change Password')}</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.text }]}>{t('currentPassword', 'Current Password')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder={t('currentPassword', 'Enter current password')}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={passwordForm.currentPassword}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('newPassword', 'New Password')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder={t('newPassword', 'Enter new password (min 6 characters)')}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
              />

              <Text style={[styles.label, { color: colors.text }]}>{t('confirmNewPassword', 'Confirm New Password')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder={t('confirmNewPassword', 'Confirm new password')}
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
              />
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleChangePassword}>
              <Text style={styles.saveButtonText}>{t('changePassword', 'Change Password')}</Text>
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
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  profileCard: {
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userPhone: {
    fontSize: 16,
    marginBottom: 15,
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
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
    fontSize: 24,
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
  menuContainer: {
    borderRadius: 10,
    marginBottom: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
  },
  menuArrow: {
    fontSize: 24,
  },
  logoutButton: {
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  languageSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  languageOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  languageOptionSelected: {
    borderColor: 'transparent',
  },
  languageText: {
    fontSize: 14,
  },
  languageTextSelected: {
    fontWeight: 'bold',
  },
  saveButton: {
    margin: 20,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
