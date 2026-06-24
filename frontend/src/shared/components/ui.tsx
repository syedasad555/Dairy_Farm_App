/**
 * MVR Farms — Premium UI Component Library
 * Dark mode aware, animated, production-grade
 */
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  type TouchableOpacityProps,
  type TextInputProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/shared/utils/cn';
import { useThemeStore } from '@/stores';

// ─── Theme hook ────────────────────────────────────────────────────────────
export function useTheme() {
  const dark = useThemeStore((s) => s.dark);
  return { dark };
}

// ─── Button ────────────────────────────────────────────────────────────────
interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  gradient?: boolean;
  className?: string;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  size = 'md',
  disabled,
  icon,
  gradient = false,
  className,
  ...props
}: ButtonProps) {
  const { dark } = useTheme();

  const sizeMap = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14, radius: 10 },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16, radius: 12 },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 18, radius: 14 },
  };

  const sz = sizeMap[size];
  const isDisabled = disabled || loading;

  if (gradient && variant === 'primary') {
    return (
      <TouchableOpacity
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[styles.btnBase, { borderRadius: sz.radius, opacity: isDisabled ? 0.5 : 1 }]}
        {...props}
      >
        <LinearGradient
          colors={['#2D7A1A', '#1E5C0A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { paddingVertical: sz.paddingVertical, paddingHorizontal: sz.paddingHorizontal, borderRadius: sz.radius }]}
        >
          {loading && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
          {icon && !loading && <Text style={{ marginRight: 6, fontSize: sz.fontSize }}>{icon}</Text>}
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: sz.fontSize }}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyle = {
    primary: { backgroundColor: '#1E5C0A' },
    secondary: { backgroundColor: '#7C3912' },
    outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#1E5C0A' },
    danger: { backgroundColor: '#DC2626' },
    ghost: { backgroundColor: 'transparent' },
  }[variant];

  const textColor = {
    primary: '#fff',
    secondary: '#fff',
    outline: '#1E5C0A',
    danger: '#fff',
    ghost: '#1E5C0A',
  }[variant];

  return (
    <TouchableOpacity
      style={[
        styles.btnBase,
        variantStyle,
        { paddingVertical: sz.paddingVertical, paddingHorizontal: sz.paddingHorizontal, borderRadius: sz.radius },
        isDisabled && { opacity: 0.5 },
      ]}
      disabled={isDisabled}
      activeOpacity={0.82}
      {...props}
    >
      {loading && <ActivityIndicator color={textColor} style={{ marginRight: 8 }} />}
      {icon && !loading && <Text style={{ marginRight: 6, fontSize: sz.fontSize }}>{icon}</Text>}
      <Text style={{ color: textColor, fontWeight: '700', fontSize: sz.fontSize }}>{title}</Text>
    </TouchableOpacity>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: object;
  onPress?: () => void;
  elevated?: boolean;
}

export function Card({ children, className, style, onPress, elevated = false }: CardProps) {
  const { dark } = useTheme();
  const bg = dark ? '#243018' : '#FFFFFF';
  const border = dark ? '#2D3D22' : '#E8F0E2';
  const shadow = elevated
    ? Platform.select({ ios: { shadowColor: '#1E5C0A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 }, android: { elevation: 6 } })
    : Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }, android: { elevation: 2 } });

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, { backgroundColor: bg, borderColor: border }, shadow, { opacity: pressed ? 0.94 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }, shadow, style]}>
      {children}
    </View>
  );
}

// ─── GradientCard ─────────────────────────────────────────────────────────
export function GradientCard({ children, colors = ['#1E5C0A', '#2D7A1A'] as const, style }: {
  children: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  style?: object;
}) {
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, style]}>
      {children}
    </LinearGradient>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  icon,
  color = 'green',
  trend,
}: {
  label: string;
  value: string | number;
  icon?: string;
  color?: 'green' | 'brown' | 'blue' | 'orange' | 'red';
  trend?: number;
}) {
  const { dark } = useTheme();
  const colorMap = {
    green:  { bg: '#F0FBE8', text: '#1E5C0A', border: '#B8F48B' },
    brown:  { bg: '#FDF4EE', text: '#7C3912', border: '#F8DECE' },
    blue:   { bg: '#EBF6FD', text: '#1A7BBE', border: '#C3E3F7' },
    orange: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
    red:    { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  };
  const c = colorMap[color];

  return (
    <View style={[styles.statCard, { backgroundColor: dark ? '#243018' : c.bg, borderColor: dark ? '#2D3D22' : c.border }]}>
      {icon && <Text style={{ fontSize: 24, marginBottom: 6 }}>{icon}</Text>}
      <Text style={{ fontSize: 26, fontWeight: '800', color: dark ? '#E8F5E0' : c.text }}>{value}</Text>
      <Text style={{ fontSize: 12, color: dark ? '#8FA882' : '#5A6B52', marginTop: 2, fontWeight: '500' }}>{label}</Text>
      {trend !== undefined && (
        <Text style={{ fontSize: 11, color: trend >= 0 ? '#16A34A' : '#DC2626', marginTop: 4, fontWeight: '600' }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </Text>
      )}
    </View>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────
type BadgeColor = 'primary' | 'success' | 'warning' | 'error' | 'blue' | 'gray';

const BADGE_COLORS: Record<BadgeColor, { bg: string; text: string }> = {
  primary: { bg: '#F0FBE8', text: '#1E5C0A' },
  success: { bg: '#F0FDF4', text: '#16A34A' },
  warning: { bg: '#FFFBEB', text: '#D97706' },
  error:   { bg: '#FEF2F2', text: '#DC2626' },
  blue:    { bg: '#EBF6FD', text: '#1A7BBE' },
  gray:    { bg: '#F3F4F6', text: '#6B7280' },
};

export function Badge({ label, color = 'primary' }: { label: string; color?: BadgeColor }) {
  const c = BADGE_COLORS[color] ?? BADGE_COLORS.gray;
  return (
    <View style={{ backgroundColor: c.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
      <Text style={{ color: c.text, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────
export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  const { dark } = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: dark ? '#0F1A0A' : '#F5F9F2' }]}>
      <View style={{ marginBottom: 16 }}>
        <ActivityIndicator size="large" color="#1E5C0A" />
      </View>
      <Text style={{ color: dark ? '#8FA882' : '#5A6B52', fontSize: 15, fontWeight: '500' }}>{message}</Text>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────
export function EmptyState({
  title,
  message,
  icon = '📭',
  action,
  actionLabel,
}: {
  title: string;
  message?: string;
  icon?: string;
  action?: () => void;
  actionLabel?: string;
}) {
  const { dark } = useTheme();
  return (
    <View style={[styles.center, { padding: 40 }]}>
      <Text style={{ fontSize: 56, marginBottom: 16 }}>{icon}</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: dark ? '#E8F5E0' : '#1A2614', marginBottom: 8, textAlign: 'center' }}>{title}</Text>
      {message && <Text style={{ color: dark ? '#8FA882' : '#5A6B52', textAlign: 'center', lineHeight: 22 }}>{message}</Text>}
      {action && actionLabel && (
        <TouchableOpacity onPress={action} style={{ marginTop: 20, backgroundColor: '#1E5C0A', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────
export function SectionHeader({ title, action, actionLabel }: { title: string; action?: () => void; actionLabel?: string }) {
  const { dark } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: dark ? '#E8F5E0' : '#1A2614' }}>{title}</Text>
      {action && actionLabel && (
        <TouchableOpacity onPress={action}>
          <Text style={{ color: '#1E5C0A', fontWeight: '600', fontSize: 14 }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────
export function Divider() {
  const { dark } = useTheme();
  return <View style={{ height: 1, backgroundColor: dark ? '#2D3D22' : '#E8F0E2', marginVertical: 12 }} />;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
export function Skeleton({ width, height, radius = 8 }: { width: number | string; height: number; radius?: number }) {
  const { dark } = useTheme();
  return (
    <View style={{ width: width as number, height, borderRadius: radius, backgroundColor: dark ? '#243018' : '#E8F0E2' }} />
  );
}

// ─── ScreenHeader ─────────────────────────────────────────────────────────
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  rightLabel,
  gradient = false,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: () => void;
  rightLabel?: string;
  gradient?: boolean;
}) {
  const { dark } = useTheme();
  const content = (
    <View style={styles.headerInner}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={{ marginRight: 12, padding: 4 }}>
            <Text style={{ fontSize: 22, color: gradient ? '#fff' : '#1E5C0A' }}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: gradient ? '#fff' : (dark ? '#E8F5E0' : '#1A2614') }}>{title}</Text>
          {subtitle && <Text style={{ fontSize: 13, color: gradient ? 'rgba(255,255,255,0.8)' : (dark ? '#8FA882' : '#5A6B52'), marginTop: 1 }}>{subtitle}</Text>}
        </View>
      </View>
      {rightAction && rightLabel && (
        <TouchableOpacity onPress={rightAction}>
          <Text style={{ color: gradient ? '#fff' : '#1E5C0A', fontWeight: '700', fontSize: 15 }}>{rightLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient colors={['#1E5C0A', '#2D7A1A']} style={styles.headerGradient}>
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.headerPlain, { backgroundColor: dark ? '#1A2614' : '#FFFFFF', borderBottomColor: dark ? '#2D3D22' : '#E8F0E2' }]}>
      {content}
    </View>
  );
}

// ─── FormInput ────────────────────────────────────────────────────────────
interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export function FormField({ label, error, icon, rightIcon, onRightIconPress, style, ...props }: FormFieldProps) {
  const { dark } = useTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: dark ? '#8FA882' : '#5A6B52', marginBottom: 6, letterSpacing: 0.3 }}>
        {label.toUpperCase()}
      </Text>
      <View style={[
        styles.inputWrap,
        { backgroundColor: dark ? '#1A2614' : '#F5F9F2', borderColor: error ? '#DC2626' : (dark ? '#2D3D22' : '#D1E5C8') },
      ]}>
        {icon && <Text style={{ fontSize: 18, marginRight: 10, opacity: 0.7 }}>{icon}</Text>}
        <TextInput
          style={[styles.inputText, { color: dark ? '#E8F5E0' : '#1A2614', flex: 1 }, style]}
          placeholderTextColor={dark ? '#8FA882' : '#A0B090'}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Text style={{ fontSize: 18, opacity: 0.7 }}>{rightIcon}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 4, fontWeight: '500' }}>{error}</Text>}
    </View>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────
export function InfoRow({ label, value, icon }: { label: string; value: string; icon?: string }) {
  const { dark } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
      <Text style={{ color: dark ? '#8FA882' : '#5A6B52', fontSize: 14, flex: 1 }}>
        {icon ? `${icon} ${label}` : label}
      </Text>
      <Text style={{ color: dark ? '#E8F5E0' : '#1A2614', fontSize: 14, fontWeight: '600', flex: 1.5, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

// ─── Pill / Tag ───────────────────────────────────────────────────────────
export function Pill({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: selected ? '#1E5C0A' : 'transparent',
        borderWidth: 1.5,
        borderColor: selected ? '#1E5C0A' : '#D1E5C8',
        marginRight: 8,
      }}
    >
      <Text style={{ color: selected ? '#fff' : '#5A6B52', fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  btnBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  statCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    flex: 1,
    minWidth: '46%',
    margin: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerGradient: {
    paddingTop: 0,
  },
  headerPlain: {
    borderBottomWidth: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  inputText: {
    fontSize: 16,
  },
});
