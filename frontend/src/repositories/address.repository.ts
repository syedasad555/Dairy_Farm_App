import { COLLECTIONS } from '@/shared/constants';
import type { Address } from '@/shared/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  where,
} from './base.repository';

export class AddressRepository {
  async getByUser(userId: string): Promise<Address[]> {
    return queryDocuments<Address>(COLLECTIONS.ADDRESSES, where('userId', '==', userId));
  }

  async getById(id: string): Promise<Address | null> {
    return getDocument<Address>(COLLECTIONS.ADDRESSES, id);
  }

  async create(userId: string, data: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `${userId}_${Date.now()}`;

    if (data.isDefault) {
      await this.clearDefault(userId);
    }

    await createDocument(COLLECTIONS.ADDRESSES, id, { ...data, userId });
    return id;
  }

  async update(id: string, userId: string, data: Partial<Address>): Promise<void> {
    if (data.isDefault) {
      await this.clearDefault(userId);
    }
    await updateDocument(COLLECTIONS.ADDRESSES, id, data as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    await deleteDocument(COLLECTIONS.ADDRESSES, id);
  }

  async setDefault(id: string, userId: string): Promise<void> {
    await this.clearDefault(userId);
    await updateDocument(COLLECTIONS.ADDRESSES, id, { isDefault: true });
  }

  private async clearDefault(userId: string): Promise<void> {
    const addresses = await this.getByUser(userId);
    await Promise.all(
      addresses
        .filter((a) => a.isDefault)
        .map((a) => updateDocument(COLLECTIONS.ADDRESSES, a.id, { isDefault: false }))
    );
  }
}

export const addressRepository = new AddressRepository();
