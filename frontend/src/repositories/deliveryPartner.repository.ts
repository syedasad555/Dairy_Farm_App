import { COLLECTIONS } from '@/shared/constants';
import type { DeliveryPartner } from '@/shared/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  where,
} from './base.repository';

export class DeliveryPartnerRepository {
  async getAll(): Promise<DeliveryPartner[]> {
    return queryDocuments<DeliveryPartner>(COLLECTIONS.DELIVERY_PARTNERS);
  }

  async getById(id: string): Promise<DeliveryPartner | null> {
    return getDocument<DeliveryPartner>(COLLECTIONS.DELIVERY_PARTNERS, id);
  }

  async getByUserId(userId: string): Promise<DeliveryPartner | null> {
    const partners = await queryDocuments<DeliveryPartner>(
      COLLECTIONS.DELIVERY_PARTNERS,
      where('userId', '==', userId)
    );
    return partners[0] ?? null;
  }

  async findByPincode(pincode: string): Promise<DeliveryPartner | null> {
    const partners = await queryDocuments<DeliveryPartner>(
      COLLECTIONS.DELIVERY_PARTNERS,
      where('assignedPincodes', 'array-contains', pincode),
      where('active', '==', true)
    );
    return partners[0] ?? null;
  }

  async create(data: Omit<DeliveryPartner, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `dp_${Date.now()}`;
    await createDocument(COLLECTIONS.DELIVERY_PARTNERS, id, data);
    return id;
  }

  async update(id: string, data: Partial<DeliveryPartner>): Promise<void> {
    await updateDocument(COLLECTIONS.DELIVERY_PARTNERS, id, data as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    await deleteDocument(COLLECTIONS.DELIVERY_PARTNERS, id);
  }

  async assignPincodes(id: string, pincodes: string[], areaName: string): Promise<void> {
    await updateDocument(COLLECTIONS.DELIVERY_PARTNERS, id, {
      assignedPincodes: pincodes,
      assignedAreaName: areaName,
    });
  }
}

export const deliveryPartnerRepository = new DeliveryPartnerRepository();
