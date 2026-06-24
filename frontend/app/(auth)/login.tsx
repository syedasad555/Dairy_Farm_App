import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '@/shared/components/ui';
import { FormInput } from '@/shared/components/FormInput';
import { authService } from '@/services';
import { useAuthStore } from '@/stores';
import { APP_NAME, APP_TAGLINE } from '@/shared/constants';
import { validateMobile } from '@/shared/utils/format';
import { useEmulator, getEmulatorHost } from '@/lib/firebase/config';
import { FIREBASE_EMULATOR_PORTS } from '@/lib/firebase/emulatorHost';

const schema = z.object({
  mobile: z.string().refine(validateMobile, 'Enter a valid 10-digit mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof schema>;

export default function LoginScreen() {
  const { t } = useTranslation();
  const setProfile = useAuthStore((s) => s.setProfile);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { mobile: '', password: '' },
  });

  const fillTestAccount = (role: 'admin' | 'customer' | 'partner') => {
    const accounts = {
      admin: { mobile: '9999999999', password: 'admin123' },
      customer: { mobile: '9876543210', password: 'customer123' },
      partner: { mobile: '9888888888', password: 'partner123' },
    };
    const account = accounts[role];
    setValue('mobile', account.mobile);
    setValue('password', account.password);
    setError('');
  };

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setLoading(true);
    try {
      const profile = await authService.login(data);
      setProfile(profile);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center p-6" keyboardShouldPersistTaps="handled">
          <View className="items-center mb-8">
            <Text className="text-4xl font-bold text-primary">{APP_NAME}</Text>
            <Text className="text-muted text-base mt-2">{APP_TAGLINE}</Text>
            {__DEV__ && useEmulator && (
              <Text className="text-xs text-muted mt-3 text-center px-4">
                Emulator: {getEmulatorHost()} (auth {FIREBASE_EMULATOR_PORTS.auth}, firestore{' '}
                {FIREBASE_EMULATOR_PORTS.firestore})
              </Text>
            )}
          </View>

          <Card>
            <Text className="text-2xl font-bold text-gray-900 mb-6">{t('login')}</Text>

            <Controller
              control={control}
              name="mobile"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label={t('mobile')}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  placeholder="9876543210"
                  maxLength={10}
                  error={errors.mobile?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label={t('password')}
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  placeholder="••••••"
                  error={errors.password?.message}
                />
              )}
            />

            {error ? <Text className="text-error text-sm mb-4">{error}</Text> : null}

            {__DEV__ && useEmulator && (
              <View className="mb-4 p-3 rounded-xl bg-primary-50 border border-primary-100">
                <Text className="text-xs text-muted mb-2">Test accounts (run: cd firebase && npm run seed)</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { role: 'admin' as const, label: 'Admin' },
                    { role: 'customer' as const, label: 'Customer' },
                    { role: 'partner' as const, label: 'Partner' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.role}
                      onPress={() => fillTestAccount(item.role)}
                      className="px-3 py-2 rounded-lg bg-white border border-primary-200"
                    >
                      <Text className="text-primary text-xs font-semibold">{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Button title={t('login')} onPress={handleSubmit(onSubmit)} loading={loading} />
          </Card>

          <View className="flex-row justify-center mt-6">
            <Text className="text-muted">{t('noAccount')} </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-semibold">{t('register')}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
