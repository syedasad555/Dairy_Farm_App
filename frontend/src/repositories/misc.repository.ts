import { COLLECTIONS } from '@/shared/constants';
import type { Subscription, BillingStatement, Feedback, Complaint, AppNotification } from '@/shared/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  queryDocuments,
  where,
  orderBy,
} from './base.repository';

export class SubscriptionRepository {
  async getAll(activeOnly = false): Promise<Subscription[]> {
    if (activeOnly) {
      return queryDocuments<Subscription>(
        COLLECTIONS.SUBSCRIPTIONS,
        where('active', '==', true)
      );
    }
    return queryDocuments<Subscription>(COLLECTIONS.SUBSCRIPTIONS);
  }

  async getByCustomer(customerId: string): Promise<Subscription[]> {
    return queryDocuments<Subscription>(
      COLLECTIONS.SUBSCRIPTIONS,
      where('customerId', '==', customerId)
    );
  }

  async create(data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `sub_${Date.now()}`;
    await createDocument(COLLECTIONS.SUBSCRIPTIONS, id, data);
    return id;
  }

  async update(id: string, data: Partial<Subscription>): Promise<void> {
    await updateDocument(COLLECTIONS.SUBSCRIPTIONS, id, data as Record<string, unknown>);
  }

  async cancel(id: string): Promise<void> {
    await updateDocument(COLLECTIONS.SUBSCRIPTIONS, id, { active: false });
  }
}

export class BillingRepository {
  async getByCustomer(customerId: string): Promise<BillingStatement[]> {
    return queryDocuments<BillingStatement>(
      COLLECTIONS.BILLING_STATEMENTS,
      where('customerId', '==', customerId),
      orderBy('year', 'desc')
    );
  }

  async getById(id: string): Promise<BillingStatement | null> {
    return getDocument<BillingStatement>(COLLECTIONS.BILLING_STATEMENTS, id);
  }

  async updatePayment(
    id: string,
    paidAmount: number,
    paymentStatus: BillingStatement['paymentStatus'],
    notes?: string
  ): Promise<void> {
    const statement = await this.getById(id);
    if (!statement) throw new Error('Statement not found');

    await updateDocument(COLLECTIONS.BILLING_STATEMENTS, id, {
      paidAmount,
      pendingAmount: statement.totalAmount - paidAmount,
      paymentStatus,
      notes: notes ?? statement.notes,
    });
  }
}

export class FeedbackRepository {
  async getAll(): Promise<Feedback[]> {
    return queryDocuments<Feedback>(COLLECTIONS.FEEDBACK, orderBy('createdAt', 'desc'));
  }

  async create(data: Omit<Feedback, 'id' | 'createdAt'>): Promise<string> {
    const id = `fb_${Date.now()}`;
    await createDocument(COLLECTIONS.FEEDBACK, id, data);
    return id;
  }
}

export class ComplaintRepository {
  async getAll(): Promise<Complaint[]> {
    return queryDocuments<Complaint>(COLLECTIONS.COMPLAINTS, orderBy('createdAt', 'desc'));
  }

  async getOpen(): Promise<Complaint[]> {
    return queryDocuments<Complaint>(
      COLLECTIONS.COMPLAINTS,
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );
  }

  async create(data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `cmp_${Date.now()}`;
    await createDocument(COLLECTIONS.COMPLAINTS, id, data);
    return id;
  }

  async resolve(id: string, adminNotes?: string): Promise<void> {
    await updateDocument(COLLECTIONS.COMPLAINTS, id, { status: 'resolved', adminNotes });
  }
}

export class NotificationRepository {
  async getByUser(userId: string): Promise<AppNotification[]> {
    return queryDocuments<AppNotification>(
      COLLECTIONS.NOTIFICATIONS,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }

  async markRead(id: string): Promise<void> {
    await updateDocument(COLLECTIONS.NOTIFICATIONS, id, { read: true });
  }
}

export const subscriptionRepository = new SubscriptionRepository();
export const billingRepository = new BillingRepository();
export const feedbackRepository = new FeedbackRepository();
export const complaintRepository = new ComplaintRepository();
export const notificationRepository = new NotificationRepository();
