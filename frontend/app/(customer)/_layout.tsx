import { Redirect, Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useNotificationStore, useThemeStore } from '@/stores';

function TabIcon({ name, focused, color, size }: { name: keyof typeof Ionicons.glyphMap; focused: boolean; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function NotifIcon({ focused, color, size }: { focused: boolean; color: string; size: number }) {
  const count = useNotificationStore((s) => s.unreadCount);
  return (
    <View>
      <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={size} color={color} />
      {count > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -6,
          backgroundColor: '#DC2626', borderRadius: 10,
          minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 3,
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function CustomerLayout() {
  const profile = useAuthStore((s) => s.profile);
  const dark = useThemeStore((s) => s.dark);

  if (!profile || profile.role !== 'customer' || profile.status !== 'approved') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1E5C0A',
        tabBarInactiveTintColor: dark ? '#8FA882' : '#6B7280',
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          height: Platform.OS === 'ios' ? 82 : 64,
          backgroundColor: dark ? '#1A2614' : '#FFFFFF',
          borderTopColor: dark ? '#2D3D22' : '#E8F0E2',
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size, focused }) => <NotifIcon focused={focused} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />,
        }}
      />
      {/* Hidden tabs — navigated to programmatically */}
      <Tabs.Screen name="billing" options={{ href: null }} />
      <Tabs.Screen name="complaints" options={{ href: null }} />
      <Tabs.Screen name="subscriptions" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="order-detail" options={{ href: null }} />
    </Tabs>
  );
}
