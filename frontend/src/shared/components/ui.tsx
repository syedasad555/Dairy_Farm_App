import { View, Text, TouchableOpacity, ActivityIndicator, type TouchableOpacityProps } from 'react-native';
import { cn } from '@/shared/utils/cn';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  outline: 'bg-transparent border-2 border-primary',
  danger: 'bg-error',
};

const textStyles = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-primary',
  danger: 'text-white',
};

const sizeStyles = {
  sm: 'py-2 px-4',
  md: 'py-3 px-6',
  lg: 'py-4 px-8',
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  size = 'md',
  disabled,
  className,
  ...props
}: ButtonProps & { className?: string }) {
  return (
    <TouchableOpacity
      className={cn(
        'rounded-xl items-center justify-center flex-row',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && 'opacity-50',
        className
      )}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading && <ActivityIndicator color="#fff" className="mr-2" />}
      <Text className={cn('font-semibold text-base', textStyles[variant])}>{title}</Text>
    </TouchableOpacity>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <View className={cn('bg-white rounded-card p-4 shadow-sm border border-gray-100', className)}>
      {children}
    </View>
  );
}

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  multiline?: boolean;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  keyboardType = 'default',
  multiline,
}: InputProps) {
  return (
    <View className="mb-4">
      <Text className="text-gray-700 font-medium mb-1.5 text-base">{label}</Text>
      <View
        className={cn(
          'border rounded-xl px-4 py-3 bg-surface',
          error ? 'border-error' : 'border-gray-200'
        )}
      >
        <Text
          className="text-base text-gray-900"
          // Using Text as input placeholder for simplicity — replaced in screens with TextInput
        />
      </View>
      {error && <Text className="text-error text-sm mt-1">{error}</Text>}
    </View>
  );
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#2D5016" />
      <Text className="text-muted mt-4 text-base">{message}</Text>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-xl font-semibold text-gray-800 mb-2">{title}</Text>
      {message && <Text className="text-muted text-center text-base">{message}</Text>}
    </View>
  );
}

export function Badge({ label, color = 'primary' }: { label: string; color?: string }) {
  const colors: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
  };

  return (
    <View className={cn('px-3 py-1 rounded-full', colors[color]?.split(' ')[0])}>
      <Text className={cn('text-xs font-semibold', colors[color]?.split(' ')[1])}>{label}</Text>
    </View>
  );
}

export function StatCard({ label, value, icon }: { label: string; value: string | number; icon?: string }) {
  return (
    <Card className="flex-1 min-w-[45%]">
      {icon && <Text className="text-2xl mb-2">{icon}</Text>}
      <Text className="text-2xl font-bold text-primary">{value}</Text>
      <Text className="text-muted text-sm mt-1">{label}</Text>
    </Card>
  );
}
