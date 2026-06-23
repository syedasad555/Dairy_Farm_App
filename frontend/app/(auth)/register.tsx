import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '@/shared/components/ui';
import { FormInput, FormSelect } from '@/shared/components/FormInput';
import { authService } from '@/services';
import { LANGUAGES } from '@/shared/constants';
import { validateMobile } from '@/shared/utils/format';
import type { Language } from '@/shared/types';

const schema = z
  .object({
    name: z.string().min(2, 'Name is required'),
    mobile: z.string().refine(validateMobile, 'Enter a valid 10-digit mobile number'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    language: z.enum(['english', 'telugu', 'hindi']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      password: '',
      confirmPassword: '',
      language: 'english',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await authService.register({
        name: data.name,
        mobile: data.mobile,
        email: data.email || undefined,
        password: data.password,
        language: data.language as Language,
      });

      Alert.alert(
        'Registration Successful',
        'Your account is pending admin approval. You will receive a notification once approved.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err) {
      Alert.alert('Registration Failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerClassName="p-6" keyboardShouldPersistTaps="handled">
          <Text className="text-2xl font-bold text-primary mb-6">{t('register')}</Text>

          <Card>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <FormInput label={t('fullName')} value={value} onChangeText={onChange} error={errors.name?.message} />
              )}
            />

            <Controller
              control={control}
              name="mobile"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label={t('mobile')}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                  error={errors.mobile?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label={t('email')}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <FormInput label={t('password')} value={value} onChangeText={onChange} secureTextEntry error={errors.password?.message} />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label={t('confirmPassword')}
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="language"
              render={({ field: { onChange, value } }) => (
                <FormSelect
                  label={t('language')}
                  value={value}
                  onChange={onChange}
                  options={LANGUAGES.map((l) => ({ label: l.label, value: l.code }))}
                />
              )}
            />

            <Button title={t('register')} onPress={handleSubmit(onSubmit)} loading={loading} className="mt-2" />
          </Card>

          <View className="flex-row justify-center mt-6">
            <Text className="text-muted">{t('hasAccount')} </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-semibold">{t('login')}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
