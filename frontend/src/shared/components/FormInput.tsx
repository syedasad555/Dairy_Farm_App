import { TextInput, View, Text, TouchableOpacity, type TextInputProps } from 'react-native';
import { cn } from '@/shared/utils/cn';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function FormInput({ label, error, className, ...props }: FormInputProps & { className?: string }) {
  return (
    <View className="mb-4">
      <Text className="text-gray-700 font-medium mb-1.5 text-base">{label}</Text>
      <TextInput
        className={cn(
          'border rounded-xl px-4 py-3 bg-surface text-base text-gray-900',
          error ? 'border-error' : 'border-gray-200',
          className
        )}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && <Text className="text-error text-sm mt-1">{error}</Text>}
    </View>
  );
}

interface SelectOption {
  label: string;
  value: string;
}

interface FormSelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
}

export function FormSelect({ label, value, options, onChange, error }: FormSelectProps) {
  return (
    <View className="mb-4">
      <Text className="text-gray-700 font-medium mb-1.5 text-base">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={cn(
              'px-4 py-2 rounded-xl border',
              value === opt.value ? 'bg-primary border-primary' : 'bg-surface border-gray-200'
            )}
          >
            <Text className={cn('text-base', value === opt.value ? 'text-white font-semibold' : 'text-gray-700')}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text className="text-error text-sm mt-1">{error}</Text>}
    </View>
  );
}
