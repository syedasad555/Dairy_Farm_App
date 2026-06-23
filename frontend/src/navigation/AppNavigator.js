import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Customer Screens
import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';
import ProductDetailsScreen from '../screens/customer/ProductDetailsScreen';
import CartScreen from '../screens/customer/CartScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import OrderTrackingScreen from '../screens/customer/OrderTrackingScreen';
import OrderDetailsScreen from '../screens/customer/OrderDetailsScreen';
import LiveTrackingScreen from '../screens/customer/LiveTrackingScreen';
import SubscriptionScreen from '../screens/customer/SubscriptionScreen';
import AddressManagementScreen from '../screens/customer/AddressManagementScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import NotificationsScreen from '../screens/customer/NotificationsScreen';
import BillingScreen from '../screens/customer/BillingScreen';

const Stack = createStackNavigator();

// Delivery Partner Screens
import DeliveryPartnerHomeScreen from '../screens/delivery/DeliveryPartnerHomeScreen';
import DeliveryDetailsScreen from '../screens/delivery/DeliveryDetailsScreen';
import RouteOptimizationScreen from '../screens/delivery/RouteOptimizationScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminApprovalsScreen from '../screens/admin/AdminApprovalsScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import AdminDeliveryPartnersScreen from '../screens/admin/AdminDeliveryPartnersScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminBillingScreen from '../screens/admin/AdminBillingScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';

const AppNavigator = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      {!isAuthenticated ? (
        // Auth Stack
        <Stack.Group>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{ title: t('register') }}
          />
        </Stack.Group>
      ) : (
        // Role-based Dashboards
        <Stack.Group>
          {user?.role === 'customer' && (
            <>
              <Stack.Screen 
                name="CustomerHome" 
                component={CustomerHomeScreen}
                options={{ headerShown: false, title: t('appName') }}
              />
              <Stack.Screen 
                name="ProductDetails" 
                component={ProductDetailsScreen}
                options={{ title: 'Product Details' }}
              />
              <Stack.Screen 
                name="Cart" 
                component={CartScreen}
                options={{ title: t('myCart') }}
              />
              <Stack.Screen 
                name="Checkout" 
                component={CheckoutScreen}
                options={{ title: t('checkout') }}
              />
              <Stack.Screen 
                name="OrderTracking" 
                component={OrderTrackingScreen}
                options={{ title: t('trackOrder') }}
              />
              <Stack.Screen 
                name="AddressManagement" 
                component={AddressManagementScreen}
                options={{ title: t('deliveryAddress') }}
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen}
                options={{ title: t('profile') }}
              />
              <Stack.Screen 
                name="Notifications" 
                component={NotificationsScreen}
                options={{ title: t('notifications') }}
              />
              <Stack.Screen 
                name="OrderDetails" 
                component={OrderDetailsScreen}
                options={{ title: t('orderDetails', 'Order Details') }}
              />
              <Stack.Screen 
                name="LiveTracking" 
                component={LiveTrackingScreen}
                options={{ title: t('liveTracking', 'Live Tracking') }}
              />
              <Stack.Screen 
                name="Subscription" 
                component={SubscriptionScreen}
                options={{ title: t('milkSubscriptions') }}
              />
              <Stack.Screen 
                name="Billing" 
                component={BillingScreen}
                options={{ title: t('orderSummary') }}
              />
            </>
          )}
          
          {user?.role === 'delivery_partner' && (
            <>
              <Stack.Screen 
                name="DeliveryPartnerHome" 
                component={DeliveryPartnerHomeScreen}
                options={{ headerShown: false, title: t('deliveries', 'Deliveries') }}
              />
              <Stack.Screen 
                name="DeliveryDetails" 
                component={DeliveryDetailsScreen}
                options={{ title: 'Delivery Details' }}
              />
              <Stack.Screen 
                name="RouteOptimization" 
                component={RouteOptimizationScreen}
                options={{ title: 'Optimize Route' }}
              />
            </>
          )}
          
          {user?.role === 'admin' && (
            <>
              <Stack.Screen 
                name="AdminDashboard" 
                component={AdminDashboardScreen}
                options={{ headerShown: false, title: t('adminDashboard') }}
              />
              <Stack.Screen 
                name="AdminApprovals" 
                component={AdminApprovalsScreen}
                options={{ title: t('approvals') }}
              />
              <Stack.Screen 
                name="AdminProducts" 
                component={AdminProductsScreen}
                options={{ title: t('products') }}
              />
              <Stack.Screen 
                name="AdminDeliveryPartners" 
                component={AdminDeliveryPartnersScreen}
                options={{ title: t('deliveryPartners', 'Delivery Partners') }}
              />
              <Stack.Screen 
                name="AdminOrders" 
                component={AdminOrdersScreen}
                options={{ title: t('orders') }}
              />
              <Stack.Screen 
                name="AdminBilling" 
                component={AdminBillingScreen}
                options={{ title: t('billing') }}
              />
              <Stack.Screen 
                name="AdminAnalytics" 
                component={AdminAnalyticsScreen}
                options={{ title: t('analytics') }}
              />
            </>
          )}
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
