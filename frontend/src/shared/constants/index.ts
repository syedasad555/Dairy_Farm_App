export const APP_NAME = 'MVR Farms';
export const APP_TAGLINE = 'Fresh. Natural. Farm Direct.';

export const COLLECTIONS = {
  USERS: 'users',
  ADDRESSES: 'addresses',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  SUBSCRIPTIONS: 'subscriptions',
  DELIVERY_PARTNERS: 'deliveryPartners',
  FEEDBACK: 'feedback',
  COMPLAINTS: 'complaints',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports',
  BILLING_STATEMENTS: 'billingStatements',
  DELIVERY_PROOFS: 'deliveryProofs',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const PRODUCT_CATEGORIES = ['Dairy', 'Meat', 'Poultry', 'Grocery'] as const;

export const LANGUAGES = [
  { code: 'english', label: 'English' },
  { code: 'telugu', label: 'తెలుగు' },
  { code: 'hindi', label: 'हिन्दी' },
] as const;

export const DELIVERY_RADIUS_KM = 2;

export const MORNING_SLOT = { start: 4, end: 8, label: '04:00 AM - 08:00 AM' };
export const EVENING_SLOT = { start: 16, end: 20, label: '04:00 PM - 08:00 PM' };

export const AUTH_EMAIL_DOMAIN = 'mvrfarms.app';

export const CACHE_KEYS = {
  PRODUCTS: '@mvr/products',
  ORDERS: '@mvr/orders',
  ADDRESSES: '@mvr/addresses',
  USER_PROFILE: '@mvr/user_profile',
  CART: '@mvr/cart',
  OFFLINE_QUEUE: '@mvr/offline_queue',
} as const;

export const NOTIFICATION_TYPES = {
  ACCOUNT_APPROVED: 'account_approved',
  ORDER_CREATED: 'order_created',
  ORDER_ASSIGNED: 'order_assigned',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  SUBSCRIPTION_CREATED: 'subscription_created',
  COMPLAINT_RAISED: 'complaint_raised',
  MONTHLY_BILL: 'monthly_bill',
  MONTHLY_REPORT: 'monthly_report',
  REGISTRATION_PENDING: 'registration_pending',
} as const;
