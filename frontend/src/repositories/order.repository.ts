import { COLLECTIONS } from '@/shared/constants';
import type { Order, OrderStatus } from '@/shared/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  queryDocuments,
  where,
  orderBy,
  limit,
} from './base.repository';

export class OrderRepository {
  async getById(id: string): Promise<Order | null> {
    return getDocument<Order>(COLLECTIONS.ORDERS, id);
  }

  async getByCustomer(customerId: string): Promise<Order[]> {
    return queryDocuments<Order>(
      COLLECTIONS.ORDERS,
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
  }

  async getByDeliveryPartner(partnerId: string): Promise<Order[]> {
    return queryDocuments<Order>(
      COLLECTIONS.ORDERS,
      where('deliveryPartnerId', '==', partnerId),
      orderBy('createdAt', 'desc')
    );
  }

  async getTodayByPartner(partnerId: string, date: string): Promise<Order[]> {
    return queryDocuments<Order>(
      COLLECTIONS.ORDERS,
      where('deliveryPartnerId', '==', partnerId),
      where('scheduledDate', '==', date)
    );
  }

  async getByStatus(status: OrderStatus): Promise<Order[]> {
    return queryDocuments<Order>(
      COLLECTIONS.ORDERS,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
  }

  async getRecent(limitCount = 20): Promise<Order[]> {
    return queryDocuments<Order>(COLLECTIONS.ORDERS, orderBy('createdAt', 'desc'), limit(limitCount));
  }

  async create(id: string, data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    await createDocument(COLLECTIONS.ORDERS, id, data);
  }

  async updateStatus(id: string, status: OrderStatus, extra?: Record<string, unknown>): Promise<void> {
    await updateDocument(COLLECTIONS.ORDERS, id, { status, ...extra });
  }

  async assignPartner(orderId: string, partnerId: string, partnerName: string): Promise<void> {
    await updateDocument(COLLECTIONS.ORDERS, orderId, {
      deliveryPartnerId: partnerId,
      deliveryPartnerName: partnerName,
      status: 'assigned',
    });
  }

  async update(id: string, data: Partial<Order>): Promise<void> {
    await updateDocument(COLLECTIONS.ORDERS, id, data as Record<string, unknown>);
  }

  async countAll(): Promise<number> {
    const orders = await queryDocuments<Order>(COLLECTIONS.ORDERS);
    return orders.length;
  }
}

export const orderRepository = new OrderRepository();
