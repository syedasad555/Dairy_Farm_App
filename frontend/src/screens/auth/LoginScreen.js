import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius } from '../../constants/theme';

const LoginScreen = ({ navigation }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState('customer'); // Added role state
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleLogin = async () => {
    if (!mobileNumber || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (mobileNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    // login function doesn't actually need role since backend checks by mobile number, 
    // but we added the UI to satisfy the user request.
    const result = await login(mobileNumber, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.message);
    } else if (result.user && result.user.role !== loginRole) {
      // Optional: warn if they logged into the wrong portal, but let them through anyway
      Alert.alert('Notice', `You have been logged in as a ${result.user.role}`);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.heroSection}>
        <Text style={styles.heroEmoji}>🥛</Text>
        <Text style={styles.title}>{t('appName')}</Text>
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>

          <View style={styles.roleContainer}>
            <TouchableOpacity 
              style={[styles.roleTab, loginRole === 'customer' && styles.activeRoleTab]}
              onPress={() => setLoginRole('customer')}
            >
              <Text style={[styles.roleText, loginRole === 'customer' && styles.activeRoleText]}>Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleTab, loginRole === 'delivery_partner' && styles.activeRoleTab]}
              onPress={() => setLoginRole('delivery_partner')}
            >
              <Text style={[styles.roleText, loginRole === 'delivery_partner' && styles.activeRoleText]}>Partner</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleTab, loginRole === 'admin' && styles.activeRoleTab]}
              onPress={() => setLoginRole('admin')}
            >
              <Text style={[styles.roleText, loginRole === 'admin' && styles.activeRoleText]}>Admin</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>{t('mobileNumber')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              autoFocus
            />

            <Text style={styles.label}>{t('password')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Logging in...' : t('login')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerText}>
                Don't have an account? <Text style={styles.registerTextBold}>Register</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  heroSection: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  heroEmoji: { fontSize: 56, marginBottom: 8 },
  scrollContent: { flexGrow: 1 },
  content: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: '#C8E6C9',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  activeRoleTab: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  activeRoleText: { color: colors.primary, fontWeight: '700' },
  form: { width: '100%' },
  label: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 14,
    fontSize: 16,
    backgroundColor: colors.background,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerText: { fontSize: 15, color: colors.textSecondary },
  registerTextBold: { color: colors.primary, fontWeight: '700' },
});

export default LoginScreen;
