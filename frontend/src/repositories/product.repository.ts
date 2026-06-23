import { COLLECTIONS } from '@/shared/constants';
import type { Product, ProductCategory } from '@/shared/types';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  where,
  orderBy,
} from './base.repository';

export class ProductRepository {
  async getAll(activeOnly = true): Promise<Product[]> {
    if (activeOnly) {
      return queryDocuments<Product>(
        COLLECTIONS.PRODUCTS,
        where('active', '==', true),
        orderBy('name')
      );
    }
    return queryDocuments<Product>(COLLECTIONS.PRODUCTS, orderBy('name'));
  }

  async getByCategory(category: ProductCategory): Promise<Product[]> {
    return queryDocuments<Product>(
      COLLECTIONS.PRODUCTS,
      where('category', '==', category),
      where('active', '==', true),
      orderBy('name')
    );
  }

  async getById(id: string): Promise<Product | null> {
    return getDocument<Product>(COLLECTIONS.PRODUCTS, id);
  }

  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `prod_${Date.now()}`;
    await createDocument(COLLECTIONS.PRODUCTS, id, data);
    return id;
  }

  async update(id: string, data: Partial<Product>): Promise<void> {
    await updateDocument(COLLECTIONS.PRODUCTS, id, data as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    await deleteDocument(COLLECTIONS.PRODUCTS, id);
  }

  async disable(id: string): Promise<void> {
    await updateDocument(COLLECTIONS.PRODUCTS, id, { active: false });
  }
}

export const productRepository = new ProductRepository();
