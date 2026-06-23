export type UserRole = 'customer' | 'delivery_partner' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type Language = 'english' | 'telugu' | 'hindi';
export type ProductCategory = 'Dairy' | 'Meat' | 'Poultry' | 'Grocery';
export type OrderStatus = 'pending' | 'assigned' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type DeliverySlot = 'morning' | 'evening';
export type ComplaintStatus = 'open' | 'resolved';

export interface UserProfile {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  language: Language;
  fcmToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  title: string;
  houseNumber: string;
  street: string;
  village: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  name: string;
  price: number;
  quantity: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  image: string;
  variants: ProductVariant[];
  stock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface DeliveryProof {
  photoUrl: string;
  latitude: number;
  longitude: number;
  deliveredAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  items: OrderItem[];
  addressId: string;
  address: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  status: OrderStatus;
  slot: DeliverySlot;
  slotLabel: string;
  scheduledDate: string;
  totalAmount: number;
  totalQuantity: number;
  deliveryProof?: DeliveryProof;
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPartner {
  id: string;
  userId: string;
  name: string;
  mobile: string;
  assignedPincodes: string[];
  assignedAreaName: string;
  active: boolean;
  totalDeliveries: number;
  successfulDeliveries: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  variantName: string;
  quantity: number;
  price: number;
  startDate: string;
  endDate: string;
  slot: DeliverySlot;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillingStatement {
  id: string;
  customerId: string;
  customerName: string;
  month: number;
  year: number;
  orders: OrderItem[];
  orderIds: string[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  rating: number;
  feedback: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  subject: string;
  description: string;
  preferredTime: string;
  requestCallback: boolean;
  status: ComplaintStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

export interface MonthlyReport {
  id: string;
  month: number;
  year: number;
  pdfUrl: string;
  totalRevenue: number;
  totalOrders: number;
  totalDeliveries: number;
  totalMilkLitres: number;
  totalGheeSold: number;
  totalEggPacksSold: number;
  createdAt: string;
}

export interface AnalyticsSnapshot {
  id: string;
  date: string;
  dailyOrders: number;
  weeklyOrders: number;
  monthlyOrders: number;
  revenue: number;
  topProducts: { productId: string; name: string; quantity: number }[];
  milkLitresSold: number;
  gheeSold: number;
  eggPacksSold: number;
  customerGrowth: number;
  deliveryPerformance: number;
}

export interface AppSettings {
  id: string;
  morningSlotStart: string;
  morningSlotEnd: string;
  eveningSlotStart: string;
  eveningSlotEnd: string;
  deliveryRadiusKm: number;
  updatedAt: string;
}

export interface RegisterInput {
  name: string;
  mobile: string;
  email?: string;
  password: string;
  language: Language;
}

export interface LoginInput {
  mobile: string;
  password: string;
}

export interface CreateOrderInput {
  items: CartItem[];
  addressId: string;
}

export interface DeliveryProofInput {
  orderId: string;
  photoUri: string;
  latitude: number;
  longitude: number;
}

export interface AdminDashboardStats {
  totalCustomers: number;
  pendingApprovals: number;
  totalOrders: number;
  ordersToday: number;
  deliveredToday: number;
  pendingDeliveries: number;
  revenueThisMonth: number;
  productsSold: number;
  activeSubscriptions: number;
  deliveryPartners: number;
  recentComplaints: Complaint[];
  recentFeedback: Feedback[];
}

export interface DeliveryPartnerStats {
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  assignedPincodes: string[];
  successRate: number;
}

export interface SlotAssignment {
  slot: DeliverySlot;
  slotLabel: string;
  scheduledDate: string;
  message: string;
}
