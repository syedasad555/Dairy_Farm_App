import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  english: {
    translation: {
      appName: 'MVR Farms',
      tagline: 'Fresh. Natural. Farm Direct.',
      login: 'Login',
      register: 'Register',
      mobile: 'Mobile Number',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      email: 'Email (Optional)',
      language: 'Preferred Language',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      home: 'Home',
      cart: 'Cart',
      orders: 'Orders',
      profile: 'Profile',
      billing: 'Billing',
      feedback: 'Feedback',
      complaints: 'Complaints',
      logout: 'Logout',
      addToCart: 'Add to Cart',
      checkout: 'Checkout',
      placeOrder: 'Place Order',
      pendingApproval: 'Your account is pending approval.',
      slotMessage: 'Your order has been scheduled for the nearest delivery slot.',
      deliveryProof: 'Delivery Proof',
      markDelivered: 'Mark Delivered',
      withinRange: 'You must be within 2km of customer location.',
      approve: 'Approve',
      reject: 'Reject',
      dashboard: 'Dashboard',
      products: 'Products',
      customers: 'Customers',
      partners: 'Delivery Partners',
      subscriptions: 'Subscriptions',
      reports: 'Reports',
      settings: 'Settings',
    },
  },
  telugu: {
    translation: {
      appName: 'MVR Farms',
      tagline: 'తాజా. సహజం. ферма నుండి నేరుగా.',
      login: 'లాగిన్',
      register: 'నమోదు',
      mobile: 'మొబైల్ నంబర్',
      password: 'పాస్‌వర్డ్',
      home: 'హోమ్',
      cart: 'కార్ట్',
      orders: 'ఆర్డర్లు',
      profile: 'ప్రొఫైల్',
    },
  },
  hindi: {
    translation: {
      appName: 'MVR Farms',
      tagline: 'ताज़ा. प्राकृतिक. खेत से सीधे.',
      login: 'लॉगिन',
      register: 'पंजीकरण',
      mobile: 'मोबाइल नंबर',
      password: 'पासवर्ड',
      home: 'होम',
      cart: 'कार्ट',
      orders: 'ऑर्डर',
      profile: 'प्रोफ़ाइल',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'english',
  fallbackLng: 'english',
  interpolation: { escapeValue: false },
});

export default i18n;
