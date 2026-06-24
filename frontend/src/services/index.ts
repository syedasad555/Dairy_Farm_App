import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { storage, functions } from '@/lib/firebase/config';
import { authRepository } from '@/repositories/auth.repository';
import { addressRepository } from '@/repositories/address.repository';
import { productRepository } from '@/repositories/product.repository';
import { orderRepository } from '@/repositories/order.repository';
import { deliveryPartnerRepository } from '@/repositories/deliveryPartner.repository';
import {
  subscriptionRepository,
  billingRepository,
  feedbackRepository,
  complaintRepository,
} from '@/repositories/misc.repository';
import { assignNearestDeliverySlot } from '@/shared/utils/deliverySlots';
import { generateOrderNumber } from '@/shared/utils/format';
import { isWithinDeliveryRange } from '@/shared/utils/geo';
import type {
  RegisterInput,
  LoginInput,
  UserProfile,
  CreateOrderInput,
  CartItem,
  Order,
  Address,
  DeliveryProofInput,
  AdminDashboardStats,
  DeliveryPartnerStats,
} from '@/shared/types';

export class AuthService {
  async register(input: RegisterInput): Promise<UserProfile> {
    const user = await authRepository.register(input);
    const profile = await authRepository.getProfile(user.uid);
    if (!profile) throw new Error('Failed to create profile');

    await this.notifyAdminsRegistration(profile);
    return profile;
  }

  async login(input: LoginInput): Promise<UserProfile> {
    const user = await authRepository.login(input.mobile, input.password);
    const profile = await authRepository.getProfile(user.uid);
    if (!profile) throw new Error('Profile not found');

    if (profile.role === 'customer' && profile.status === 'rejected') {
      await authRepository.logout();
      throw new Error('Your account has been rejected. Please contact support.');
    }

    if (profile.role === 'customer' && profile.status === 'pending') {
      await authRepository.logout();
      throw new Error('Your account is pending approval. You will be notified once approved.');
    }

    return profile;
  }

  async logout(): Promise<void> {
    await authRepository.logout();
  }

  async getCurrentProfile(): Promise<UserProfile | null> {
    const user = authRepository.getCurrentUser();
    if (!user) return null;
    return authRepository.getProfile(user.uid);
  }

  private async notifyAdminsRegistration(customer: UserProfile): Promise<void> {
    try {
      const notifyFn = httpsCallable(functions, 'notifyAdminsNewRegistration');
      await notifyFn({ customerId: customer.id, customerName: customer.name });
    } catch {
      // Non-blocking — Cloud Function handles notification
    }
  }
}

export class OrderService {
  async createOrder(customerId: string, customerName: string, customerMobile: string, input: CreateOrderInput): Promise<Order> {
    const address = await addressRepository.getById(input.addressId);
    if (!address) throw new Error('Address not found');

    const partner = await deliveryPartnerRepository.findByPincode(address.pincode);
    if (!partner) {
      throw new Error(`Delivery is not available for pincode ${address.pincode}. Please contact support.`);
    }

    const slotAssignment = assignNearestDeliverySlot();
    const orderCount = await orderRepository.countAll();
    const orderId = `ord_${Date.now()}`;

    const items = input.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.price * item.quantity,
    }));

    const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

    const order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
      orderNumber: generateOrderNumber(orderCount),
      customerId,
      customerName,
      customerMobile,
      deliveryPartnerId: partner.id,
      deliveryPartnerName: partner.name,
      items,
      addressId: address.id,
      address: {
        title: address.title,
        houseNumber: address.houseNumber,
        street: address.street,
        village: address.village,
        city: address.city,
        district: address.district,
        state: address.state,
        pincode: address.pincode,
        latitude: address.latitude,
        longitude: address.longitude,
        isDefault: address.isDefault,
      },
      status: 'assigned',
      slot: slotAssignment.slot,
      slotLabel: slotAssignment.slotLabel,
      scheduledDate: slotAssignment.scheduledDate,
      totalAmount,
      totalQuantity,
    };

    await orderRepository.create(orderId, order);

    try {
      const notifyFn = httpsCallable(functions, 'notifyOrderCreated');
      await notifyFn({ orderId, ...order });
    } catch {
      // Non-blocking
    }

    return { id: orderId, ...order, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }

  async getCustomerOrders(customerId: string): Promise<Order[]> {
    return orderRepository.getByCustomer(customerId);
  }

  async getPartnerOrders(partnerId: string): Promise<Order[]> {
    return orderRepository.getByDeliveryPartner(partnerId);
  }

  async markOutForDelivery(orderId: string): Promise<void> {
    await orderRepository.updateStatus(orderId, 'out_for_delivery');
  }

  async submitDeliveryProof(input: DeliveryProofInput, partnerLat: number, partnerLon: number): Promise<void> {
    const order = await orderRepository.getById(input.orderId);
    if (!order) throw new Error('Order not found');

    if (!isWithinDeliveryRange(partnerLat, partnerLon, order.address.latitude, order.address.longitude)) {
      throw new Error('You must be within 2km of customer location.');
    }

    const photoUrl = await this.uploadDeliveryPhoto(input.orderId, input.photoUri);

    const proof = {
      photoUrl,
      latitude: input.latitude,
      longitude: input.longitude,
      deliveredAt: new Date().toISOString(),
    };

    await orderRepository.updateStatus(input.orderId, 'delivered', { deliveryProof: proof });

    try {
      const completeFn = httpsCallable(functions, 'completeDelivery');
      await completeFn({ orderId: input.orderId, proof });
    } catch {
      // Non-blocking
    }
  }

  private async uploadDeliveryPhoto(orderId: string, uri: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `delivery-proofs/${orderId}_${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  }
}

export class AdminService {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [orders, subscriptions, partners, complaints, feedback, pending, customers] = await Promise.all([
      orderRepository.getRecent(500),
      subscriptionRepository.getAll(true),
      deliveryPartnerRepository.getAll(),
      complaintRepository.getOpen(),
      feedbackRepository.getAll(),
      authRepository.getPendingCustomers(),
      authRepository.getAllCustomers(),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    return {
      totalCustomers: customers.length,
      pendingApprovals: pending.length,
      totalOrders: orders.length,
      ordersToday: orders.filter((o) => o.createdAt.startsWith(today)).length,
      deliveredToday: orders.filter((o) => o.status === 'delivered' && o.updatedAt.startsWith(today)).length,
      pendingDeliveries: orders.filter((o) => ['pending', 'assigned', 'out_for_delivery'].includes(o.status)).length,
      revenueThisMonth: orders
        .filter((o) => {
          const d = new Date(o.createdAt);
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear && o.status === 'delivered';
        })
        .reduce((sum, o) => sum + o.totalAmount, 0),
      productsSold: orders.reduce((sum, o) => sum + o.totalQuantity, 0),
      activeSubscriptions: subscriptions.length,
      deliveryPartners: partners.length,
      recentComplaints: complaints.slice(0, 5),
      recentFeedback: feedback.slice(0, 5),
    };
  }

  async approveCustomer(uid: string): Promise<void> {
    await authRepository.approveCustomer(uid);
    try {
      const fn = httpsCallable(functions, 'notifyCustomerApproved');
      await fn({ customerId: uid });
    } catch {
      // Non-blocking
    }
  }

  async rejectCustomer(uid: string): Promise<void> {
    await authRepository.rejectCustomer(uid);
  }

  async assignOrderPartner(orderId: string, partnerId: string): Promise<void> {
    const partner = await deliveryPartnerRepository.getById(partnerId);
    if (!partner) throw new Error('Delivery partner not found');
    await orderRepository.assignPartner(orderId, partner.id, partner.name);
  }
}

export class DeliveryService {
  async getPartnerStats(userId: string): Promise<DeliveryPartnerStats> {
    const partner = await deliveryPartnerRepository.getByUserId(userId);
    if (!partner) throw new Error('Delivery partner profile not found');

    const today = new Date().toISOString().split('T')[0];
    const orders = await orderRepository.getByDeliveryPartner(partner.id);
    const todayOrders = orders.filter((o) => o.scheduledDate === today);

    const completed = orders.filter((o) => o.status === 'delivered');
    const successRate =
      partner.totalDeliveries > 0
        ? Math.round((partner.successfulDeliveries / partner.totalDeliveries) * 100)
        : 100;

    return {
      todayOrders: todayOrders.length,
      pendingOrders: todayOrders.filter((o) => ['assigned', 'out_for_delivery'].includes(o.status)).length,
      completedOrders: todayOrders.filter((o) => o.status === 'delivered').length,
      assignedPincodes: partner.assignedPincodes,
      successRate,
    };
  }
}

export class ProductService {
  getAll = () => productRepository.getAll();
  getById = (id: string) => productRepository.getById(id);
  create = productRepository.create.bind(productRepository);
  update = productRepository.update.bind(productRepository);
  delete = productRepository.delete.bind(productRepository);
  disable = productRepository.disable.bind(productRepository);

  async uploadImage(uri: string, productId: string): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `products/${productId}_${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  }
}

export class AddressService {
  getByUser = (userId: string) => addressRepository.getByUser(userId);
  create = addressRepository.create.bind(addressRepository);
  update = addressRepository.update.bind(addressRepository);
  delete = addressRepository.delete.bind(addressRepository);
  setDefault = addressRepository.setDefault.bind(addressRepository);
}

export class BillingService {
  getByCustomer = (customerId: string) => billingRepository.getByCustomer(customerId);
  updatePayment = billingRepository.updatePayment.bind(billingRepository);
}

export class FeedbackService {
  submit = feedbackRepository.create.bind(feedbackRepository);
  getAll = feedbackRepository.getAll.bind(feedbackRepository);
}

export class ComplaintService {
  create = complaintRepository.create.bind(complaintRepository);
  getOpen = complaintRepository.getOpen.bind(complaintRepository);
  resolve = complaintRepository.resolve.bind(complaintRepository);
}

export class SubscriptionService {
  getAll = subscriptionRepository.getAll.bind(subscriptionRepository);
  getByCustomer = subscriptionRepository.getByCustomer.bind(subscriptionRepository);
  create = subscriptionRepository.create.bind(subscriptionRepository);
  update = subscriptionRepository.update.bind(subscriptionRepository);
  cancel = subscriptionRepository.cancel.bind(subscriptionRepository);
}

export const authService = new AuthService();
export const orderService = new OrderService();
export const adminService = new AdminService();
export const deliveryService = new DeliveryService();
export const productService = new ProductService();
export const addressService = new AddressService();
export const billingService = new BillingService();
export const feedbackService = new FeedbackService();
export const complaintService = new ComplaintService();
export const subscriptionService = new SubscriptionService();

export type { CartItem };
